import { Temporal } from "temporal-polyfill";
import * as dj from "./DataJournal";
import { Period, PeriodStr } from "./Period";

//#region ### TYPES ###

//none?

//#endregion

//#region ### INTERFACES ###

export interface Connector {

    commit(trans: Transaction): Promise<any>;

    getEntries(params: dj.QueryObject): Promise<dj.Entry[]>;

    getDefs(includeDeletedForArchiving?: boolean): dj.Def[];

    getOverview(): dj.Overview;

    connect(...params: any): Promise<dj.Def[]>;

    /**
     * The name of the connector, essentially.
     */
    serviceName: string;
}

/**
 * The means to convert {@link CanonicalDataset}s to and from other formats
 */
export interface Translator {
    toDataJournal(params: any): Promise<dj.DataJournal>;
    fromDataJournal(canonicalDataset: dj.DataJournal, params: any): any;
}

export interface Transaction {
    create: dj.DataJournal;
    update: dj.DataJournal;
    delete: dj.DataJournal;
}

export interface PointRollup {
    val: any;
    method: dj.Rollup;
    vals: any[];
}

export interface EntryRollup {
    def: dj.Def;
    pts: PointRollup[];
}

export interface PeriodSummary {
    period: PeriodStr | "ALL";
    entryRollups: EntryRollup[];
    entries: dj.Entry[]
}

export interface Config{
    translators?: Translator[],
    connectors?: Connector[],
}

//#endregion

//#region ### CLASSES ###

export class PDW {
    databases: Connector[];
    translators: Translator[];
    inMemoryDatabase: InMemoryDatabase

    private constructor(config: Config) {
        this.inMemoryDatabase = new InMemoryDatabase();
        this.databases = config.connectors ?? [];
        this.translators = config.translators ?? [];
    }

    static async newPDW(config?: Config): Promise<PDW> {
        if(config === undefined){
            config = {
                connectors: [],
                translators: []
            }
        }
        let instance = new PDW(config);
        // await instance.setDefs(defManifest);
        return instance
    }

    /**
     * 
     * @param rawParams an object of any {@link StandardParams} to include
     * @returns a {@link CanonicalDataset} containing a {@link Def}s, {@link Entry}s
     */
    async getAll(rawParams: StandardParams): Promise<CanonicalDataset> {
        const params = this.sanitizeParams(rawParams);
        const entries = await this.dataStore.getEntries(params);
        const includeDeletedDefs = params.hasOwnProperty('includeDeleted') && params.includeDeleted != 'no';
        const defs = (await this.dataStore.getDefs(includeDeletedDefs)) as DefData[];

        const dataset: CanonicalDataset = {
            defs: defs,
            entries: entries.entries
        }

        return PDW.addOverviewToCompleteDataset(dataset);
    }

    query(params?: StandardParams): Query {
        return new Query(this, params);
    }

    async getEntries(rawParams?: StandardParams): Promise<Entry[]> {
        if (rawParams === undefined) rawParams = {};
        const params = this.sanitizeParams(rawParams);
        let entriesQuery = await this.dataStore.getEntries(params);
        return this.inflateEntriesFromData(entriesQuery.entries);
    }

    async setEntries(createEntries: EntryData[] = [], updateEntries: EntryData[] = [], deletionEntries: DeletionMsg[] = []): Promise<any> {
        let trans: Transaction = {
            create: {
                defs: [],
                entries: this.inflateEntriesFromData(createEntries)
            },
            update: {
                defs: [],
                entries: this.inflateEntriesFromData(updateEntries)
            },
            delete: {
                defs: [],
                entries: deletionEntries
            }
        }
        const response = await this.dataStore.commit(trans);

        return response
    }

    async getDefs(includeDeleted = false): Promise<Def[]> {
        return (await this.dataStore.getDefs(includeDeleted)).map(defData => new Def(defData, this));
    }

    async setDefs(createDefs: DefLike[] = [], updateDefs: DefLike[] = [], deletionDefs: DeletionMsg[] = []): Promise<any> {
        let trans: Transaction = {
            create: {
                defs: createDefs.map(def => new Def(def, this)),
                entries: []
            },
            update: {
                defs: updateDefs.map(def => new Def(def, this)),
                entries: []
            },
            delete: {
                defs: deletionDefs,
                entries: []
            }
        }
        const response = await this.dataStore.commit(trans)
        /* Update the Manifest with the transaction */
        const defs = [...trans.create.defs, ...trans.update.defs];
        this.handleManifestDeletionChange(trans.delete.defs);
        this.pushDefsToManifest(defs);
        return response
    }

    async setAll(completeDataset: ElementMap | CanonicalDataset): Promise<any> {
        let defs: Def[] = [];
        if (completeDataset.defs.length > 0) {
            defs = completeDataset.defs.map(def => new Def(def as DefData, this))
            this.pushDefsToManifest(defs);
        }

        let entries: Entry[] = [];
        if (completeDataset.entries.length > 0) {
            entries = this.inflateEntriesFromData(completeDataset.entries as EntryData[]);
        }

        const result = await this.dataStore.commit({
            create: {
                defs: [],
                entries: []
            },
            update: {
                defs: defs,
                entries: entries,
            },
            delete: {
                defs: [],
                entries: []
            },
        })
        if (result.success === false) {
            console.error(result);
            throw new Error('Setting Defs and Entries failed')
        }
        return result;
    }

    async newDef(defInfo: DefLike): Promise<Def> {
        let newDef = new Def(defInfo, this);
        const storeCopy = newDef.makeStaticCopy() as Def;
        const result = await this.dataStore.commit({
            create: {
                defs: [storeCopy],
                entries: []
            },
            update: {
                defs: [],
                entries: []
            },
            delete: {
                defs: [],
                entries: []
            },
        })
        if (result.success === false) {
            console.error(result);
            throw new Error('Def Creation failed')
        }
        this.manifest.push(storeCopy);
        return newDef;
    }

    async newEntry(entryInfo: EntryLike): Promise<Entry> {
        let newEntry = new Entry(entryInfo, this);
        const storeCopy = newEntry.makeStaticCopy() as Entry;
        const result = await this.dataStore.commit({
            create: {
                defs: [],
                entries: [storeCopy]
            },
            update: {
                defs: [],
                entries: []
            },
            delete: {
                defs: [],
                entries: []
            },
        })
        if (result.success === false) {
            console.error(result);
            throw new Error('Entry Creation failed')
        }
        return newEntry;
    }

    /**
     * Enforces defaults. Sanity check some types.
     * Less variability in the output
     * @param params rawParams in
     * @returns santized params out
     */
    sanitizeParams(params: StandardParams): ReducedParams {
        //ensure default
        if (params.includeDeleted === undefined) params.includeDeleted = 'no';

        if (params?.today !== undefined) params.inPeriod = Period.now(Scope.DAY);
        if (params?.thisWeek !== undefined) params.inPeriod = Period.now(Scope.WEEK);
        if (params?.thisMonth !== undefined) params.inPeriod = Period.now(Scope.MINUTE);
        if (params?.thisQuarter !== undefined) params.inPeriod = Period.now(Scope.QUARTER);
        if (params?.thisYear !== undefined) params.inPeriod = Period.now(Scope.YEAR);

        if (params.hasOwnProperty("inPeriod")) {
            let period = params.inPeriod as Period
            if (typeof params.inPeriod === 'string') period = new Period(params.inPeriod);
            params.from = new Period(period).getStart();
            params.to = new Period(period).getEnd();
        }

        //make periods from period strings
        if (params.from !== undefined) {
            if (typeof params.from === 'string') {
                params.from = new Period(params.from);
            }
            //otherwise I guess I'll assume it's okay
        }
        if (params.to !== undefined) {
            if (typeof params.to === 'string') {
                params.to = new Period(params.to);
            }
            //otherwise I guess I'll assume it's okay
        }

        //make Temporal & EpochStr options
        if (params.createdAfter !== undefined) {
            if (typeof params.createdAfter === 'string') {
                params.createdAfter = parseTemporalFromEpochStr(params.createdAfter);
                (<ReducedParams>params).createdAfterEpochStr = makeEpochStrFrom(params.createdAfter);
            } else {
                (<ReducedParams>params).createdAfterEpochStr = makeEpochStrFrom(params.createdAfter);
                params.createdAfter = parseTemporalFromEpochStr((<ReducedParams>params).createdAfterEpochStr!);
            }
        }
        if (params.createdBefore !== undefined) {
            if (typeof params.createdBefore === 'string') {
                params.createdBefore = parseTemporalFromEpochStr(params.createdBefore);
                (<ReducedParams>params).createdBeforeEpochStr = makeEpochStrFrom(params.createdBefore);
            } else {
                (<ReducedParams>params).createdBeforeEpochStr = makeEpochStrFrom(params.createdBefore);
                params.createdBefore = parseTemporalFromEpochStr((<ReducedParams>params).createdBeforeEpochStr!);
            }
        }
        if (params.updatedAfter !== undefined) {
            if (typeof params.updatedAfter === 'string') {
                params.updatedAfter = parseTemporalFromEpochStr(params.updatedAfter);
                (<ReducedParams>params).updatedAfterEpochStr = makeEpochStrFrom(params.updatedAfter);
            } else {
                (<ReducedParams>params).updatedAfterEpochStr = makeEpochStrFrom(params.updatedAfter);
                params.updatedAfter = parseTemporalFromEpochStr((<ReducedParams>params).updatedAfterEpochStr!);
            }
        }
        if (params.updatedBefore !== undefined) {
            if (typeof params.updatedBefore === 'string') {
                params.updatedBefore = parseTemporalFromEpochStr(params.updatedBefore);
                (<ReducedParams>params).updatedBeforeEpochStr = makeEpochStrFrom(params.updatedBefore);
            } else {
                (<ReducedParams>params).updatedBeforeEpochStr = makeEpochStrFrom(params.updatedBefore);
                params.updatedBefore = parseTemporalFromEpochStr((<ReducedParams>params).updatedBeforeEpochStr!);
            }
        }

        //ensure arrays
        if (params.uid !== undefined && typeof params.uid == 'string') params.uid = [params.uid]
        if (params.eid !== undefined && typeof params.eid == 'string') params.eid = [params.eid]
        if (params.defLbl !== undefined && typeof params.defLbl == 'string') params.did = this._manifest.filter(def => (<string[]>params.defLbl)!.some(dl => dl === def.lbl)).map(def => def.did);
        if (params.did !== undefined && typeof params.did == 'string') params.did = [params.did]
        if (params.scope !== undefined && typeof params.scope == 'string') params.scope = [params.scope];

        if (params.tag !== undefined && typeof params.tag == 'string') params.did = this._manifest.filter(def => def.hasTag(params.tag!)).map(def => def.did);

        if (params.limit !== undefined && typeof params.limit !== "number") {
            console.error('Your params were: ', params)
            throw new Error('You tried to supply a limit param with a non-number.')
        }

        return params as ReducedParams
    }

    /**
     * Takes in an array of {@link Entry} instances sharing a common Def and applies the default rollup to 
     * each of the EntryPoints contained in the Entries. Produces an {@link EntryRollup}
     */
    rollupEntries(entries: EntryData[]): EntryRollup { //#TODO - add RollupOverride param
        const def = this.getDefFromManifest(entries[0]._did);
        if (def === undefined) throw new Error("No definition found with _did: " + entries[0]._did);
        return PDW.rollupEntries(entries, def)
    }

    /**
     * Takes in an array of {@link Entry} instances sharing a common Def and applies the default rollup to 
     * each of the EntryPoints contained in the Entries. Produces an {@link EntryRollup}
     */
    static rollupEntries(entries: EntryData[], def: Def): EntryRollup { //#TODO - add RollupOverride param
        if (def === undefined) console.log(entries[0])
        const pointDefs = def.pts;
        let returnObj = {
            did: def.did,
            lbl: def.lbl,
            emoji: def.emoji,
            pts: [] as PointRollup[]
        }
        //**********TEMP CHANGE*/
        return returnObj
        //************ */

        pointDefs.forEach(pd => {
            let vals: any[] = [];
            entries.forEach(e => {

                let point = e[pd.pid];
                if (point !== undefined) vals.push(point);
            })
            let ptRlp: PointRollup = {
                pid: pd.pid,
                lbl: pd.lbl,
                emoji: pd.emoji,
                method: pd.rollup,
                vals: vals,
                val: undefined
            }
            if (pd.rollup === Rollup.COUNT) ptRlp.val = vals.length;
            if (pd.rollup === Rollup.AVERAGE) {
                const type = pd.type;
                if (type === PointType.NUMBER) ptRlp.val = doAverage(vals);
                if (type === PointType.DURATION) ptRlp.val = doAverageDuration(vals);
                if (type === PointType.TIME) ptRlp.val = doAverageTime(vals);
                if (type !== PointType.NUMBER && type !== PointType.DURATION && type !== PointType.TIME) {
                    console.warn('Tried averaging a point with unsupported type ' + type);
                    ptRlp.val = -1; //hint at an error in the UI
                }
            }
            if (pd.rollup === Rollup.SUM) {
                const type = pd.type;
                if (type === PointType.NUMBER) ptRlp.val = doSum(vals);
                if (type === PointType.DURATION) ptRlp.val = doSumDuration(vals);
            }
            if (pd.rollup === Rollup.COUNTOFEACH) ptRlp.val = doCountOfEach(vals);
            if (pd.rollup === Rollup.COUNTUNIQUE) ptRlp.val = doCountUnique(vals);

            returnObj.pts.push(ptRlp);
        })
        return returnObj

        function doAverage(vals: number[]) {
            let sum = doSum(vals)
            const ave = sum / vals.length;
            const rounded = Math.round(ave * 100) / 100 //2 decimals
            return rounded
        }

        function doAverageDuration(vals: string[]): string {
            if (typeof vals[0] !== 'string') throw new Error('Period average saw a non-string');
            const sum = vals.reduce((pv, val) => Math.round(pv + Temporal.Duration.from(val).total('seconds')), 0);
            const ave = sum / vals.length;
            return Temporal.Duration.from({ seconds: ave }).toLocaleString();
        }

        function doAverageTime(vals: string[]) {// Temporal.PlainTime {
            //want average to be about 4pm, so any time *before* 4pm I add 1-day's worth of seconds to
            let runningTotalInSeconds = 0;
            vals.forEach(val => {
                const time = Temporal.PlainTime.from(val)
                let delta = Temporal.PlainTime.from('00:00:00').until(time)
                const hrs = delta.hours;
                const mins = delta.minutes;
                const secs = delta.seconds;
                //add 24hrs if its before 4am
                if (hrs < 4) runningTotalInSeconds = runningTotalInSeconds + 86400; //add 24 hrs if its before 4am
                runningTotalInSeconds = runningTotalInSeconds + hrs * 3600;
                runningTotalInSeconds = runningTotalInSeconds + mins * 60;
                runningTotalInSeconds = runningTotalInSeconds + secs;

            })
            // let sum = doSum(vals)
            const averageSeconds = Math.round(runningTotalInSeconds / vals.length);
            const timeAverage = Temporal.PlainTime.from('00:00:00').add({ seconds: averageSeconds })
            return timeAverage.toString();
        }

        function doSum(vals: number[]) {
            return vals.reduce((pv, val) => pv + val, 0);
        }

        function doSumDuration(vals: string[]) {
            if (typeof vals[0] !== 'string') throw new Error('Duration average saw a non-string')
            // let temp = Temporal.Duration.from(vals[0]).total('seconds');
            const sum = vals.reduce((pv, val) => pv + Temporal.Duration.from(val).total('seconds'), 0);
            return Temporal.Duration.from({ seconds: sum }).toLocaleString();
        }

        function doCountOfEach(vals: string[]) {
            let strings = [...new Set(vals)];
            let stringCounts = '';
            strings.forEach(str => {
                stringCounts = str + ": " + vals.filter(s => s == str).length + ", " + stringCounts;
            })
            return stringCounts.substring(0, stringCounts.length - 2);
        }

        function doCountUnique(vals: any[]): number {
            return [...new Set(vals)].length;

        }
    }

    /**
     * Converts class instances into standard objects.
     * @param elements Def[], Entry[], or Tag[]
     * @returns DefData[], EntryData[], or TagData[]
     */
    static flatten(elements: Element[]): ElementData[] | DefData[] | EntryData[] {
        return elements.map(e => e.toData());
    }

    /**
     * Finds the most-recently updated Element from a {@link CanonicalDataset}
     * @returns EpochStr of the most recently-updated thing in the set
     */
    static getDatasetLastUpdate(dataset: CanonicalDataset): string {
        let recents: ElementData[] = [];
        if (dataset.defs !== undefined && dataset.defs.length > 0) recents.push(Element.getMostRecent(dataset.defs)!)
        if (dataset.entries !== undefined && dataset.entries.length > 0) recents.push(Element.getMostRecent(dataset.entries)!)
        if (recents.length === 0) return '00000001'
        return Element.getMostRecent(recents)!._updated!
    }

    /**
     * Slap a {@link DatasetOverview} to a {@link CanonicalDataset}
     */
    static addOverviewToCompleteDataset(data: CanonicalDataset, storeName?: string): CanonicalDataset {
        if (data.overview !== undefined) {
            console.warn('Tried to add an overview to a dataset that already had one:', data);
            return data
        }
        data.overview = {
            defs: {
                current: data.defs?.filter(element => element._deleted === false).length,
                deleted: data.defs?.filter(element => element._deleted).length
            },
            entries: {
                current: data.entries?.filter(element => element._deleted === false).length,
                deleted: data.entries?.filter(element => element._deleted).length
            },
            lastUpdated: PDW.getDatasetLastUpdate(data)
        }
        if (storeName) data.overview!.storeName = storeName
        return data
    }

    static summarize(entries: Entry[] | EntryData[], scope: Scope | "ALL"): PeriodSummary[] {
        if (entries.length === 0) throw new Error("No entries to summarize");
        if (scope === Scope.MINUTE || scope === Scope.SECOND) throw new Error("Rollups to scopes below one hour are not supported."); //I imagine if this happens it would be unintentional
        let entryDataArr = entries as EntryData[];
        if (!entryDataArr[0].hasOwnProperty('_eid')) entryDataArr = entryDataArr.map(e => e.toData()) as EntryData[];
        let periodStrs: PeriodStr[] = [...new Set(entryDataArr.map(e => e._period))];
        let earliest = periodStrs.reduce((prev, periodStr) => {
            const start = new Period(periodStr).getStart().toString();
            return start < prev ? start : prev
        });
        let latest = periodStrs.reduce((prev, periodStr) => {
            const end = new Period(periodStr).getEnd().toString();
            return end > prev ? end : prev
        });

        /* Added this to support transitioning to a static function */
        const defMap: { [did: string]: Def } = {};
        entries.forEach(entry => {
            defMap[entry.def.did] = entry.def;
        })

        if (scope === 'ALL') {
            let entsByType = splitEntriesByType(entryDataArr);
            const keys = Object.keys(entsByType);
            let rollups: EntryRollup[] = [];
            keys.forEach(key =>
                rollups.push(PDW.rollupEntries(entsByType[key], defMap[key])))
            return [{
                period: 'ALL',
                entryRollups: rollups,
                entries: entryDataArr
            }];
        }
        console.log('PERIODS SPOT')
        let periods = Period.allPeriodsIn(new Period(earliest), new Period(latest), (<Scope>scope), false) as Period[];
        return periods.map(p => {
            console.log(p.periodStr);
            let ents = entryDataArr.filter(e => p.contains(e._period));
            let entsByType = splitEntriesByType(ents);
            const keys = Object.keys(entsByType);
            let rollups: EntryRollup[] = [];
            keys.forEach(key =>
                rollups.push(PDW.rollupEntries(entsByType[key], defMap[key])))
            return {
                period: p.toString(),
                entryRollups: rollups,
                entries: ents
            }
        })

        function splitEntriesByType(entries: EntryData[]): { [dids: string]: any; } {
            let entryTypes: { [dids: string]: any; } = {};
            entries.forEach(entry => {
                if (entryTypes.hasOwnProperty(entry._did)) {
                    entryTypes[entry._did].push(entry);
                } else {
                    entryTypes[entry._did] = [entry];
                }
            })
            return entryTypes
        }
    }
}


export class InMemoryDatabase implements Connector {
    serviceName: string;
    defs: dj.Def[];
    entries: dj.Entry[];

    constructor() {
        this.serviceName = 'In memory dataset';
        this.defs = [];
        this.entries = [];
    }

    async commit(trans: Transaction): Promise<any> {
        let returnObj: any = {
            success: false,
            msgs: []
        }

        //creating new Elements
        trans.create.defs.forEach(newDef => {
            this.defs.push(newDef);
        })
        trans.create.entries.forEach(newEntry => {
            this.entries.push(newEntry);
        })
        returnObj.msgs?.push(`Added:
            ${trans.create.defs.length} Defs, 
            ${trans.create.entries.length} Entries`)

        //updating existing
        const flatUpdatedDefs = trans.update.defs.map(d => d.data) as DefData[]
        const flatUpdatedEntries = trans.update.entries.map(d => d.data) as EntryData[]
        this.setElementsInRepo(flatUpdatedDefs, this.defs, returnObj.msgs!);
        this.setElementsInRepo(flatUpdatedEntries, this.entries, returnObj.msgs!);

        //deletions        
        trans.delete.defs.forEach(def => {
            let matched = this.defs.find(defInRepo => defInRepo.uid === def.uid);
            if (matched !== undefined) {
                matched.updated = def.updated;
                matched.deleted = def.deleted;
                returnObj.delEntries?.push(def);
            }
        })
        trans.delete.entries.forEach(entry => {
            let matched = this.entries.find(entryInRepo => entryInRepo.uid === entry.uid);
            if (matched !== undefined) {
                matched.updated = entry.updated;
                matched.deleted = entry.deleted;
                returnObj.delEntries?.push(entry);
            }
        })

        returnObj.success = true;
        returnObj.defData = [...flatUpdatedDefs, ...trans.create.defs.map(d => d.toData() as DefData)]
        returnObj.entryData = [...flatUpdatedEntries, ...trans.create.entries.map(d => d.toData() as EntryData)]
        returnObj.msgs!.push(`Stored ${returnObj.defData.length} Defs, ${returnObj.entryData.length} Entries, and toggled deletition for ${returnObj.delDefs?.length} Defs and ${returnObj.delEntries?.length} Entries.`);
        return returnObj;
    }

    /**
     * Reset all the arrays to nil.
     * Right now only used for **testing**
     */
    clearAllStoreArrays() {
        this.defs = [];
        this.entries = [];
    }

    async getEntries(params: ReducedParams): Promise<ReducedQueryResponse> {
        let returnObj: ReducedQueryResponse = {
            success: false,
            entries: [],
            msgs: []
        }
        try {
            returnObj.entries = this.getEntriesFromRepo(params);
            returnObj.success = true;
        } catch (e) {
            console.error(e);
            returnObj.msgs = ['An error occurred when querying the DefaultDataStore']
        }
        //force any future updates to *not* change the elements in stores until they're saved explicitly
        returnObj = JSON.parse(JSON.stringify(returnObj));
        return returnObj
    }

    async getDefs(includedDeleted = false): Promise<DefData[]> {
        let params: ReducedParams = { includeDeleted: 'no' };
        if (includedDeleted) params.includeDeleted = 'yes';
        const allMatches = this.defs.filter(def => def.passesFilters(params));
        let noDupes = new Set(allMatches);
        return Array.from(noDupes).map(def => def.toData() as DefData)
    }

    /**
     * For pulling entries that you know the eid of
     * @param eids
     * @param includeDeleted
     * @returns an array of all entries matching the criteria
     */
    private getEntriesFromRepo(params: ReducedParams): EntryData[] {
        const allMatches = this.entries.filter(entry => entry.passesFilters(params));
        let noDupes = new Set(allMatches);
        return Array.from(noDupes).map(entry => entry.toData() as EntryData);
    }

    /**
     * This function is a bit strange, but was extracted from
     * the 6 functions below, which were duplicates code-wise
     * @param elementsIn list of Elements (Defs, Entries, etc) to set
     * @param elementRepo the existing set of Elements in the DataStore (this.defs, this.entries, etc)
     */
    async setElementsInRepo(elementsIn: ElementData[], elementRepo: Element[], msgs: string[]): Promise<void> {
        if (elementsIn.length === 0) return;
        let newElements: ElementData[] = [];
        elementsIn.forEach(el => {
            //if we're *only* deleting or undeleting, this should find match.
            let sameUid = elementRepo.find(existingElement => existingElement.uid == el._uid);
            if (sameUid !== undefined) {
                //only replace if the setDefs def is newer, necessary for StorageConnector merges
                if (sameUid.isOlderThan(el)) {
                    sameUid.deleted = el._deleted;
                    sameUid.updated = el._updated;
                }
                return
            }

            //if we're *updating* then we need to find based on the same element ID
            let sameId = elementRepo.find(existingElement => existingElement.data._deleted === false && existingElement.sameIdAs(el));
            if (sameId !== undefined) {
                //only replace if the setDefs def is newer, necessary for StorageConnector merges
                if (sameId.isOlderThan(el)) {
                    sameId.deleted = true;
                    sameId.updated = makeEpochStr();
                    newElements.push(el);
                } else {
                    msgs.push('Skipped saving entry with uid ' + el._uid + ', as a more recently updated element is already in stores');
                }
            } else {
                newElements.push(el);
            }
        });
        const type = elementsIn[0].hasOwnProperty('_eid') === true ? 'EntryData' : 'DefData';
        if (type === 'DefData') elementRepo.push(...newElements.map(d => new Def(d, this.pdw)));
        if (type === 'EntryData') elementRepo.push(...await this.pdw.inflateEntriesFromData(newElements as EntryData[]));
        // return elementsIn;
    }

    async getOverview(): Promise<DataStoreOverview> {
        throw new Error("Method not implemented.");
    }

    // setAll(completeData: CompleteDataset): CompleteDataset {
    //     throw new Error("Method not implemented.");
    // }

    async connect(pdwRef: PDW): Promise<boolean> {
        this.pdw = pdwRef;
        console.log("Connected to the DefaultDataStore");
        return true

    }

}

//#endregion

//#region ### UTILITIES ###

export function parseTemporalFromEpochStr(epochStr: EpochStr): Temporal.ZonedDateTime {
    const epochMillis = parseInt(epochStr, 36)
    const parsedTemporal = Temporal.Instant.fromEpochMilliseconds(epochMillis).toZonedDateTimeISO(Temporal.Now.timeZone());
    if (parsedTemporal.epochSeconds == 0) throw new Error('Unable to parse temporal from ' + epochStr)
    return parsedTemporal
}

//#endregion
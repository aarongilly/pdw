import { Temporal } from "temporal-polyfill";
import * as dj from "./DataJournal";
import { Period } from "./Period";

//#region ### TYPES ###

//#endregion

//#region ### INTERFACES ###

/**
 * The `DataStore` interface is what you must implement when creating code to
 * hook up a new database. It is what sits between the database of choice and the PDW.
 * It's designed to be as simple-to-implement as possible.
 * 
 * The parameter sanitization & merge logic are handled by the PDW.
 * 
 * It's *very much* a work in progress.
 */
export interface DataStore {

    commit(trans: Transaction): Promise<any>;

    getEntries(params: ReducedParams): Promise<ReducedQueryResponse>;

    getDefs(includeDeletedForArchiving?: boolean): Promise<DefData[]>;

    getOverview(): Promise<DataStoreOverview>;

    connect(...params: any): Promise<boolean>;

    /**
     * The name of the connector, essentially. Examples: "Excel", "Firestore"
     */
    serviceName: string;

    /**
     * A reference to the Personal Data Warehouse instance to 
     * which the storage connector is connected.
     */
    pdw?: PDW;
}

/**
 * The means to convert {@link CanonicalDataset}s to and from other formats
 */
export interface CanonicalDataTranslator {
    toCanonicalData(params: any): Promise<CanonicalDataset>;
    fromCanonicalData(canonicalDataset: CanonicalDataset, params: any): any;
    /**
     * Data from the external library are imported into a PDW instance.
     */
    // importDefData(params: any): Promise<DefData[]>,
    // importEntryData(usingDefData: DefData[], params: any): Promise<EntryData[]>
    /**
     * Data from the PDW is supplied, it's saved in an exported format
     * according to the Exporter logic & whatnot.
     */
    // exportTo(allData: CanonicalDataset, params: any): any
}

export interface Transaction {
    create: ElementMap;
    update: ElementMap;
    delete: DeletionMsgMap;
}


export interface PeriodSummary {
    period: PeriodStr | "ALL";
    // entryRollups: EntryRollup[];
    entries: EntryData[]
}

export interface QueryResponse {
    success: boolean;
    count: number;
    msgs?: string[];
    params: { paramsIn: object, asParsed: object };
    entries: Entry[];
    summary?: PeriodSummary[];
    // defs: Def[]; //maybe not needed? Entry contains Def
}

export interface ReducedQueryResponse {
    success: boolean;
    entries: EntryData[];
    msgs?: string[];
}

// export interface CommitResponse {
//     success: boolean;
//     msgs?: string[];
//     defData?: DefData[];
//     entryData?: EntryData[];
//     delDefs?: DeletionMsg[];
//     delEntries?: DeletionMsg[];
// }

interface CurrentAndDeletedCounts {
    /**
     * undefined means zero
     */
    current: number | undefined,
    /**
     * undefined means zero
     */
    deleted: number | undefined
}

export interface DataStoreOverview {
    storeName?: string;
    defs: CurrentAndDeletedCounts;
    entries: CurrentAndDeletedCounts;
    lastUpdated: EpochStr;
}

//#endregion

//#region ### CLASSES ###

export class PDW {
    dataStore: DataStore;
    private _manifest: Def[]; //#TODO - move to Database Class
    private constructor(manifest: DefLike[], store?: DataStore,) {
        this._manifest = this._manifest = manifest.map(defData => new Def(defData, this));
        if (store !== undefined) {
            this.dataStore = store;
        } else {
            this.dataStore = new DefaultDataStore(this);
        }

        console.log('PDW instance created with the ' + this.dataStore.serviceName + ' DataStore, with ' + this._manifest.length + ' definitions.');
    }

    public get manifest(): Def[] {
        return this._manifest;
    }

    static async newPDW(defManifest: DefLike[]): Promise<PDW> {
        let instance = new PDW([]);
        await instance.setDefs(defManifest);
        return instance
    }

    static async newPDWUsingDatastore(dataStore: DataStore): Promise<PDW> {
        let defs = await dataStore.getDefs(false);
        return new PDW(defs, dataStore);
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

    private pushDefsToManifest(defs: Def[]) {
        if (!Array.isArray(defs)) return;
        if (defs.length === 0) return;
        defs.forEach((def: any) => {
            //find def with the same _did, if you find it, replace it
            //if you don't, add it
            const existsAt = this.manifest.findIndex(mD => mD.data._did === def.data._did);
            if (existsAt === -1) this.manifest.push(def);
            if (existsAt !== -1) this.manifest[existsAt] = def;
        })
    }

    private async handleManifestDeletionChange(deles: DeletionMsg[]) {
        if (!Array.isArray(deles)) deles = [deles];
        const deletions = deles.filter(d => d.deleted);
        const undeletions = deles.filter(d => !d.deleted);
        this._manifest = this.manifest.filter(md => !deletions.some(d => d.uid === md.data._uid));
        if (undeletions.length > 0) {
            this.manifest.push(...(await this.getDefs(false)));
        }
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

    /**
     * Grabs the Defs from the attached DataStore. 
     * By default, does not include the deleted defs.
     * If you want to include *all* defs, pass in `true`
     * @param includedDeleted false by default
     * @returns Defs inflated from the DataStore
     */
    async getDefsFromDataStore(includedDeleted = false): Promise<Def[]> {
        const defDatas = await this.dataStore.getDefs(includedDeleted);
        let defs = defDatas.map(dl => new Def(dl, this));
        this._manifest = defs.filter(d => !d.deleted);
        return defs;
    }

    /**
     * Grabs the Def from the loaded manifest. 
     * If it doesnt exist, returns undefined.
     */
    getDefFromManifest(did: string): Def | undefined {
        let foundDef = this._manifest.find(def => def.did === did);
        if (foundDef === undefined) foundDef = this._manifest.find(def => def.lbl.toUpperCase() === did.toUpperCase().trim());
        if (foundDef === undefined) throw new Error("Did not find Def in manifest ")
        return foundDef
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
     * Combines two complete(ish) datasets ({@link CanonicalDataset}). 
     * Returns a CompleteDataset that merges each type of ElementData
     */
    mergeComplete(a: CanonicalDataset, b: CanonicalDataset): CanonicalDataset {
        let returnObj: CanonicalDataset = {
            defs: [],
            entries: []
        };

        if (a.defs.length > 0 && b.defs.length > 0) {
            returnObj.defs = this.merge(a.defs, b.defs) as DefData[];
        } else {
            if (a.defs.length > 0) returnObj.defs = a.defs
            if (b.defs.length > 0) returnObj.defs = b.defs
        }
        if (a.entries.length > 0 && b.entries.length > 0) {
            returnObj.entries = this.merge(a.entries, b.entries) as EntryData[];
        } else {
            if (a.entries.length > 0) returnObj.entries = a.entries
            if (b.entries.length > 0) returnObj.entries = b.entries
        }
        return returnObj;
    }

    /**
     * Mergest two arrays of elements and returns a static COPY of the combined list
     * without duplicates. Also handles marking things as updated & deleted when they
     * are different in between lists (the most-recently-updated one stays, the rest
     * are marked _deleted = true)
     * @param a list of Elements or ElementData
     * @param b list of Elements or ElementData
     * @returns an array of separate, data-only copies of the merged elements
     */
    merge(a: ElementData[] | Element[], b: ElementData[] | Element[]): ElementData[] {
        if (a.hasOwnProperty('__modified')) a = a.map(el => el.data);
        if (b.hasOwnProperty('__modified')) b = b.map(el => el.data);
        //make static copy of A
        let result = a.map(e => JSON.parse(JSON.stringify(e)));

        b.forEach(eB => {
            let match = result.find(eA => eA._uid === (<ElementData>eB)._uid);
            if (match !== undefined && match._updated === (<ElementData>eB)._updated) return //result is identical
            if (match !== undefined) {
                if (match._updated! > (<ElementData>eB)._updated!) return //result is newer
                match._updated = (<ElementData>eB)._updated;
                match._deleted = (<ElementData>eB)._deleted;
                return //due to principle of not changing data on update, this makes match equal to eB
            }
            let matches = result.filter(eA => Element.hasSameId(eA, eB as ElementData));
            if (matches.length === 0) {
                result.push(JSON.parse(JSON.stringify(eB)));
                return
            }
            if (matches.length > 1) {
                //keep the most recently updated one
                match = matches.reduce((prev, current) => (prev._updated! > current._updated!) ? prev : current);
            } else {
                match = matches[0]
            }
            if (match !== undefined) {
                if (match._updated! > (<ElementData>eB)._updated) return
                match._deleted = true; //match is outdated by new entry in b
                match._updated = (<ElementData>eB)._created; //this seems appropriate
                //intentionally not returning here, still need to push eB
            }
            result.push(JSON.parse(JSON.stringify(eB)));
        })
        return result;
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

    inflateEntriesFromData(entryData: EntryData[]): Entry[] {
        return entryData.map(e => new Entry(e, this));
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
        if(def === undefined) console.log(entries[0])
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
        const defMap: {[did: string]: Def} = {};
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

//#TODO - clean up some query methods, maybe combine things like "dids" "defs" "defsLbld"
export class Query {
    // private verbosity: 'terse' | 'normal' | 'verbose'
    // private rollup: boolean
    public pdw: PDW;
    private params: StandardParams
    private sortOrder: undefined | 'asc' | 'dsc'
    private sortBy: undefined | string
    constructor(pdwRef: PDW, paramsIn?: StandardParams) {
        // this.verbosity = 'normal';
        // this.rollup = false;
        this.pdw = pdwRef;
        this.params = { includeDeleted: 'no' }; //default
        if (paramsIn !== undefined) this.parseParamsObject(paramsIn)
    }

    parseParamsObject(paramsIn: StandardParams) {
        if (paramsIn?.includeDeleted !== undefined) {
            if (paramsIn.includeDeleted === 'no') this.includeDeleted(false);
            if (paramsIn.includeDeleted === 'yes') this.includeDeleted(true);
            if (paramsIn.includeDeleted === 'only') this.onlyIncludeDeleted();
        }
        if (paramsIn?.allOnPurpose !== undefined) this.allOnPurpose(paramsIn.allOnPurpose);
        if (paramsIn?.createdAfter !== undefined) this.createdAfter(paramsIn.createdAfter);
        if (paramsIn?.createdBefore !== undefined) this.createdBefore(paramsIn.createdBefore);
        if (paramsIn?.updatedAfter !== undefined) this.updatedAfter(paramsIn.updatedAfter);
        if (paramsIn?.updatedBefore !== undefined) this.updatedBefore(paramsIn.updatedBefore);
        if (paramsIn?.defLbl !== undefined) this.forDefsLbld(paramsIn.defLbl);
        if (paramsIn?.did !== undefined) this.forDids(paramsIn.did);
        if (paramsIn?.uid !== undefined) this.uids(paramsIn.uid);
        if (paramsIn?.eid !== undefined) this.eids(paramsIn.eid);
        if (paramsIn?.tag !== undefined) this.tags(paramsIn.tag);
        if (paramsIn?.from !== undefined) this.from(paramsIn.from);
        if (paramsIn?.to !== undefined) this.to(paramsIn.to);
        if (paramsIn?.inPeriod !== undefined) this.inPeriod(paramsIn.inPeriod);
        if (paramsIn?.scope !== undefined) this.scope(paramsIn.scope);
        if (paramsIn?.today !== undefined) this.inPeriod(Period.now(Scope.DAY));
        if (paramsIn?.thisWeek !== undefined) this.inPeriod(Period.now(Scope.WEEK));
        if (paramsIn?.thisMonth !== undefined) this.inPeriod(Period.now(Scope.MINUTE));
        if (paramsIn?.thisQuarter !== undefined) this.inPeriod(Period.now(Scope.QUARTER));
        if (paramsIn?.thisYear !== undefined) this.inPeriod(Period.now(Scope.YEAR));
        return this
    }

    static parseFromURL(url: string): Query {
        console.log(url);

        throw new Error('unimplemented')

    }

    encodeAsURL(): string {
        //new URLSearchParams(obj).toString(); //ref code
        throw new Error('unimplemented')
    }

    includeDeleted(b = true) {
        if (b) {
            this.params.includeDeleted = 'yes';
        } else {
            this.params.includeDeleted = 'no';
        }
        return this
    }

    onlyIncludeDeleted() {
        this.params.includeDeleted = 'only';
        return this
    }

    forDids(didList: string[] | string) {
        if (!Array.isArray(didList)) didList = [didList];
        this.params.did = didList;
        return this
    }

    forDefsLbld(defLbls: string[] | string) {
        if (!Array.isArray(defLbls)) defLbls = [defLbls];
        this.params.defLbl = defLbls;
        return this
    }

    createdAfter(epochDateOrTemporal: EpochStr | Date | Temporal.ZonedDateTime) {
        const epoch = makeEpochStrFrom(epochDateOrTemporal);
        this.params.createdAfter = epoch;
        return this;
    }

    createdBefore(epochDateOrTemporal: EpochStr | Date | Temporal.ZonedDateTime) {
        const epoch = makeEpochStrFrom(epochDateOrTemporal);
        this.params.createdBefore = epoch;
        return this;
    }

    updatedAfter(epochDateOrTemporal: EpochStr | Date | Temporal.ZonedDateTime) {
        const epoch = makeEpochStrFrom(epochDateOrTemporal);
        this.params.updatedAfter = epoch;
        return this;
    }

    updatedBefore(epochDateOrTemporal: EpochStr | Date | Temporal.ZonedDateTime) {
        const epoch = makeEpochStrFrom(epochDateOrTemporal);
        this.params.updatedBefore = epoch;
        return this;
    }

    forDefs(defList: Def[] | Def) {
        if (!Array.isArray(defList)) defList = [defList];
        return this.forDids(defList.map(def => def.did));
    }

    uids(uid: string[] | string) {
        if (!Array.isArray(uid)) uid = [uid];
        this.params.uid = uid;
        return this
    }

    eids(eid: string[] | string) {
        if (!Array.isArray(eid)) eid = [eid];
        this.params.eid = eid;
        return this
    }

    rollup(to: Scope) {
        to = to.toUpperCase() as Scope;
        this.params.rollup = to;
        return this
    }

    /**
     * Cannot be used in conjuction with dids. This sets `params.did` internally.
     * @param tid tag ID of tags to be used
     * @returns 
     */
    tags(tags: string[] | string) {
        if (!Array.isArray(tags)) tags = [tags];
        //convert tags into dids
        const dids = this.pdw.manifest.filter(def => def.hasTag(tags))
        this.params.did = dids.map(d => d.data._did);
        return this
    }

    scope(scopes: Scope[] | Scope): Query {
        if (!Array.isArray(scopes)) scopes = [scopes];
        let defs = this.pdw.manifest.filter(def => (<Scope[]>scopes).some(scope => scope === def.scope));
        this.params.did = defs.map(def => def.did);
        return this
    }

    scopeMin(scope: Scope): Query {
        let scopes = Object.values(Scope);
        let index = scopes.indexOf(scope);
        return this.scope(scopes.slice(index));
    }

    scopeMax(scope: Scope): Query {
        let scopes = Object.values(Scope);
        let index = scopes.indexOf(scope);
        return this.scope(scopes.slice(0, index + 1));
    }

    allOnPurpose(allIn = true): Query {
        this.params.allOnPurpose = allIn;
        return this
    }

    from(period: Period | PeriodStr) {
        this.params.from = period;
        return this
    }

    to(period: Period | PeriodStr) {
        this.params.to = period;
        return this
    }

    inPeriod(period: Period | PeriodStr) {
        this.params.from = period;
        this.params.to = period;
        return this
    }

    /**
     * How to sort the entries in the result.
     * @param propName underscore-prefixed known prop, or the pid of the Point to sort by
     * @param type defaults to 'asc'
     */
    sort(propName: string, type: undefined | 'asc' | 'dsc') {
        if (type === undefined) type = 'asc';
        this.sortOrder = type;
        this.sortBy = propName;
    }

    async run(): Promise<QueryResponse> {
        //empty queries are not allowed
        if (this.params === undefined ||
            (!this.params.allOnPurpose && Object.keys(this.params).length <= 1)
        ) {
            return {
                success: false,
                count: 0,
                params: {
                    paramsIn: this.params,
                    asParsed: this.pdw.sanitizeParams(this.params)
                },
                msgs: ['Empty queries not allowed. If seeking all, include {allOnPurpose: true}'],
                entries: []
            }
        }
        let entries = await this.pdw.getEntries(this.params);
        if (this.sortBy !== undefined) entries = this.applySort(entries);
        let resp: QueryResponse = {
            success: true,
            count: entries.length,
            params: {
                paramsIn: this.params,
                asParsed: this.pdw.sanitizeParams(this.params)
            },
            entries: entries,
            summary: this.params.hasOwnProperty('rollup') ? PDW.summarize(entries, this.params.rollup as Scope) : undefined
        }
        return resp
    }

    private applySort(entries: Entry[]): Entry[] {
        return entries.sort((a, b) => {
            if (this.sortOrder === 'asc') {
                //@ts-expect-error
                return a[this.sortBy] > b[this.sortBy] ? 1 : -1
            }
            //@ts-expect-error
            return a[this.sortBy] > b[this.sortBy] ? -1 : 1
        })
    }
}

export class DefaultDataStore implements DataStore {
    serviceName: string;
    pdw: PDW;
    defs: Def[];
    entries: Entry[];

    constructor(pdwRef: PDW) {
        this.serviceName = 'In memory dataset';
        this.pdw = pdwRef;
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

/**
 * Makes a unique identifier for use with _uid and _eid
 */
export function makeUID(): UID {
    return makeEpochStr() + "-" + makeSmallID();
}

export function makeEpochStr(): EpochStr {
    return Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString(36)
}

export function makeSmallID(length = 4): SmallID {
    return Math.random().toString(36).slice(13 - length).padStart(length, "0")
}

export function parseTemporalFromUid(uid: UID): Temporal.ZonedDateTime {
    return parseTemporalFromEpochStr(uid.split("-")[0]);
}

export function isValidEpochStr(epochStr: string): boolean {
    if (typeof epochStr !== 'string') return false;
    if (epochStr.length !== 8) return false; //not supporting way in the past or future
    //☝️ technically creates a 2059 problem... but that's my problem when I'm 2x as old as I am now
    //console.log(parseTemporalFromEpochStr('zzzzzzz').toLocaleString()) //is "6/25/1972, 6:49:24 PM CDT"
    //console.log(parseTemporalFromEpochStr('100000000').toLocaleString()) //is "5/25/2059, 12:38:27 PM CDT"
    //for now this is good enough. I could parse a temporal out then check if it succeed & is in a resonable year, but meh
    return true
}

export function makeEpochStrFrom(epochDateOrTemporal: EpochStr | Date | Temporal.ZonedDateTime): EpochStr | undefined {
    if (typeof epochDateOrTemporal === 'string') {
        if (isValidEpochStr(epochDateOrTemporal)) return epochDateOrTemporal;
        //This WILL cause errors given bad strings, but I want to support lazy strings like "2023-07-28"
        return Temporal.Instant.fromEpochMilliseconds(new Date(epochDateOrTemporal).getTime()).toZonedDateTimeISO(Temporal.Now.timeZone()).epochMilliseconds.toString(36);
    }
    if (Object.prototype.toString.call(epochDateOrTemporal) === "[object Date]") {
        return (<Date>epochDateOrTemporal).getTime().toString(36);
    }
    if (Object.prototype.toString.call(epochDateOrTemporal) === "[object Temporal.ZonedDateTime]") {
        return (<Temporal.ZonedDateTime>epochDateOrTemporal).epochMilliseconds.toString(36);
    }
    return undefined;
}

export function parseTemporalFromEpochStr(epochStr: EpochStr): Temporal.ZonedDateTime {
    const epochMillis = parseInt(epochStr, 36)
    const parsedTemporal = Temporal.Instant.fromEpochMilliseconds(epochMillis).toZonedDateTimeISO(Temporal.Now.timeZone());
    if (parsedTemporal.epochSeconds == 0) throw new Error('Unable to parse temporal from ' + epochStr)
    return parsedTemporal
}

//#endregion
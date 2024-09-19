import { Temporal } from "temporal-polyfill";
import { QueryObject, Entry, Def, Overview, DataJournal, EpochStr, DJ } from "./DJ.js";
import { ConnectorListMember, getConnector, getTranslator, TranslatorListMember } from "./ConnectorsAndTranslators.js";

//#region ### TYPES ###

//none?

//#endregion

//#region ### INTERFACES ###

export interface Connector {

    commit(trans: Transaction): Promise<CommitResponse>;

    query(params: QueryObject): Promise<Entry[]>;

    getDefs(): Def[];

    getOverview(): Promise<Overview>;

    connect(...params: any): Promise<Def[]>;

    /**
     * The name of the connector.
     */
    getServiceName(): string;
}

export interface CommitResponse {
    
}

/**
 * The means to convert {@link CanonicalDataset}s to and from other formats
*/
export interface Translator {
    toDataJournal(params: any): Promise<DataJournal>;
    fromDataJournal(canonicalDataset: DataJournal, params: any): any;
    /**
     * The name of the translator.
    */
    getServiceName(): string;
}

export interface Transaction {
    /**
     * Brand new Entries & Defs. Must have all minimum fields present.
     * Checks for existing records with the same ID will not be done.
     */
    create: DataJournal;
    /**
     * What MAY be an update or MAY be wholly new data points. 
     * Each of `element._id` contained in here will be searched for by
     * the connector - if the `_id` is found AND the `_updated` in the
     * transaction is newer, the property values in the transaction 
     * will overwrite existing property values. BUT existing property
     * values not explicitly nullified in the data will not be removed
     * from the data on the other side of the connector.
     */
    update: TransactionUpdates;
    /**
     * These are assumed to already exist. These will ONLY change the 
     * `_updated` & `_deleted` fields for the found data with the same
     * `_id`. 
     */
    delete: TransactionDeletes;
}

export interface TransactionUpdates {
    defs: TransactionUpdateMember[],
    entries: TransactionUpdateMember[]
}

export interface TransactionUpdateMember {
    _id: string,
        _updated: EpochStr
        [propsToSet: string]: any
}

export interface TransactionDeletes {
    defs: TransactionDeleteMember[],
    entries: TransactionDeleteMember[]
}

export interface TransactionDeleteMember{
    _id: string,
    _updated: EpochStr,
    _deleted: boolean
}

export interface Config {
    translators?: ConfigTranslator[],
    connectors?: ConfigConnector[],
    entries?: Entry[],
    defs?: Def[]
}

export interface ConfigTranslator {
    /**
     * Must match Translator.getServiceName
     */
    serviceName: TranslatorListMember,
    /**
     * Where to go look for data.
     */
    filePath: string
}

export interface ConfigConnector {
    /**
     * Must match Connector.getServiceName
     */
    serviceName: ConnectorListMember,
    /**
     * Whatever other params are needed, per Connector
     */
    params?: any
}

//#endregion

//#region ### CLASSES ###

export class PDW {
    connectors: Connector[];
    translators: Translator[];
    localData: DataJournal;

    /** Singleton */
    private static _instance: PDW;

    private constructor(config: Config) {
        this.localData = {
            defs: config.defs ?? [],
            entries: config.entries ?? []
        };
        this.connectors = [];
        this.translators = [];

        PDW._instance = this;
    }

    /** Probably only for testing? */
    private clearForTest() {
        //@ts-expect-error // for test, hacking.
        PDW._instance = undefined;
    }


    static async newPDW(config?: Config): Promise<PDW> {
        if (PDW._instance !== undefined) throw new Error('PDW Instance already exists. Do you you mean to getPDW?')
        if (config === undefined) config = {};
        const pdwRef = new PDW(config);
        let connectorPromiseArray: Promise<Def[]>[] = [];
        let translatorPromiseArray: Promise<DataJournal>[] = [];
        if (config.connectors !== undefined) {
            connectorPromiseArray = config.connectors?.map(connectorConfig => {
                const connectorInstance = getConnector(connectorConfig.serviceName);
                pdwRef.connectors.push(connectorInstance);
                return connectorInstance.connect(connectorConfig.params);
            })
        }
        const defsFromConnectors = await Promise.all([...connectorPromiseArray]);
        pdwRef.localData.defs = DJ.mergeDefs(defsFromConnectors);

        if (config.translators !== undefined) {
            translatorPromiseArray = config.translators?.map(transConfig => {
                const transInstance = getTranslator(transConfig.serviceName);
                pdwRef.translators.push(transInstance);
                return transInstance.toDataJournal(transConfig.filePath)
            })
        }
        const results = await Promise.all([...translatorPromiseArray])//, ...connectorPromiseArray]);

        pdwRef.localData = DJ.merge([pdwRef.localData, ...results])
        console.log('New PDW created with ' + pdwRef.connectors.length + ' connectors, with data imported from ' + pdwRef.translators.length + ' translators');

        return pdwRef
    }

    static getPDW(): PDW {
        if (this._instance === undefined) throw new Error("No PDW exists");
        return PDW._instance;
    }

    /**
     * Grabs Defs from all attached Connectors and any Defs internal to the PDW.
     * @returns Def array containing a static copy of all merged Defs from the 
     * PDW local database and all attached Connectors
     */
    getDefs(): Def[] {
        let defs = this.localData.defs
        let connectedDefs = this.connectors.map(connector => connector.getDefs());
        const mergedDefs = DJ.mergeDefs([defs, ...connectedDefs])
        return mergedDefs
    }

    /**
     * Creates a {@link Transaction} from the passed in arrays of {@link Def}s, then 
     * distributes the commit message out to each connected database.
     * @returns Array of responses from each connector's "commit" method.
     */
    async setDefs(createDefs: Def[] = [], updateDefs: TransactionUpdateMember[] = [], deletionDefs: TransactionDeleteMember[] = []): Promise<any> {
        //created must have all required fields
        const sanitizedCreated = createDefs.map(def => this.ensureCreatableDef(def));
        //updated must have _id and _updated
        const sanitizedUpdated = updateDefs.map(def => this.ensureUpdateable(def) as Def);
        //deleted must have _id, _updated, & _deleted
        const sanitizedDeleted = deletionDefs.map(def => this.ensureDeleteable(def));

        let trans: Transaction = {
            create: {
                defs: sanitizedCreated,
                entries: []
            },
            update: {
                defs: sanitizedUpdated,
                entries: []
            },
            delete: {
                defs: sanitizedDeleted,
                entries: []
            }
        }

        const connectorPromiseArray = this.connectors.map(connector => connector.commit(trans));
        return await Promise.all(connectorPromiseArray);
    }

    async getEntries(rawParams?: StandardParams): Promise<Entry[]> {
        if (rawParams === undefined) rawParams = {};
        const params = this.sanitizeParams(rawParams);
        let entriesQuery = await this.dataStore.getEntries(params);
        return this.inflateEntriesFromData(entriesQuery.entries);
    }

    async setEntries(createEntries: EntryData[] = [], updateEntries: EntryData[] = [], deletionEntries: DeletionMsg[] = []): Promise<any> {
        // PDW.ensureValidAndUpdated()
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


    query(params?: StandardParams): Query {
        return new Query(this, params);
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

    ensureUpdateable(element: Partial<Entry> | Partial<Def>): TransactionUpdateMember {
        if (!Object.hasOwn(element, '_id')) {
            console.error('No ID element:', element);
            throw new Error("No _id found on element");
        }
        if (element._updated === undefined) element._updated = DJ.makeEpochStr();
        return element as TransactionUpdateMember
    }

    ensureDeleteable(element: Partial<Entry> | Partial<Def>): TransactionDeleteMember {
        if (!Object.hasOwn(element, '_id')) {
            console.error('No ID element:', element);
            throw new Error("No _id found on element");
        }
        if (element._updated === undefined) element._updated = DJ.makeEpochStr();
        //@ts-expect-error - it doesn't like Partial Def having a `_deleted` key, which I want here
        if (element._deleted === undefined) element._deleted = true;
        return element as TransactionDeleteMember
    }

    ensureCreatableEntry(entry: Partial<Entry>): Entry {
        if (entry._updated === undefined) entry._updated = DJ.makeEpochStr();
        if (!DJ.isValidEntry(entry)) throw new Error('Invalid entry found, see log around this');
        return entry as Entry
    }

    ensureCreatableDef(def: Partial<Def>): Def {
        if (def._updated === undefined) def._updated = DJ.makeEpochStr();
        if (!DJ.isValidDef(def)) throw new Error('Invalid def found, see log around this');
        return def as Def
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
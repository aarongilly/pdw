import { Temporal } from "temporal-polyfill";
import { QueryObject, Entry, Def, Overview, DataJournal, EpochStr, DJ } from "./DJ.js";
import { ConnectorListMember, getConnector, getTranslator, TranslatorListMember } from "./ConnectorsAndTranslators.js";

//#region ### TYPES ###

//none?

//#endregion

//#region ### INTERFACES ###

export interface Connector {

    commit(trans: TransactionObject): Promise<CommitResponse>;

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

export interface HalfTransactionObject {
    /**
     * Brand new elements. Must have all minimum fields present.
     * No checks for existing records with the same ID.
     */
    create?: Def[] | Entry[];
    /**
     * In short: "L overwritten with F becomes F"
     * 
     * If the element doesn't exist, it's created.
     * If the element does exist AND is older than the transaction copy,
     * it is fully replaced by what's in the transaction copy.
     * If the element does exist AND is newer than the transaction copy,
     * the transaction copy is ignored.
    */
    overwrite?: Def[] | Entry[];
    /**
     * In short: "F appended to L becomes E"
     * 
     * If the element doesn't exist, it's created.
     * If the element does exist AND is older than the transaction copy,
     * properties from the transaction copy will replace properties from
     * the existing element, but existing element properties outside of
     * those found in the transaction copy will not be removed.
     * If the element does exist AND is newer than the transaction copy,
     * the transaction copy is ignored.
     */
    append?: TransactionUpdateMember[];
    /**
     * If elements are found with these IDs they will be deleted.
     * Definitions will be removed entirely.
     * Entries will be retained but marked as `_deleted` = `TRUE`
     */
    delete?: string[];
}

export interface TransactionObject {
    defs: HalfTransactionObject,
    entries: HalfTransactionObject
}

export interface TransactionUpdateMember {
    _id: string,
    _updated: EpochStr
    [propsToSet: string]: any
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
    localData: DataJournal; //#TODO - kill this & officially convert strawman

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
     * Creates a {@link TransactionObject} from the passed in arrays of {@link Def}s, then 
     * distributes the commit message out to each connected database.
     * @returns Array of responses from each connector's "commit" method.
     */
    async setDefs(defTransaction: HalfTransactionObject): Promise<CommitResponse[]> {
        //convert to full transaction object
        const trans: TransactionObject = {
            defs: defTransaction,
            entries: {}
        }
        //pass to common setter
        return await this.setAll(trans);
    }

    async getEntries(queryObject?: QueryObject): Promise<Entry[]> {
        if(queryObject === undefined) queryObject = {}
        let entries = this.localData.entries
        const connectorPromiseArray = this.connectors.map(connector => connector.query(queryObject));
        const connectedEntries = await Promise.all(connectorPromiseArray);
        const mergedEntries = DJ.mergeEntries([entries, ...connectedEntries])
        return mergedEntries
    }

    async setEntries(entryTransaction: HalfTransactionObject): Promise<CommitResponse[]> {
        //convert to full transaction object
        const trans: TransactionObject = {
            defs: {},
            entries: entryTransaction,
        }
        //pass to common setter
        return await this.setAll(trans);
    }

    /**
     * 
     * @param rawParams an object of any {@link StandardParams} to include
     * @returns a {@link CanonicalDataset} containing a {@link Def}s, {@link Entry}s
     */
    async getAll(queryObject?: QueryObject, includeOverview = true): Promise<DataJournal> {
        if(queryObject === undefined) queryObject = {}
        const defs = this.getDefs();
        const entries = await this.getEntries(queryObject);
        const dataset: DataJournal = {
            defs: defs,
            entries: entries
        }
        if(includeOverview){
            dataset.overview = DJ.makeOverview(dataset);
        }

        return dataset;
    }

    async setAll(transaction: TransactionObject): Promise<CommitResponse[]> {
        if(transaction.defs) transaction.defs = this.ensureValidDefTransactionObject(transaction.defs);
        if(transaction.entries) transaction.entries = this.ensureValidEntryTransactionObject(transaction.entries);
        const connectorPromiseArray = this.connectors.map(connector => connector.commit(transaction));
        return await Promise.all(connectorPromiseArray);
    }

    async query(queryObject?: QueryObject): Promise<Entry[]> {
        
        return 
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

    ensureValidDefTransactionObject(defTransaction: HalfTransactionObject): HalfTransactionObject {
        if (defTransaction.create) {
            defTransaction.create = defTransaction.create.map(def => this.ensureSettableDef(def));
        }
        if (defTransaction.overwrite) {
            defTransaction.overwrite = defTransaction.overwrite.map(def => this.ensureSettableDef(def));
        }
        if (defTransaction.append) {
            defTransaction.append = defTransaction.append.map(def => this.ensureAppendable(def));
        }
        if (defTransaction.delete) {
            if (!Array.isArray(defTransaction.delete)) throw new Error("The delete property of a transaction should be an array of strings")
        }
        return defTransaction
    }

    ensureValidEntryTransactionObject(defTransaction: HalfTransactionObject): HalfTransactionObject {
        if (defTransaction.create) {
            defTransaction.create = defTransaction.create.map(entry => this.ensureSettableEntry(entry));
        }
        if (defTransaction.overwrite) {
            defTransaction.overwrite = defTransaction.overwrite.map(entry => this.ensureSettableEntry(entry));
        }
        if (defTransaction.append) {
            defTransaction.append = defTransaction.append.map(entry => this.ensureAppendable(entry));
        }
        if (defTransaction.delete) {
            if (!Array.isArray(defTransaction.delete)) throw new Error("The delete property of a transaction should be an array of strings")
        }
        return defTransaction
    }

    ensureAppendable(element: Partial<Entry> | Partial<Def>): TransactionUpdateMember {
        if (!Object.hasOwn(element, '_id')) {
            console.error('No ID element:', element);
            throw new Error("No _id found on element");
        }
        if (element._updated === undefined) element._updated = DJ.makeEpochStr();
        return element as TransactionUpdateMember
    }

    ensureSettableEntry(entry: Partial<Entry>): Entry {
        if (entry._updated === undefined) entry._updated = DJ.makeEpochStr();
        if (!DJ.isValidEntry(entry)) throw new Error('Invalid entry found, see log around this');
        return entry as Entry
    }

    ensureSettableDef(def: Partial<Def>): Def {
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
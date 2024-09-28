import { QueryObject, Entry, Def, Overview, DataJournal, DJ, HalfTransaction, TransactionObject, DiffReport } from "./DataJournal.js";
import { ConnectorListMember, getConnector, getTranslator, TranslatorListMember } from "./ConnectorsAndTranslators.js";
import { InMemoryDb } from "./connectors/inMemoryConnector.js";

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

export interface CommitResponse extends DiffReport {
    success: boolean; //only required field
    error?: string;
    warnings?: string[];
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

    /** Singleton */
    private static _instance: PDW;

    private constructor() {
        this.connectors = [];
        this.translators = [];
        PDW._instance = this;
    }

    //@ts-ignore --- For testing
    private clearForTest() {
        //@ts-expect-error // for test, hacking.
        PDW._instance = undefined;
    }

    static async newPDW(config?: Config): Promise<PDW> {
        if (PDW._instance !== undefined) throw new Error('PDW Instance already exists. Do you you mean to getPDW?')
        if (config === undefined) config = {};
        const pdwRef = new PDW();
        let connectorPromiseArray: Promise<Def[]>[] = [];
        let translatorPromiseArray: Promise<DataJournal>[] = [];
        if (config.connectors !== undefined) {
            connectorPromiseArray = config.connectors?.map(connectorConfig => {
                const connectorInstance = getConnector(connectorConfig.serviceName);
                pdwRef.connectors.push(connectorInstance);
                return connectorInstance.connect(connectorConfig.params);
            })
        }

        //ensure there's at least one connection - the Default in-memory connection
        if (pdwRef.connectors.length === 0) {
            // const defaultConnector = 
            pdwRef.connectors.push(new InMemoryDb())
        }

        if (config.translators !== undefined) {
            translatorPromiseArray = config.translators?.map(transConfig => {
                const transInstance = getTranslator(transConfig.serviceName);
                pdwRef.translators.push(transInstance);
                return transInstance.toDataJournal(transConfig.filePath)
            })

            //merge DataJournals from all translators
            const translatorArr = await Promise.all(translatorPromiseArray);
            const allDJ = DJ.merge(translatorArr, false);

            //push to connectors?
            await Promise.all(connectorPromiseArray);
            pdwRef.setAll({
                defs: {
                    modify: allDJ.defs
                },
                entries: {
                    modify: allDJ.entries
                }
            })
        }

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
        let connectedDefs = this.connectors.map(connector => connector.getDefs());
        const mergedDefs = DJ.mergeDefs(connectedDefs)
        return mergedDefs
    }

    /**
     * Creates a {@link TransactionObject} from the passed in arrays of {@link Def}s, then 
     * distributes the commit message out to each connected database.
     * @returns Array of responses from each connector's "commit" method.
     */
    async setDefs(defTransaction: HalfTransaction): Promise<CommitResponse[]> {
        //convert to full transaction object
        const trans: TransactionObject = {
            defs: defTransaction,
            entries: {}
        }
        //pass to common setter
        return await this.setAll(trans);
    }

    async getEntries(queryObject?: QueryObject): Promise<Entry[]> {
        if (queryObject === undefined) queryObject! = {}
        const connectorPromiseArray = this.connectors.map(connector => connector.query(queryObject!));
        const connectedEntries = await Promise.all(connectorPromiseArray);
        const mergedEntries = DJ.mergeEntries(connectedEntries)
        return mergedEntries
    }

    async setEntries(entryTransaction: HalfTransaction): Promise<CommitResponse[]> {
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
        if (queryObject === undefined) queryObject = {}
        const defs = this.getDefs();
        const entries = await this.getEntries(queryObject);
        const dataset: DataJournal = {
            defs: defs,
            entries: entries
        }
        if (includeOverview) {
            dataset.overview = DJ.makeOverview(dataset);
        }

        return dataset;
    }

    async setAll(transaction: TransactionObject): Promise<CommitResponse[]> {
        if (transaction.defs) transaction.defs = DJ.ensureValidDefTransactionObject(transaction.defs);
        if (transaction.entries) transaction.entries = DJ.ensureValidEntryTransactionObject(transaction.entries);
        const connectorPromiseArray = this.connectors.map(connector => connector.commit(transaction));
        return await Promise.all(connectorPromiseArray);
    }

    async query(queryObject?: QueryObject): Promise<Entry[]> {
        return this.getEntries(queryObject);
    }

    async newDef(def: Partial<Def>): Promise<CommitResponse[]> {
        let newDef = DJ.makeDef(def);
        const transaction: TransactionObject = {
            defs: {
                create: [newDef]
            },
            entries: {}
        }
        const connectorPromiseArray = this.connectors.map(connector => connector.commit(transaction));
        return await Promise.all(connectorPromiseArray);
    }

    async newEntry(entry: Partial<Entry>): Promise<CommitResponse[]> {
        let newEntry = DJ.makeEntry(entry)
        const transaction: TransactionObject = {
            defs: {
            },
            entries: {
                create: [newEntry]
            }
        }
        const connectorPromiseArray = this.connectors.map(connector => connector.commit(transaction));
        return await Promise.all(connectorPromiseArray);
    }
}

//#endregion
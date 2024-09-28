import { QueryObject, Entry, Def, Overview, DJ, DataJournal, TransactionObject } from "../DataJournal.js";
import { CommitResponse, Connector } from "../pdw.js";

/**
 * Strawman connector. 
 * MINIMALLY fulfills the Connector interface for developing stuff.
 */
export class InMemoryDb implements Connector {
    internalDJ: DataJournal
    constructor() {
        this.internalDJ = {
            defs: [],
            entries: []
        }
    }

    commit(trans: TransactionObject): Promise<CommitResponse> {
        let tempDJ = DJ.commit(this.internalDJ, trans);
        const diff = DJ.diffReport(this.internalDJ, tempDJ);
        this.internalDJ = tempDJ;
        const returnObj: CommitResponse = {
            success: true,
            ...diff
        }
        return new Promise((resolve) =>
            resolve(returnObj) // Resolve the promise
        )
    }

    query(params: QueryObject): Promise<Entry[]> {
        return new Promise((resolve) => {
            const filteredArray = DJ.filterTo(params, this.internalDJ.entries);
            return resolve(filteredArray as Entry[]); // Resolve the promise
        });
    }

    getDefs(): Def[] {
        return this.internalDJ.defs;
    }

    getOverview(): Promise<Overview> {
        return new Promise((resolve) => {
            const overview = DJ.addOverview(this.internalDJ);
            return resolve(overview.overview!); // Resolve the promise
        });
    }

    connect(): Promise<Def[]> {
        return new Promise((resolve) => resolve(this.internalDJ.defs));
    }

    getServiceName(): string {
        return 'In-Memory Database';
    }
}
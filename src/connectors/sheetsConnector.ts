import { QueryObject, Entry, Def, Overview, DJ, DataJournal, TransactionObject } from "../DataJournal.js";
import { CommitResponse, Connector } from "../pdw.js";

/**
 * NOTES TO SELF
 * - Okay so you decided not to go ultra-complex here and simply say:
 * - ALL MODIFICATIONS WILL COMPLETELY DESTROY AND REWRITE WHATEVER
 *  SHEET YOU'RE USING
 * - This could have bad implications down the road, but it's the 
 *  simplest thing to do right now.
 */

/**
 * Google Sheets Connector.
 * Mostly forwards along requests to the Google Apps Script deployed webapp.
 */
export class SheetsConnector implements Connector {
    internalDJ: DataJournal;
    private webAppUrl;
    constructor(webAppUrl: string) {
        this.webAppUrl = webAppUrl;
        this.internalDJ = {
            defs: [],
            entries: []
        }
    }

    commit(trans: TransactionObject): Promise<CommitResponse> {
        let tempDJ = DJ.commit(this.internalDJ, trans);

        const diff = DJ.diffReport(this.internalDJ, tempDJ);
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
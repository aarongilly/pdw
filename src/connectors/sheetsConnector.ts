import { QueryObject, Entry, Def, DataJournal, TransactionObject } from "../DataJournal.js";
import { CommitResponse, Connector } from "../pdw.js";
import * as dotenv from 'dotenv'

/* CONFIG SPOT */
dotenv.config();
const webAppUrl = process.env.LIVE_DEPLOYMENT_URL as string;//process.env.TEST_DEPLOYMENT_URL as string;
const testerOAuthToken = process.env.OAUTH as string;
const testMode = false; //true

/**
 * Google Sheets Connector.
 * Mostly forwards along requests to the Google Apps Script deployed webapp.
 * - IF you choose to supply the ID for a single Google Sheet (the "singleFileId")
 * then the methods will all use **only** that file as the whole Data Journal.
 * - ELSE you do NOT supply a single file ID, then the master "Manifest" sheet will
 * be called and the query/commit will be federated out and results collated.
 */
export class SheetsConnector implements Connector {
    internalDJ: DataJournal;
    private constructor() {
        this.internalDJ = {
            defs: [],
            entries: []
        }
    }

    static async newSheetsConnector(singleFileId?: string){
        const instance = new SheetsConnector();
        const defs = await SheetsConnector.postRequest({},'getDefs', singleFileId);
        instance.internalDJ.defs = defs;
        return instance
    }

    //static convenience methods
    static commit(trans: TransactionObject, singleFileId?: string): Promise<CommitResponse>{

        return new SheetsConnector().commit(trans, singleFileId);
    }
    static query(query: QueryObject, singleFileId?: string): Promise<Entry[]>{
        return new SheetsConnector().query(query, singleFileId);
    }
    static async getDefs(singleFileId?: string): Promise<Def[]>{
        const instance = await SheetsConnector.newSheetsConnector(singleFileId);
        return instance.getDefs()
    }

    async commit(trans: TransactionObject, singleFileId?: string): Promise<CommitResponse> {
        const returnObj: CommitResponse = {
            success: true,
        }
        returnObj.postResponse = await SheetsConnector.postRequest(trans,'commit',singleFileId);
        return new Promise((resolve) =>
            resolve(returnObj) // Resolve the promise
        )
    }

    async query(params: QueryObject, singleFileId?: string): Promise<Entry[]> {        
        const requestResult = await SheetsConnector.postRequest(params,'query',singleFileId);
        return new Promise((resolve) =>
            resolve(requestResult) // Resolve the promise
        )
    }

    getDefs(): Def[] {
        return this.internalDJ.defs;
    }

    connect(): Promise<Def[]> {
        return new Promise((resolve) => resolve(this.internalDJ.defs));
    }

    getServiceName(): string {
        return 'Google Sheets Connector';
    }

    /**
     * Sends the request to the posted webapp.
     * If the "singleFileId" param is not supplied, the webapp will use 
     * the "Manifest" sheet and operate in "Multi-File" mode
     * @param payload the Transaction, QueryObject
     * @param method effectively which function to call
     * @param singleFileId if supplied, will treat that one file as the whole Data Journal, 
     * if omitted, will use the manifest and operate in "Multi-File" mode
     * @returns whatever the method called returns
     */
    private static async postRequest(payload: any, method: 'commit' | 'query' | 'getDefs', singleFileId?: string) {
        const bodyObj: any = {
            data: payload
        }
        if(singleFileId !== undefined) bodyObj.id = singleFileId;

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyObj)
        };

        //@ts-expect-error - typing complaints
        if(testMode) options.headers.authorization = "Bearer " + testerOAuthToken;

        const postURL = webAppUrl + "?method=" + method;
        let result: any = null;
        await fetch(postURL, options)
            .then(response => response.text())
            .then(data =>
                result = JSON.parse(data))
            .catch(error =>
                console.error(error));
        // console.log('Result was:', JSON.parse(result));
        return result
    }
}
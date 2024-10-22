import { DataJournal } from "../DataJournal";
import { Translator } from "../pdw";
import * as dotenv from 'dotenv'

export class SheetsTranslator implements Translator {
    private webappUrl: string;
    constructor(){
        dotenv.config();
        this.webappUrl = process.env.LIVE_DEPLOYMENT_URL as string;
    }
    static toDataJournal(spreadsheetId: string): Promise<DataJournal> {
        return new SheetsTranslator().toDataJournal(spreadsheetId);
    }
    static fromDataJournal(datajournal: DataJournal, filename: string): Promise<DataJournal> {
        return new SheetsTranslator().fromDataJournal(datajournal, filename);
    }

    async toDataJournal(spreadsheetId: string): Promise<DataJournal> {
        const getUrl = this.webappUrl + '?method=toDataJournal&id=' + spreadsheetId;
        const getOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        }
        let returnObj: any = {};
        let sawErr = false;
        await fetch(getUrl, getOptions)
            .then(response => response.json())
            .then(data => returnObj = data)
            .catch(error => {
                sawErr = true;
                console.error(error)
            });
        if (sawErr) throw new Error('Saw an error, see the console');
        return returnObj;
    }

    async fromDataJournal(datajournal: DataJournal, filename: string) {
        const postURL = this.webappUrl + '?method=fromDataJournal';
        const postOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({FILENAME: filename, DATAJOURNAL: datajournal})
        }
        let returnObj: any = {};
        let sawErr = false;
        await fetch(postURL, postOptions).then(response => response.json())
            .then(data => returnObj = data)
            .catch(error => {
                sawErr = true;
                console.error(error)
            });
        if (sawErr) throw new Error('Saw an error, see the console');
        return returnObj;
    }
    getServiceName(): string {
        return 'Sheets Translator'
    }

}
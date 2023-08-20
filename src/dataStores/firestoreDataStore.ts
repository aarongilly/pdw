import * as pdw from "../pdw";

/**
 * Try not to chase 3 rabbits. This is intended to KEEP THE END IN MIND.
 * 
 * This sort of thing would have to handle authorization and authentication.
 * It's not obvious to me yet whether the PDW library needs to know about
 * or be involved with that at all. Probably not?
 */


export class FireDataStore implements pdw.DataStore{
    pdw: pdw.PDW;
    serviceName: string;
    private _isConnected: boolean;

    constructor(pdwRef: pdw.PDW) {
        this.serviceName = 'Firestore';
        this.pdw = pdwRef;
        this._isConnected = false;
    }

    getDefs(params: pdw.SanitizedParams): pdw.DefLike[] {
        throw new Error("Method not implemented.");
    }
    getEntries(params: pdw.SanitizedParams): pdw.EntryLike[] {
        throw new Error("Method not implemented.");
    }
    getTags(params: pdw.SanitizedParams): pdw.TagLike[] {
        throw new Error("Method not implemented.");
    }
    getAll(params: pdw.SanitizedParams): pdw.CompleteishDataset {
        throw new Error("Method not implemented.");
    }
    setDefs(defs: pdw.Def[]): pdw.Def[] {
        console.log("I saw this:", defs);
        
        throw new Error("Method not implemented.");
    }
    setEntries(entries: pdw.Entry[]): pdw.Entry[] {
        throw new Error("Method not implemented.");
    }
    setTags(tagData: pdw.Tag[]): pdw.TagLike[] {
        throw new Error("Method not implemented.");
    }
    setAll(completeDataset: pdw.CompleteishDataset): pdw.CompleteishDataset {
        throw new Error("Method not implemented.");
    }
    query(params: pdw.SanitizedParams): pdw.QueryResponse {
        throw new Error("Method not implemented.");
    }
    getOverview(): pdw.DataStoreOverview {
        throw new Error("Method not implemented.");
    }
    connect?(...params: any): boolean {
        throw new Error("Method not implemented.");

    }
}

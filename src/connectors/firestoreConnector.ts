import { StorageConnector } from "../pdw";

/**
 * Try not to chase 3 rabbits. This is intended to KEEP THE END IN MIND.
 * 
 * This sort of thing would have to handle authorization and authentication.
 * It's not obvious to me yet whether the PDW library needs to know about
 * or be involved with that at all. Probably not?
 */
export class FirestoreConnector implements StorageConnector{
    constructor(){
        this.connectedDbName = 'Temporary';
        this.serviceName = "Firestore";
    }
    getDefs(params?: string[] | undefined) {
        if(params) console.log('I see your', params);
        throw new Error("Method not implemented.");
    }
    connectedDbName: string;
    serviceName: string;

}
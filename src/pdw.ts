import { Temporal } from "temporal-polyfill";

//#region ### INTERFACES ###

/**
 * This function exists temporarily to stop errors from unused **Temporal** imports
 */
export function makeTemp(){
    console.log(Temporal.Now.zonedDateTimeISO());    
}

/**
 * The `StorageConnector` interface is what you must implement when creating code to
 * hook up a new database. It is what sits between the data store of choice and the PDW.
 * It's designed to be as simple-to-implement as possible.
 * 
 * It's very much a work in progress. I have a semi-functional
 * one for Firebase, but would like to create ones for Excel (for pragmatics) and 
 * SQL (for learning)
 */
export interface StorageConnector {
    /**
     * This coment explains getDefs in the storageconnenctor
     */
    getDefs(params?: getDefParam[]): any;

    //setDefs()
    //getEntries()
    //setEntries()
    /**
     * The file name for local files, or some reference to
     * the database name for cloud databases.
     */
    connectedDbName: string;
    /**
     * The name of the connector, essentially. Examples: "Excel", "Firestore"
     */
    serviceName: string;

}

/**
 * Can be either the _lbl or _did
 */
export type getDefParam = string;

/**
 * This interface is extended by {@link DefLike}
 */
export interface Element {
    _did: string;
    _deleted: boolean;
    _created: Temporal.ZonedDateTime;
    _updated: Temporal.ZonedDateTime;
}

export interface DefLike extends Element {
    _lbl: string;
    _desc: string;
    _emoji: string;
    _tags: string[];
}

//#endregion

//#region ### CLASSES ###

//#endregion


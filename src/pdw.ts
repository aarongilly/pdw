import { Temporal } from "temporal-polyfill";

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
}

/**
 * This is a comment for getDefParam
 */
type getDefParam = string;
import { Temporal } from "temporal-polyfill";

//#region ### CLASSES ###

export class PDW {
    connection?: StorageConnector;
    private static instance: PDW;
    constructor() {

    }
    registerConnection(connectorInstance: StorageConnector) {
        this.connection = connectorInstance;
    }

    /**
     * Singleton pattern.
     * @returns the PDW
     */
    public static getInstance() {
        if (!PDW.instance) {
            PDW.instance = new PDW();
        }
        return PDW.instance;
    }

}

//#endregion

//#region ### TYPES ###

/**
 * A synonym for string, implying one with the structure of:
 * 
 */
export type _uid = string;

export enum PointType {
    /**
     * number
     */
    num,
    text,
    select,
    bool,
    duration,
    file,
    photo,
}

export enum Scope {
    second,
    day,
    week,
    month,
    quarter,
    year,
}

//#endregion

//#region ### INTERFACES ###

/**
 * This function exists temporarily to stop errors from unused **Temporal** imports
 */
export function makeTemp() {
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
    getDefs(params?: getDefParam[]): DefLike[];

    /**
     * Creates (or updates) definitions. 
     */
    setDefs(defs: DefLike[]): any;
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

/**
 * Definitions Data Shape
 */
export interface DefLike extends Element {
    _lbl: string;
    _desc: string;
    _emoji: string;
    _scope: Scope;
    _tags: Tag[];
}

export interface Tag {
    _tid: string;
    _lbl: string
}

export interface PointDef extends Element {
    /**
     * Point ID, a tiny ID
     */
    _pid: string;
    /**
    * Label for the point
    */
    _lbl: string;
    /**
    * Point description
    */
    _desc: string;
    /**
    * Point type
    */
    _type: PointType;


}

//#endregion

//#region ### CLASSES ###

//#endregion

//#region ### UTILITIES ###

//TODO - do you want a utils class?

/**
 * Makes a unique identifier for use with _uid and _eid
 */
export function makeUid(): _uid {
    const randomLength = 4
    return new Date().getTime().toString(36) + "." + Math.random().toString(36).slice(13 - randomLength).padStart(randomLength, "0")
}

export function parseTemporalFromUid(uid: _uid): any { //Temporal.Instant{
    const epochMillis = parseInt(uid.split(".")[0], 36)
    const parsedTemporal = Temporal.Instant.fromEpochMilliseconds(epochMillis);
    // const timezone = Temporal.Now.timeZone();
    // console.log(parsedTemporal.toString({ timeZone: Temporal.TimeZone.from(timezone)}));
    return parsedTemporal
}

//#endregion

//#region ### CONSTANTS ###

export const standardTabularDefHeaders = ['_did','_lbl','_emoji','_deleted','_desc','_scope','_created','_updated','_tags'];
export const standardTabularPointDefHeaders = ['_did','_lbl','_emoji','_deleted','_desc','_scope','_created','_updated'];
export const standardTabularEntryHeaders = ['_did','_lbl','_emoji','_deleted','_desc','_scope','_created','_updated'];

//#endregion
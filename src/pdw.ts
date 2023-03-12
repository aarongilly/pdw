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

    setDefs(defs: DefLike[]) {
        if (this.connection === undefined) throw new Error("No connector registered");
        //pass along function call to the connector
        this.connection.setDefs(defs);
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

    // public static open(){
    //     //TODO - this maybe how it makes the most sense to do this?
    // }
}

//#endregion

//#region ### TYPES ###

/**
 * A synonym for string, implying one with the structure of:
 * 
 */
export type UID = string;

export enum PointType {
    /**
     * number
     */
    NUM,
    TEXT,
    SELECT,
    BOOL,
    DURATION,
    FILE,
    PHOTO,
}

export enum Scope {
    SECOND,
    DAY,
    WEEK,
    MONTH,
    QUARTER,
    YEAR,
}

//#endregion

//#region ### INTERFACES ###

/**
 * This function exists temporarily to stop errors from unused **Temporal** imports
 */
export function makeTemp() {
    console.log(Temporal.Now.plainDateTimeISO());
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

    //property for whether or not the PDW should be using 
    //a "pass along all getters and setters" mode or
    //a "do everything in memory, then do saves"
}

/**
 * Can be either the _lbl or _did
 */
export type getDefParam = string;

/**
 * This interface is extended by {@link DefLike}
 */
export interface Element {
    /**
     * Universal ID - uniquely identifies an INSTANCE of any element
     */
    _uid: UID;
    /**
     * Was the element marked as deleted?
     * For things like "_did" or "_pid", "_tid", you may have multiple
     * instances with the same value, but you'll tell them apart using
     * the _uid --- and only **one** will have _deleted == false
     */
    _deleted: boolean;
    /**
     * When the element was created
     */
    _created: Temporal.PlainDateTime;
    /**
     * When the element was updated, usually lines up with "_created"
     * unless the instance of the element was created via updating a 
     * previous instance
     */
    _updated: Temporal.PlainDateTime;
}

/**
 * Definitions Data Shape
 */
export interface DefLike extends Element {
    /**
     * Definition ID - the type of the thing.
     */
    _did: string;
    /**
     * The label for the definition
     */
    _lbl: string;
    /**
     * A text string describing what the definition is for
     */
    _desc: string;
    /**
     * A shorthand for the definition
     */
    _emoji: string;
    /**
     * Scope of the definition (e.g. "day", "week"...)
     */
    _scope: Scope;
    /**
     * Tags for grouping similar definitions easier in filters
     */
    _tags?: TagLike[];
    /**
     * The points on the definition
     */
    _points?: PointDefLike[];
}

export interface TagLike extends Element {
    /**
     * Like the Definition ID, the ID of the Tag
     */
    _tid: string;
    /**
     * Human-readable tag
     */
    _lbl: string;
}

export interface PointDefLike extends Element {
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
     * Shorthand for the point in the UI
     */
    _emoji: string;
    /**
    * Point type
    */
    _type: PointType;
}

export interface EntryLike extends Element {


}

//#endregion

//#region ### CLASSES ###

//#endregion

//#region ### UTILITIES ###

//TODO - do you want a utils class?

/**
 * Makes a unique identifier for use with _uid and _eid
 */
export function makeUid(): UID {
    const randomLength = 4
    return new Date().getTime().toString(36) + "." + Math.random().toString(36).slice(13 - randomLength).padStart(randomLength, "0")
}

export function parseTemporalFromUid(uid: UID): any { //Temporal.Instant{
    const epochMillis = parseInt(uid.split(".")[0], 36)
    const parsedTemporal = Temporal.Instant.fromEpochMilliseconds(epochMillis);
    // const zoneless = Temporal.Now.plainDateTimeISO();
    // const timezone = Temporal.Now.timeZone();
    // console.log(parsedTemporal.toString({ timeZone: Temporal.TimeZone.from(timezone)}));
    return parsedTemporal
}

//#endregion

//#region ### CONSTANTS ###

export const standardTabularDefHeaders = ['_uid', '_created', '_updated', '_deleted', '_did', '_lbl', '_emoji', '_desc', '_scope'];
export const standardTabularPointDefHeaders = ['_uid', '_created', '_updated', '_deleted', '_did', '_pid', '_lbl', '_emoji', '_desc', '_type', '_rollup', '_display'];
export const standardTabularEntryHeaders = ['_uid', '_created', '_updated', '_deleted', '_did', '_note']; //think
export const standardTabularTagHeaders = ['_uid', '_created', '_updated', '_deleted', '_tid', '_lbl'];

//#endregion

export const sampleDefinitions: DefLike[] = [
    {
        _uid: 'lep62vrw.hfvm',
        _created: Temporal.PlainDateTime.from('2023-02-28T22:10:00'),
        _updated: Temporal.PlainDateTime.from('2023-02-28T22:10:00'),
        _deleted: false,
        _desc: 'A test definition, for plain events',
        _did: 'doae',
        _emoji: '🧪',
        _lbl: 'Event',
        _scope: Scope.SECOND,
        _tags: [{
            _uid: 'lep6353w.hnkp',
            _created: Temporal.PlainDateTime.from('2023-02-28T22:10:00'),
            _updated: Temporal.PlainDateTime.from('2023-02-28T22:10:00'),
            _deleted: false,
            _lbl: 'Testing',
            _tid: 'spak'
        }],
        _points: [
            {
                _uid: 'lep65ghw.rghw', 
                _created: Temporal.PlainDateTime.from('2023-02-28T22:10:00'),
                _updated: Temporal.PlainDateTime.from('2023-02-28T22:10:00'),
                _deleted: false,
                _pid: 'apox',
                _lbl: 'Event',
                _desc: 'The main text for the event',
                _emoji: '🏷️',
                _type: PointType.TEXT
            }
        ]
    }
]
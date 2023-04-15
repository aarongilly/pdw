import { Temporal } from "temporal-polyfill";

//#region ### TYPES ###

/**
 * A synonym for string, implying one with the structure of:
 * tinytimestamp-{@link SmallID}
 */
export type UID = string;

/**
 * A synonym for string, a string of 4 random characters
 */
export type SmallID = string;

/**
 * A synonym for string, a string of structure
 * yyyy-mm-dd
 */
export type isoDate = string;

/**
 * A synonym for string, a string of structure
 * hh:mm:ss
 */
export type isoTime = string;

/**
 * A synonym for string, a string of structure
 * P1Y1M1DT1H1M1.1S
 * 
 */
export type isoDuration = string

/**
 * A synonym for string, a string of structure
 * {@link isoDate}T{@link isoTime}
 * yyyy-mm-ddThh:mm:ss
 */
export type isoDateTime = string;


export enum PointType {
    /**
     * number
     */
    NUM = "NUM",
    TEXT = 'TEXT',
    SELECT = 'SELECT', //
    BOOL = 'BOOL', //true false
    DURATION = 'DURATION', //Temporal.duration
    TIME = 'TIME', //Temporal.plainTime
    MULTISELECT = 'MULTISELECT', //#TODO --- think
    FILE = 'FILE',
    PHOTO = 'PHOTO',
}

export enum Scope {
    SECOND = 'SECOND',
    DAY = 'DAY',
    WEEK = 'WEEK',
    MONTH = 'MONTH',
    QUARTER = 'QUARTER',
    YEAR = 'YEAR',
}

export enum Rollup {
    COUNT = 'COUNT',
    COUNTUNIQUE = 'COUNTUNIQUE',
    SUM = 'SUM',
    AVERAGE = 'AVERAGE',
    COUNTOFEACH = 'COUNTOFEACH',
    AVERAGEABOUT4AM = 'AVERAGEABOUT4AM' //for type =  TYPE.TIME
}

export enum Format {
    TEXT = 'TEXT',
    MARKDOWN = 'MARKDOWN',
    NUMWHOLE = 'NUMWHOLE',
    NUMDECIMAL = 'NUMDECIMAL',
    COMMASEPARATED = 'COMMASEPARATED',
    YESNO = 'YESNO',
    TRUEFALSE = 'TRUEFALSE',
    MONEY = 'MONEY',
    AMPM = 'AMPM',
    MILITARYTIME = 'MILITARYTIME',
    HOURSMINSSECS = 'HOURSMINSSECS',
    SECSTOTAL = 'SECSTOTAL'
}

//#endregion

//#region ### INTERFACES ###

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
     * Get Definitions. 
     * Specifying no param will return all definitions.
     * @param didsAndOrLbls array of _did or _lbl vales to get, leave empty to get all Defs
     * @returns array of all matching definitions
     */
    getDefs(didsAndOrLbls?: getDefParam[]): DefLike[];

    /**
     * Creates (or updates) definitions. 
     */
    setDefs(defs: DefLike[]): any;
    //getEntries()
    //setEntries()
    //getTags()
    //setTags()
    /**
     * The file name for local files, or some reference to
     * the database name for cloud databases.
     */
    connectedDbName: string;
    
    /**
     * The name of the connector, essentially. Examples: "Excel", "Firestore"
     */
    serviceName: string;

    /**
     * A reference to the Personal Data Warehouse instance to 
     * which the storage connector is connected.
     */
    pdw?: PDW;
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
     * Universal ID - uniquely identifies an INSTANCE of any element.
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
     * Definition ID - the type of the thing.
     */
    _did: SmallID;
    /**
     * Point ID, a tiny ID
     */
    _pid: SmallID;
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
    /**
     * Default rollup type
     */
    _rollup: Rollup;
    /**
     * Default display format
     */
    _format: Format
}

export interface EntryLike extends Element {
    /**
     * Entry ID, a unique identifier for an entry - unlike {@link _uid} 
     * _eid is not updated when an entry is updated. A new _uid is created
     * for the updated Entry, but they will share _eid values.
     */
    _eid: UID,
    /**
     * A generic note about an entry, all entries can have them
     */
    _note: string,
    /**
     * An array of associated EntryPoints. May be empty.
     */
    _points: EntryPointLike[]
    /**
     * Associated definition ID
     */
    _did: SmallID,
}

export interface EntryPointLike extends Element {
    /**
     * The Entry the Point is Associated With
     */
    _eid: UID,
    /**
     * Associated Point Definition ID
     */
    _pid: SmallID,
    /**
     * The actual value of the entry
     */
    _val: any
}

export interface MinimumDef {
    /**
     * To create a brand new definition, this is the **only** required field.
     * All other fields *can* be provided, but will set to default if not provided.
     */
    _lbl: string;
    /**
     * Unique ID
     * Defaults to a new UID
     */
    _uid?: UID;
    /**
     * Deleted
     * Defaults to false
     */
    _deleted?: boolean;
    /**
     * Created
     * Defaults to PlainDateTime for (now)
     */
    _created?: Temporal.PlainDateTime;
    /**
     * Updated
     * Defaults to PlainDateTime for (now)
     */
    _updated?: Temporal.PlainDateTime;
    /**
     * Definition ID
     * Defaults to a new smallID
     */
    _did?: SmallID;
    /**
     * Description
     * Defaults to 'Set a description'
     */
    _desc?: string;
    /**
     * Emoji
     * Defaults to 🆕
     */
    _emoji?: string;
    /**
     * Scope
     * Defaults to SECOND
     */
    _scope?: Scope;
    /**
     * Tags
     * Defaults to empty array
     */
    _tags?: TagLike[];
    /**
     * Point Definitions
     * Defaults to empty array
     */
    _points?: PointDefLike[];
}

export interface MinimumPointDef {
    /**
     * To create a brand new PointDef, you must provide a label, did, & type
     */
    _lbl: string;
    /**
     * To create a brand new PointDef, you must provide a label, did, & type
     */
    _did: SmallID;
    /**
     * To create a brand new PointDef, you must provide a label, did & type
     */
    _type: PointType;
    /**
     * Unique ID
     * Defaults to a new UID
     */
    _uid?: UID;
    /**
     * Deleted
     * Defaults to false
     */
    _deleted?: boolean;
    /**
     * Created
     * Defaults to PlainDateTime for (now)
     */
    _created?: Temporal.PlainDateTime;
    /**
     * Updated
     * Defaults to PlainDateTime for (now)
     */
    _updated?: Temporal.PlainDateTime;
    /**
     * Point ID
     * Defaults to a new smallID
     */
    _pid?: SmallID;
    /**
     * Description
     * Defaults to 'Set a description'
     */
    _desc?: string;
    /**
     * Emoji
     * Defaults to 🆕
     */
    _emoji?: string;
    /**
     * Rollup Type
     * Defaults to {@link Rollup.COUNT}
     */
    _rollup?: Rollup;
    /**
     * Rollup Type
     * Defaults to {@link Format.TEXT}
     */
    _format?: Format;
    
}

//#endregion

//#region ### CLASSES ###

export class PDW {
    connection?: StorageConnector;
    private static instance: PDW;
    constructor() {

    }
    registerConnection(connectorInstance: StorageConnector) {
        this.connection = connectorInstance;
        connectorInstance.pdw = this;
    }

    setDefs(defs: DefLike[]) {
        if (this.connection === undefined) throw new Error("No connector registered");
        //pass along function call to the connector
        return this.connection.setDefs(defs);
    }

    getDefs(didOrLbls: string[] | string){
        //force array type
        if(!Array.isArray(didOrLbls)) didOrLbls = [didOrLbls];

        if (this.connection === undefined) throw new Error("No connector registered");
        //pass along function call to the connector
        return this.connection.getDefs(didOrLbls);
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

export class Def implements DefLike {
    _did: SmallID;
    _lbl: string;
    _desc: string;
    _emoji: string;
    _scope: Scope;
    _tags?: TagLike[] | undefined;
    _points?: PointDefLike[] | undefined;
    _uid: UID;
    _deleted: boolean;
    _created: Temporal.PlainDateTime;
    _updated: Temporal.PlainDateTime;
    constructor(defIn: MinimumDef) {
        this._lbl = defIn._lbl;
        this._did = defIn._did ?? makeSmallID();
        this._uid = defIn._uid ?? makeUID();
        this._desc = defIn._desc ?? 'Set a description';
        this._emoji = defIn._emoji ?? '🆕';
        this._scope = defIn._scope ?? Scope.SECOND;
        this._deleted = defIn._deleted ?? false;
        this._created = defIn._created ?? Temporal.Now.plainDateTimeISO();
        this._updated = defIn._updated ?? Temporal.Now.plainDateTimeISO();
        if(defIn._points !== undefined){
            this._points = defIn._points.map(point => new PointDef(point, this));
        }
    }

    setPointDef() {

    }

    /**
     * Returns an array of the values of the def
     * in accordance with the positions of the
     * {@link standardTabularDefHeaders} positioning
     */
    getTabularDefBase() {
        return [
            this._uid, this._created.toString(), this._updated.toString(), this._deleted,
            this._did, this._lbl, this._emoji, this._desc, this._scope.toString()
        ]
    }

    /**
     * Returns an array of arrays with the values of the
     * def's points in accordance with the positions of the
     * {@link standardTabularPointDefHeaders} positioning
     */
    getTabularPointDefs() {
        return this._points?.map(point => [
            point._uid,
            point._created,
            point._updated,
            point._deleted,
            point._did,
            point._pid,
            point._lbl,
            point._emoji,
            point._desc,
            point._type,
            point._rollup,
            point._format
        ])
    }
}

class PointDef implements PointDefLike {
    _did: string;
    _pid: string;
    _lbl: string;
    _desc: string;
    _emoji: string;
    _type: PointType;
    _rollup: Rollup;
    _format: Format;
    _uid: string;
    _deleted: boolean;
    _created: Temporal.PlainDateTime;
    _updated: Temporal.PlainDateTime;
    _def?: Def;
    constructor(pd: MinimumPointDef, def: Def){
        this._did = pd._did;
        this._lbl = pd._lbl;
        this._type = pd._type;
        this._pid = pd._pid ?? makeSmallID();
        this._deleted = pd._deleted ?? false;
        this._created = pd._created ?? Temporal.Now.plainDateTimeISO();
        this._updated = pd._updated ?? Temporal.Now.plainDateTimeISO();
        this._uid = pd._uid ?? makeUID();
        this._desc = pd._desc ?? 'Set a description';
        this._emoji = pd._emoji ?? '🆕';
        this._rollup = pd._rollup ?? Rollup.COUNT;
        this._format = pd._format ?? Format.TEXT;
        if(def) this._def = def;
    }

}

//#endregion

//#region ### UTILITIES ###

//TODO - do you want a utils class?

/**
 * Makes a unique identifier for use with _uid and _eid
 */
export function makeUID(): UID {
    return new Date().getTime().toString(36) + "." + makeSmallID();
}

export function makeSmallID(length = 4): SmallID {
    return Math.random().toString(36).slice(13 - length).padStart(length, "0")
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
export const standardTabularPointDefHeaders = ['_uid', '_created', '_updated', '_deleted', '_did', '_pid', '_lbl', '_emoji', '_desc', '_type', '_rollup', '_format'];
export const standardTabularBaseEntryHeaders = ['_uid', '_created', '_updated', '_deleted', '_did', '_note'];
export const standardTabularEntryPointHeaders = ['_uid', '_created', '_updated', '_deleted', '_did', '_pid', '_val'];
export const standardTabularTagHeaders = ['_uid', '_created', '_updated', '_deleted', '_tid', '_lbl'];

export const standardTabularFullEntryHeaders = ['_uid', '_created', '_updated', '_deleted', '_did', '_note']; //think

//#endregion
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
 * A synonym for string, any valid Period.stringify string
 */
export type periodString = string;

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
    getDefs(didsAndOrLbls?: getDefParam[], includeDeleted?: boolean): DefLike[];

    /**
     * Creates (or updates) definitions. 
     */
    setDefs(defs: DefLike[]): any;

    /**
     * Get PointDefinitions. 
     * Specifying no param will return all definitions.
     * @param didsAndOrLbls array of _did or _lbl vales to get, leave empty to get all Defs
     * @returns array of all matching definitions
     */
    getPointDefs(didsAndOrLbls?: getDefParam[]): PointDefLike[];

    /**
     * Creates (or updates) point defintions
     */
    setPointDefs(pointDefs: PointDefLike[]): any



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
 * This interface is extended by the interfaces for the base Elements:
 * {@link DefLike}, {@link PointDefLike}, {@link EntryLike}, & {@link EntryPointLike}
 */
export interface ElementLike {
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
export interface DefLike extends ElementLike {
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
    // _tags?: TagLike[];
    /**
     * The points on the definition
     */
    // _points?: PointDefLike[];
}

export interface TagLike extends ElementLike {
    /**
     * Like the Definition ID, the ID of the Tag
     */
    _tid: string;
    /**
     * Human-readable tag
     */
    _lbl: string;
}

export interface PointDefLike extends ElementLike {
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

export interface EntryLike extends ElementLike {
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
     * When the entry is for
     */
    _period: periodString,
    /**
     * Associated definition ID
     */
    _did: SmallID,
}

export interface EntryPointLike extends ElementLike {
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

    setPointDefs(pointDefs: PointDefLike[]) {
        if (this.connection === undefined) throw new Error("No connector registered");
        //pass along function call to the connector
        return this.connection.setPointDefs(pointDefs);
    }

    getDefs(didOrLbls: string[] | string, includeDeleted = true){
        //force array type
        if(!Array.isArray(didOrLbls)) didOrLbls = [didOrLbls];
        if (this.connection === undefined) throw new Error("No connector registered");
        //pass along function call to the connector
        return this.connection.getDefs(didOrLbls, includeDeleted);
    }
    
    /**
     * Creates a new definition from {@link MinimumDef} components
     * and adds it to the definition manifest of the connected storage
     * connector.
     * @param defInfo 
     * @returns the newly created Definition
    */
   createNewDef(defInfo: MinimumDef): Def{
        if (this.connection === undefined) throw new Error("No connector registered");
        let newDef = new Def(defInfo);
        this.setDefs([newDef]);
        return newDef;
    }

    /**
     * Creates a new definition from {@link MinimumDef} components
     * and adds it to the definition manifest of the connected storage
     * connector.
     * @param pointDefInfo 
     * @returns the newly created Point Definition
    */
   createNewPointDef(pointDefInfo: MinimumPointDef): PointDef{
    if (this.connection === undefined) throw new Error("No connector registered");
    let newPointDef = new PointDef(pointDefInfo);
    this.setPointDefs([newPointDef]);
    return newPointDef;
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

/**
 * Base class 
 */
export abstract class Element implements ElementLike{
    _uid: string;
    _deleted: boolean;
    _created: Temporal.PlainDateTime;
    _updated: Temporal.PlainDateTime;
    constructor(existingData: Object){
        //@ts-expect-error
        this._uid = existingData.hasOwnProperty('_uid') ? existingData._uid : makeUID();
        //@ts-expect-error
        this._deleted = existingData.hasOwnProperty('_deleted') ? existingData._deleted : false;
        //@ts-expect-error
        this._created = existingData.hasOwnProperty('_created') ? existingData._created : Temporal.Now.plainDateTimeISO();
        //@ts-expect-error
        this._updated = existingData.hasOwnProperty('_updated') ? existingData._updated : Temporal.Now.plainDateTimeISO();

    }
    markAsDeleted(){
        this._deleted = true;
        this._updated = Temporal.Now.plainDateTimeISO();
    }

    /**
     * Checks if the argument was updated more recently than this
     * @param elementData ElementLike data to compare against
     * @returns true if argument is updated more recently than this
     */
    isOlderThan(elementData: ElementLike){
        let until = this._updated.until(elementData._updated)
    
        console.log(this._updated.toLocaleString())
        console.log(elementData._updated.toLocaleString())
        // "until" is a Temporal.Duration instance
        console.log(until.total('seconds'));
        
        //sign is 1 if and only if comp is newer
        return until.sign == 1
    }

    /**
     * Checks whether this is the same Element as the comparison AND if the 
     * comparison is newer than this
     * @param comparison ElementLike data that might be a newer copy of this
     * @returns true if the argument is a newer version of the same Element
     */
    shouldBeReplacedWith(comparison: ElementLike): boolean{
        if(!this.sameIdAs(comparison)) return false;
        if(this.isOlderThan(comparison)) return true;
        return false;
    }

    /**
     * Get the type of an element. Not sure if I'll use this outside
     * of the 
     * @returns string representing the type of element
     */
    getType(): 'DefLike' | 'PointDefLike' | 'EntryLike' | 'EntryPointLike' | 'TagLike' {
        if(this.hasOwnProperty("_tid")) return "TagLike"
        if(this.hasOwnProperty("_eid") && this.hasOwnProperty('_pid')) return "EntryPointLike"
        if(this.hasOwnProperty("_eid")) return "EntryLike"
        if(this.hasOwnProperty("_pid")) return "PointDefLike"
        return "DefLike"
    }

    /**
     * Checks to see if this has the same _did (or _eid, _tid, _pid) as
     * whatever is passed in
     * @param comparison Element to compare against
     */
    sameIdAs(comparison: ElementLike){
        if(!this.sameTypeAs(comparison)) return false;
        const type = this.getType();
        //@ts-expect-error
        if(type==='DefLike') return this._did === comparison._did;
        //@ts-expect-error
        if(type==='EntryLike') return this._eid === comparison._eid;
        //@ts-expect-error
        if(type==='TagLike') return this._tid === comparison._tid;
        //@ts-expect-error
        return this._pid === comparison._pid && this._did === comparison._did;
    }

    sameTypeAs(comparison: ElementLike){
        return this.getType() === this.getTypeOfElementLike(comparison);
    }

    private getTypeOfElementLike(data: ElementLike) {
        if(data.hasOwnProperty("_tid")) return "TagLike"
        if(data.hasOwnProperty("_eid") && data.hasOwnProperty('_pid')) return "EntryPointLike"
        if(data.hasOwnProperty("_eid")) return "EntryLike"
        if(data.hasOwnProperty("_pid")) return "PointDefLike"
        return "DefLike"
    }
}

export class Def extends Element implements DefLike {
    _did: SmallID;
    _lbl: string;
    _desc: string;
    _emoji: string;
    _scope: Scope;
    _tags?: TagLike[] | undefined;
    _points?: PointDefLike[] | undefined;
    declare _uid: UID;
    declare _deleted: boolean;
    declare _created: Temporal.PlainDateTime;
    declare _updated: Temporal.PlainDateTime;
    constructor(defIn: MinimumDef) {
        super(defIn)
        this._lbl = defIn._lbl;
        this._did = defIn._did ?? makeSmallID();
        // this._uid = defIn._uid ?? makeUID();
        this._desc = defIn._desc ?? 'Set a description';
        this._emoji = defIn._emoji ?? '🆕';
        this._scope = defIn._scope ?? Scope.SECOND;
        // this._deleted = defIn._deleted ?? false;
        // this._created = defIn._created ?? Temporal.Now.plainDateTimeISO();
        // this._updated = defIn._updated ?? Temporal.Now.plainDateTimeISO();
        if(defIn._points !== undefined){
            this._points = defIn._points.map(point => new PointDef(point, this));
        }
    }

    // createNewPointDef(pd: {_lbl: string, _type: PointType}){
        
    // }

    setPointDefs() {

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

export class PointDef extends Element implements PointDefLike {
    _did: string;
    _pid: string;
    _lbl: string;
    _desc: string;
    _emoji: string;
    _type: PointType;
    _rollup: Rollup;
    _format: Format;
    declare _uid: string;
    declare _deleted: boolean;
    declare _created: Temporal.PlainDateTime;
    declare _updated: Temporal.PlainDateTime;
    _def?: Def;
    constructor(pd: MinimumPointDef, def?: Def){
        super(pd)
        this._did = pd._did;
        this._lbl = pd._lbl;
        this._type = pd._type;
        this._pid = pd._pid ?? makeSmallID();
        // this._deleted = pd._deleted ?? false;
        // this._created = pd._created ?? Temporal.Now.plainDateTimeISO();
        // this._updated = pd._updated ?? Temporal.Now.plainDateTimeISO();
        // this._uid = pd._uid ?? makeUID();
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

/**
 * To compare elements' {@link _updated} times, for use in determining
 * if the comparisonElement is newer than the baseElement.
 * @param baseElement The thing you have that might be outdated
 * @param comparisonElement The thing that might be newer
 * @returns true if baseElement is less recently updated than comparison
 */
export function elementIsNewer(baseElement: ElementLike, comparisonElement: ElementLike): Boolean{
    
    let until = baseElement._updated.until(comparisonElement._updated)
    
    // console.log(baseElement._updated.toLocaleString())
    // console.log(comparisonElement._updated.toLocaleString())
    // "until" is a Temporal.Duration instance
    //console.log(until.total('seconds'));
    
    //sign is 1 if and only if comp is newer
    return until.sign == 1
}

/**
* Get the type of an element. Not sure if I'll use this outside
* of the 
* @returns string representing the type of element
*/
export function getElementType(element: ElementLike): 'DefLike' | 'PointDefLike' | 'EntryLike' | 'EntryPointLike' | 'TagLike' {
   if(element.hasOwnProperty("_tid")) return "TagLike"
   if(element.hasOwnProperty("_eid") && element.hasOwnProperty('_pid')) return "EntryPointLike"
   if(element.hasOwnProperty("_eid")) return "EntryLike"
   if(element.hasOwnProperty("_pid")) return "PointDefLike"
   return "DefLike"
}

//#endregion

//#region ### CONSTANTS ###

export const standardTabularDefHeaders = ['_uid', '_created', '_updated', '_deleted', '_did', '_lbl', '_emoji', '_desc', '_scope'];
export const standardTabularPointDefHeaders = ['_uid', '_created', '_updated', '_deleted', '_did', '_pid', '_lbl', '_emoji', '_desc', '_type', '_rollup', '_format'];
export const standardTabularBaseEntryHeaders = ['_uid', '_created', '_updated', '_deleted', '_did', '_period', '_note'];
export const standardTabularEntryPointHeaders = ['_uid', '_created', '_updated', '_deleted', '_did', '_pid', '_val'];
export const standardTabularTagHeaders = ['_uid', '_created', '_updated', '_deleted', '_tid', '_lbl'];

export const standardTabularFullEntryHeaders = ['_uid', '_created', '_updated', '_deleted', '_did', '_note']; //think

//#endregion
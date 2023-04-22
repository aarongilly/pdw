import { Temporal } from "temporal-polyfill";

//#region ### TYPES ###

/**
 * A synonym for string, implying one with the structure of:
 * {@link EpochStr}-{@link SmallID}
 */
export type UID = string;

/**
 * A synonym for string, a string of 4 random characters
 */
export type SmallID = string;

/**
 * An alias for string, a string that's made from the number of 
 * milliseconds that have occurred since the epoch. A short way
 * to track timezone-dependent "_updated" field that isn't 
 * subject to alternative interpretations by, say, Excel
 */
export type EpochStr = string;

/**
 * An alias for string, a string that can be parsed by
 * Temporal.Duration.from()
 */
export type DurationStr = string;

/**
 * A synonym for string, any valid Period.stringify string
 */
export type PeriodStr = string;

/**
 * String representation of a full ISO 8601 timestamp, ending with the 'Z'
 */
export type UTCTimestamp = string

/**
 * A String that is likely to be markdown-enabled in use
 */
export type Markdown = string

//#endregion

//#region ### ENUMS ###

export enum PointType {
    /**
     * number
     */
    NUM = "NUM",
    TEXT = 'TEXT',
    MARKDOWN = 'MARKDOWN',
    SELECT = 'SELECT', //_tid
    BOOL = 'BOOL', //true false
    DURATION = 'DURATION', //Temporal.duration
    TIME = 'TIME', //Temporal.plainTime
    MULTISELECT = 'MULTISELECT', //Comma-separated list of _tid 
    FILE = 'FILE', //url?
    PHOTO = 'PHOTO', //url?
}

export enum Scope {
    SECOND = 'SECOND',
    MINUTE = 'MINUTE',
    HOUR = 'HOUR',
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

//#endregion

//#region ### INTERFACES ###

/**
 * The `DataStore` interface is what you must implement when creating code to
 * hook up a new database. It is what sits between the data store of choice and the PDW.
 * It's designed to be as simple-to-implement as possible.
 * 
 * It's very much a work in progress. I have a semi-functional
 * one for Firebase, but would like to create ones for Excel (for pragmatics) and 
 * SQL (for learning)
 */
export interface DataStore {
    /**
     * /**
     * Get Definitions. 
     * By default, returns onl undeleted definitions.
     * Specifying no param will return all NOT DELETED definitions.
     * @param didsAndOrLbls array of lbls and/or _did to include
     * @param includeDeleted defaults to false;
     */
    getDefs(didsAndOrLbls?: string[], includeDeleted?: boolean): DefLike[];

    /**
     * Creates (or updates) definitions. 
     */
    setDefs(defs: Def[]): Def[];

    /**
     * Get PointDefinitions. 
     * Specifying no param will return all definitions.
     * @param didsAndOrLbls array of _did or _lbl vales to get, leave empty to get all Defs
     * @returns array of all matching definitions
     */
    getPointDefs(didsAndOrLbls?: string[], includeDeleted?: boolean): PointDefLike[];

    /**
     * Creates (or updates) point defintions
     */
    setPointDefs(pointDefs: PointDef[]): any

    getEntries(eids?: string[], includeDeleted?: boolean): EntryLike[];

    setEntries(entries: Entry[]): Entry[];

    getEntryPoints(eids?: UID[], pids?: SmallID[], includeDeleted?: boolean): EntryPointLike[];

    setEntryPoints(entryPointData: MinimumEntryPoint[]): EntryPointLike[];

    getTags(tids?: string[], dids?: SmallID[], pids?: SmallID[], includeDeleted?: boolean): TagLike[];

    setTags(tagData: Tag[]): TagLike[];

    getTagDefs(pidAndOrDidAndOrLbls?: string[], includeDeleted?: boolean): TagDefLike[];

    setTagDefs(tagData: TagDef[]): TagDefLike[];

    getOverview(): DataStoreOverview;

    query(params: QueryParams): QueryResponse;

    getAllSince(): CompleteDataset;

    connect(...params: any): boolean;

    /**
     * The name of the connector, essentially. Examples: "Excel", "Firestore"
     */
    serviceName: string;

    /**
     * A reference to the Personal Data Warehouse instance to 
     * which the storage connector is connected.
     */
    pdw: PDW;
}

/**
 * A map of arrays of all types of {@link Element}.
 */
export interface CompleteDataset {
    overview?: DataStoreOverview;
    defs?: DefLike[];
    pointDefs?: PointDefLike[];
    entries?: EntryLike[];
    entryPoints?: EntryPointLike[];
    tagDefs?: TagDefLike[];
    tags?: TagLike[];
}

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
    _created: UTCTimestamp;
    /**
     * When the element was updated, usually lines up with "_created"
     * unless the instance of the element was created via updating a 
     * previous instance
     */
    _updated: EpochStr;
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
    _period: PeriodStr,
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
     * Definition ID of the Entry
     */
    _did: SmallID,
    /**
     * Associated Point Definition ID
     */
    _pid: SmallID,
    /**
     * The actual value of the entry
     */
    _val: any
}

export interface TagDefLike extends ElementLike {
    /**
     * Like the Definition ID, the ID of the Tag
     */
    _tid: string;
    /**
     * Human-readable tag
     */
    _lbl: string;
}

export interface TagLike extends ElementLike {
    /**
     * Like the Definition ID, the ID of the Tag
     */
    _tid: SmallID;
    /**
     * The Definition the tag is associated with
     */
    _did: SmallID
    /**
     * The Point ID for 'Select'-type Points to
     * use as a select option. (Like an Enum)
     */
    _pid?: SmallID
}

/**
 * All properties in here are optional in all uses.
 */
export interface MinimumElement {
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
     * The human-readable time of creation. Will generate for you.
     */
    _created?: UTCTimestamp;
    /**
     * EpochStr for when this was updated. Will geenrate for you.
     */
    _updated?: EpochStr;
}

/**
 * required: _lbl
 * optional: all others
 */
export interface MinimumDef extends MinimumElement {
    /**
     * To create a brand new definition, this is the **only** required field.
     * All other fields *can* be provided, but will set to default if not provided.
     */
    _lbl: string;
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
     * other key/value pairs will attempt to set
     * up a {@link PointDef} with the embedded info 
     * the value
     */
    [x: string]: any;
    /**
     * Tags
     * Defaults to empty array
     */
    // _tags?: TagDefLike[];
    /**
     * Point Definitions
     * Defaults to empty array
     */
    // _points?: PointDefLike[];
}

/**
 * required: _did
 * optoinal: all others
 */
export interface MinimumPointDef extends MinimumElement {
    /**
     * Label for the points, defaults to "Label Unset"
     */
    _lbl?: string;
    /**
     * To create a brand new PointDef, you must provide a label, did, & type
     */
    _did: SmallID;
    /**
     * Point type, defaults to {@link PointType.TEXT}
     */
    _type?: PointType;
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
}

/**
 * required: _did OR/AND _eid
 * optional: all others
 */
export interface MinimumEntry extends MinimumElement {
    /**
     * When the Entry took place
     * if blank, will default to 'now'
     * in accordnce with the definition's scope
     */
    _period?: PeriodStr;
    /**
     * What kind of entry it is
     */
    _did?: SmallID;
    /**
     * Entry ID
     */
    _eid?: UID;
    /**
     * Note about the entry
     */
    _note?: Markdown;
    /**
     * other key/value pairs will attempt to find
     * the PointDef who's _pid == the key and spin
     * up a new {@link EntryPoint} who's _val is 
     * the value
     */
    [x: string]: any;
}

/**
 * required: _pid, _val, and _eid
 */
export interface MinimumEntryPoint extends MinimumElement {
    /**
     * What kind of entry it is
     * Can be inferred
     */
    _did?: SmallID;
    /**
     * Which Point is it
     */
    _pid: SmallID;
    /**
     * What Entry is it associated with?
     */
    _eid: SmallID;
    /**
     * What is the entry value?
     */
    _val: string | number | boolean | object;
}

/**
 * required: _lbl
 * optional: _tid
 */
export interface MinimumTagDef extends MinimumElement {
    /**
     * Label to be applied to the tag
     */
    _lbl: string
    /**
     * Tag ID, if known.
     * Defaults to a new {@link SmallID}
     */
    _tid?: SmallID;
}

/**
 * required: _did, _tid,
 * required if for select: _pid
 */
export interface MinimumTag extends MinimumElement {
    /**
     * Definition to apply to
     */
    _did: SmallID;
    /**
     * Tag ID to attach to the Definition (as a tag) 
     * or to the PointDefinition (as a select value)
     */
    _tid: SmallID;
    /**
     * When used as a select value, a _pid is required
     */
    _pid?: SmallID;
}

export interface QueryParams {
    from?: PeriodStr;
    to?: PeriodStr;
    updatedFrom?: PeriodStr;
    updatedTo?: PeriodStr;
    did?: string | string[];
    eid?: string | string[];
    pid?: string | string[];
    tag?: string | string[];
    includeDeleted?: boolean;
    //#TODO - more query params?
}

export interface ReducedQuery {
    from: Temporal.PlainDateTime;
    to: Temporal.PlainDateTime;
    includeDeleted: boolean;
    did: string[];
    eid: string[];
    pid: string[];
}

export interface QueryResponse {
    success: boolean;
    count: number;
    messages?: string;
    params: { paramsIn: object, asParsed: object };
    entries: Entry[]
}

interface CurrentAndDeletedCounts {
    current: number,
    deleted: number
}

export interface DataStoreOverview {
    storeName: string;
    defs: CurrentAndDeletedCounts;
    pointDefs: CurrentAndDeletedCounts;
    entries: CurrentAndDeletedCounts;
    entryPoints: CurrentAndDeletedCounts
    tagDefs: CurrentAndDeletedCounts;
    tags: CurrentAndDeletedCounts;
    lastUpdated: EpochStr; //?? probably better to be human-readable?
}
//#endregion

//#region ### CLASSES ###

export class PDW {
    dataStores: DataStore[];
    private static instance: PDW;
    constructor(store?: DataStore) {
        if (store !== undefined) {
            this.dataStores = [store];
        } else {
            this.dataStores = [new DefaultDataStore(this)]
        }
        PDW.instance = this; //for singleton
    }

    registerConnection(storeInstance: DataStore) {
        //#THINK - is this how to do it? Right now you're coming in from the connector
        this.dataStores.push(storeInstance);
    }

    //#HACK - allDataSince hardcoded
    allDataSince(): CompleteDataset {
        return {
            defs: this.dataStores[0].getDefs(undefined, true),
            pointDefs: this.dataStores[0].getPointDefs(undefined, true),
            entries: this.dataStores[0].getEntries(undefined, true),
            entryPoints: this.dataStores[0].getEntryPoints(undefined, undefined, true),
            tagDefs: this.dataStores[0].getTagDefs(undefined, true),
            tags: this.dataStores[0].getTags(undefined, undefined, undefined, true),
        }
    }

    setDefs(defsIn: MinimumDef[]): Def[] {
        let defs: Def[] = defsIn.map(defLike => new Def(defLike));
        this.dataStores.forEach(connection => {
            connection.setDefs(defs)
        })
        return defs
    }


    setPointDefs(pointDefsIn: MinimumPointDef[]): PointDef[] {
        let pointDefs: PointDef[] = pointDefsIn.map(minimumPD => new PointDef(minimumPD));
        this.dataStores.forEach(connection => {
            connection.setPointDefs(pointDefs)
        })
        return pointDefs
    }

    setEntries(entryData: MinimumEntry[]): Entry[] {
        let entries: Entry[] = entryData.map(minimumEntry => new Entry(minimumEntry));
        this.dataStores.forEach(connection => {
            connection.setEntries(entries)
        })
        return entries
    }

    setEntryPoints(entryPointData: MinimumEntryPoint[]): EntryPoint[] {
        let entryPoints: EntryPoint[] = entryPointData.map(minimumEntryPoint => new EntryPoint(minimumEntryPoint));
        this.dataStores.forEach(connection => {
            connection.setEntryPoints(entryPoints)
        })
        return entryPoints
    }

    setTagDefs(tagDefsIn: MinimumTagDef[]): TagDef[] {
        let tagDefs: TagDef[] = tagDefsIn.map(tagDef => new TagDef(tagDef));
        this.dataStores.forEach(connection => {
            connection.setTagDefs(tagDefs)
        })
        return tagDefs
    }

    setTags(tagsIn: MinimumTag[]): Tag[] {
        let tags: Tag[] = tagsIn.map(tag => new Tag(tag));
        this.dataStores.forEach(connection => {
            connection.setTags(tags)
        })
        return tags
    }

    getDefs(didOrLbls?: string[] | string, includeDeleted = false): Def[] {
        //enforce array-of-strings type
        if (didOrLbls !== undefined && !Array.isArray(didOrLbls)) didOrLbls = [didOrLbls]

        //if there's only DataStore, bypass the combining stuff to save time
        if (this.dataStores.length == 1) {
            let defLikes = this.dataStores[0].getDefs(didOrLbls, includeDeleted)
            return defLikes.map(dl => new Def(dl));
        }

        //multiple DataStores need to be all pulled, then deconflicted
        let combinedDefs: Def[] = [];
        //compile defs from all attached DataStores
        //#UNTESTED - test this!
        this.dataStores.forEach(dataStore => {
            let thisStoreDefLikes = dataStore.getDefs(didOrLbls as string[], includeDeleted);
            let thisStoreDefs = thisStoreDefLikes.map(tsdl => new Def(tsdl));
            thisStoreDefs.forEach(def => {
                let existingCopy = combinedDefs.find(cd => cd.sameIdAs(def));
                if (existingCopy !== undefined) {
                    //duplicate found, determine which is newer & keep only it
                    if (existingCopy.shouldBeReplacedWith(def)) {
                        //find & remove exising
                        const ind = combinedDefs.findIndex(el => el._uid === existingCopy!._uid)
                        combinedDefs.splice(ind);
                        //add replacement
                        combinedDefs.push(def);
                    }
                    //else{ignore it. don't do anything}
                } else {
                    combinedDefs.push(def);
                }
            })
        })
        return combinedDefs;
    }

    getPointDefs(didPidOrLbls?: string[] | string, includeDeleted = false): Def[] {
        //enforce array-of-strings type
        if (didPidOrLbls !== undefined && !Array.isArray(didPidOrLbls)) didPidOrLbls = [didPidOrLbls]

        //if there's only DataStore, bypass the combining stuff to save time
        if (this.dataStores.length == 1) {
            let defLikes = this.dataStores[0].getPointDefs(didPidOrLbls, includeDeleted)
            return defLikes.map(dl => new Def(dl));
        }

        throw new Error('Multiple stores not implemented yet');
        // //multiple DataStores need to be all pulled, then deconflicted
        // let combinedDefs: Def[] = [];
        // //compile defs from all attached DataStores
        // //#UNTESTED - test this!
        // this.dataStores.forEach(dataStore => {
        //     let thisStoreDefLikes = dataStore.getDefs(didPidOrLbls as string[], includeDeleted);
        //     let thisStoreDefs = thisStoreDefLikes.map(tsdl => new Def(tsdl));
        //     thisStoreDefs.forEach(def => {
        //         let existingCopy = combinedDefs.find(cd => cd.sameIdAs(def));
        //         if (existingCopy !== undefined) {
        //             //duplicate found, determine which is newer & keep only it
        //             if (existingCopy.shouldBeReplacedWith(def)) {
        //                 //find & remove exising
        //                 const ind = combinedDefs.findIndex(el => el._uid === existingCopy!._uid)
        //                 combinedDefs.splice(ind);
        //                 //add replacement
        //                 combinedDefs.push(def);
        //             }
        //             //else{ignore it. don't do anything}
        //         } else {
        //             combinedDefs.push(def);
        //         }
        //     })
        // })
        // return combinedDefs;
    }

    getEntries(eids: UID[], includeDeleted = false): Entry[] {
        if (this.dataStores.length == 1) {
            let entries = this.dataStores[0].getEntries(eids, includeDeleted);
            return entries.map(entry => new Entry(entry));
        }

        throw new Error('Multiple datastores not yet implemented');
    }

    getEntryPoints(){
        throw new Error('You did not build this, do you need it?')
    }


    getTagDefs(tidOrLbls?: string[] | string, includeDeleted = false): TagDef[] {
        //enforce array-of-strings type
        if (tidOrLbls !== undefined && !Array.isArray(tidOrLbls)) tidOrLbls = [tidOrLbls]

        //if there's only DataStore, bypass the combining stuff to save time
        if (this.dataStores.length == 1) {
            let tagDefLikes = this.dataStores[0].getTagDefs(tidOrLbls, includeDeleted)
            return tagDefLikes.map(tdl => new TagDef(tdl));
        }

        throw new Error('Multiple datastores not yet implemented');
    }

    // /**
    //  * Looks at an array of Elements and removes any duplicates and any
    //  * older versions of an element (say, a Def from a DataStore that was 
    //  * later updated in another DataStore). A CLASSIC CODING CHALLENGE.
    //  * It does NOT modify any Elements.
    //  * @param elementsIn array of elements to check for duplication/outdatedness within
    //  */
    // private deconflictElements(elementsIn: Element[]): Element[] {
    //     let noConflict: Element[] = [];
    //     elementsIn.forEach(el=>{
    //         if(!noConflict.some(nc=>nc.sameIdAs(el))) return noConflict.push(el);
    //         return 
    //     })
    //     return elementsIn;
    // }

    /**
     * Creates a new definition from {@link MinimumDef} components
     * and adds it to the definition manifest of the connected DataStore.
     * @param defInfo 
     * @returns the newly created Definition
    */
    createNewDef(defInfo: MinimumDef): Def {
        let newDef = new Def(defInfo);
        this.dataStores.forEach(connection => {
            connection.setDefs([newDef])
        })
        return newDef
    }

    /**
     * Creates a new definition from {@link MinimumDef} components
     * and adds it to the definition manifest of the connected DataStore
     * @param pointDefInfo 
     * @returns the newly created Point Definition
    */
    createNewPointDef(pointDefInfo: MinimumPointDef): PointDef {
        let newPointDef = new PointDef(pointDefInfo);
        this.dataStores.forEach(connection => {
            connection.setPointDefs([newPointDef])
        })
        return newPointDef;
    }

    createNewEntry(entryInfo: MinimumEntry): Entry {
        let newEntry = new Entry(entryInfo);
        this.dataStores.forEach(connection => {
            connection.setEntries([newEntry])
        })
        return newEntry;
    }

    createNewEntryPoint(entryPointInfo: MinimumEntryPoint): EntryPoint {
        let newEntryPoint = new EntryPoint(entryPointInfo);
        this.dataStores.forEach(connection => {
            connection.setEntryPoints([newEntryPoint])
        })
        return newEntryPoint;
    }

    createNewTagDef(tagDefInfo: MinimumTagDef): TagDef {
        let newTagDef = new TagDef(tagDefInfo);
        this.dataStores.forEach(connection => {
            connection.setTagDefs([newTagDef])
        })
        return newTagDef;
    }

    createNewTag(tagInfo: MinimumTag): Tag {
        let newTag = new Tag(tagInfo);
        this.dataStores.forEach(connection => {
            connection.setTags([newTag])
        })
        return newTag;
    }

    /**
     * Singleton pattern.
     * @returns the PDW
     */
    public static getInstance(): PDW {
        if (!PDW.instance) {
            PDW.instance = new PDW();
        }
        return PDW.instance;
    }
}

/**
 * Base class 
 */
export abstract class Element implements ElementLike {
    _uid: string;
    _deleted: boolean;
    _created: UTCTimestamp;
    _updated: EpochStr;
    constructor(existingData: any) {
        this._uid = existingData._uid ?? makeUID();
        this._deleted = existingData._deleted ?? false;
        this._created = existingData._created ?? new Date().toISOString();
        this._updated = existingData._updated ?? makeEpochStr();
    }

    markDeleted() {
        this._deleted = true;
        this._updated = makeEpochStr();
    }

    markUndeleted() {
        this._deleted = false;
        this._updated = makeEpochStr();
    }

    /**
     * Checks if the argument was updated more recently than this
     * @param elementData ElementLike data to compare against
     * @returns true if argument is updated more recently than this
     */
    isOlderThan(elementData: ElementLike) {
        return this._updated < elementData._updated;
    }

    /**
     * Checks whether this is the same Element as the comparison AND if the 
     * comparison is newer than this
     * @param comparison ElementLike data that might be a newer copy of this
     * @returns true if the argument is a newer version of the same Element
     */
    shouldBeReplacedWith(comparison: ElementLike): boolean {
        if (!this.sameIdAs(comparison)) return false;
        if (this.isOlderThan(comparison)) return true;
        return false;
    }

    /**
     * Get the type of an element. Not sure if I'll use this outside
     * of the 
     * @returns string representing the type of element
     */
    getType(): 'DefLike' | 'PointDefLike' | 'EntryLike' | 'EntryPointLike' | 'TagDefLike' | 'TagLike' | null {
        return Element.getTypeOfElementLike(this)!
    }

    /**
     * Checks to see if this has the same _did (or _eid, _tid, _pid) as
     * whatever is passed in
     * @param comparison Element to compare against
     */
    sameIdAs(comparison: ElementLike) {
        if (!this.sameTypeAs(comparison)) return false;
        const type = this.getType();
        //@ts-expect-error
        if (type === 'DefLike') return this._did === comparison._did;
        //@ts-expect-error
        if (type === 'PointDefLike') return this._did === comparison._did && this._pid === comparison._pid;
        //@ts-expect-error
        if (type === 'EntryLike') return this._eid === comparison._eid;
        //@ts-expect-error
        if (type === 'EntryPointLike') return this._eid === comparison._eid && this._pid === comparison._pid;
        //@ts-expect-error
        if (type === 'TagDefLike') return this._tid === comparison._tid;
        //@ts-expect-error
        if (type === 'TagLike') return this._tid === comparison._tid && this._did === comparison._did; //#UNTESTED - for selects
        //@ts-expect-error
        return this._pid === comparison._pid && this._did === comparison._did;
    }

    sameTypeAs(comparison: ElementLike) {
        return this.getType() === Element.getTypeOfElementLike(comparison);
    }

    private static getTypeOfElementLike(data: ElementLike) {
        if (data.hasOwnProperty("_tid") && data.hasOwnProperty('_did')) return "TagLike"
        if (data.hasOwnProperty("_tid")) return "TagDefLike"
        if (data.hasOwnProperty("_eid") && data.hasOwnProperty('_pid')) return "EntryPointLike"
        if (data.hasOwnProperty("_eid")) return "EntryLike"
        if (data.hasOwnProperty("_pid")) return "PointDefLike"
        if (data.hasOwnProperty("_did")) return "DefLike"
        return null
    }

    /**
     * Analyzes an object and tries to find one UNDELETED Element that
     * has the same Xid(s). 
     * @param dataIn an object that may be part of an existing Element
     * @returns the raw DefLike, PointDefLike, EntryLike, EntryPointLike, TagLike, or TagDefLike - or undefined if none found
     */
    public static findExistingData(dataIn: any): any {
        const type = Element.getTypeOfElementLike(dataIn);
        if (type === null) return undefined;

        let pdwRef = PDW.getInstance();
        let existing: any;
        if (type === 'DefLike') {
            pdwRef.dataStores.forEach(store => {
                let storeResult = maybeGetOnlyResult(store.getDefs([dataIn._did], false));
                if (storeResult !== undefined && existing === undefined) existing = storeResult as DefLike
            })
        }
        if (type === 'PointDefLike') {
            pdwRef.dataStores.forEach(store => {
                let storeResult = maybeGetOnlyResult(store.getPointDefs([dataIn._pid], false));
                if (storeResult !== undefined && existing === undefined) existing = storeResult as PointDefLike
            })
        }
        if (type === 'EntryLike') {
            pdwRef.dataStores.forEach(store => {
                let storeResult = maybeGetOnlyResult(store.getEntries([dataIn._eid], false));
                if (storeResult !== undefined && existing === undefined) existing = storeResult as EntryLike
            })
        }
        if (type === 'EntryPointLike') {
            pdwRef.dataStores.forEach(store => {
                let storeResult = maybeGetOnlyResult(store.getEntryPoints([dataIn._eid], [dataIn._pid], false));
                if (storeResult !== undefined && existing === undefined) existing = storeResult as EntryPointLike
            })
        }
        if (type === 'TagDefLike') {
            pdwRef.dataStores.forEach(store => {
                let storeResult = maybeGetOnlyResult(store.getTagDefs([dataIn._tid], false));
                if (storeResult !== undefined && existing === undefined) existing = storeResult as TagDefLike
            })
        }
        if (type === 'TagLike') {
            pdwRef.dataStores.forEach(store => {
                let storeResult = maybeGetOnlyResult(store.getTags([dataIn._tid], [dataIn._did], undefined, false));
                if (storeResult !== undefined && existing === undefined) existing = storeResult as TagDefLike
            })
        }
        return existing;
    }
}

export class Def extends Element implements DefLike {
    _did: SmallID;
    _lbl: string;
    _desc: string;
    _emoji: string;
    _scope: Scope;
    constructor(newDefData: MinimumDef) {
        if (newDefData._did !== undefined) {
            let existing = Element.findExistingData(newDefData);
            if (existing !== undefined) {
                if (newDefData._created === undefined) newDefData._created = existing._created;
                if (newDefData._desc === undefined) newDefData._desc = existing._desc;
                if (newDefData._emoji === undefined) newDefData._emoji = existing._emoji;
                if (newDefData._did === undefined) newDefData._did = existing._did;
                if (newDefData._lbl === undefined) newDefData._lbl = existing._lbl;
                if (newDefData._scope === undefined) newDefData._scope = existing._scope;
            }
        }
        super(newDefData)
        this._lbl = newDefData._lbl;
        this._did = newDefData._did ?? makeSmallID();
        this._desc = newDefData._desc ?? 'Set a description';
        this._emoji = newDefData._emoji ?? '🆕';
        this._scope = newDefData._scope ?? Scope.SECOND;
        //spawn new PointDefs for any non-underscore-prefixed keys
        let pids = Object.keys(newDefData).filter(key => key.substring(0, 1) !== '_');
        if (pids.length > 0) {
            let pointDefs: MinimumPointDef[] = pids.map(pid => {
                newDefData[pid]._pid = pid;
                newDefData[pid]._did = this._did;
                return newDefData[pid]
            });
            PDW.getInstance().setPointDefs(pointDefs);
        }
    }

    setPointDefs(pointInfoIn: [{
        _lbl: string,
        _type: PointType,
        _emoji?: string,
        _desc?: Markdown,
        _rollup?: Rollup
        _pid?: SmallID
    }]): PointDef[] {
        let pointDefs = pointInfoIn.map(point => {
            return PDW.getInstance().createNewPointDef({
                _lbl: point._lbl,
                _did: this._did,
                _type: point._type,
                _emoji: point._emoji,
                _desc: point._desc,
                _rollup: point._rollup,
                _pid: point._pid
            })
        })
        return pointDefs
    }

    getPoints(includeDeleted = false): PointDef[] {
        const pdwRef = PDW.getInstance();

        //if there's only DataStore, bypass the combining stuff to save time
        if (pdwRef.dataStores.length == 1) {
            let pds = pdwRef.dataStores[0].getPointDefs([this._did], includeDeleted)
            return pds.map(pointDef => new PointDef(pointDef));
        }

        throw new Error('Multiple Data Stores are #TODO') //#TODO - for multiple data stores
    }

    // /**
    //  * When replacing one Def with a new one, you want to pull all the values
    //  * for any existing properties that are NOT explicityl contained in the new Def
    //  * @param existingDef 
    //  */
    // overwriteWith(newDefData: MinimumDef): Def{
    //     if(newDefData._created === undefined) newDefData._created = this._created;
    //     if(newDefData._desc === undefined) newDefData._desc = this._desc;
    //     if(newDefData._emoji === undefined) newDefData._emoji = this._emoji;
    //     if(newDefData._did === undefined) newDefData._did = this._did;
    //     if(newDefData._lbl === undefined) newDefData._lbl = this._lbl;
    //     if(newDefData._scope === undefined) newDefData._scope = this._scope;
    //     this._deleted = true;
    //     //newDefData._uid will be different
    //     //newDefData._updated will be set anew
    //     return new Def(newDefData);
    // }

    /**
    * Predicate to check if an object has all {@link DefLike} properties
    * AND they are the right type.
    * @param data data to check
    * @returns true if data have all required properties of {@link DefLike}
    */
    static isDefLike(data: any): boolean {
        if (data._did == undefined || typeof data._did !== 'string') return false
        if (data._lbl == undefined || typeof data._lbl !== 'string') return false
        if (data._desc == undefined || typeof data._desc !== 'string') return false
        if (data._emoji == undefined || typeof data._emoji !== 'string') return false
        if (data._scope == undefined || !this.isValidScope(data._scope)) return false
        if (data._uid == undefined || typeof data._uid !== 'string') return false
        if (data._created == undefined || typeof data._created.getISOFields !== 'function') return false //proxy check
        if (data._deleted == undefined || typeof data._deleted !== 'boolean') return false
        if (data._updated == undefined || typeof data._updated !== 'string') return false
        return true;
    }

    static isValidScope(typeStr: string): boolean {
        const values = Object.values(Scope);
        return values.includes(typeStr as unknown as Scope)
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
    _def?: Def;
    constructor(newPointDefData: MinimumPointDef, def?: Def) {
        if (newPointDefData._did !== undefined && newPointDefData._pid !== undefined) {
            let existing = Element.findExistingData(newPointDefData);
            if (existing !== undefined) {
                if (newPointDefData._created === undefined) newPointDefData._created = existing._created;
                if (newPointDefData._desc === undefined) newPointDefData._desc = existing._desc;
                if (newPointDefData._emoji === undefined) newPointDefData._emoji = existing._emoji;
                if (newPointDefData._did === undefined) newPointDefData._did = existing._did;
                if (newPointDefData._lbl === undefined) newPointDefData._lbl = existing._lbl;
                if (newPointDefData._type === undefined) newPointDefData._type = existing._type;
                if (newPointDefData._rollup === undefined) newPointDefData._rollup = existing._rollup;
            }
        }
        super(newPointDefData)
        this._did = newPointDefData._did;
        this._lbl = newPointDefData._lbl ?? 'Label unset';
        this._type = newPointDefData._type ?? PointType.TEXT;
        this._pid = newPointDefData._pid ?? makeSmallID();
        this._desc = newPointDefData._desc ?? 'Set a description';
        this._emoji = newPointDefData._emoji ?? '🆕';
        this._rollup = newPointDefData._rollup ?? Rollup.COUNT;
        if (def) this._def = def;
    }

    /**
    * Predicate to check if an object has all {@link PointDefLike} properties
    * AND they are the right type.
    * @param data data to check
    * @returns true if data have all required properties of {@link DefLike}
    */
    static isPointDefLike(data: any): boolean {
        if (data._did == undefined || typeof data._did !== 'string') return false
        if (data._pid == undefined || typeof data._pid !== 'string') return false
        if (data._lbl == undefined || typeof data._lbl !== 'string') return false
        if (data._desc == undefined || typeof data._desc !== 'string') return false
        if (data._emoji == undefined || typeof data._emoji !== 'string') return false
        if (data._type == undefined || !PointDef.isValidType(data._type)) return false
        if (data._rollup == undefined || !PointDef.isValidRollup(data._rollup)) return false
        if (data._uid == undefined || typeof data._uid !== 'string') return false
        if (data._created == undefined || typeof data._created.getISOFields !== 'function') return false //proxy check
        if (data._deleted == undefined || typeof data._deleted !== 'boolean') return false
        if (data._updated == undefined || typeof data._updated !== 'string') return false
        return true;
    }

    static isValidType(typeStr: string): boolean {
        //Handy bit of Enum functionality here for ref
        const values = Object.values(PointType);
        return values.includes(typeStr as unknown as PointType)
    }

    static isValidRollup(typeStr: string): boolean {
        const values = Object.values(Rollup);
        return values.includes(typeStr as unknown as Rollup)
    }
}

export class Entry extends Element implements EntryLike {
    _eid: string;
    _note: Markdown;
    _did: string;
    _period: PeriodStr;
    constructor(entryData: MinimumEntry) {
        if (entryData._eid === undefined && entryData._did === undefined)
            throw new Error('Not enough info to determine Entry type')
        if (entryData._eid !== undefined) {
            let existing = Element.findExistingData(entryData);
            if (existing !== undefined) {
                if (entryData._created === undefined) entryData._created = existing._created;
                if (entryData._did === undefined) entryData._did = existing._did;
                if (entryData._period === undefined) entryData._period = existing._period;
                if (entryData._note === undefined) entryData._note = existing._note;
            }
        }
        super(entryData);
        const relatedDef = maybeGetOnlyResult(PDW.getInstance().getDefs([entryData._did!]));
        if (relatedDef === undefined) throw new Error('No def found for ' + entryData._did);
        this._did = entryData._did!;
        if (entryData._period !== undefined) {
            this._period = entryData._period;
        } else {
            this._period = Period.now((<Def>relatedDef)._scope);
        }
        this._eid = entryData._eid ?? makeUID();
        this._note = entryData._note ?? '';
        //spawn new EntryPoints for any non-underscore-prefixed keys
        let pids = Object.keys(entryData).filter(key => key.substring(0, 1) !== '_');
        if (pids.length > 0) {
            let entryPoints: MinimumEntryPoint[] = pids.map(pid => {
                return {
                    _pid: pid,
                    _val: entryData[pid],
                    _eid: this._eid,
                    _did: this._did
                }
            });
            PDW.getInstance().setEntryPoints(entryPoints);
        }
    }

    getPeriod(): Period {
        return new Period(this._period);
    }
}

/**
 * Making this a class for symmetry, but not exactly sure if it 
 * really should be one. Can't think of any methods that would 
 * be attached. But I guess it's an easy way to build an EntryLike obj
 */
export class EntryPoint extends Element implements EntryPointLike {
    _eid: UID;
    _pid: SmallID;
    _val: any;
    _did: SmallID
    constructor(entryPointData: MinimumEntryPoint) {
        if (entryPointData._eid !== undefined) {
            let existing = Element.findExistingData(entryPointData);
            if (existing !== undefined) {
                if (entryPointData._created === undefined) entryPointData._created = existing._created;
                if (entryPointData._did === undefined) entryPointData._did = existing._did;
            }
        }
        super(entryPointData);
        this._eid = entryPointData._eid;
        this._pid = entryPointData._pid;
        this._val = entryPointData._val;
        this._did = entryPointData._did!; //I *think* this will always be not undefined
    }

}

export class TagDef extends Element implements TagDefLike {
    _tid: string;
    _lbl: string;
    constructor(tagDefData: MinimumTagDef) {
        if (tagDefData._tid !== undefined) {
            let existing = Element.findExistingData(tagDefData);
            if (existing !== undefined) {
                if (tagDefData._created === undefined) tagDefData._created = existing._created;
            }
        }
        super(tagDefData);
        this._tid = tagDefData._tid ?? makeSmallID();
        this._lbl = tagDefData._lbl;
    }
}

export class Tag extends Element implements TagLike {
    _tid: string;
    _did: string;
    _pid?: string | undefined;
    constructor(tagData: MinimumTag) {
        if (tagData._tid !== undefined) {
            let existing = Element.findExistingData(tagData);
            if (existing !== undefined) {
                if (tagData._created === undefined) tagData._created = existing._created;
            }
        }
        super(tagData);
        this._tid = tagData._tid;
        this._did = tagData._did;
        this._pid = tagData._pid;
    }
}

export class Period {
    constructor(periodStr: PeriodStr) {

    }
    static now(scope: Scope): PeriodStr {
        let seedStr = '';
        let nowTemp = Temporal.Now.zonedDateTimeISO();
        if (scope === Scope.YEAR) seedStr = nowTemp.year.toString();
        if (scope === Scope.QUARTER) seedStr = nowTemp.year.toString() + '-Q' + Math.ceil(nowTemp.month / 3);
        if (scope === Scope.MONTH) seedStr = nowTemp.toPlainYearMonth().toString()
        if (scope === Scope.WEEK) seedStr = nowTemp.year.toString() + '-W' + nowTemp.weekOfYear.toString();
        if (scope === Scope.DAY) seedStr = nowTemp.toPlainDate().toString()
        if (scope === Scope.HOUR) seedStr = nowTemp.toString().substring(0, 13)
        if (scope === Scope.MINUTE) seedStr = nowTemp.toString().substring(0, 16)
        if (scope === Scope.SECOND) seedStr = nowTemp.toString().substring(0, 19)
        return seedStr
    }

    static inferScope(ISOString: string): Scope {
        if (/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d/i.test(ISOString))
            return Scope.SECOND;
        if (/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d/i.test(ISOString))
            return Scope.MINUTE;
        if (/\d{4}-[01]\d-[0-3]\dT[0-2]\d/i.test(ISOString))
            return Scope.HOUR;
        if (/^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$/.test(ISOString))
            return Scope.DAY;
        if (/^([0-9]{4})-?W(5[0-3]|[1-4][0-9]|0[1-9])$/i.test(ISOString))
            return Scope.WEEK;
        if (/^([0-9]{4})-(1[0-2]|0[1-9])$/.test(ISOString))
            return Scope.MONTH;
        if (/^[0-9]{4}-Q[1-4]$/i.test(ISOString))
            return Scope.QUARTER;
        if (/^([0-9]{4})$/.test(ISOString))
            return Scope.YEAR;
        throw new Error('Attempted to infer scope failed for: ' + ISOString);
    }
}

export class Query {
    constructor() {

    }

    run(): QueryResponse {
        throw new Error('Query.run not yet implemented')
    }
}

export class DefaultDataStore implements DataStore {
    serviceName: string;
    pdw: PDW;
    defs: Def[];
    pointDefs: PointDef[];
    entries: Entry[];
    entryPoints: EntryPoint[];
    tagDefs: TagDef[];
    tags: Tag[];

    constructor(pdwRef: PDW) {
        this.serviceName = 'In memory dataset';
        this.pdw = pdwRef;
        this.defs = [];
        this.pointDefs = [];
        this.entries = [];
        this.entryPoints = [];
        this.tagDefs = [];
        this.tags = [];
    }

    query(params: QueryParams): QueryResponse {

        throw new Error("Method not implemented.");
    }

    getDefs(didsAndOrLbls?: string[] | undefined, includeDeleted = false): DefLike[] {
        if (didsAndOrLbls === undefined) {
            if (includeDeleted) return this.defs;
            return this.defs.filter(def => def._deleted === false);
        }
        const labelMatches = this.defs.filter(def => didsAndOrLbls.some(p => p === def._lbl));
        const didMatches = this.defs.filter(def => didsAndOrLbls.some(p => p === def._did));
        //in case a _lbl & _did were supplied for the same entry, remove the duplicate (tested, works)
        let noDupes = new Set([...labelMatches, ...didMatches]);
        if (includeDeleted) return Array.from(noDupes);
        return Array.from(noDupes).filter(def => def._deleted === false);
    }

    setDefs(defsIn: Def[]): Def[] {
        let newDefs: Def[] = [];
        //mark any old defs as deleted
        defsIn.forEach(def => {
            let existingDef = this.defs.find(existing => existing.sameIdAs(def) && existing._deleted === false);
            if (existingDef !== undefined) {
                //only replace if the setDefs def is newer, necessary for StorageConnector merges
                if (existingDef.shouldBeReplacedWith(def)) {
                    existingDef.markDeleted();
                    if(!def._deleted) newDefs.push(def) //don't duplicate in case of calling setDefs purely to delete
                }
            } else {
                newDefs.push(def);
            }
        })
        //merge newDefs with defs in the DataStore
        this.defs.push(...newDefs);
        return defsIn;
    }

    getPointDefs(didsAndOrLbls?: string[] | undefined, includeDeleted = false): PointDefLike[] {
        if (didsAndOrLbls === undefined) {
            if (includeDeleted) return this.pointDefs;
            return this.pointDefs.filter(def => def._deleted === false);
        }
        const labelMatches = this.pointDefs.filter(def => didsAndOrLbls.some(p => p === def._lbl));
        const didMatches = this.pointDefs.filter(def => didsAndOrLbls.some(p => p === def._did));
        const pidMatches = this.pointDefs.filter(def => didsAndOrLbls.some(p => p === def._pid));
        //in case a _lbl & _did were supplied for the same entry, remove the duplicate (tested, works)
        let noDupes = new Set([...labelMatches, ...didMatches, ...pidMatches]);
        if (includeDeleted) return Array.from(noDupes);
        return Array.from(noDupes).filter(pd => pd._deleted === false);
    }

    setPointDefs(pointDefsIn: PointDef[]) {
        let newDefs: PointDef[] = [];
        //mark any old defs as deleted
        pointDefsIn.forEach(pd => {
            let existingDef = this.pointDefs.find(existing => existing.sameIdAs(pd) && existing._deleted === false);
            if (existingDef !== undefined) {
                //only replace if the setDefs def is newer, necessary for StorageConnector merges
                if (existingDef.shouldBeReplacedWith(pd)) {
                    existingDef.markDeleted();
                    if(!pd._deleted) newDefs.push(pd)
                }
            } else {
                newDefs.push(pd);
            }
        })
        //merge newDefs with defs in the DataStore
        this.pointDefs.push(...newDefs);
        return pointDefsIn;
    }

    /**
     * For pulling entries that you know the eid of
     * @param eids 
     * @param includeDeleted 
     * @returns an array of all entries matching the criteria
     */
    getEntries(eids?: string[], includeDeleted = false): EntryLike[] {
        if (eids === undefined) {
            if (includeDeleted) return this.entries;
            return this.entries.filter(entry => entry._deleted === false);
        }
        const entries = this.entries.filter(entry => eids.some(p => p === entry._eid));
        //in case a _lbl & _did were supplied for the same entry, remove the duplicate (tested, works)
        let noDupes = new Set([...entries]);
        if (includeDeleted) return Array.from(noDupes);
        return Array.from(noDupes).filter(entry => entry._deleted === false);

    }

    setEntries(entriesIn: Entry[]): Entry[] {
        let entries: Entry[] = [];
        //mark any old defs as deleted
        entriesIn.forEach(entry => {
            let existingEntry = this.entries.find(existing => existing.sameIdAs(entry) && existing._deleted === false);
            if (existingEntry !== undefined) {
                //only replace if the setDefs def is newer, necessary for StorageConnector merges
                if (existingEntry.shouldBeReplacedWith(entry)) {
                    existingEntry.markDeleted();
                    if(!entry._deleted) entries.push(entry)
                }
            } else {
                entries.push(entry);
            }
        })
        //merge newDefs with defs in the DataStore
        this.entries.push(...entries);
        return entries;
    }

    getEntryPoints(eids?: UID[], pids?: SmallID[], includeDeleted = false): EntryPointLike[] {
        if (eids === undefined && pids === undefined) {
            if (includeDeleted) return this.entryPoints;
            return this.entryPoints.filter(entryPoint => entryPoint._deleted === false);
        }
        const eidMatches = eids === undefined ? [] : this.entryPoints.filter(entry => eids.some(p => p === entry._eid));
        const pidMatches = pids === undefined ? [] : this.entryPoints.filter(entry => pids.some(p => p === entry._pid));
        //in case a _lbl & _did were supplied for the same entry, remove the duplicate (tested, works)
        let noDupes = Array.from(new Set([...eidMatches, ...pidMatches]));
        if (eids !== undefined && pids !== undefined) {
            noDupes = noDupes.filter(entryPoint => {
                const eidSame = eids.some(p => p === entryPoint._eid);
                const pidSame = pids.some(p => p === entryPoint._pid)
                return eidSame && pidSame
            })
        }
        if (includeDeleted) return Array.from(noDupes);
        return Array.from(noDupes).filter(entry => entry._deleted === false);
    }

    setEntryPoints(entryPointData: EntryPoint[]): EntryPoint[] {
        let entryPoints: EntryPoint[] = [];
        //mark any old defs as deleted
        entryPointData.forEach(entryPoint => {
            let existingEntry = this.entryPoints.find(existing => existing.sameIdAs(entryPoint) && existing._deleted === false);
            if (existingEntry !== undefined) {
                //only replace if the setDefs def is newer, necessary for StorageConnector merges
                if (existingEntry.shouldBeReplacedWith(entryPoint)) {
                    existingEntry.markDeleted();
                    if(!entryPoint._deleted) entryPoints.push(entryPoint)
                }
            } else {
                entryPoints.push(entryPoint);
            }
        })
        this.entryPoints.push(...entryPoints);
        return entryPoints;
    }


    getTags(tids?: UID[], dids?: SmallID[], pids?: SmallID[], includeDeleted = false): TagLike[] {
        if (tids === undefined && dids === undefined && pids === undefined) {
            if (includeDeleted) return this.tags;
            return this.tags.filter(entry => entry._deleted === false);
        }
        const didMatches = dids === undefined ? [] : this.tags.filter(def => dids.some(p => p === def._did));
        const tidMatches = tids === undefined ? [] : this.tags.filter(def => tids.some(p => p === def._tid));
        const pidMatches = pids === undefined ? [] : this.tags.filter(def => pids.some(p => p === def._pid));
        let noDupes = new Set([...didMatches, ...pidMatches, ...tidMatches]);
        if (includeDeleted) return Array.from(noDupes);
        return Array.from(noDupes).filter(entry => entry._deleted === false);
    }

    setTags(tagData: Tag[]): TagLike[] {
        let tags: Tag[] = [];
        //mark any old defs as deleted
        tagData.forEach(tag => {
            let existingTag = this.tags.find(existing => existing.sameIdAs(tag) && existing._deleted === false);
            if (existingTag !== undefined) {
                //only replace if the setDefs def is newer, necessary for StorageConnector merges
                if (existingTag.shouldBeReplacedWith(tag)) {
                    existingTag.markDeleted();
                    if(!tag._deleted) tags.push(tag)
                }
            } else {
                tags.push(tag);
            }
        })
        this.tags.push(...tags);
        return tags;
    }

    getTagDefs(tidAndOrLbls?: string[], includeDeleted = false): TagDefLike[] {
        if (tidAndOrLbls === undefined) {
            if (includeDeleted) return this.tagDefs;
            return this.tagDefs.filter(entry => entry._deleted === false);
        }
        const didMatches = this.tagDefs.filter(def => tidAndOrLbls.some(p => p === def._tid));
        const lblMatches = this.tagDefs.filter(def => tidAndOrLbls.some(p => p === def._lbl));
        let noDupes = new Set([...lblMatches, ...didMatches]);
        if (includeDeleted) return Array.from(noDupes);
        return Array.from(noDupes).filter(entry => entry._deleted === false);
    }

    setTagDefs(tagDefsIn: TagDef[]): TagDefLike[] {
        let tagDefs: TagDef[] = [];
        //mark any old defs as deleted
        tagDefsIn.forEach(tagDef => {
            let existingTagDef = this.tagDefs.find(existing => existing.sameIdAs(tagDef) && existing._deleted === false);
            if (existingTagDef !== undefined) {
                //only replace if the setDefs def is newer, necessary for StorageConnector merges
                if (existingTagDef.shouldBeReplacedWith(tagDef)) {
                    existingTagDef.markDeleted();
                    if(!tagDef._deleted) tagDefs.push(tagDef) //don't duplicate if you're just deleting
                }
            } else {
                tagDefs.push(tagDef);
            }
        })
        //merge newDefs with defs in the DataStore
        this.tagDefs.push(...tagDefs);
        return tagDefs;
    }

    getOverview(): DataStoreOverview {
        throw new Error("Method not implemented.");
    }

    getAllSince(): CompleteDataset {
        throw new Error("Method not implemented.");
    }

    connect(..._params: any): boolean {
        throw new Error("Method not implemented.");
    }

}

//#endregion

//#region ### UTILITIES ###

//TODO - do you want a utils class?

/**
 * Makes a unique identifier for use with _uid and _eid
 */
export function makeUID(): UID {
    return makeEpochStr() + "-" + makeSmallID();
}

export function makeEpochStr(): EpochStr {
    return new Date().getTime().toString(36)
}

export function makeSmallID(length = 4): SmallID {
    return Math.random().toString(36).slice(13 - length).padStart(length, "0")
}

export function parseTemporalFromUid(uid: UID): Temporal.Instant {
    return parseTemporalFromEpochStr(uid.split("-")[0]);
}

export function parseTemporalFromEpochStr(epochStr: EpochStr): Temporal.Instant {
    const epochMillis = parseInt(epochStr, 36)
    const parsedTemporal = Temporal.Instant.fromEpochMilliseconds(epochMillis);
    // const zoneless = Temporal.Now.plainDateTimeISO();
    // console.log(parsedTemporal.toString({ timeZone: Temporal.TimeZone.from(timezone)}));
    // const timezone = Temporal.Now.timeZone();
    //#BUG - this is still having some time zone weirdness.
    //bug demo
    let tempStr = makeEpochStr();
    const bugEpochMillis = parseInt(tempStr, 36)
    const bugParsedTemporal = Temporal.Instant.fromEpochMilliseconds(bugEpochMillis);
    console.log('bug demo: ' + bugParsedTemporal.toLocaleString()); //will be in the future

    return parsedTemporal
}

/**
* Get the type of an element. Not sure if I'll use this outside
* of the 
* @returns string representing the type of element
*/
export function getElementType(element: ElementLike): 'DefLike' | 'PointDefLike' | 'EntryLike' | 'EntryPointLike' | 'TagLike' {
    if (element.hasOwnProperty("_tid")) return "TagLike"
    if (element.hasOwnProperty("_eid") && element.hasOwnProperty('_pid')) return "EntryPointLike"
    if (element.hasOwnProperty("_eid")) return "EntryLike"
    if (element.hasOwnProperty("_pid")) return "PointDefLike"
    return "DefLike"
}

function maybeGetOnlyResult(arrayOfOneElement: any[]): undefined | Def | Entry | PointDef | EntryPoint | Tag | TagDef {
    if (arrayOfOneElement.length === 0) return undefined
    if (arrayOfOneElement.length > 1) {
        console.error('Found too many errors:', arrayOfOneElement)
        throw new Error('Found too many results')
    }
    return arrayOfOneElement[0]
}

//#endregion
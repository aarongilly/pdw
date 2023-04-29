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
 * A String that is likely to be markdown-enabled in use
 */
export type Markdown = string

//#endregion

//#region ### ENUMS ###

export enum PointType {
    /**
     * a number
     */
    NUMBER = "NUMBER",
    /**
     * A string, assumed to be short-ish
     */
    TEXT = 'TEXT',
    /**
     * A string, assumed to be long-ish, to run through 'marked' if possible
     */
    MARKDOWN = 'MARKDOWN',
    SELECT = 'SELECT', //_tid
    /**
     * true or false
     */
    BOOL = 'BOOL', //true false
    /**
     * A Temporal Duration string
     */
    DURATION = 'DURATION', //Temporal.duration
    /**
     * A Temporal PlainTime string (no timezone)
     */
    TIME = 'TIME', //Temporal.plainTime
    /**
     * An array of _tid
     */
    MULTISELECT = 'MULTISELECT', //Comma-separated list of _tid 
    /**
     * A url to a file?
     */
    FILE = 'FILE', //url?
    /**
     * A url to a photo?
     */
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

    getDefs(params: SanitizedParams): DefLike[];

    getPointDefs(params: SanitizedParams): PointDefLike[];

    getEntries(params: SanitizedParams): EntryLike[];

    getEntryPoints(params: SanitizedParams): EntryPointLike[];

    getTags(params: SanitizedParams): TagLike[];

    getTagDefs(params: SanitizedParams): TagDefLike[];

    getAll(params: SanitizedParams): CompleteDataset;



    setDefs(defs: Def[]): Def[];

    setPointDefs(pointDefs: PointDef[]): any

    setEntries(entries: Entry[]): Entry[];

    setEntryPoints(entryPointData: MinimumEntryPoint[]): EntryPointLike[];

    setTags(tagData: Tag[]): TagLike[];

    setTagDefs(tagData: TagDef[]): TagDefLike[];

    setAll(completeDataset: CompleteDataset): CompleteDataset;



    query(params: QueryParams): QueryResponse;

    getOverview(): DataStoreOverview;

    connect?(...params: any): boolean;

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
 * A static DataStore. Loads content to the DefaultDataStore (arrays in memory)
 * and doesn't register itself with the PDW. No changes are persisted to the 
 * place where the data was imported from until it's exported back to that place.
 */
export interface AsyncDataStore {
    importFrom(params: any): CompleteDataset,
    exportTo(allData: CompleteDataset, params: any): any
}

/**
 * Basic data filtering parameters, supported by the {@link DataStore} methods for
 * {@link getDefs} & the 5 other element "getters".
 * Not all parameters are considered for each getter, but it should make
 * things a bit simpler to standardize the params
 */
export interface StandardParams {
    /**
     * Include things marked as deleted?
     * no - default
     * yes - include all
     * only - only include deleted things
     */
    includeDeleted?: 'yes' | 'no' | 'only',
    /**
     * For entries and entryPoints only
     */
    from?: Period | PeriodStr,
    to?: Period | PeriodStr,
    createdAfter?: Temporal.ZonedDateTime | EpochStr,
    createdBefore?: Temporal.ZonedDateTime | EpochStr,
    updatedAfter?: Temporal.ZonedDateTime | EpochStr,
    updatedBefore?: Temporal.ZonedDateTime | EpochStr,
    uid?: UID[],
    did?: SmallID[],
    pid?: SmallID[],
    eid?: UID[],
    tid?: SmallID[],
    defLbl?: string[],
    pointLbl?: string[],
    tagLbl?: string[],
    limit?: number,
    allOnPurpose?: boolean
}

export interface SanitizedParams {
    includeDeleted: 'yes' | 'no' | 'only',
    /**
     * For entries and entryPoints only
     */
    from?: Period,
    to?: Period,
    createdAfter?: Temporal.ZonedDateTime,
    createdAfterEpochStr?: EpochStr,
    createdBefore?: Temporal.ZonedDateTime,
    createdBeforeEpochStr?: EpochStr,
    updatedAfter?: Temporal.ZonedDateTime,
    updatedAfterEpochStr?: EpochStr,
    updatedBefore?: Temporal.ZonedDateTime
    updatedBeforeEpochStr?: EpochStr,
    uid?: UID[],
    did?: SmallID[],
    pid?: SmallID[],
    eid?: UID[],
    tid?: SmallID[],
    defLbl?: string[],
    pointLbl?: string[],
    tagLbl?: string[],
    limit?: number,
    allOnPurpose?: boolean
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
    _created: EpochStr;
    /**
     * When the element was updated, usually lines up with "_created"
     * unless the instance of the element was created via updating a 
     * previous instance
     */
    _updated: EpochStr;
    /**
     * other key/value pairs will attempt to find
     * the PointDef who's _pid == the key and spin
     * up a new {@link EntryPoint} who's _val is 
     * the value
     */
    [x: string]: any;
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
    /**
     * For tracking where the tracking is coming from
     */
    _source: string,
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
     * Sets based on `typeof` your inputVal
     * if undefined => false
     * if boolean => inputVal
     * if string => inputVal.toUpperCase() === 'TRUE'
     * if number => inputVal === 1 ? true : false
     * else throw error
     */
    _deleted?: boolean | boolean | number;
    /**
     * EpochStr for when this was updated. Will geenrate for you.  
     */
    _created?: EpochStr;
    /**
     * EpochStr for when this was updated. Will geenrate for you.
     */
    _updated?: EpochStr;
    /**
     * Additional arbitrary key/value pairs are allowed
     */
    [x: string]: any;
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
     * Where did the data come from?
     */
    _source?: string;
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
    updatedAfter?: PeriodStr;
    updatedBefore?: PeriodStr;
    did?: string | string[];
    eid?: string | string[];
    pid?: string | string[];
    tag?: string | string[];
    search?: string | string[];
    searchIn?: string | string[];
    includeDeleted?: boolean;
    limit?: number;
    today?: any;
    thisWeek: any;
    thisMonth: any;
    /**
     * MoA - map of Arrays
     * NestPoints - Entrys with _points: [EntryPoints], Defs with _points: [PointDefs]
     * ByEntry - Entries with _points: [EntryPoints] & _defs: [Def], where Def has Tags & PointDefs
     * ByDef - Defs with _entries: [Entry] & _points: [PointDefs
     * MyPeriod - Periods with _entries: [ByEntry]
     */
    shape?: 'MoA' | 'NestPoints'

    //#TODO - more query params?
}

export interface QueryResponse {
    success: boolean;
    count: number;
    messages?: string;
    params: { paramsIn: object, asParsed: object };
    entries: Entry[]
}

interface CurrentAndDeletedCounts {
    /**
     * undefined means zero
     */
    current: number | undefined,
    /**
     * undefined means zero
     */
    deleted: number | undefined
}

export interface DataStoreOverview {
    storeName?: string;
    defs: CurrentAndDeletedCounts;
    pointDefs: CurrentAndDeletedCounts;
    entries: CurrentAndDeletedCounts;
    entryPoints: CurrentAndDeletedCounts
    tagDefs: CurrentAndDeletedCounts;
    tags: CurrentAndDeletedCounts;
    lastUpdated: EpochStr;
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

    getAll(rawParams: StandardParams): CompleteDataset {
        const params = PDW.sanitizeParams(rawParams)

        let data = {
            defs: this.dataStores[0].getDefs(params),
            pointDefs: this.dataStores[0].getPointDefs(params),
            entries: this.dataStores[0].getEntries(params),
            entryPoints: this.dataStores[0].getEntryPoints(params),
            tagDefs: this.dataStores[0].getTagDefs(params),
            tags: this.dataStores[0].getTags(params),
        }
        return PDW.addOverviewToCompleteDataset(data);
    }

    getDefs(rawParams: StandardParams): Def[] {
        const params = PDW.sanitizeParams(rawParams)

        //if there's only DataStore, bypass the combining stuff to save time
        if (this.dataStores.length == 1) {
            let defLikes = this.dataStores[0].getDefs(params)
            return defLikes.map(dl => new Def(dl));
        }

        //multiple DataStores need to be all pulled, then deconflicted
        let combinedDefs: Def[] = [];
        //compile defs from all attached DataStores
        //#UNTESTED - test this!
        this.dataStores.forEach(dataStore => {
            let thisStoreDefLikes = dataStore.getDefs(params);
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

    getPointDefs(rawParams: StandardParams): Def[] {
        const params = PDW.sanitizeParams(rawParams)

        //if there's only DataStore, bypass the combining stuff to save time
        if (this.dataStores.length == 1) {
            let defLikes = this.dataStores[0].getPointDefs(params)
            return defLikes.map(dl => new Def(dl));
        }

        throw new Error('Multiple stores not implemented yet');
        // //multiple DataStores need to be all pulled, then deconflicted
        // let combinedDefs: Def[] = [];
        // //compile defs from all attached DataStores
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

    getEntries(rawParams: StandardParams): Entry[] {
        const params = PDW.sanitizeParams(rawParams)

        if (this.dataStores.length == 1) {
            let entries = this.dataStores[0].getEntries(params);
            return entries.map(entry => new Entry(entry));
        }

        throw new Error('Multiple datastores not yet implemented');
    }

    getEntryPoints() {
        throw new Error('You did not build this, do you need it?')
    }


    getTagDefs(rawParams: StandardParams): TagDef[] {
        const params = PDW.sanitizeParams(rawParams)

        //if there's only DataStore, bypass the combining stuff to save time
        if (this.dataStores.length == 1) {
            let tagDefLikes = this.dataStores[0].getTagDefs(params)
            return tagDefLikes.map(tdl => new TagDef(tdl));
        }

        throw new Error('Multiple datastores not yet implemented');
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

    setAll(completeDataset: CompleteDataset): CompleteDataset {
        throw new Error("Method not implemented")
    }

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


    /**
     * Enforces defaults. Sanity check some types.
     * Less variability in the output
     * @param params rawParams in
     * @returns santized params out
     */
    static sanitizeParams(params: StandardParams | SanitizedParams): SanitizedParams {
        //ensure default
        if (params.includeDeleted === undefined) params.includeDeleted = 'no';
        //make periods from period srings
        if (params.from !== undefined) {
            if (typeof params.from === 'string') params.from = new Period(params.from);
            //otherwise I guess I'll assume it's okay
        }
        if (params.to !== undefined) {
            if (typeof params.to === 'string') params.to = new Period(params.to);
            //otherwise I guess I'll assume it's okay
        }
        //make Temporal & EpochStr options
        if (params.createdAfter !== undefined) {
            if (typeof params.createdAfter === 'string') {
                params.createdAfter = parseTemporalFromEpochStr(params.createdAfter);
                (<SanitizedParams>params).createdAfterEpochStr = makeEpochStrFromTemporal(params.createdAfter);
            } else {
                (<SanitizedParams>params).createdAfterEpochStr = makeEpochStrFromTemporal(params.createdAfter);
                params.createdAfter = parseTemporalFromEpochStr((<SanitizedParams>params).createdAfterEpochStr!);
            }
        }
        if (params.createdBefore !== undefined) {
            if (typeof params.createdBefore === 'string') {
                params.createdBefore = parseTemporalFromEpochStr(params.createdBefore);
                (<SanitizedParams>params).createdBeforeEpochStr = makeEpochStrFromTemporal(params.createdBefore);
            } else {
                (<SanitizedParams>params).createdBeforeEpochStr = makeEpochStrFromTemporal(params.createdBefore);
                params.createdBefore = parseTemporalFromEpochStr((<SanitizedParams>params).createdBeforeEpochStr!);
            }
        }
        if (params.updatedAfter !== undefined) {
            if (typeof params.updatedAfter === 'string') {
                params.updatedAfter = parseTemporalFromEpochStr(params.updatedAfter);
                (<SanitizedParams>params).updatedAfterEpochStr = makeEpochStrFromTemporal(params.updatedAfter);
            } else {
                (<SanitizedParams>params).updatedAfterEpochStr = makeEpochStrFromTemporal(params.updatedAfter);
                params.updatedAfter = parseTemporalFromEpochStr((<SanitizedParams>params).updatedAfterEpochStr!);
            }
        }
        if (params.updatedBefore !== undefined) {
            if (typeof params.updatedBefore === 'string') {
                params.updatedBefore = parseTemporalFromEpochStr(params.updatedBefore);
                (<SanitizedParams>params).updatedBeforeEpochStr = makeEpochStrFromTemporal(params.updatedBefore);
            } else {
                (<SanitizedParams>params).updatedBeforeEpochStr = makeEpochStrFromTemporal(params.updatedBefore);
                params.updatedBefore = parseTemporalFromEpochStr((<SanitizedParams>params).updatedBeforeEpochStr!);
            }
        }
        //ensure arrays
        if (params.uid !== undefined && typeof params.uid == 'string') params.uid = [params.uid]
        if (params.did !== undefined && typeof params.did == 'string') params.did = [params.did]
        if (params.pid !== undefined && typeof params.pid == 'string') params.pid = [params.pid]
        if (params.eid !== undefined && typeof params.eid == 'string') params.eid = [params.eid]
        if (params.tid !== undefined && typeof params.tid == 'string') params.tid = [params.tid]

        if (params.defLbl !== undefined && typeof params.defLbl == 'string') params.defLbl = [params.defLbl]
        if (params.pointLbl !== undefined && typeof params.pointLbl == 'string') params.pointLbl = [params.pointLbl]
        if (params.tagLbl !== undefined && typeof params.tagLbl == 'string') params.tagLbl = [params.tagLbl]

        if (params.limit !== undefined && typeof params.limit !== "number") {
            console.error('Your params were: ', params)
            throw new Error('You tried to supply a limit param with a non-number.')
        }

        return params as SanitizedParams
    }

    static getDatasetLastUpdate(dataset: CompleteDataset): string {
        let recents: ElementLike[] = [];
        if (dataset.defs !== undefined && dataset.defs.length > 0) recents.push(Element.getMostRecent(dataset.defs)!)
        if (dataset.pointDefs !== undefined && dataset.pointDefs.length > 0) recents.push(Element.getMostRecent(dataset.pointDefs)!)
        if (dataset.entries !== undefined && dataset.entries.length > 0) recents.push(Element.getMostRecent(dataset.entries)!)
        if (dataset.entryPoints !== undefined && dataset.entryPoints.length > 0) recents.push(Element.getMostRecent(dataset.entryPoints)!)
        if (dataset.tagDefs !== undefined && dataset.tagDefs.length > 0) recents.push(Element.getMostRecent(dataset.tagDefs)!)
        if (dataset.tags !== undefined && dataset.tags.length > 0) recents.push(Element.getMostRecent(dataset.tags)!)
        return Element.getMostRecent(recents)!._updated
    }

    static addOverviewToCompleteDataset(data: CompleteDataset, storeName?: string): CompleteDataset {
        if (data.overview !== undefined) {
            console.warn('Tried to add an overview to a dataset that already had one:', data);
            return data
        }
        data.overview = {
            defs: {
                current: data.defs?.filter(element => element._deleted === false).length,
                deleted: data.defs?.filter(element => element._deleted).length
            },
            pointDefs: {
                current: data.pointDefs?.filter(element => element._deleted === false).length,
                deleted: data.pointDefs?.filter(element => element._deleted).length
            },
            entries: {
                current: data.entries?.filter(element => element._deleted === false).length,
                deleted: data.entries?.filter(element => element._deleted).length
            },
            entryPoints: {
                current: data.entryPoints?.filter(element => element._deleted === false).length,
                deleted: data.entryPoints?.filter(element => element._deleted).length
            },
            tagDefs: {
                current: data.tagDefs?.filter(element => element._deleted === false).length,
                deleted: data.tagDefs?.filter(element => element._deleted).length
            },
            tags: {
                current: data.tags?.filter(element => element._deleted === false).length,
                deleted: data.tags?.filter(element => element._deleted).length
            },
            lastUpdated: PDW.getDatasetLastUpdate(data)
        }
        if (storeName) data.overview!.storeName = storeName
        return data
    }
}

/**
 * Base class 
 */
export abstract class Element implements ElementLike {
    _uid: string;
    _deleted: boolean;
    _created: EpochStr;
    _updated: EpochStr;
    _tempCreated: Temporal.ZonedDateTime;
    _tempUpdated: Temporal.ZonedDateTime;
    constructor(inputData: MinimumElement) {
        this._uid = inputData._uid ?? makeUID();
        this._deleted = this.handleDeletedInputVariability(inputData._deleted);
        this._created = this.handleEpochStrInputVariability(inputData._created);
        this._updated = this.handleEpochStrInputVariability(inputData._updated);
        this._tempCreated = parseTemporalFromEpochStr(this._created)
        this._tempUpdated = parseTemporalFromEpochStr(this._updated)
    }

    // extraction & "never nesting" really made this code way more readable... huh
    private handleDeletedInputVariability(deletedVal: any): boolean {
        if (deletedVal === undefined) return false
        if (typeof deletedVal === 'boolean') return deletedVal;
        if (typeof deletedVal === 'string') return (<string>deletedVal).toUpperCase() === 'TRUE';
        if (typeof deletedVal === 'number') return (<number>deletedVal) === 1 ? true : false
        console.warn(`Didn't know how to set '_deleted' based on input. Defaulting to 'false':`, deletedVal);
        return false
    }

    private handleEpochStrInputVariability(inputSeen: any): EpochStr {
        if (inputSeen === undefined) return makeEpochStr();
        if (typeof inputSeen === 'string') {
            if (isValidEpochStr(inputSeen)) return inputSeen;
            //try passing through new Date()'s wide-open interpretations
            return makeEpochStrFromTemporal(Temporal.Instant.fromEpochMilliseconds(new Date(inputSeen).getTime()).toZonedDateTimeISO(Temporal.Now.timeZone()));
        }
        if (typeof inputSeen === 'number') {
            makeEpochStrFromTemporal(Temporal.Instant.fromEpochMilliseconds(inputSeen).toZonedDateTimeISO(Temporal.Now.timeZone()));
        }
        console.warn('Did not know how to handle parsing this date input, defaulting to now:', inputSeen);
        return makeEpochStr();
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
        if (type === 'TagLike') {
            //@ts-expect-error
            if (this._pid === undefined) return this._tid === comparison._tid && this._did === comparison._did;
            //@ts-expect-error
            return this._tid === comparison._tid && this._did === comparison._did && this._pid === comparison._pid;

        }
        //@ts-expect-error
        return this._pid === comparison._pid && this._did === comparison._did;
    }

    sameTypeAs(comparison: ElementLike) {
        return this.getType() === Element.getTypeOfElementLike(comparison);
    }

    passesFilters(params: SanitizedParams) {
        const type = this.getType()!;

        if (params.uid !== undefined && !params.uid.some(uid => uid === this._uid)) return false;
        //@ts-expect-error
        if (params.did !== undefined && this._did !== undefined && !params.did.some(did => did === this._did)) return false;
        //@ts-expect-error
        if (params.eid !== undefined && this._eid !== undefined && !params.eid.some(eid => eid === this._eid)) return false;
        //@ts-expect-error
        if (params.tid !== undefined && this._tid != undefined && !params.tid.some(tid => tid === this._tid)) return false;
        //@ts-expect-error
        if (params.pid !== undefined && this._pid !== undefined && !params.pid.some(pid => pid === this._pid)) return false;

        //@ts-expect-error
        if (params.defLbl !== undefined && type === 'DefLike' && !params.defLbl.some(lbl => lbl === this._lbl)) return false;
        //@ts-expect-error
        if (params.tagLbl !== undefined && type.substring(0, 3) === 'Tag' && !params.tagLbl.some(lbl => lbl === this._lbl)) return false;
        //@ts-expect-error
        if (params.pointLbl !== undefined && type === 'PointDefLike' && !params.pointLbl.some(lbl => lbl === this._lbl)) return false;
        if (params.pointLbl !== undefined && type === 'EntryPointLike') {
            const assPointDef = PDW.getInstance().getPointDefs({ pointLbl: params.pointLbl });
            if (!assPointDef.some(pd => pd._deleted !== true && params.pointLbl?.includes(pd._lbl))) return false;
        }

        // I don't **THINK** I should ever need the native Temporal compare here? It works, but... sanitized params should always have the epochstr
        // if (params.createdBefore !== undefined && Temporal.ZonedDateTime.compare(params.createdBefore, this._tempCreated) === -1) return false;
        // if (params.createdAfter !== undefined && Temporal.ZonedDateTime.compare(params.createdAfter, this._tempCreated) === 1) return false;
        if (params.createdBeforeEpochStr !== undefined && params.createdBeforeEpochStr < this._created) return false;
        if (params.createdAfterEpochStr !== undefined && params.createdAfterEpochStr > this._created) return false;

        // if (params.updatedBefore !== undefined && Temporal.ZonedDateTime.compare(params.updatedBefore, this._tempUpdated) === -1) return false;
        // if (params.updatedAfter !== undefined && Temporal.ZonedDateTime.compare(params.updatedAfter, this._tempUpdated) === 1) return false;
        if (params.updatedBeforeEpochStr !== undefined && params.updatedBeforeEpochStr < this._updated) return false;
        if (params.updatedAfterEpochStr !== undefined && params.updatedAfterEpochStr > this._updated) return false;

        if (params.includeDeleted === 'no' && this._deleted === true) return false;
        if (params.includeDeleted === 'only' && this._deleted === false) return false;

        return true;
    }

    //#TODO - fallsInPeriod(period: Period): boolean

    private static getTypeOfElementLike(data: ElementLike) {
        if (data.hasOwnProperty("_tid") && data.hasOwnProperty('_did')) return "TagLike"
        if (data.hasOwnProperty("_tid")) return "TagDefLike"
        if (data.hasOwnProperty("_eid") && data.hasOwnProperty('_pid')) return "EntryPointLike"
        if (data.hasOwnProperty("_eid")) return "EntryLike"
        if (data.hasOwnProperty("_did") && data.hasOwnProperty('_pid')) return "PointDefLike"
        if (data.hasOwnProperty("_did")) return "DefLike"
        return null
    }

    /**
     * Analyzes an object and tries to find one UNDELETED Element that
     * has the same Xid(s). Does not look at UIDs or Labels.
     * @param dataIn an object that may be part of an existing Element
     * @param ofType optional, allows you to override what the dataIn would suggest it should be
     * @returns the raw DefLike, PointDefLike, EntryLike, EntryPointLike, TagLike, or TagDefLike - or undefined if none found
     */
    static findExistingData(dataIn: any, ofType?: 'Def' | 'PointDef' | 'Entry' | 'EntryPoint' | 'TagDef' | 'Tag'): any {
        const type = ofType === undefined ? Element.getTypeOfElementLike(dataIn) : ofType + 'Like';
        if (type === null) return undefined;

        let pdwRef = PDW.getInstance();
        let existing: any;
        if (type === 'DefLike') {
            pdwRef.dataStores.forEach(store => {
                let storeResult = maybeGetOnlyResult(store.getDefs({ did: [dataIn._did], includeDeleted: 'no' }));
                if (storeResult !== undefined && existing === undefined) existing = storeResult as DefLike
            })
        }
        if (type === 'PointDefLike') {
            pdwRef.dataStores.forEach(store => {
                let storeResult = maybeGetOnlyResult(store.getPointDefs({ pid: [dataIn._pid], did: [dataIn._did], includeDeleted: 'no' }));
                if (storeResult === undefined) storeResult = maybeGetOnlyResult(store.getPointDefs({ pointLbl: [dataIn._lbl], did: [dataIn._did], includeDeleted: 'no' }));
                if (storeResult !== undefined && existing === undefined) existing = storeResult as PointDefLike
            })
        }
        if (type === 'EntryLike') {
            pdwRef.dataStores.forEach(store => {
                let storeResult = maybeGetOnlyResult(store.getEntries({ eid: [dataIn._eid], includeDeleted: 'no' }));
                if (storeResult !== undefined && existing === undefined) existing = storeResult as EntryLike
            })
        }
        if (type === 'EntryPointLike') {
            pdwRef.dataStores.forEach(store => {
                const pidOrLbl = dataIn._pid ?? dataIn._lbl
                let storeResult = maybeGetOnlyResult(store.getEntryPoints({ pid: [dataIn._pid], eid: [dataIn._eid], includeDeleted: 'no' }));
                if (storeResult !== undefined && existing === undefined) existing = storeResult as EntryPointLike
            })
        }
        if (type === 'TagDefLike') {
            pdwRef.dataStores.forEach(store => {
                let storeResult = maybeGetOnlyResult(store.getTagDefs({ tid: [dataIn._tid], includeDeleted: 'no' }));
                if (storeResult !== undefined && existing === undefined) existing = storeResult as TagDefLike
            })
        }
        if (type === 'TagLike') {
            pdwRef.dataStores.forEach(store => {
                let storeResult
                if (dataIn._pid === undefined) storeResult = maybeGetOnlyResult(store.getTags({ did: [dataIn._did], tid: [dataIn._tid], includeDeleted: 'no' }));
                if (dataIn._pid !== undefined) storeResult = maybeGetOnlyResult(store.getTags({ did: [dataIn._did], tid: [dataIn._tid], pid: [dataIn._pid], includeDeleted: 'no' }));
                if (storeResult !== undefined && existing === undefined) existing = storeResult as TagDefLike
            })
        }
        return existing;
    }

    public static getMostRecent(elementArr: ElementLike[]): ElementLike | undefined {
        if (elementArr.length == 0) {
            console.warn('You tried to get the most recent of a list of zero elements');
            return undefined
        }
        let mostRecent: ElementLike = {
            _uid: '',
            _deleted: true,
            _created: '',
            _updated: '0' // earlier than anything before 12/31/1969, 6:00:00 PM CST
        }
        elementArr.forEach(element => {
            if (element._updated > mostRecent._updated) mostRecent = element
        })
        return mostRecent
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
            let pds = pdwRef.dataStores[0].getPointDefs({ did: [this._did], includeDeleted: includeDeleted ? 'yes' : 'no' })
            return pds.map(pointDef => new PointDef(pointDef));
        }

        throw new Error('Multiple Data Stores are #TODO') //#TODO - for multiple data stores
    }

    /**
    * Predicate to check if an object has all {@link DefLike} properties
    * AND they are the right type.
    * @param data data to check
    * @returns true if data have all required properties of {@link DefLike}
    */
    static isDefLike(data: any): boolean {
        if (typeof data._did !== 'string') return false
        if (typeof data._lbl !== 'string') return false
        if (typeof data._desc !== 'string') return false
        if (typeof data._emoji !== 'string') return false
        if (data._scope == undefined || !this.isValidScope(data._scope)) return false
        if (typeof data._uid !== 'string') return false
        if (typeof data._created !== 'string') return false
        if (typeof data._deleted !== 'boolean') return false
        if (typeof data._updated !== 'string') return false
        return true;
    }

    static isValidScope(typeStr: string): boolean {
        const values = Object.values(Scope);
        return values.includes(typeStr as unknown as Scope)
    }

    //#TODO - implement an 'addTag() method
    //#TODO - and a 'removeTag() method, for that matter
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
        if (typeof data._did !== 'string') return false
        if (typeof data._pid !== 'string') return false
        if (typeof data._lbl !== 'string') return false
        if (typeof data._desc !== 'string') return false
        if (typeof data._emoji !== 'string') return false
        if (data._type == undefined || !PointDef.isValidType(data._type)) return false
        if (data._rollup == undefined || !PointDef.isValidRollup(data._rollup)) return false
        if (typeof data._uid !== 'string') return false
        if (typeof data._created !== 'string') return false
        if (typeof data._deleted !== 'boolean') return false
        if (typeof data._updated !== 'string') return false
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
    _source: string;
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
                if (entryData._source === undefined) entryData._source = existing._source;
            }
        }
        super(entryData);
        let relatedDef: Def | undefined;
        if (entryData._did !== undefined) relatedDef = maybeGetOnlyResult(PDW.getInstance().getDefs({ did: [entryData._did!], includeDeleted: 'no' })) as Def;
        if (entryData._did === undefined) true == true
        if (relatedDef === undefined)
            throw new Error('No def found for ' + entryData._did);
        this._did = entryData._did!;
        if (entryData._period !== undefined) {
            this._period = entryData._period;
        } else {
            this._period = Period.now((<Def>relatedDef)._scope);
        }
        this._eid = entryData._eid ?? makeUID();
        this._note = entryData._note ?? '';
        this._source = entryData._source ?? '';
        //spawn new EntryPoints for any non-underscore-prefixed keys
        let pointKey = Object.keys(entryData).filter(key => key.substring(0, 1) !== '_');
        if (pointKey.length > 0) {
            let entryPoints: MinimumEntryPoint[] = pointKey.map(pid => {
                //needing to find associated PointDef to support using the _lbl as the key
                let assPointDef
                //checking first for pointKey is a _pid
                //making SmallID here to avoid hardcoding the length to "4"
                if (pid.length === makeSmallID().length) assPointDef = EntryPoint.findExistingData({ _did: this._did, _pid: pid });
                //checking for if pointKey is a _lbl
                if (assPointDef === undefined) assPointDef = EntryPoint.findExistingData({ _did: this._did, _lbl: pid, _pid: undefined })
                if (assPointDef === undefined) {
                    console.error("Couldn't find associated pointDef for '" + pid + '".', entryData);
                    throw new Error('Error creating Entry. :-(');
                }
                return {
                    _pid: assPointDef._pid,
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

    /**
    * Predicate to check if an object has all {@link EntryLike} properties
    * AND they are the right type.
    * @param data data to check
    * @returns true if data have all required properties of {@link DefLike}
    */
    static isEntryLike(data: any): boolean {
        if (typeof data._did !== 'string') return false
        if (typeof data._eid !== 'string') return false
        if (typeof data._note !== 'string') return false
        if (typeof data._period !== 'string') return false
        if (typeof data._uid !== 'string') return false
        if (typeof data._created !== 'string') return false
        if (typeof data._deleted !== 'boolean') return false
        if (typeof data._updated !== 'string') return false
        if (typeof data._source !== 'string') return false
        return true;
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
    constructor(entryPointData: MinimumEntryPoint, associatedDef?: PointDef) {
        if (entryPointData._eid !== undefined) {
            let existing = Element.findExistingData(entryPointData);
            if (existing !== undefined) {
                if (entryPointData._created === undefined) entryPointData._created = existing._created;
                if (entryPointData._did === undefined) entryPointData._did = existing._did;
            }
        }
        if (associatedDef === undefined) associatedDef = PointDef.findExistingData(entryPointData, 'PointDef');
        if (associatedDef === undefined) { // throw new Error('No definition associated with supplied EntryPoint data')
            PointDef.findExistingData(entryPointData, 'PointDef');
            throw new Error('No definition associated with supplied EntryPoint data')
        }

        //for now, just letting that function throw warnings to the console
        let correctType: any = EntryPoint.ensureValType(entryPointData._val, associatedDef._type);
        if (correctType === undefined) correctType = entryPointData._val; //for now passing thru bad data

        super(entryPointData);
        this._eid = entryPointData._eid;
        this._pid = entryPointData._pid;
        this._val = correctType;
        this._did = associatedDef._did!; //I *think* this will always be not undefined
    }

    /**
     * Attempts to intercept poorly-typed values and convert them if possible.
     * If conversion isn't possible, returns undefined and logs to console.warn
     * @param _val value to check
     * @param _type type to attempt to convert to
     * @returns correctly-typed _val, or undefined if _val cannot be converted
     */
    static ensureValType(_val: string | number | boolean | object, _type: PointType) {
        if (_type === PointType.BOOL) {
            if (typeof _val === 'boolean') return _val;
            if (typeof _val === 'string') return _val.toUpperCase() === 'TRUE';
            if (typeof _val === "number") return _val !== 0;
            console.warn(`Cannot convert this to boolean:`, _val)
            return undefined;
        }
        if (_type === PointType.DURATION) {
            if (typeof _val === 'string') return _val;
            //if (typeof _val === "number") return _val !== 0; //number of seconds? millseconds?
            console.warn(`Cannot convert this to duration:`, _val)
            return undefined;
        }
        if (_type === PointType.FILE) {
            if (typeof _val === 'string') return _val;
            console.warn(`Cannot convert this to file:`, _val)
            return undefined;
        }
        if (_type === PointType.MARKDOWN) {
            if (typeof _val === 'boolean') return _val.toString();
            if (typeof _val === 'string') return _val;
            if (typeof _val === "number") return _val.toString();
            console.warn(`Cannot convert this to markdown:`, _val)
            return undefined;
        }
        if (_type === PointType.MULTISELECT) {
            if (Array.isArray(_val)) return _val.join(', ');
            if (typeof _val === 'string') return _val;
            console.warn(`Cannot convert this to multiselect:`, _val)
            return undefined;
        }
        if (_type === PointType.NUMBER) {
            if (typeof _val === 'boolean') return _val ? 1 : 0;
            if (typeof _val === 'string') return Number.parseInt(_val);
            if (typeof _val === "number") return _val;
            console.warn(`Cannot convert this to number:`, _val)
            return undefined;
        }
        if (_type === PointType.PHOTO) {
            if (typeof _val === 'string') return _val;
            console.warn(`Cannot convert this to PHOTO:`, _val)
            return undefined;
        }
        if (_type === PointType.SELECT) {
            if (typeof _val === 'string') return _val;
            console.warn(`Cannot convert this to select:`, _val)
            return undefined;
        }
        if (_type === PointType.TEXT) {
            if (typeof _val === 'boolean') return _val.toString();
            if (typeof _val === 'string') return _val.trim();
            if (typeof _val === "number") return _val.toString();
            return _val.toString();
        }
        if (_type === PointType.TIME) {
            if (typeof _val === 'string') return _val.trim();
            if (typeof _val === "number" && _val >= 0 && _val <= 1) {
                //attempt to support "proportion of day to time" like Excel would
                return new Temporal.PlainTime(0, 0).add({ seconds: 86400 * _val }).toString();
            }
            console.warn(`Cannot convert this to time:`, _val)
            return undefined;
        }
        throw new Error("Method not implemented.");
    }

    static isEntryPointLike(data: any): boolean {
        if (typeof data._uid !== 'string') return false
        if (typeof data._created !== 'string') return false
        if (typeof data._updated !== 'string') return false
        if (typeof data._deleted !== 'boolean') return false
        if (typeof data._did !== 'string') return false
        if (typeof data._pid !== 'string') return false
        if (typeof data._eid !== 'string') return false
        if (data._val === undefined) return false
        return true;
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

    static isTagDefLike(data: any): boolean {
        if (typeof data._uid !== 'string') return false
        if (typeof data._created !== 'string') return false
        if (typeof data._updated !== 'string') return false
        if (typeof data._deleted !== 'boolean') return false
        if (typeof data._tid !== 'string') return false
        if (typeof data._lbl !== 'string') return false
        return true;
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

    static isTagLike(data: any): boolean {
        if (typeof data._uid !== 'string') return false
        if (typeof data._created !== 'string') return false
        if (typeof data._updated !== 'string') return false
        if (typeof data._deleted !== 'boolean') return false
        if (typeof data._did !== 'string') return false
        if (typeof data._tid !== 'string') return false
        return true;
    }
}

/**
 * Periods are Immutable. All methods return new copies of Period.
 * They are basically wrappers around a string.
 */
export class Period {
    periodStr: string;
    scope: Scope;
    private _zoomLevel: number

    constructor(periodStr: PeriodStr | Period, desiredScope?: Scope) {
        if (typeof periodStr !== 'string') periodStr = periodStr.periodStr;
        this.periodStr = periodStr;
        this.scope = Period.inferScope(periodStr);
        this._zoomLevel = Period.zoomLevel(this.scope)

        if (desiredScope !== undefined && this.scope !== desiredScope) {
            console.log('Converting ' + periodStr + ' to scope ' + desiredScope);
            return this.zoomTo(desiredScope);
        }
    }

    private static zoomLevel(scope: Scope): number {
        return [
            Scope.SECOND,
            Scope.MINUTE,
            Scope.HOUR,
            Scope.DAY,
            Scope.WEEK,
            Scope.MONTH,
            Scope.QUARTER,
            Scope.YEAR
        ].findIndex(val => val === scope)
    }

    /**
     * Yay overriding default Object prototype methods!
     * @returns periodStr
     */
    toString() {
        return this.periodStr;
    }

    getEnd(): Period {
        if (this.scope === Scope.SECOND) return new Period(this.periodStr);
        if (this.scope === Scope.MINUTE) return new Period(this.periodStr + ':59');
        if (this.scope === Scope.HOUR) return new Period(this.periodStr + ':59:59');
        if (this.scope === Scope.DAY) return new Period(this.periodStr + 'T23:59:59');

        if (this.scope === Scope.WEEK) {
            let numWks = Number.parseInt(this.periodStr.split('W')[1])-1;
            //if the previous year had 53 weeks, this is necessary
            if(Period.prevYearHas53Weeks(this.periodStr.substring(0,4))) numWks = numWks + 1
            let init = Temporal.PlainDate.from(this.periodStr.split('-')[0] + '01-01')
            
            let sun = init.add({ days: 7 - init.dayOfWeek })
            sun = sun.add({ days: numWks * 7 });
            return new Period(sun.toString() + 'T23:59:59')
            
        }
        if (this.scope === Scope.MONTH){
            let lastDay = Temporal.PlainDate.from(this.periodStr+'-01').daysInMonth;
            return new Period(this.periodStr + '-' + lastDay.toString() + 'T23:59:59')
        }
        if (this.scope === Scope.QUARTER){
            const year = this.periodStr.substring(0,4)
            const q = Number.parseInt(this.periodStr.slice(-1));
            const month = q * 3
            const d =  Temporal.PlainDate.from(year+'-'+month.toString().padStart(2,'0')+'-01').daysInMonth;
            return new Period(year+'-'+month.toString().padStart(2,'0')+'-'+d+'T23:59:59')
        }
        return new Period(this.periodStr + "-12-31T23:59:59")
    }

    /**
     * 
     * @returns the first second of the period (e.g. 2020-01-01T00:00:00)
     */
    getStart(): Period{
        if(this._zoomLevel === 0) return new Period(this);
        if(this.scope === Scope.YEAR) return new Period(this.toString() + '-01-01T00:00:00')
        if(this.scope === Scope.QUARTER) return new Period(this.zoomIn() + '-01T00:00:00')
        if(this.scope === Scope.MONTH) return new Period(this.toString() + '-01T00:00:00')
        //above preempts week, cause it's not purely hierarchical,
        //from here you can just "zoomIn" to the beginning of the period
        let per = this.zoomIn();
        while(per._zoomLevel !== 0){
            per = per.zoomIn()
        }
        return per;
    }

    /**
     * 
     */
    zoomTo(desiredScope: Scope): Period {
        const desiredLevel = Period.zoomLevel(desiredScope);
        if(this._zoomLevel === desiredLevel) return new Period(this);
        if(this._zoomLevel < desiredLevel){
            let zoomOut = this.zoomOut()
            while(zoomOut._zoomLevel < desiredLevel){
                //need to bypass weeks
                if(desiredLevel !== 4 && zoomOut._zoomLevel === 3){
                    zoomOut = new Period(zoomOut.periodStr.substring(0,7))
                }else{
                    zoomOut = zoomOut.zoomOut()
                }
            }
            return zoomOut;
        }
            let zoomIn = this.zoomIn()
            while(zoomIn._zoomLevel > desiredLevel){
                if(desiredLevel !== 4 && zoomIn._zoomLevel === 5){
                    zoomIn = new Period(zoomIn.periodStr+'-01')
                }else{
                    zoomIn = zoomIn.zoomIn()
                }
            }
            return zoomIn;
    }

    /**
     * Zooms in on the BEGINNING (?) of the Period
     * @returns the next level finer-grain scope at the beginning of this scope
     */
    zoomIn(): Period {
        if (this.scope === Scope.YEAR) return new Period(this.periodStr + '-Q1');
        if (this.scope === Scope.QUARTER) {
            const year = this.periodStr.substring(0, 4);
            const month = Number.parseInt(this.periodStr.slice(-1)) * 3 - 2
            return new Period(year + '-' + month.toString().padStart(2, '0'));
        }
        if (this.scope === Scope.MONTH) {
            const temp = Temporal.PlainDate.from(this.periodStr + "-01")
            let year = temp.year;
            if (temp.weekOfYear > 50 && temp.dayOfYear < 14) year = year - 1;
            if (temp.weekOfYear == 1 && temp.dayOfYear > 360) year = year + 1
            const weekNum = temp.weekOfYear
            return new Period(year + "-W" + weekNum.toString().padStart(2, '0'));
        }
        if (this.scope === Scope.WEEK) {
            let numWks = Number.parseInt(this.periodStr.split('W')[1])-1;
            //if the previous year had 53 weeks, this is necessary
            if(Period.prevYearHas53Weeks(this.periodStr.substring(0,4))) numWks = numWks + 1
            let init = Temporal.PlainDate.from(this.periodStr.split('-')[0] + '01-01')
            let mon = init.add({ days: 1 - init.dayOfWeek }).add({ days: numWks * 7 })
            return new Period(mon.toString());
        }
        if (this.scope === Scope.DAY) return new Period(this.periodStr + "T00")
        if (this.scope === Scope.HOUR) return new Period(this.periodStr + ":00")
        if (this.scope === Scope.MINUTE) return new Period(this.periodStr + ":00")
        //zooming in from a second returns itself
        return new Period(this.periodStr)
    }

    zoomOut(): Period {
        if (this.scope === Scope.SECOND) return new Period(this.periodStr.slice(0, -3));
        if (this.scope === Scope.MINUTE) return new Period(this.periodStr.slice(0, -3));
        if (this.scope === Scope.HOUR) return new Period(this.periodStr.slice(0, -3));
        if (this.scope === Scope.DAY) {
            const temp = Temporal.PlainDateTime.from(this.periodStr);
            //catching edge cases like 2019-12-31 => 2020-W01 & 2023-01-01 => 2022-W52
            let year = temp.year;
            if (temp.weekOfYear > 50 && temp.dayOfYear < 14) year = year - 1;
            if (temp.weekOfYear == 1 && temp.dayOfYear > 360) year = year + 1
            return new Period(year + "-W" + temp.weekOfYear.toString().padStart(2, '0'));
        }
        if (this.scope === Scope.WEEK) {
            //weeks zooming out resolve to whichever month contains the THURSDAY of the week
            let numWks = Number.parseInt(this.periodStr.split('W')[1])-1;
            //if the previous year had 53 weeks, this is necessary
            if(Period.prevYearHas53Weeks(this.periodStr.substring(0,4))) numWks = numWks + 1
            let init = Temporal.PlainDate.from(this.periodStr.split('-')[0] + '01-01')
            let thur = init.add({ days: 4 - init.dayOfWeek }).add({ days: numWks * 7 })
            return new Period(thur.toPlainYearMonth().toString());
        }
        if (this.scope === Scope.MONTH) {
            let yearStr = this.periodStr.split('-')[0];
            let month = Number.parseInt(this.periodStr.split('-')[1]);
            let quarterStr = Math.ceil(month / 3).toString();
            return new Period(yearStr + '-Q' + quarterStr);
        }
        // else is a Scope.QUARTER or Scope.YEAR, I think I'm goign to let Scope.YEAR return itself
        return new Period(this.periodStr.substring(0, 4))
    }

    addDuration(temporalDurationStr: string): Period{
        const startTemp = Temporal.PlainDateTime.from(this.getStart().periodStr);
        const endTemp = startTemp.add(temporalDurationStr);
        return new Period(endTemp.toString()).zoomTo(this.scope);
    }

    contains(period: Period): boolean{
        const inBegin = Temporal.PlainDateTime.from(period.getStart().periodStr)
        const inEnd = Temporal.PlainDateTime.from(period.getEnd().periodStr)
        const thisBegin = Temporal.PlainDateTime.from(this.getStart().periodStr);
        const thisEnd = Temporal.PlainDateTime.from(this.getEnd().periodStr);
        const start = Temporal.PlainDateTime.compare(inBegin, thisBegin);
        const end = Temporal.PlainDateTime.compare(thisEnd,inEnd);
        return start !== -1 && end !== -1
    }
        
    // I can't believe I was able to reduce these to a 1 liner
    getNext(): Period{
        let start = this.getStart();
        let end = this.getEnd();
        let plusOne = end.addDuration('PT1S');
        let zoomed = plusOne.zoomTo(this.scope);
        return this.getEnd().addDuration('PT1S').zoomTo(this.scope);
        
    }
    getPrev(): Period{
        return this.getStart().addDuration('-PT1S').zoomTo(this.scope);
    }

    private static prevYearHas53Weeks(yearStr: string):boolean{
        const prevYear = Number.parseInt(yearStr)-1;
        return Temporal.PlainDate.from(prevYear + '-12-31').weekOfYear == 53;
        
    }

    static allPeriodsBetween(start: Period, end: Period, scope: Scope, asStrings = false): Period[] | string[]{
        if(Temporal.PlainDateTime.compare(Temporal.PlainDateTime.from(start.getStart().periodStr), Temporal.PlainDateTime.from(end.getStart().periodStr)) === 1){
            console.warn('You may have flipped your start and end dates accidentally... or something')
            const temp = start; 
            start = end;
            end = temp;            
        }
        const startOfStart = start.getStart().periodStr;
        const endOfEnd = end.getEnd().periodStr;
        let first, last, list: any[];
        first = start.zoomTo(scope);
        last = end.getNext().zoomTo(Scope.SECOND).addDuration('-PT1S').zoomTo(scope);

        let member = first;
        list = [];
        if(asStrings){
            do{
                // list.push({[member.periodStr]: {from: member.getStart().toString(), to: member.getEnd().toString()}});
                list.push(member.periodStr);
                member = member.getNext();
            }while(member.periodStr <= last.periodStr)
            return list as string[]
        }else{
            do{
                list.push(member);
                member = member.getNext();
                
            }while(member.periodStr <= last.periodStr)
            return list as Period[]
        }
    }

    //#TODO - enable Periods to query for Entries
    //getEntriesInPeriodMatchingFilter(params: StandardFilters): Element[]

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
        // /https://xkcd.com/208/
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
    //#TODO - build Query Class
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

    getAll(params: SanitizedParams): CompleteDataset {
        return {
            defs: this.getDefs(params),
            pointDefs: this.getPointDefs(params),
            entries: this.getEntries(params),
            entryPoints: this.getEntryPoints(params),
            tagDefs: this.getTagDefs(params),
            tags: this.getTags(params),
        }
    }

    getDefs(params: SanitizedParams): DefLike[] {
        const allMatches = this.defs.filter(def => def.passesFilters(params));
        let noDupes = new Set(allMatches);
        return Array.from(noDupes)
    }

    getPointDefs(params: SanitizedParams): PointDefLike[] {

        const allMatches = this.pointDefs.filter(pd => pd.passesFilters(params));
        let noDupes = new Set(allMatches);
        return Array.from(noDupes);
    }

    /**
     * For pulling entries that you know the eid of
     * @param eids 
     * @param includeDeleted 
     * @returns an array of all entries matching the criteria
     */
    getEntries(params: SanitizedParams): EntryLike[] {
        const allMatches = this.entries.filter(entry => entry.passesFilters(params));
        let noDupes = new Set(allMatches);
        return Array.from(noDupes);
    }

    getEntryPoints(params: SanitizedParams): EntryPointLike[] {
        const allMatches = this.entryPoints.filter(entryPoint => entryPoint.passesFilters(params));
        let noDupes = new Set(allMatches);
        return Array.from(noDupes);
    }

    getTags(params: SanitizedParams): TagLike[] {
        const allMatches = this.tags.filter(tag => tag.passesFilters(params));
        let noDupes = new Set(allMatches);
        return Array.from(noDupes);
    }

    getTagDefs(params: SanitizedParams): TagDefLike[] {

        const allMatches = this.tagDefs.filter(tagDef => tagDef.passesFilters(params));
        let noDupes = new Set(allMatches);
        return Array.from(noDupes);
    }

    /**
     * This function is a bit strange, but was extracted from
     * the 6 functions below, which were duplicates code-wise
     * @param elementsIn list of Elements (Defs, Entries, etc) to set
     * @param elementRepo the existing set of Elements in the DataStore (this.defs, this.entries, etc)
     */
    setElementsInRepo(elementsIn: Element[], elementRepo: Element[]) {
        let newElements: Element[] = [];
        elementsIn.forEach(el => {
            let existing = elementRepo.find(existingElement => existingElement._deleted === false && existingElement.sameIdAs(el))
            if (existing !== undefined) {
                //only replace if the setDefs def is newer, necessary for StorageConnector merges
                if (existing.shouldBeReplacedWith(el)) {
                    existing.markDeleted();
                    if (!el._deleted) newElements.push(el) //don't duplicate in case of calling setElement purely to delete
                }
            } else {
                newElements.push(el)
            }
        })
        elementRepo.push(...newElements)
        return elementsIn;
    }

    setDefs(defsIn: Def[]): Def[] {
        return this.setElementsInRepo(defsIn, this.defs) as Def[]
        // let newDefs: Def[] = [];
        // //mark any old defs as deleted
        // defsIn.forEach(def => {
        //     let existingDef = this.defs.find(existing => existing.sameIdAs(def) && existing._deleted === false);
        //     if (existingDef !== undefined) {
        //         //only replace if the setDefs def is newer, necessary for StorageConnector merges
        //         if (existingDef.shouldBeReplacedWith(def)) {
        //             existingDef.markDeleted();
        //             if (!def._deleted) newDefs.push(def) //don't duplicate in case of calling setDefs purely to delete
        //         }
        //     } else {
        //         newDefs.push(def);
        //     }
        // })
        // //merge newDefs with defs in the DataStore
        // this.defs.push(...newDefs);
        // return defsIn;
    }

    setPointDefs(pointDefsIn: PointDef[]) {
        return this.setElementsInRepo(pointDefsIn, this.pointDefs) as PointDef[]
    }

    setEntries(entriesIn: Entry[]): Entry[] {
        return this.setElementsInRepo(entriesIn, this.entries) as Entry[]
    }

    setEntryPoints(entryPointData: EntryPoint[]): EntryPoint[] {
        return this.setElementsInRepo(entryPointData, this.entryPoints) as EntryPoint[]
    }

    setTags(tagData: Tag[]): TagLike[] {
        return this.setElementsInRepo(tagData, this.tags) as Tag[]
    }

    setTagDefs(tagDefsIn: TagDef[]): TagDefLike[] {
        return this.setElementsInRepo(tagDefsIn, this.tagDefs) as TagDef[]
    }

    getOverview(): DataStoreOverview {
        throw new Error("Method not implemented.");
    }

    setAll(completeData: CompleteDataset): CompleteDataset {
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
    return Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString(36)
}

export function makeSmallID(length = 4): SmallID {
    return Math.random().toString(36).slice(13 - length).padStart(length, "0")
}

export function parseTemporalFromUid(uid: UID): Temporal.ZonedDateTime {
    return parseTemporalFromEpochStr(uid.split("-")[0]);
}

export function makeEpochStrFromTemporal(temp: Temporal.ZonedDateTime): EpochStr {
    return temp.epochMilliseconds.toString(36);
}

export function isValidEpochStr(epochStr: string): boolean {
    if (typeof epochStr !== 'string') return false;
    if (epochStr.length !== 8) return false; //not supporting way in the past or future
    //☝️ technically creates a 2059 problem... but that's my problem when I'm 2x as old as I am now
    //console.log(parseTemporalFromEpochStr('zzzzzzz').toLocaleString()) //is "6/25/1972, 6:49:24 PM CDT"
    //console.log(parseTemporalFromEpochStr('100000000').toLocaleString()) //is "5/25/2059, 12:38:27 PM CDT"
    //for now this is good enough. I could parse a temporal out then check if it succeed & is in a resonable year, but meh
    return true
}

export function parseTemporalFromEpochStr(epochStr: EpochStr): Temporal.ZonedDateTime {
    const epochMillis = parseInt(epochStr, 36)
    const parsedTemporal = Temporal.Instant.fromEpochMilliseconds(epochMillis).toZonedDateTimeISO(Temporal.Now.timeZone());
    if (parsedTemporal.epochSeconds == 0) throw new Error('Unable to parse temporal from ' + epochStr)
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
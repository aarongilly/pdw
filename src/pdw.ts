import { Temporal } from "temporal-polyfill";
import { DefaultDataStore } from "./DefaultDataStore.js";

//#region ### TYPES ###

/**
 * A alias for string, implying one with the structure of:
 * {@link EpochStr}-{@link SmallID}
 */
export type UID = string;

/**
 * A alias for string, a string of 4 random characters
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
 * A alias for string, any valid Period.stringify string
 */
export type PeriodStr = string;

/**
 * An alias for string, intended to be markdown-enabled in use
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
    /**
     * Essentially an enumeration
     */
    SELECT = 'SELECT',
    /**
     * true or false
     */
    BOOL = 'BOOL', //true false
    /**
     * A Temporal Duration string, starting with the 'P' to really ensure no ambiguity
     */
    DURATION = 'DURATION',
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
    /**
     * Literally JSON
     */
    JSON = 'JSON'
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
    AVERAGEABOUT430AM = 'AVERAGEABOUT430AM' //for type =  TYPE.TIME
}

//#endregion

//#region ### INTERFACES ###

/**
 * The `DataStore` interface is what you must implement when creating code to
 * hook up a new database. It is what sits between the data store of choice and the PDW.
 * It's designed to be as simple-to-implement as possible.
 * 
 * The parameter sanitization & merge logic are handled by the PDW.
 * 
 * It's *very much* a work in progress.
 */
export interface DataStore {

    getDefs(params: SanitizedParams): DefLike[];

    getEntries(params: SanitizedParams): EntryLike[];

    getTags(params: SanitizedParams): TagLike[];

    getAll(params: SanitizedParams): CompleteDataset;



    setDefs(defs: Def[]): Def[];

    setEntries(entries: Entry[]): Entry[];

    setTags(tagData: Tag[]): TagLike[];

    setAll(completeDataset: CompleteDataset): CompleteDataset;



    query(params: SanitizedParams): QueryResponse;

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
 * Basic data filtering parameters, supported by the {@link PDW} methods for
 * {@link getDefs} & the 5 other element "getters". The {@link DataStore} methods
 * will get {@link SanitizedParams} passed to them by the PDW methods, which will
 * perform the sanitization.
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
    uid?: UID[] | UID,
    did?: SmallID[] | SmallID,
    pid?: SmallID[] | SmallID,
    eid?: UID[] | UID,
    tid?: SmallID[] | SmallID,
    defLbl?: string[] | string,
    pointLbl?: string[] | string,
    tagLbl?: string[] | string,
    limit?: number,
    allOnPurpose?: boolean
}

/**
 * A more tightly-controlled version of the {@link StandardParams}, meant to make
 * development of any new {@link DataStore} easier to implement. SanitizedParams are
 * what DataStore versions of the main setter/getter functions respond to.  
 */
export interface SanitizedParams {
    /**
     * yes - excludes deleted stuff
     * no - returns deleted & undeleted stuff
     * only - returns **only** deleted stuff
     */
    includeDeleted: 'yes' | 'no' | 'only',

    /**
     * For entries and entryPoints only.
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
    entries?: EntryLike[];
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
    _uid?: UID;
    /**
     * Was the element marked as deleted?
     * For things like "_did" or "_pid", "_tid", you may have multiple
     * instances with the same value, but you'll tell them apart using
     * the _uid --- and only **one** will have _deleted == false
     */
    _deleted?: boolean;
    /**
     * When the element was created
     */
    _created?: EpochStr;
    /**
     * When the element was updated, usually lines up with "_created"
     * unless the instance of the element was created via updating a 
     * previous instance
     */
    _updated?: EpochStr;
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
    _did?: string;
    /**
     * The label for the definition
     */
    _lbl?: string;
    /**
     * A text string describing what the definition is for
     */
    _desc?: string;
    /**
     * A shorthand for the definition
     */
    _emoji?: string;
    /**
     * Scope of the definition (e.g. "day", "week"...)
     */
    _scope?: Scope;
    /**
     * The points on the definition
     */
    _pts?: PointDefLike[];
}

export interface PointDefLike {
    /**
     * Point Definition ID.
     */
    _pid?: SmallID
    /**
    * Label for the point
    */
    _lbl?: string;
    /**
    * Point description
    */
    _desc?: string;
    /**
     * Shorthand for the point in the UI
     */
    _emoji?: string;
    /**
    * Point type
    */
    _type?: PointType;
    /**
     * Default rollup type
     */
    _rollup?: Rollup;
    /**
     * PointDefs cannot be *deleted*, only deactivated
     */
    _active?: boolean;
    /**
     * Select & Multiselect options. Associated with a {@link Tag} '_tid.
     * An array of _tid
     */
    _opts?: OptMap;
    
    /**
     * Metaproperty reference to the Def
     */
    __def?: Def
    // [x: string]: any;
}

export interface EntryLike extends ElementLike {
    /**
     * Entry ID, a unique identifier for an entry - unlike {@link _uid} 
     * _eid is not updated when an entry is updated. A new _uid is created
     * for the updated Entry, but they will share _eid values.
     */
    _eid?: UID,
    /**
     * A generic note about an entry, all entries can have them
     */
    _note?: string,
    /**
     * When the entry is for
     */
    _period?: PeriodStr,
    /**
     * Associated definition ID
     */
    _did?: SmallID,
    /**
     * For tracking where the tracking is coming from
     */
    _source?: string,

    /**
     * _pid keys, with the value of the EntryPoint
     */
    [_pid: string]: any
}

export interface TagLike extends ElementLike {
    /**
     * Like the Definition ID, the ID of the Tag
     */
    _tid?: SmallID;
    /**
     * Text
     */
    _lbl?: string;
    /**
     * Tags for grouping similar definitions easier in filters,
     * An array of _did
     */
    _dids?: SmallID[];
}

/**
 * Option object, map with key = _oid, val = text label for option
 */
export interface OptMap {
    [_oid: SmallID]: string;
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
    entries: CurrentAndDeletedCounts;
    tags: CurrentAndDeletedCounts;
    lastUpdated: EpochStr;
}

//#endregion

//#region ### CLASSES ###

export class PDW {
    dataStores: DataStore[];
    private static instance: PDW;
    private constructor(store?: DataStore) {
        if (store !== undefined) {
            this.dataStores = [store];
        } else {
            this.dataStores = [new DefaultDataStore(this)]
        }
        PDW.instance = this; //for singleton
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

    registerConnection(storeInstance: DataStore) {
        //#THINK - is this how to do it? Right now you're coming in from the connector
        this.dataStores.push(storeInstance);
    }

    getAll(rawParams: StandardParams): CompleteDataset {
        const params = PDW.sanitizeParams(rawParams)

        let data = {
            defs: this.dataStores[0].getDefs(params),
            entries: this.dataStores[0].getEntries(params),
            tags: this.dataStores[0].getTags(params),
        }
        return PDW.addOverviewToCompleteDataset(data);
    }

    getDefs(rawParams?: StandardParams): Def[] {
        if (rawParams === undefined) rawParams = {};
        const params = PDW.sanitizeParams(rawParams);

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

    getEntries(rawParams?: StandardParams): Entry[] {
        if (rawParams === undefined) rawParams = {};
        const params = PDW.sanitizeParams(rawParams)

        if (this.dataStores.length == 1) {
            let entries = this.dataStores[0].getEntries(params);
            return entries.map(entry => new Entry(entry));
        }

        throw new Error('Multiple datastores not yet implemented');
    }

    getTags(rawParams?: StandardParams): Tag[] {
        if (rawParams === undefined) rawParams = {};
        const params = PDW.sanitizeParams(rawParams)

        //if there's only DataStore, bypass the combining stuff to save time
        if (this.dataStores.length == 1) {
            let tagLikes = this.dataStores[0].getTags(params)
            return tagLikes.map(tdl => new Tag(tdl));
        }

        throw new Error('Multiple datastores not yet implemented');
    }

    setDefs(defsIn: DefLike[]): Def[] {
        let defs: Def[] = defsIn.map(defLike => new Def(defLike));
        this.dataStores.forEach(connection => {
            connection.setDefs(defs)
        })
        return defs
    }

    setEntries(entryData: EntryLike[]): Entry[] {
        let entries: Entry[] = entryData.map(EntryLike => new Entry(EntryLike));
        this.dataStores.forEach(connection => {
            connection.setEntries(entries)
        })
        return entries
    }

    setTags(tagsIn: TagLike[]): Tag[] {
        let tags: Tag[] = tagsIn.map(tag => new Tag(tag));
        this.dataStores.forEach(connection => {
            connection.setTags(tags)
        })
        return tags
    }

    setAll(completeDataset: CompleteDataset) {
        if(completeDataset.defs !== undefined) this.setDefs(completeDataset.defs);
        if(completeDataset.entries !== undefined) this.setEntries(completeDataset.entries);
        if(completeDataset.tags !== undefined) this.setTags(completeDataset.tags);
    }

    /**
     * Creates a new definition from {@link DefLike} components
     * and adds it to the definition manifest of the connected DataStore.
     * @param defInfo 
     * @returns the newly created Definition
    */
    newDef(defInfo: DefLike): Def {
        let newDef = new Def(defInfo, false);
        this.dataStores.forEach(connection => {
            connection.setDefs([newDef])
        })
        return newDef
    }

    newEntry(entryInfo: EntryLike): Entry {
        let newEntry = new Entry(entryInfo, false);
        this.dataStores.forEach(connection => {
            connection.setEntries([newEntry])
        })
        return newEntry;
    }

    newTag(tagInfo: TagLike): Tag {
        let newTag = new Tag(tagInfo, false);
        this.dataStores.forEach(connection => {
            connection.setTags([newTag])
        })
        return newTag;
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
        if (dataset.entries !== undefined && dataset.entries.length > 0) recents.push(Element.getMostRecent(dataset.entries)!)
        if (dataset.tags !== undefined && dataset.tags.length > 0) recents.push(Element.getMostRecent(dataset.tags)!)
        return Element.getMostRecent(recents)!._updated!
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
            entries: {
                current: data.entries?.filter(element => element._deleted === false).length,
                deleted: data.entries?.filter(element => element._deleted).length
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
    /**
     * Unique identifier for the Element
     */
    _uid: string;
    /**
     * Do not update me directly!
     * Call method {@link markDeleted} or {@link markUndeleted}
     */
    _deleted: boolean;
    /**
     * Do not update me directly!
     * Call method markDeleted or markUndeleted
     */
    _updated: EpochStr;
    /**
     * Read-only - when the Element was created.
     * Stored as an {@link EpochStr}
     */
    readonly _created: EpochStr;
    /**
     * For convenience only - a ZonedDateTime representation
     * of _created.
     */
    readonly __tempCreated: Temporal.ZonedDateTime;
    /**
     * For convenience only - a ZonedDateTime representation
     * of _updated.
     */
    readonly __tempUpdated: Temporal.ZonedDateTime;

    constructor(inputData: ElementLike) {//, associatedElements: AssociatedElementMap) {
        this._uid = inputData._uid ?? makeUID();
        this._deleted = this.handleDeletedInputVariability(inputData._deleted);
        this._created = this.handleEpochStrInputVariability(inputData._created);
        this._updated = this.handleEpochStrInputVariability(inputData._updated);
        this.__tempCreated = parseTemporalFromEpochStr(this._created);
        this.__tempUpdated = parseTemporalFromEpochStr(this._updated);
    }

    /**
     * this syntax exposes private variables to the outside world
     * in read-only manner
     */
    // get _deleted(){
    //     return this._deleted_
    // }

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

    /**
     * Sets _deleted & _updated and updates DataStores
     */
    deleteAndSave(isUndelete = false): Entry | Def | Tag {
        const type = this.getType();
        const pdwRef = PDW.getInstance();

        this._deleted = !isUndelete;
        this._updated = makeEpochStr();

        if(type === 'DefLike'){
            return pdwRef.setDefs([this])[0];
        }
        if(type === 'EntryLike'){
            return pdwRef.setEntries([this])[0];
        }
        if(type === 'TagLike'){
            return pdwRef.setTags([this])[0];
        }
        throw new Error('Type was not found')
    }

    /**
     * Sets _deleted & _updated and updates DataStores
     */
    unDeleteAndSave(): Entry | Def | Tag   {
        return this.deleteAndSave(true);
    }

    setProp(key: keyof DefLike | keyof TagLike | keyof EntryLike, val: any){
        return this.setProps({[key]: val})
    }

    setProps(newPropsMap: DefLike | EntryLike | TagLike): Element {
        const type = this.getType();
        
        if(typeof newPropsMap !== 'object') throw new Error('Element.setProps() expects an object with key/value pairs to set')
        
        // let newElementData: any = Element.toData(this)
        
        let newKeys = Object.keys(newPropsMap);

        newKeys.forEach(key=>{
            if(key === '_uid' || key === '_eid' || key === '_did' || key === '_tid'){
                console.warn('Tried to update prop ' + key + ', but ID properties cannot be updated. ID will not be updated.')
                return
            }
            if(key === '_scope'){
                console.warn('Cannot change a Definition Scope after it is established');
                return
            }
            //protecting against bad inputs
            if(key === '_updated' || key === '_created'){
                if(!isValidEpochStr(newPropsMap[key]!)){
                    let epochStr = this.handleEpochStrInputVariability(newPropsMap[key])
                    newPropsMap[key] = epochStr;
                }
            }
            //intercept known properties and set to subclass dedicated handler
            if(key === '_emoji'){
                (<Def>(<unknown>this)).setEmoji(newPropsMap[key]);
                return
            }
            if(key === '_period'){
                (<Entry>(<unknown>this)).setPeriod(newPropsMap[key]);
                return
            }

            //all other cases, assume good!
            //@ts-expect-error
            this[key] = newPropsMap[key];
            
        })


        this._updated = makeEpochStr();

        if(type === 'DefLike' && !Def.isDefLike(this)) throw new Error('You updates made a Def not DefLike');
        if(type === 'EntryLike' && !Entry.isEntryLike(this)) throw new Error('You updates made a Entry not EntryLike');
        if(type === 'TagLike' && !Tag.isTagLike(this)) throw new Error('You updates made a Tag not TagLike');
        return this
    }

    /**
     * Marks the existing Element as deleted and sends a copy of it with
     * its current property values and a new _uid to the connected {@link DataStore}(s)
     * @returns this
     */
    save(){
        const oldId = this._uid;
        const changeTime = makeEpochStr();
        
        const deletionMessage = {
            _uid: oldId,
            _deleted: true,
            _updated: changeTime
        }
        
        const newId = makeUID();
        this._updated = changeTime;
        this._uid = newId;

        const elementType = this.getType();
        if(elementType === 'DefLike'){
            PDW.getInstance().setDefs([this, deletionMessage])
            return this
        }
        if(elementType === 'EntryLike'){
            PDW.getInstance().setEntries([this, deletionMessage])
            return this
        }
        if(elementType === 'TagLike'){
            PDW.getInstance().setTags([this, deletionMessage])
            return this
        }
        throw new Error('What kind of element is this anyway? ' + elementType)
    }

    /**
     * Checks if the argument was updated more recently than this
     * @param elementData ElementLike data to compare against
     * @returns true if argument is updated more recently than this
     */
    isOlderThan(elementData: ElementLike) {
        return this._updated < elementData._updated!;
        //ran into a situation one time where I saved something twice on successive
        //lines nad only the first one was taken due to the "strictly olderthan",
        //but I don't want mass overwrites of the same data, so I'm living with
        //that for now.
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
     * Get the type of an Element.
     * @returns string representing the type of element
     */
    getType(): 'DefLike' | 'EntryLike' | 'TagLike' | null {
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
        if (type === 'EntryLike') return this._eid === comparison._eid;
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
        if (params.uid !== undefined && !params.uid.some(uid => uid === this._uid)) return false;
        //@ts-expect-error
        if (params.did !== undefined && this._did !== undefined && !params.did.some(did => did === this._did)) return false;
        //@ts-expect-error
        if (params.eid !== undefined && this._eid !== undefined && !params.eid.some(eid => eid === this._eid)) return false;
        //@ts-expect-error
        if (params.tid !== undefined && this._tid != undefined && !params.tid.some(tid => tid === this._tid)) return false;
        //@ts-expect-error
        if (params.pid !== undefined && this._pid !== undefined && !params.pid.some(pid => pid === this._pid)) return false;
        
        const type = this.getType()!;

        //@ts-expect-error
        if (params.defLbl !== undefined && type === 'DefLike' && !params.defLbl.some(lbl => lbl === this._lbl)) return false;
        //@ts-expect-error
        if (params.tagLbl !== undefined && type.substring(0, 3) === 'Tag' && !params.tagLbl.some(lbl => lbl === this._lbl)) return false;
        ////@ts-expect-error
        // if (params.pointLbl !== undefined && type === 'PointDefLike' && !params.pointLbl.some(lbl => lbl === this._lbl)) return false;

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

        //#TODO - from & to?

        return true;
    }

    //#TODO - fallsInPeriod(period: Period): boolean

    /**
     * Create an object that is a non-referenced copy of the Element.
     * Also strips out meta-properties (those starting with double underscores).
     */
    static toData(elementIn: any): ElementLike{
        if(typeof elementIn !== 'object') return elementIn;

        let cloneData: ElementLike = {};

        let oldKeys = Object.keys(elementIn);

        //make clone object
        oldKeys.forEach(key=>{
            //don't copy double-underscored keys
            if(key.substring(0,2) === "__") return

            let keyVal = elementIn[key];

            if(typeof keyVal === 'object'){
                if(Array.isArray(keyVal)){
                    cloneData[key] = keyVal.map(val=> Element.toData(val))
                }else{
                    cloneData[key] = Element.toData(keyVal);
                }
            }else{
                cloneData[key] = keyVal
            }
        });

        return cloneData
    }

    makeStaticCopy(): Tag | Def | Entry{
        const type = Element.getTypeOfElementLike(this);
        const data = Element.toData(this);
        if(type === 'DefLike') return new Def(data, false);
        if(type === 'EntryLike') return new Entry(data, false);
        if(type === 'TagLike') return new Tag(data, false);
        throw new Error('What type was this? ' + type);
    }

    private static getTypeOfElementLike(data: ElementLike) {
        if (data.hasOwnProperty("_tid")) return "TagLike"
        if (data.hasOwnProperty("_eid")) return "EntryLike"
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
    static findExistingData(dataIn: any, ofType?: 'Def' | 'Entry' | 'Tag'): any {
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
        if (type === 'EntryLike') {
            pdwRef.dataStores.forEach(store => {
                //search by _eid
                let storeResult = maybeGetOnlyResult(store.getEntries({ eid: [dataIn._eid], includeDeleted: 'no' }));
                if (storeResult !== undefined && existing === undefined) existing = storeResult as unknown as EntryLike
                //search by _uid
                storeResult = maybeGetOnlyResult(store.getEntries({ uid: [dataIn._uid], includeDeleted: 'no' }));
                if (storeResult !== undefined && existing === undefined) existing = storeResult as unknown as EntryLike
            })
        }
        if (type === 'TagLike') {
            pdwRef.dataStores.forEach(store => {
                let storeResult
                if (dataIn._pid === undefined) storeResult = maybeGetOnlyResult(store.getTags({ did: [dataIn._did], tid: [dataIn._tid], includeDeleted: 'no' }));
                if (dataIn._pid !== undefined) storeResult = maybeGetOnlyResult(store.getTags({ did: [dataIn._did], tid: [dataIn._tid], pid: [dataIn._pid], includeDeleted: 'no' }));
                if (storeResult !== undefined && existing === undefined) existing = storeResult as TagLike
            })
        }
        return existing;
    }

    /**
     * what was this specificlly supposed to do? To filter gainst an EpochStr?
     * @param elementArr 
     * @returns 
     */
    public static getMostRecent(elementArr: ElementLike[]): ElementLike | undefined {
        //#TODO - what was this whole method meant to do?
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
            if (element._updated! > mostRecent._updated!) mostRecent = element
        })
        return mostRecent
    }
}

export class Def extends Element implements DefLike {
    readonly _did: SmallID;
    readonly _lbl: string;
    readonly _desc: string;
    readonly _emoji: string;
    readonly _scope: Scope;
    readonly _pts: PointDef[];
    constructor(defData: DefLike, lookForExisting = true) {
        if (defData._scope !== undefined && !Def.isValidScope(defData._scope)) throw new Error('Invalid scope supplied when creating Def: ' + defData._scope);
        if (lookForExisting) {
            let existing = Element.findExistingData(defData, 'Def');
            if (existing !== undefined) {
                if (defData._created === undefined) defData._created = existing._created;
                if (defData._desc === undefined) defData._desc = existing._desc;
                if (defData._emoji === undefined) defData._emoji = existing._emoji;
                if (defData._did === undefined) defData._did = existing._did;
                if (defData._lbl === undefined) defData._lbl = existing._lbl;
                if (defData._scope === undefined) defData._scope = existing._scope;
            }
        }
        super(defData)
        this._did = defData._did ?? makeSmallID();
        this._lbl = defData._lbl ?? 'Unlabeled Definition ' + this._did;
        this._desc = defData._desc ?? 'Set a description';
        this._emoji = defData._emoji ?? '🆕';
        this._scope = defData._scope ?? Scope.SECOND;

        let pointsToSanitize = defData._pts ?? [];
        //spawn new PointDefs for any non-underscore-prefixed keys
        let pids = Object.keys(defData).filter(key => key.substring(0, 1) !== '_');
        pids.forEach(pid => {
            defData[pid]._pid = pid;
            pointsToSanitize.push(defData[pid]);
        })

        this._pts = pointsToSanitize.map(rawPoint => new PointDef(rawPoint, this));
        
        if (!Def.isDefLike(this)) throw new Error('Def was mal-formed.')
    }

    getPoint(pidOrLbl: string): PointDef {
        let point = this._pts.find(point => point._pid === pidOrLbl);
        if (point === undefined) point = this._pts.find(point => point._lbl === pidOrLbl);
        if (point !== undefined) return point
        throw new Error('No point found with pid or lbl when getting ' + pidOrLbl + ' for the Def labeled ' + this._lbl)
    }

    addPoint(pointInfo: PointDefLike): Def{
        let newPoint = new PointDef(pointInfo, this);
        this._pts.push(newPoint);
        return this
    }

    /**
     * Associates an Existing Tag with this Def
     * SAVES the Tag with the modification.
     * 
     * @param tid of EXISTING Tag
     * @returns the new Tag
     */
    addTag(tidLblOrTag: Tag | string, isRemove = false): Tag {
        let tag: Tag | undefined;
        if(Tag.isTagLike(tidLblOrTag)){
            tag = tidLblOrTag as Tag;
        }else{
            let pdwRef = PDW.getInstance();
            let foundTags = pdwRef.getTags({tid: tidLblOrTag as string});
            if(foundTags.length !== 1){
                foundTags = pdwRef.getTags({tagLbl: tidLblOrTag as string});
                if(foundTags.length !== 1) throw new Error('No such tag found');
            }
            tag = foundTags[0];
        }
        if(tag===undefined) throw new Error('Tag was undefined')
        if(isRemove){
            tag.removeDef(this._did);
        }else{
            tag.addDef(this._did);
        }
        tag.save();
        return tag
    }

    removeTag(tidLblOrTag: Tag | string): Tag{
        return this.addTag(tidLblOrTag, true);
    }

    setPointProps(pointIdentifier: string | PointDef, newPropsMap: DefLike | EntryLike | TagLike): Element {
        let assPoint: undefined | PointDef
        if(typeof pointIdentifier === undefined) throw new Error("Must send a string or object as a point identifier");
        if(typeof pointIdentifier === 'string'){
            assPoint = this.getPoint(pointIdentifier);
        }else{
            assPoint = pointIdentifier;
            if(!PointDef.isPointDefLike(assPoint)) throw new Error("pointIdentifier passed in wasn't PointDefLike")
        }
        
        if(typeof newPropsMap !== 'object') throw new Error('Element.setProps() expects an object with key/value pairs to set')
        
        assPoint.setProps(newPropsMap as unknown as PointDefLike);
        
        return this
    }

    /**
     * Marks the pointDef as _active = false
     */
    deactivatePoint(pointIdentifier: string | PointDef, isReactivate = false){
        let assPoint: undefined | PointDef
        if(typeof pointIdentifier === undefined) throw new Error("Must send a string or object as a point identifier");
        if(typeof pointIdentifier === 'string'){
            assPoint = this.getPoint(pointIdentifier);
        }else{
            assPoint = pointIdentifier;
            if(!PointDef.isPointDefLike(assPoint)) throw new Error("pointIdentifier passed in wasn't PointDefLike")
        }
        //@ts-expect-error - setting read-only here on purpose
        assPoint._active = isReactivate;
        this._updated = makeEpochStr();
    }

    /**
     * Will set _active = true for the identified point
     * @param pointIdentifier the point to set as active again
     */
    reactivatePoint(pointIdentifier: string | PointDef){
        this.deactivatePoint(pointIdentifier, true)
    }

    newEntry(entryData: EntryLike): Entry {
        //not tesitng the 'any' right here
        entryData._did = this._did;
        return PDW.getInstance().setEntries([entryData])[0];
    }

    setEmoji(newEmoji: string): Def{
        if(!Def.isSingleEmoji(newEmoji)){
            console.warn('Tried to set an emoji with something that was too long, emoji will not change');
            return this
        }
        //@ts-expect-error - setting read-only
        this._emoji = newEmoji;
        return this
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
        if (!Def.isSingleEmoji(data._emoji)) return false
        if (data._scope == undefined || !Def.isValidScope(data._scope)) return false
        if (typeof data._uid !== 'string') return false
        if (typeof data._created !== 'string') return false
        if (typeof data._deleted !== 'boolean') return false
        if (typeof data._updated !== 'string') return false
        if (!Array.isArray(data._pts)) return false
        return true;
    }

    static isValidScope(typeStr: string): boolean {
        const values = Object.values(Scope);
        return values.includes(typeStr as unknown as Scope)
    }

    private static isSingleEmoji(emojiStr: string): boolean {
        return [...new Intl.Segmenter().segment(emojiStr)].length == 1;
    }
}

export class PointDef implements PointDefLike {
    readonly _lbl: string;
    readonly _desc: string;
    readonly _emoji: string;
    readonly _type: PointType;
    readonly _rollup: Rollup;
    readonly _active: boolean;
    readonly _opts?: OptMap;
    readonly _pid: string;
    readonly __def: Def;
    constructor(newPointDefData: PointDefLike, def: Def) {
        if (newPointDefData._pid === undefined) throw new Error("No PointDef _pid supplied.");
        if (newPointDefData._type !== undefined && !PointDef.isValidType(newPointDefData._type)) throw new Error('Cannot parse point type ' + newPointDefData._type);
        if (newPointDefData._rollup !== undefined && !PointDef.isValidRollup(newPointDefData._rollup)) throw new Error('Cannot parse point rollup ' + newPointDefData._rollup);

        this._pid = newPointDefData._pid
        this._lbl = newPointDefData._lbl ?? 'Label unset';
        this._type = newPointDefData._type ?? PointType.TEXT;
        this._desc = newPointDefData._desc ?? 'Set a description';
        this._emoji = newPointDefData._emoji ?? '🆕';
        this._rollup = newPointDefData._rollup ?? Rollup.COUNT;
        this._active = newPointDefData._active ?? true;
        if (this.shouldHaveOptsProp()){
            if(newPointDefData._opts !== undefined){
                this._opts = PointDef.validateOptsArray(newPointDefData._opts);
            }else{
                this._opts = {};
            }
        }

        this.__def = def;

        if (!PointDef.isPointDefLike(this)) throw new Error('Mal-formed PointDef')
    }

    /**
     * Updates the properties of a PointDef inside a Def, returns teh DEF itself.
     * Because Defs **own** PointDefs.
     * @param newPropsMap map of PointDefLike properties with new values
     */
    setProps(newPropsMap: PointDefLike): PointDef {
        if(typeof newPropsMap !== 'object') throw new Error('Element.setProps() expects an object with key/value pairs to set')
        
        let newKeys = Object.keys(newPropsMap);

        newKeys.forEach(key=>{
            if(key === '_did' || key === '_pid'){
                console.warn('Tried to update prop ' + key + ', but ID properties cannot be updated. ID will not be updated.')
                return
            }
            if(key === '_emoji'){
                this.setEmoji(newPropsMap[key]!);
                return
            }
            if(key === '_rollup'){
                this.setRollup(newPropsMap[key]!);
                return
            }
            if(key === '_type'){
                this.setType(newPropsMap[key]!);
                return
            }
            if(key === '_opt' || key === '_opts'){
                console.warn('Cannot set PointDef options via setProps. Must call setOpts on the PointDef')
                return
            }
            //@ts-expect-error
            this[key] = newPropsMap[key];
        })

        this.__def._updated = makeEpochStr();

        if(!PointDef.isPointDefLike(this)) throw new Error('Your updates made a PointDef not PointDefLike');
        if(!Def.isDefLike(this.__def)) throw new Error('Your updates made a Def not DefLike');
        return this
    }

    setProp(key: keyof PointDefLike, val: any){
        this.setProps({[key]: val})
    }


    setRollup(newRollup: Rollup){
        if(!PointDef.isValidRollup(newRollup)){
            console.warn('tried to set a rollup to an invalid value. Ignoring that');
                return
        }
        //@ts-expect-error
        this._rollup = newRollup;
        this.__def._updated = makeEpochStr();
        return this
    }

    setType(newType: PointType){
        if(!PointDef.isValidType(newType)){
            console.warn('tried to set a type to an invalid value. Ignoring that');
                return
        }
        //@ts-expect-error
        this._type = newType;
        this.__def._updated = makeEpochStr();
        return this
    }

    setEmoji(newEmoji: string): PointDef{
        if(!PointDef.isSingleEmoji(newEmoji)){
            console.warn('Tried to set an emoji with something that was too long, emoji will not change');
            return this
        }
        //@ts-expect-error - setting read-only
        this._emoji = newEmoji;
        this.__def._updated = makeEpochStr();
        return this
    }

    /**
     * 
     * @param oid required - oid of option ot change
     * @param newLbl optional - if supplied option label will be set
     * @returns 
     */
    setOpt(oid: string, newLbl: string){
        if(!Object.hasOwn(this._opts!, oid)){
            console.warn('Tried to setOpt with a non-existant oid. If trying to create a new one, use addOpt().');
            return this
        }
        this._opts![oid] = newLbl;
        this.__def._updated = makeEpochStr();
        return this
    }
    
    /**
     * Passes along the save to the Def that owns this.
     */
    save(){
        this.__def.save();
    }

    private static validateOptsArray(optsMap: OptMap){
        if(typeof optsMap !== 'object') throw new Error('optsMap not an object');
        let keys = Object.keys(optsMap)
        keys.forEach(key=>{
            //not modifiying, just looking for errors
            if(
                typeof key !== 'string' ||
                typeof optsMap[key] !== 'string'
            ) throw new Error("Option wasn't formatted like an 'opt'")
        })
        //you *could* create new array of objects explicitly only keeping the 3 desired keys,
        //but you're not.
        return optsMap
    }

    addOpt(lbl: string, oid?: string){
        if(!this.shouldHaveOptsProp()){
            console.warn('Cannot add option to PointDef of type ' + this._type);
            return
        }
        if(oid=== undefined) oid = makeSmallID();
        this._opts![oid] = lbl;
        this.__def._updated = makeEpochStr();
        return this;
    }

    removeOpt(lbl?:string, oid?: string): PointDef{
        if(lbl===undefined && oid === undefined) throw new Error("must supply either a label or option ID");
        if(oid===undefined){
            oid = this.getOptOid(lbl!);
        }
        if(this._opts![oid!] !== undefined){
            delete this._opts![oid!]
        }
        this.__def._updated = makeEpochStr();
        return this
    }

    getOptLbl(oid: string): string | undefined{
        if(this._opts === undefined) return undefined
        return this._opts![oid];
    }

    getOptOid(lbl:string): string | undefined{
        if(this._opts === undefined) return undefined
        let opt = Object.keys(this._opts!).find(key => this._opts![key] === lbl);
        return opt
    }

    getOpts(): OptMap{
        if(!this.shouldHaveOptsProp()){
            console.warn('Tried getting Options for a PointDef that should not have any');
            return {};
        }
        return this._opts ?? {};
    }

    /**
     * The Def that contains this PointDef.
     */
    getDef(): Def {
        //#THINK - do you have to worry about this Def every not being the most recent Def?
        return this.__def;
    };

    shouldHaveOptsProp(): boolean {
        return this._type === PointType.SELECT || this._type === PointType.MULTISELECT;
    }

    /**
    * Predicate to check if an object has all {@link PointDefLike} properties
    * AND they are the right type.
    * @param data data to check
    * @returns true if data have all required properties of {@link DefLike}
    */
    static isPointDefLike(data: any): boolean {
        if (typeof data._lbl !== 'string') return false
        if (typeof data._desc !== 'string') return false
        if (typeof data._emoji !== 'string') return false
        if (!PointDef.isSingleEmoji(data._emoji)) return false
        if (typeof data._active !== 'boolean') return false
        if (data._type == undefined || !PointDef.isValidType(data._type)) return false
        if (data._rollup == undefined || !PointDef.isValidRollup(data._rollup)) return false
        return true;
    }

    /**
    * Attempts to intercept poorly-typed values and convert them if possible.
    * If conversion isn't possible, returns undefined and logs to console.warn
    * @param _val value to check
    * @param _type type to attempt to convert to
    * @returns correctly-typed _val, or undefined if _val cannot be converted
    */
    ensureValType(_val: string | number | boolean | object, _type?: PointType) {
        if (_type === undefined) _type = this._type;

        if (_type === PointType.BOOL) {
            if (typeof _val === 'boolean') return _val;
            if (typeof _val === 'string') return _val.toUpperCase() === 'TRUE';
            if (typeof _val === "number") return _val !== 0;
            throw new Error(`Cannot convert this to boolean:` + _val)
        }
        if (_type === PointType.DURATION) {
            if (typeof _val === 'string') return _val;
            //if (typeof _val === "number") return _val !== 0; //number of seconds? millseconds?
            if (typeof _val === 'number') {
                // console.warn('Assuming excel portion of day for duration: ', _val)
                return Temporal.Duration.from({ seconds: Math.round(86400 * _val) }).toString()
            }
            throw new Error(`Cannot convert this to duration:` + _val)
        }
        if (_type === PointType.FILE) {
            if (typeof _val === 'string') return _val;
            throw new Error(`Cannot convert this to file:` + _val)
        }
        if (_type === PointType.MARKDOWN) {
            if (typeof _val === 'boolean') return _val.toString();
            if (typeof _val === 'string') return _val;
            if (typeof _val === "number") return _val.toString();
            throw new Error(`Cannot convert this to markdown:` + _val)
        }
        if (_type === PointType.MULTISELECT) {
            if (Array.isArray(_val)) return _val;
            if (typeof _val === 'string') return _val.split(',').map(text=>text.trim());
            throw new Error(`Cannot convert this to multiselect:` + _val)
        }
        if (_type === PointType.NUMBER) {
            if (typeof _val === 'boolean') return _val ? 1 : 0;
            if (typeof _val === 'string') return Number.parseInt(_val);
            if (typeof _val === "number") return _val;
            throw new Error(`Cannot convert this to number:` + _val)
        }
        if (_type === PointType.PHOTO) {
            if (typeof _val === 'string') return _val;
            throw new Error(`Cannot convert this to PHOTO:` + _val)
        }
        if (_type === PointType.SELECT) {
            if (typeof _val === 'string') return _val;
            if (Array.isArray(_val)) return _val.join('|||')
            if (_val === undefined) return []; //I guess
            throw new Error(`Cannot convert this to select:` + _val);
        }
        if (_type === PointType.TEXT) {
            if (typeof _val === 'boolean') return _val.toString();
            if (typeof _val === 'string') return _val.trim();
            if (typeof _val === "number") return _val.toString();
            if (_val === undefined) return ''; //I guess
            return _val.toString();
        }
        if (_type === PointType.TIME) {
            if (typeof _val === 'string') return _val.trim();
            if (typeof _val === "number" && _val >= 0 && _val <= 1) {
                //attempt to support "proportion of day to time" like Excel would
                return new Temporal.PlainTime(0, 0).add({ seconds: Math.round(86400 * _val) }).toString();
            }
            throw new Error(`Cannot convert this to time:` + _val)
        }
        if (_type === PointType.JSON) {
            if (typeof _val === 'string') return _val.trim();
            if (typeof _val === "object") return JSON.stringify(_val);
            throw new Error(`Cannot convert this to JSON:` + _val)
        }
        throw new Error("Type not supported: " + _type);
    }

    static isValidType(typeStr: string): boolean {
        //Handy bit of Enum functionality here for ref
        const values = Object.values(PointType);
        return values.includes(typeStr as unknown as PointType)
    }

    static isValidRollup(typeStr: string): boolean {
        //Handy bit of Enum functionality here for ref
        const values = Object.values(Rollup);
        return values.includes(typeStr as unknown as Rollup)
    }

    private static isSingleEmoji(emojiStr: string): boolean {
        return [...new Intl.Segmenter().segment(emojiStr)].length == 1;
    }
}

export class Entry extends Element implements EntryLike {
    readonly _eid: string;
    readonly _note: Markdown;
    readonly _did: string;
    readonly _period: PeriodStr;
    readonly _source: string;
    [pid: string]: any;
    __def?: Def;
    constructor(entryData: EntryLike, lookForExisting = true, def?: Def) {
        if (entryData._uid === undefined && entryData._eid === undefined && entryData._did === undefined && def === undefined)
            throw new Error('Not enough info to determine Entry type')
        if (lookForExisting) {
            let existing = Element.findExistingData(entryData, 'Entry');
            if (existing !== undefined) {
                if (entryData._created === undefined) entryData._created = existing._created;
                if (entryData._did === undefined) entryData._did = existing._did;
                if (entryData._period === undefined) entryData._period = existing._period;
                if (entryData._note === undefined) entryData._note = existing._note;
                if (entryData._source === undefined) entryData._source = existing._source;
            }
        }
        super(entryData);

        if (entryData._def !== undefined) this.__def = entryData._def;
        if (this.__def === undefined && entryData._did !== undefined) this.__def = maybeGetOnlyResult(PDW.getInstance().getDefs({ did: [entryData._did!], includeDeleted: 'no' })) as Def;
        if (this.__def === undefined) {
            throw new Error('No def found for ' + entryData._did);
        }
        this._did = this.__def._did;

        if (entryData._period !== undefined) {
            //force period scope compatibility
            this._period = new Period(entryData._period, this.__def._scope).toString();
        } else {
            this._period = Period.now(this.__def._scope);
        }

        this._eid = entryData._eid ?? makeUID();
        this._note = entryData._note ?? '';
        this._source = entryData._source ?? '';

        //spawn new EntryPoints for any non-underscore-prefixed keys
        let pids = Object.keys(entryData).filter(key => key.substring(0, 1) !== '_');
        pids.forEach(pid => {
            const keyval = this.sanitizePointData({[pid]: entryData[pid]});
            this[keyval.pid] = keyval.val;
        })

        if (!Entry.isEntryLike(this)) throw new Error('An error occurred in the Entry creation');
    }

    /**
     * Looks up the associated PointDef based on the object key.
     * Checks the value against that PointDef._type. Calls {@link PointDef.ensureValType()}
     * @param rawPointData key: value pair with key = _pid or _lbl of PointDef
     * @returns an object with 'key' = _pid for PointDef, and 'val' = value
     */
    sanitizePointData(rawPointData: any): {'pid': string, 'lbl': string, 'val': any, 'pointDef': PointDef} {
        if (typeof rawPointData !== 'object') throw new Error('Saw non-object Entry Point:' + rawPointData);
        if (Object.keys(rawPointData).length > 1) throw new Error('Expected a single-keyed object. Saw multiple keys');
        const key = Object.keys(rawPointData)[0];

        const assPointDef = this.__def?.getPoint(key);
        if(assPointDef===undefined) throw new Error('No PointDef found for ' + key)
        const validatedValue = assPointDef?.ensureValType(rawPointData[key]);

        return {
                'pid': assPointDef._pid,
                'lbl': assPointDef._lbl,
                'val': validatedValue, 
                'pointDef': assPointDef
            }
    }

    getPoints(): {'pid': string, 'lbl': string, 'val': any, 'pointDef': PointDef}[] {
        let pids = Object.keys(this).filter(key => key.substring(0, 1) !== '_');
        let def = this.getDef();
        return pids.map(pid=> {
                const assPD = def._pts.find(point=>point._pid === pid);
                return {
                    pointDef: assPD!,
                    pid: pid,
                    lbl: assPD!._lbl,
                    val: this[pid]
                }
            })
    }

    getPoint(pidOrLbl: string): {'pid': string, 'lbl': string, 'val': any, 'pointDef': PointDef} | undefined{
        const allPoints = this.getPoints();
        let point = allPoints.find(point=>point.pid === pidOrLbl);
        if(point!== undefined) return point;
        return allPoints.find(point=>point.lbl === pidOrLbl);
    }

    setPointVals(pidValArr: {[pid: string]: any}[]): Entry{
        pidValArr.forEach(keyVal=>{
            let pointVal = this.sanitizePointData(keyVal);
            this[pointVal.pid] = pointVal.val;
        })
        this._updated = makeEpochStr();
        return this;
    }

    setPointVal(pid: string, val: any): Entry{
        this._updated = makeEpochStr();
        return this.setPointVals([{[pid]:val}]);
    }

    getDef(): Def {
        if (this.__def) return this.__def;
        return PDW.getInstance().getDefs({ did: this._did })[0]
    }

    getPeriod(): Period {
        return new Period(this._period);
    }

    setPeriod(periodStr: PeriodStr): Entry {
        if (periodStr === this._period) {
            console.warn('Attempted to set period to what it already is');
            return this
        }
        
        //@ts-expect-error - setting readonly
        this._period = new Period(periodStr, this.getDef()._scope).toString();

        this._updated = makeEpochStr();
        return this;
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

export class Tag extends Element implements TagLike {
    readonly _tid: string;
    readonly _lbl: string;
    readonly _dids: SmallID[]
    constructor(tagDefData: TagLike, lookForExisting = true) {
        if (lookForExisting) {
            let existing = Element.findExistingData(tagDefData, 'Tag');
            if (existing !== undefined) {
                if (tagDefData._created === undefined) tagDefData._created = existing._created;
            }
        }
        super(tagDefData);
        this._tid = tagDefData._tid ?? makeSmallID();
        this._lbl = tagDefData._lbl ?? 'Unlabeled Tag with _tid = ' + this._tid;
        this._dids = tagDefData._dids ?? [];
        
        if (!Tag.isTagLike(this)) {
            throw new Error('TagDef created is not TagDefLike');
        }
    }

    static isTagLike(data: any): boolean {
        if (typeof data._uid !== 'string') return false
        if (typeof data._created !== 'string') return false
        if (typeof data._updated !== 'string') return false
        if (typeof data._deleted !== 'boolean') return false
        if (typeof data._tid !== 'string') return false
        if (typeof data._lbl !== 'string') return false
        return true;
    }

    addDef(defOrDid: Def | string){
        let did = defOrDid as string;
        if(typeof did !== 'string' && Def.isDefLike(defOrDid)){
            did = (<Def>defOrDid)._did
        }
        if(this._dids.indexOf(did)===-1) this._dids.push(did);
        return this
    }

    removeDef(defOrDid: Def | string){
        if(Def.isDefLike(defOrDid)){
            //@ts-expect-error
            this._dids = this._dids.filter(d=>d!==((<Def>defOrDid)._did));
        }else{
            //@ts-expect-error
            this._dids = this._dids.filter(d=>d!==((<string>defOrDid)));
        }
        return this
    }

    getDefs(includeDeleted = false): Def[]{
        const pdwRef = PDW.getInstance();
        const includeDeletedText = includeDeleted ? 'yes' : 'no';
        let defs: Def[]= [];
        this._dids.forEach(did=>{
            let def = pdwRef.getDefs({did: did, includeDeleted: includeDeletedText});
            if(def!==undefined) defs.push(def[0]);
        })
        return defs
    }
}

/**
 * Periods are Immutable. All methods return new copies of Period.
 * They are basically wrappers around a string.
 */
export class Period {

    /**
     * The Period itself, represented in a {@link PeriodStr} format.  
     * 
     * **Examples**:
     * - '2020'
     * - '2020-Q1'
     * - '2020-03'
     * - '2020-03-19'
     * - '2020-03-19T18'
     * - '2020-03-19T18:59'
     * - '2020-03-19T18:59:25'
     */
    periodStr: PeriodStr;
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
            let numWks = Number.parseInt(this.periodStr.split('W')[1]) - 1;
            //if the previous year had 53 weeks, this is necessary
            if (Period.prevYearHas53Weeks(this.periodStr.substring(0, 4))) numWks = numWks + 1
            let init = Temporal.PlainDate.from(this.periodStr.split('-')[0] + '01-01')

            let sun = init.add({ days: 7 - init.dayOfWeek })
            sun = sun.add({ days: numWks * 7 });
            return new Period(sun.toString() + 'T23:59:59')

        }
        if (this.scope === Scope.MONTH) {
            let lastDay = Temporal.PlainDate.from(this.periodStr + '-01').daysInMonth;
            return new Period(this.periodStr + '-' + lastDay.toString() + 'T23:59:59')
        }
        if (this.scope === Scope.QUARTER) {
            const year = this.periodStr.substring(0, 4)
            const q = Number.parseInt(this.periodStr.slice(-1));
            const month = q * 3
            const d = Temporal.PlainDate.from(year + '-' + month.toString().padStart(2, '0') + '-01').daysInMonth;
            return new Period(year + '-' + month.toString().padStart(2, '0') + '-' + d + 'T23:59:59')
        }
        return new Period(this.periodStr + "-12-31T23:59:59")
    }

    /**
     * 
     * @returns the first second of the period (e.g. 2020-01-01T00:00:00)
     */
    getStart(): Period {
        if (this._zoomLevel === 0) return new Period(this);
        if (this.scope === Scope.YEAR) return new Period(this.toString() + '-01-01T00:00:00')
        if (this.scope === Scope.QUARTER) return new Period(this.zoomIn() + '-01T00:00:00')
        if (this.scope === Scope.MONTH) return new Period(this.toString() + '-01T00:00:00')
        //above preempts week, cause it's not purely hierarchical,
        //from here you can just "zoomIn" to the beginning of the period
        let per = this.zoomIn();
        while (per._zoomLevel !== 0) {
            per = per.zoomIn()
        }
        return per;
    }

    /**
     * 
     */
    zoomTo(desiredScope: Scope): Period {
        const desiredLevel = Period.zoomLevel(desiredScope);
        if (this._zoomLevel === desiredLevel) return new Period(this);
        if (this._zoomLevel < desiredLevel) {
            let zoomOut = this.zoomOut()
            while (zoomOut._zoomLevel < desiredLevel) {
                //need to bypass weeks
                if (desiredLevel !== 4 && zoomOut._zoomLevel === 3) {
                    zoomOut = new Period(zoomOut.periodStr.substring(0, 7))
                } else {
                    zoomOut = zoomOut.zoomOut()
                }
            }
            return zoomOut;
        }
        let zoomIn = this.zoomIn()
        while (zoomIn._zoomLevel > desiredLevel) {
            if (desiredLevel !== 4 && zoomIn._zoomLevel === 5) {
                zoomIn = new Period(zoomIn.periodStr + '-01')
            } else {
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
            let numWks = Number.parseInt(this.periodStr.split('W')[1]) - 1;
            //if the previous year had 53 weeks, this is necessary
            if (Period.prevYearHas53Weeks(this.periodStr.substring(0, 4))) numWks = numWks + 1
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
            let numWks = Number.parseInt(this.periodStr.split('W')[1]) - 1;
            //if the previous year had 53 weeks, this is necessary
            if (Period.prevYearHas53Weeks(this.periodStr.substring(0, 4))) numWks = numWks + 1
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

    addDuration(temporalDurationStr: string): Period {
        const startTemp = Temporal.PlainDateTime.from(this.getStart().periodStr);
        const endTemp = startTemp.add(temporalDurationStr);
        return new Period(endTemp.toString()).zoomTo(this.scope);
    }

    contains(period: Period): boolean {
        const inBegin = Temporal.PlainDateTime.from(period.getStart().periodStr)
        const inEnd = Temporal.PlainDateTime.from(period.getEnd().periodStr)
        const thisBegin = Temporal.PlainDateTime.from(this.getStart().periodStr);
        const thisEnd = Temporal.PlainDateTime.from(this.getEnd().periodStr);
        const start = Temporal.PlainDateTime.compare(inBegin, thisBegin);
        const end = Temporal.PlainDateTime.compare(thisEnd, inEnd);
        return start !== -1 && end !== -1
    }

    // I can't believe I was able to reduce these to a 1 liner
    getNext(): Period {
        let start = this.getStart();
        let end = this.getEnd();
        let plusOne = end.addDuration('PT1S');
        let zoomed = plusOne.zoomTo(this.scope);
        return this.getEnd().addDuration('PT1S').zoomTo(this.scope);

    }
    getPrev(): Period {
        return this.getStart().addDuration('-PT1S').zoomTo(this.scope);
    }

    private static prevYearHas53Weeks(yearStr: string): boolean {
        const prevYear = Number.parseInt(yearStr) - 1;
        return Temporal.PlainDate.from(prevYear + '-12-31').weekOfYear == 53;

    }

    static allPeriodsBetween(start: Period, end: Period, scope: Scope, asStrings = false): Period[] | string[] {
        if (Temporal.PlainDateTime.compare(Temporal.PlainDateTime.from(start.getStart().periodStr), Temporal.PlainDateTime.from(end.getStart().periodStr)) === 1) {
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
        if (asStrings) {
            do {
                // list.push({[member.periodStr]: {from: member.getStart().toString(), to: member.getEnd().toString()}});
                list.push(member.periodStr);
                member = member.getNext();
            } while (member.periodStr <= last.periodStr)
            return list as string[]
        } else {
            do {
                list.push(member);
                member = member.getNext();

            } while (member.periodStr <= last.periodStr)
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
export function getElementType(element: ElementLike): 'DefLike' | 'PointDefLike' | 'EntryLike' | 'EntryPointLike' | 'TagLike' | 'TagDefLike' {
    if (element.hasOwnProperty("_tid") && element.hasOwnProperty("_did")) return "TagLike"
    if (element.hasOwnProperty("_tid")) return "TagDefLike"
    if (element.hasOwnProperty("_eid") && element.hasOwnProperty('_pid')) return "EntryPointLike"
    if (element.hasOwnProperty("_eid")) return "EntryLike"
    if (element.hasOwnProperty("_pid")) return "PointDefLike"
    return "DefLike"
}

function maybeGetOnlyResult(arrayOfOneElement: any[]): any {
    if (arrayOfOneElement.length === 0) return undefined
    if (arrayOfOneElement.length > 1) {
        console.error('Found too many errors:', arrayOfOneElement)
        throw new Error('Found too many results')
    }
    return arrayOfOneElement[0]
}

/**
 * Used for .csv outputs, and probably SQL when I get around to that.
 * This is the order of all the headers.
 */
export const canonicalHeaders = [ //#TODO - fix eventually
    '_uid',
    '_created',
    '_updated',
    '_deleted',
    '_did',
    '_pid',
    '_eid',
    '_tid',
    '_lbl',
    '_emoji',
    '_desc',
    '_scope',
    '_type',
    '_rollup',
    '_period',
    '_note',
    '_source',
    '_val'
]

//#endregion
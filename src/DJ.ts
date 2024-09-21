//#region ---- Types

/**
 * A alias for string, one that's globally-unique. 
 * For {@link Def._id}, these are probably best suited to be qualified names
 * of the label. Something like "WORKOUT_NAME"
 *  
 * But any unique string is ok. This is to allow using foreign keys
 * as primary keys here.
 */
export type UniqueID = string;

/**
 * An alias for string, a string that's made from the number of 
 * milliseconds that have occurred since the epoch, stored in base 36
 * A short, consistenty way to track timezone-dependent timestamps that
 * isn't subject to alternative interpretations by, say, Excel
 */
export type EpochStr = string;

/**
 * A alias for a plaindatetime string. e.g. "2024-09-08T22:29:08"
 */
export type Timestamp = string;

/**
 * An alias for string, intended to be markdown-enabled in use
 */
export type Markdown = string

/** 
 * Default operation to apply when performing rollups.
 * 
 * @default COUNT
 * 
 * Note - Rollups are not handled in this codebase.
 */
export enum Rollup {
    COUNT = 'COUNT',
    COUNTUNIQUE = 'COUNTUNIQUE',
    COUNTOFEACH = 'COUNTOFEACH',
    COUNTDISTINCT = 'COUNTDISTINCT',
    SUM = 'SUM',
    AVERAGE = 'AVERAGE',
}
/**
 * Literal copy of code from Period. Not DRY. Quite wet actually.
 * 
 * Note - all Entries take place at Scope.SECOND.  
 * Def._scope is for use by the PDW class or as a general
 * flag for quality checks elsewhere.
 */
export enum DefScope {
    SECOND = 'SECOND',
    MINUTE = 'MINUTE',
    HOUR = 'HOUR',
    DAY = 'DAY',
    WEEK = 'WEEK',
    MONTH = 'MONTH',
    QUARTER = 'QUARTER',
    YEAR = 'YEAR',
}


//#endregion

//#region  --- Interfaces

/**
 * The canonical data structure. Contains Entries and Defs. 
 */
export interface DataJournal {
    defs: Def[],
    entries: Entry[]
    overview?: Overview | null,
}

/**
* Not typically operated on, but used moreso
* for sanity checking things when merging and whatnot.
*/
export interface Overview {
    updated?: {
        localeStr?: string,
        isoStr?: string,
        epochStr?: string,
    },
    counts?: {
        defs?: number,
        activeEntries?: number,
        deletedEntries?: number
    },
    index?: {
        /**
         * Position of every definition in the corresponding DataJournal.defs.
         * Could be used like DataJournal.defs[index[defId]]
         */
        defMap: { [defId: string]: number }
        /**
         * Position of every entry in the corresponding DataJournal.entries.
         * Could be used like DataJournal.entries[index[entryId]]
         */
        entryMap: { [entryId: string]: number }
        /**
         * Object containing:
         * key = def._lbl
         * value = def._id
         * 
         * Could be used like DataJournal.defs[index[defLblToIdMap[defId]]]
         */
        defLblToIdMap: { [defLbl: string]: string }
    }
    [x: string]: any
}

export interface Def {
    /**
     * A globally-unique identifier for the Def. Ideally this would be named semantically,
     * but that's not required. Must be unique in all the Data Journals you use. ALSO must 
     * AGREE across all the data journals you use, for common definitions.
     * 
     * This is the **main** thing that Entry's will use as the key for their property
     * representing this Def.
     * @example READ_BOOK_NAME
     */
    _id: UniqueID,
    /**
    * An {@link EpochStr} that describes the last time the Def was saved.
    */
   _updated: EpochStr
   /**
    * A {@link DefType} that describes what data type the Definition uses. This is 
    * **NOT** checked or enforced anywhere in this code base - meaning any Entry
    * property can technically have any type of data. This is mostly for signaling
    * to applications what type of input to use or methods to display the data.
    */
   _type: DefType
   // #### OPTIONAL PROPS ####
    /**
     * A nice, human-readable description of the Def. Ideally is (but not required to be)
     * unique within any given Data Journal. Could cause issues if there's a conflict as...
     * 
     * IF an Entry has a non-underscore-prefixed property whose key doesn't match to any
     * Def's `_id` property, it will then begin trying to find a Def with a _lbl that
     * matches that key (when standardized -> {@link standardizeKey}).
     * @example Book Name
     */
    _lbl?: string
    /**
     * An emoji to represent the Def. Not used for anything but UIs or whatever.
     */
    _emoji?: string
    /**
     * An description to represent the Def. Not used for anything but UIs or whatever.
     */
    _desc?: string
    /**
    * A group of strings. Use common tags across related Defs to group them. 
    * @example exercise
    */
   _tags?: string[]
    // #### PROPS USED BY OTHER CODE BASES ####
    /**
     * A {@link DefScope} for what level of granularity this kind of Def uses. 
     * While all {@link Entry}s are at a DefScope.SCOPE level. In this code base it
     * does nothing at all. Used by other code bases that import this one.
     */
    _scope?: DefScope
    /**
     * A {@link Rollup} describing what opeartion should be performed when multiple
     * entries containing this Def are aggregated.. 
     * In this code base it does nothing at all. 
     * Used by other code bases that import this one.
     */
    _rollup?: Rollup
    /**
     * The DJ class & its static members do nothing with this, but it is planned to be
     * incorporated into a Validator class which could be imported into codebases along
     * with this one. 
     * 
     * Intended use case, depending on the {@link Def._type}:
     * 
     * ## Def._type === DefType.NUMBER
     * The array will be parsed in pairs, would expect to hold things like: 
     * ['<=', '10', '>=', '0']
     * 
     * ## Def._type === DefType.SELECT or MULTISELECT
     * The array will be parsed as a suggested list of strings to use.
     * ['Strength','Cardio','Mobility']
     * @example exercise
     */
    _range?: string[]
}

export interface Entry {
    /**
     * A string of some form that universally uniquely identifies the entry
     * @example "m0ogdggg_ca3t"
     */
    _id: UniqueID,
    /**
     * The second representing when the Entry took place.     
     * @example "2024-09-07T13:29:38"
     */
    _period: Timestamp,
    /**
     * When the entry was saved - rendered as an {@link EpochStr}
     * @example "m0ogdggg"
     * 
     */
    _updated: EpochStr,
    /**
     * When the entry was saved - rendered as an {@link EpochStr}
     * @example "m0ogdggg"
     * @default to equal entry._updated
     */
    _created?: EpochStr,
    /**
     * Whether or not the entry is to be treated as real. Entries are marked
     * as "deleted" rather than simply *actually deleted* because you want 
     * deletion in one data store to propagate out to other data stores, rather
     * than have the deleted entry re-inserted during a data merge.
     * @example true
     */
    _deleted?: boolean,
    /**
     * Generic text to be applied to the entry. Can be used for whatever.
     * @example hello world!
     */
    _note?: Markdown,
    /**
     * Description of where the entry *came from*. This type of information is
     * always vital when revisiting data captured some time ago. 
     * @example Siri Shortcut Automation
     */
    _source?: string,
    /**
     * Any other key/value pairs are allowed & will be treated as though the value
     * is associated to a particular {@link Def}, identified by the key used. The 
     * key can be either the {@link Def._id} or {@link Def._lbl}. If no Def is found,
     * the data should be retained anyway - likely to be flagged by some quality check
     * mechanism at some point as "missing definition".
     * 
     * I'm calling these Entry Points.
     */
    [defID: string]: any
}

export interface QueryObject {
    /**
     * true = returns only deleted entries
     * false = returns only entries that have no "_deleted" or have "_deleted === false" 
     */
    deleted?: boolean,
    /**
     * returns entries based on their _period
     */
    from?: Timestamp,
    /**
     * returns entries based on their _period
     */
    to?: Timestamp,
    /**
     * returns entries based on their _updated
     */
    updatedBefore?: EpochStr,
    /**
     * returns entries based on their _updated
     */
    updatedAfter?: EpochStr,
    /**
     * returns only entries who's entry._id are in the list
     */
    entryIds?: UniqueID[],
    /**
     * returns only entries which have a property that is in the list
     */
    defs?: string[],
    /**
     * Returns only the first N Entries
     */
    limit?: number,
}

//#endregion

//#region --- ENUMS

export enum DefType {
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
    BOOL = 'BOOL',
    /**
     * A Temporal Duration string, starting with the 'P' (and usually also 'T') to really ensure no ambiguity
     * P3M = 3 Months
     * PT3M = 3 Minutes
     */
    DURATION = 'DURATION',
    /**
     * A Temporal PlainTime string (no timezone)
     */
    TIME = 'TIME', //Temporal.plainTime
    /**
     * An array of strings
     */
    MULTISELECT = 'MULTISELECT',
    /**
     * A string representing an https: or file: or other form of clickable link
     */
    LINK = 'LINK'
}

//#endregion

/**
 * Testing adding a new class.
 * 
 * ## Fancy
 * Oh my.
 * 
 * > [!success] This class has some **fancy** documentation
 * 
 * ```mermaid
 * flowchart LR
 *   A --> F(Do Sum)
 *   B --> F
 *   F --> O(=A+B)
 * ```
 * 
 */
export class DJ {
    /**
     * Don't make instances of this class. It's a namespace for related methods.
     */
    private constructor() {

    }

    //#region  --- public methods
    static newBlankDataJournal(withDefs: Def[] = []): DataJournal {
        return {
            defs: withDefs,
            entries: [],
            overview: {
                counts: {
                    defs: 0,
                    activeEntries: 0,
                    deletedEntries: 0
                }
            }
        }
    }

    static isValidDataJournal(data: DataJournal) {
        if (data.defs === undefined){
            console.warn("Invalid DataJournal found - no 'defs' array")
            return false
        }
        if (Array.isArray(data.defs) === false){
            console.warn("Invalid DataJournal found - 'defs' is not array")
            return false
        }
        if (data.defs.some(def=>!DJ.isValidDef(def))) return false
        if (data.entries === undefined) {
            console.warn("Invalid DataJournal found - no 'entries' array")
            return false
        }
        if (Array.isArray(data.entries) === false) {
            console.warn("Invalid DataJournal found - 'entries' is not array")
            return false
        }
        if (data.entries.some(entry=>!DJ.isValidEntry(entry))) return false
        return true
    }

    static isValidDef(def: Partial<Def>): boolean{
        if(def._id === undefined){
            console.warn('Invalid Def found - no _id prop: ', def)
            return false
        }
        if(def._updated === undefined){
            console.warn('Invalid Def found - no _updated prop: ', def)
            return false
        }
        if(def._type === undefined){
            console.warn('Invalid Def found - no _type prop: ', def)
            return false
        }
        return true
    }

    static isValidEntry(entry: Partial<Entry>): boolean {
        if(entry._id === undefined){
            console.warn('Invalid Entry found - no _id prop: ', entry)
            return false
        }
        if(entry._updated === undefined){
            console.warn('Invalid Entry found - no _updated prop: ', entry)
            return false
        }
        if(entry._period === undefined){
            console.warn('Invalid Entry found - no _period prop: ', entry)
            return false
        }
        return true
    }

    static addDefs(dataJournal: DataJournal, newDefs: Partial<Def>[]): DataJournal {
        //make static - actually calling 'merge' later does this
        // const newJournal = JSON.parse(JSON.stringify(dataJournal)); //not needed
        const fullDefs = newDefs.map(newDef => DJ.makeDef(newDef));
        const tempDJ = {
            entries: [],
            defs: fullDefs
        }
        return DJ.merge([tempDJ, dataJournal])
    }

    static addEntries(dataJournal: DataJournal, newEntries: Partial<Entry>[]): DataJournal {
        //make static - actually calling 'merge' later does this
        // const newJournal = JSON.parse(JSON.stringify(dataJournal)); //not needed
        const fullEntries = newEntries.map(newEntry => DJ.makeEntry(newEntry));
        const tempDJ = {
            entries: fullEntries as Entry[],
            defs: []
        }
        return DJ.merge([tempDJ, dataJournal])
    }
    
    static makeEntry(partEntry: Partial<Entry>): Entry {
        //make static
        const newEntry = JSON.parse(JSON.stringify(partEntry));
        //don't include footguns
        if(!Object.hasOwn(newEntry, '_id')) throw new Error('New Entries must provide their own _id')
        if(!Object.hasOwn(newEntry, '_period')) throw new Error('New Entries must provide their own _period')
        //everything else can default
        if (!Object.hasOwn(newEntry, '_updated')) newEntry._updated = DJ.makeEpochStr();
        if (!Object.hasOwn(newEntry, '_created')) newEntry._created = newEntry._updated;
        if (!Object.hasOwn(newEntry, '_note')) newEntry._note = '';
        if (!Object.hasOwn(newEntry, '_source')) newEntry._source = '';
        if (!Object.hasOwn(newEntry, '_deleted')) newEntry._deleted = false;
        return newEntry
    }

    static makeDef(partDef: Partial<Def>): Def {
        //make static
        const newDef = JSON.parse(JSON.stringify(partDef));
        if (!Object.hasOwn(newDef, '_id')) throw new Error("Def has no _id and cannot be created")
        if (!Object.hasOwn(newDef, '_lbl')) newDef._lbl = newDef._id;
        if (!Object.hasOwn(newDef, '_desc')) newDef._desc = 'Add Description';
        if (!Object.hasOwn(newDef, '_emoji')) newDef._emoji = '🆕';
        if (!Object.hasOwn(newDef, '_range')) newDef._range = [];
        if (!Object.hasOwn(newDef, '_tags')) newDef._tags = [];
        if (!Object.hasOwn(newDef, '_type')) newDef._type = DefType.TEXT; // default
        if (!Object.hasOwn(newDef, '_updated')) newDef._updated = DJ.makeEpochStr();

        return newDef as Def
    }
    static getDeletedEntries(entries: Entry[]) {
        return entries.filter(e => e._deleted);
    }

    static addOverview(dataJournal: DataJournal): DataJournal {
        //make static
        const newDataJournal = JSON.parse(JSON.stringify(dataJournal));
        newDataJournal.overview = DJ.makeOverview(newDataJournal);
        return newDataJournal
    }

    static merge(dataJournalArray: DataJournal[], andMakeOverview = true) {
        //#TODO - #MAYBE - optimize this logic to utilize Indexes if they are present
        if (!Array.isArray(dataJournalArray) || !DJ.isValidDataJournal(dataJournalArray[0])) throw new Error('DF.merge expects an array of DataJournals');
        const returnDataJournal: DataJournal = {
            defs: DJ.mergeDefs(dataJournalArray.map(dj => dj.defs)),
            entries: DJ.mergeEntries(dataJournalArray.map(dj => dj.entries))
        }
        if (andMakeOverview) {
            returnDataJournal.overview = DJ.makeOverview(returnDataJournal);
        }
        return returnDataJournal;
    }

    static mergeDefs(defs: Def[][]) {
        if(defs.length === 0) return [] as Def[]
        return DJ.mergeArrayOfArraysOfDefsOrEntries(defs) as Def[];
    }
    
    static mergeEntries(entries: Entry[][]) {
        if(entries.length === 0) return [] as Entry[]
        return DJ.mergeArrayOfArraysOfDefsOrEntries(entries) as Entry[];
    }

    static groupBy(field: 'source' | 'deleted', entries: Entry[] | DataJournal): { [field: string]: Entry[] } {
        //make static
        let staticEntries: Entry[] = [];
        //if DataJournal, convert to just entries.
        if (Object.hasOwn(entries, "entries")) {
            staticEntries = JSON.parse(JSON.stringify((<DataJournal>entries).entries));
        } else {
            staticEntries = JSON.parse(JSON.stringify((<Entry[]>entries)));
        }

        const returnMap: { [field: string]: Entry[] } = {};

        staticEntries.forEach(entry => {
            if (field === 'deleted') {
                const keyStr = entry._deleted ? 'DELETED' : 'ACTIVE';
                if (!Object.hasOwn(returnMap, keyStr)) returnMap[keyStr] = [];
                returnMap[keyStr].push(entry);
                return
            }
            if (field === 'source') {
                if(entry._source === undefined) return
                if (!Object.hasOwn(returnMap, entry._source)) returnMap[entry._source] = [];
                returnMap[entry._source].push(entry);
                return
            }
            throw new Error("this should be unreachable. If you see this there's a problem.");
        })

        return returnMap;
    }

    static groupByDefs(entries: Entry[] | DataJournal): { [field: string]: Entry[] } {
        //make static
        let staticEntries: Entry[] = [];
        //if DataJournal, convert to just entries.
        if (Object.hasOwn(entries, "entries")) {
            staticEntries = JSON.parse(JSON.stringify((<DataJournal>entries).entries));
        } else {
            staticEntries = JSON.parse(JSON.stringify((<Entry[]>entries)));
        }

        const returnMap: { [field: string]: Entry[] } = {};

        staticEntries.forEach(entry => {
            Object.keys(entry).forEach(key => {
                if (key.startsWith('_')) return //don't group by built-in keys
                const keyStr = DJ.standardizeKey(key);
                if (!Object.hasOwn(returnMap, keyStr)) returnMap[keyStr] = [];
                returnMap[keyStr].push(entry);
            })
            return
        })

        return returnMap;
    }

    //not sure this is worth building
    // static sortBy(field: string, entries: Entry[] | DataJournal) {

    //     throw new Error('Method not implemented')
    // }

    /**
     * Takes in either a {@link QueryObject} and applies those filters to the 
     * passed-in array of {@link Entry} objects or full {@link DataJournal}.
     * Returns the same type of object that was used.
     * (array in -> filtered array out)
     * (datajournal in -> filtered datajournal out)
     * @param queryObject a {@link QueryObject} to filter against
     * @param entriesOrJournal either an array of entries or a full Data Journal
     * @returns a filtered version of either an array of entries or a full Data Journal
     */
    static filterTo(queryObject: QueryObject, entriesOrJournal: Entry[] | DataJournal): Entry[] | DataJournal {
        const isFullJournal = Object.hasOwn(entriesOrJournal,'entries');
        
        if(isFullJournal){
            //make static copy
            let newJournal = JSON.parse(JSON.stringify(entriesOrJournal)) as DataJournal;
            newJournal.entries = filterEntries(newJournal.entries);
            return newJournal;
        }

        //only get to here if an array of entries are passed in.
        let newEntryArray = JSON.parse(JSON.stringify(entriesOrJournal)) as Entry[];
        return filterEntries(newEntryArray);

        //local function inside this method to make things a bit easier to read
        function filterEntries(entries: Entry[]): Entry[]{
            //pass through the phalanx/gauntlet of filters
            if(Object.hasOwn(queryObject, 'deleted')){
                entries = entries.filter(entry=>entry._deleted === queryObject.deleted);
            }
            if(Object.hasOwn(queryObject, 'from')){
                //@ts-expect-error
                entries = entries.filter(entry=>entry._period >= queryObject.from);
            }
            if(Object.hasOwn(queryObject, 'to')){
                //@ts-expect-error
                entries = entries.filter(entry=>entry._period <= queryObject.to);
            }
            if(Object.hasOwn(queryObject, 'to')){
                //@ts-expect-error
                entries = entries.filter(entry=>entry._period <= queryObject.to);
            }
            if(Object.hasOwn(queryObject, 'updatedBefore')){
                //@ts-expect-error
                entries = entries.filter(entry=>entry._updated < queryObject.updatedBefore);
            }
            if(Object.hasOwn(queryObject, 'updatedAfter')){
                //@ts-expect-error
                entries = entries.filter(entry=>entry._updated > queryObject.updatedAfter);
            }
            if(Object.hasOwn(queryObject, 'entryIds')){
                //@ts-expect-error
                entries = entries.filter(entry=>queryObject.entryIds.some(eid=>eid===entry._id));
            }
            if(Object.hasOwn(queryObject, 'defs')){
                entries = entries.filter(entry=>arraysHaveCommonElement(Object.keys(entry),queryObject.defs));
            }
            if(Object.hasOwn(queryObject, 'limit')){
                entries = entries.slice(0, queryObject.limit);
            }
            return entries;

            //local function inside the local function
            function arraysHaveCommonElement(array1, array2) {
                const set1 = new Set(array1);
                const set2 = new Set(array2);
                return [...set1].some(item => set2.has(item));
              }
        }
    }

    /**
     * //#TODO - add check for duplicate IDs
     * - any extra keys in DJ or Defs?
     * - Def missing id
     * - entry missing id or period
     * - entries with no associated def (warning)
     * - timestamp is invalid? (Borrow Scope check regex)
     * - updated Epoch str is way off?
     * - Overview counts wrong?
     */
    static qualityCheck(dataJournal: DataJournal, panicLevel: "logs only" | "some errors thrown" | "all errors thrown" = 'some errors thrown'): void {
        //overview check
        if(dataJournal.overview && dataJournal.overview.counts){
            //Def Count bad
            if(dataJournal.overview.counts.defs !== dataJournal.defs.length)
                logOrThrow(`Overview Def count is wrong! \n Overview says: ${dataJournal.overview.counts.defs} & should be ${dataJournal.defs.length}`);
            const active =  dataJournal!.overview!.counts!.activeEntries ?? 0;
            const deleted =  dataJournal.overview.counts.deletedEntries ?? 0;
            //Entry Count bad
            const overViewEntryCount = active + deleted;
            if(overViewEntryCount !== dataJournal.entries.length)
                logOrThrow(`Overview Entry count is wrong! \n Overview says: ${overViewEntryCount} & should be ${dataJournal.entries.length}`);
        }
        //quality check defs
        dataJournal.defs.forEach(def=>{
            //Def missing id
            if(!Object.hasOwn(def,'_id')) 
                logOrThrow(`No _id on Def! \n ${JSON.stringify(def)}`, true);
            //updated epochstr is bad
            if(Object.hasOwn(def,'_updated') && epochStrIsImplausible(def._updated)) 
                logOrThrow(`Def EpochStr is probably wrong! \n ${JSON.stringify(def)}`);
            //def contains extra properties (likely a bad sign)
            if(Object.keys(def).some(key=>!key.startsWith('_'))) 
                logOrThrow(`Def property found without an underscore prefix! \n ${JSON.stringify(def)}`);
        })
        //quality check entries
        dataJournal.entries.forEach(entry=>{
            //Entry missing id
            if(!Object.hasOwn(entry,'_id')) 
                logOrThrow(`No _id on Entry! \n ${JSON.stringify(entry)}`, true);
            //Entry missing _period
            if(!Object.hasOwn(entry, '_period'))
                logOrThrow(`No _period on Entry! \n ${JSON.stringify(entry)}`, true);
            //Entry _period is wrong
            if(!secondIsProperlyFormatted(entry._period))
                logOrThrow(`_period on Entry looks wrong! \n ${JSON.stringify(entry)}`, true);
            //updated epochstr is bad
            if(Object.hasOwn(entry,'_updated') && epochStrIsImplausible(entry._updated)) 
                logOrThrow(`Entry EpochStr is probably wrong! \n ${JSON.stringify(entry)}`);
            //no associated def 
            const defKeys = Object.keys(entry).filter(key=>!key.startsWith('_'));
            defKeys.forEach(key=>{
                if(!dataJournal.defs.some(def => DJ.standardizeKey(def._id) === key || DJ.standardizeKey(def._lbl ?? def._id) === key))
                    logOrThrow(`No associated Def found for Entry! \n ${JSON.stringify(entry)}`);
            })
            
        })

        function secondIsProperlyFormatted(secondStr: string): boolean{
            return /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d/i.test(secondStr)
        }

        function epochStrIsImplausible(epochStr: string){
            if(!DJ.isValidEpochStr(epochStr)) return true;
            const date = DJ.parseDateFromEpochStr(epochStr);
            const year = date.getFullYear();
            //covering the span of years I'm unlikely to track beyond. This code will be so relevant in 76 years
            if(year < 2000 || year > 2100) return true;
            return false
        }
        
        /**
         * local helper
         * @param errMessage message to write
         * @param isImportant if true, throws error for "some errors throw" case, otherwise just logs warning
         * @returns void
         */
        function logOrThrow(errMessage: string, isImportant = false){
            if(panicLevel === 'all errors thrown') throw new Error(errMessage);
            if(panicLevel === 'logs only') return console.warn(errMessage);
            if(isImportant) throw new Error(errMessage);
            console.warn(errMessage);
        }

    }

    //#region 

    //#region --- public utility methods

    static makeEpochStrFrom(stringOrDate: string | Date): EpochStr {
        if (typeof stringOrDate === 'string' && DJ.isValidEpochStr(stringOrDate)) {
            console.warn('Tried making an epochStr from something that already looked like one.')
            return stringOrDate;
        }
        return new Date(stringOrDate).getTime().toString(36);
    }


    static parseDateFromEpochStr(epochStr: EpochStr): Date {
        const epochMillis = parseInt(epochStr, 36)
        const parsedTemporal = new Date(epochMillis);
        //quality checking here would be good, but skipping that for now
        return parsedTemporal
    }

    /**
    * Makes a unique identifier with embedded {@link EpochStr}
    */
    static makeID(): UniqueID {
        return DJ.makeEpochStr() + "_" + DJ.makeRandomString();
    }

    static makeEpochStr(): EpochStr {
        return new Date().getTime().toString(36)
    }

    static makeRandomString(length = 4): string {
        if (length > 11) throw new Error("Random strings cannot be more than 12 characters long")
        return Math.random().toString(36).slice(13 - length).padStart(length, "0")
    }

    //#endregion

    //#region --- private methods 
    /**
     * Creates a Data Journal Overview object - but does NOT append it to anything.
     * To append to a copy of a Data Journal, used {@link addOverview}.
     */
    static makeOverview(dataJournal: DataJournal): Overview {
        if (!this.isValidDataJournal(dataJournal)) throw new Error("Invalid dataset found at fFWPIhaA");

        let deletedEntryCount = 0;
        let lastUpdated = '0'; //should be the Epoch itself

        let indexObj = {
            defMap: {},
            entryMap: {},
            defLblToIdMap: {}
        }

        /**
         * Loop over entries once, capture what's necessary
         */
        dataJournal.entries.forEach((entry, index) => {
            if (entry._deleted) deletedEntryCount += 1;
            if (entry._updated > lastUpdated) lastUpdated = entry._updated;

            const standardizedKey = DJ.standardizeKey(entry._id);
            indexObj.entryMap[standardizedKey] = index;
        })

        /**
         * Loop over defs once, capture what's necessary
         */
        dataJournal.defs.forEach((def, index) => {
            if (def._updated > lastUpdated) lastUpdated = def._updated;

            const standardizedKey = DJ.standardizeKey(def._id);
            indexObj.defMap[standardizedKey] = index;
            indexObj.defLblToIdMap[def._lbl ?? def._id] = def._id;
        })

        const lastUpdatedDate = DJ.parseDateFromEpochStr(lastUpdated);

        const overview: Overview = {
            updated: {
                localeStr: lastUpdatedDate.toLocaleString(),
                isoStr: lastUpdatedDate.toISOString(),
                epochStr: lastUpdated,
            },
            counts: {
                defs: dataJournal.defs.length,
                activeEntries: dataJournal.entries.length - deletedEntryCount,
                deletedEntries: deletedEntryCount
            },
            index: indexObj
        }
        return overview;
    }

    /**
     * Both merges use the same logic, just a different key. This is called by the other merge techniques.
     */
    private static mergeArrayOfArraysOfDefsOrEntries(arrayOfArrays: Def[][] | Entry[][]) {
        if (!Array.isArray(arrayOfArrays) || !Array.isArray(arrayOfArrays[0])) throw new Error('DF.mergeDefs and DF.mergeEntries expect an array of arrays');

        //make static
        const newArrayOfArrays = JSON.parse(JSON.stringify(arrayOfArrays));

        //converting to map
        let map: Def[] | Entry[] = [];
        newArrayOfArrays.shift().forEach(element => {
            const standardizedKey = DJ.standardizeKey(element._id)
            map[standardizedKey] = element;
        })

        //iterate over remaining defArray(s)
        newArrayOfArrays.forEach(array => {
            //and defs *in* each array
            array.forEach(element => {
                const standardizedKey = DJ.standardizeKey(element._id)
                //if newer version doesn't exist, return early
                if (Object.hasOwn(map, standardizedKey) && map[standardizedKey]._updated >= element._updated) return
                //replace with newer version
                map[standardizedKey] = element;
            })
        })

        // convert back to array
        return Object.values(map);
    }

    //#endregion

    //#region --- private utility methods
    /**
     * Turns "my lbl  " turns into "MY_LBL"
     */
    static standardizeKey(lbl: string): string {
        return lbl.toUpperCase().replaceAll(' ', '_').trim();
    }

    private static isValidEpochStr(epochStr: string): boolean {
        if (typeof epochStr !== 'string') return false;
        if (epochStr.length !== 8) return false; //not supporting way in the past or future
        //☝️ technically creates a 2059 problem... but that's my problem when I'm 2x as old as I am now
        if (epochStr.includes('-') || epochStr.includes(':') || epochStr.includes(' ')) return false
        return true
    }
    //#endregion
}
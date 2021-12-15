import { MongoConnector as DB} from "./mongo-connector";

/**
 * db, from a connector Module, implements StorageConnector
 */
const db = new DB();

/**
 * The main class
 */
export class PDW {

  getManifests(): Promise<FullManifest[]>{
    console.log("pdw.getManifest runs.")
    return db.getManifests();
  }

  //#region ### STATIC METHODS ###
  /**
   * Returns an ID string sufficiently unique for entries
   * @param seedDate optionally specify date component
   */
  static makeId(seedDate?: Date | string): string {
    // if(seedDate){
    //   if(typeof seedDate === "string"){
    //     if(PDW.isParsableDate(seedDate)){
    //       seedDate = new Date(seedDate);
    //     }
    //   }
    // }
    let pre = "e"; // ensure excel doesnt treat as number
    let millis = new Date().getTime().toString();
    // if(seedDate) millis = seedDate.getTime().toString();
    let randSix = Math.random().toString(36).substring(6);
    return pre + "." + millis + "." + randSix;
  }

  static isParsableDate(dateStr: string): boolean {
    //@ts-ignore //@TODO - figure out if htis is really an error
    return new Date(dateStr) !== "Invalid Date" && !isNaN(new Date(dateStr));
  }

  /**
   * Checks whether a string can resolve to the scope
   *
   * @param stringIn string to test
   * @param scopeStr scope to test against
   */
  static periodStringValid(stringIn: string, scopeStr: ScopeName) {
    // /https://xkcd.com/208/
    let regex = PDW.scopes[scopeStr].regex;
    return regex.test(stringIn);
  }

  /**
   *
   * @param testStr the string to test
   */
  static inferScope(testStr: string): ScopeName | void {}

  /**
   * The various scopes a Manifest can have.
   *
   * Implments related functions as well.
   */
  static scopes: Record<ScopeName, ScopeMember> = {
    time: {
      label: "time",
      regex: /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+(?:[+-][0-2]\d:[0-5]\d|Z)/i,
      size: 0, //smallest
      isScope: function (testStr) {
        return this.regex.test(testStr);
      }
    },
    day: {
      label: "day",
      regex: /^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$/,
      size: 1,
      isScope: function (testStr) {
        return this.regex.test(testStr);
      }
    },
    week: {
      label: "week",
      regex: /^([0-9]{4})-?W(5[0-3]|[1-4][0-9]|0[1-9])$/i,
      size: 7,
      isScope: function (testStr) {
        return this.regex.test(testStr);
      }
    },
    month: {
      label: "month",
      regex: /^([0-9]{4})-(1[0-2]|0[1-9])$/,
      size: 30,
      isScope: function (testStr) {
        return this.regex.test(testStr);
      }
    },
    year: {
      label: "year",
      regex: /^([0-9]{4})$/,
      size: 365,
      isScope: function (testStr) {
        return this.regex.test(testStr);
      }
    }
  };
}

 //#region #### INTERFACES ####

/**
 * Minimum viable manifest. Just a label.
 *
 * All other manifest properties have default
 * valuse that can be assumed or are calculated.
 */
 export interface MinimumManifest {
  /**
   * Human-readable name. Like a column header in Excel.
   */
  _label: string;
}

/**
 * Full manifest including all properties
 */
export interface FullManifest extends MinimumManifest {
  /**
   * The manifest identifier
   */
  _mid: string;
  /**
   * An emoji. Shorthand for the manifest.
   */
  _emoji: string;
  /**
   * What length of time an entry covers
   */
  _scope: ScopeName;
  /**
   * Earliest-dated entry's entry.periodEnd
   */

  _first: Date | string; //FORTESTONLY string
  /**
   * Latest-dated entry's entry.periodEnd
   */
  _latest: Date | string; //FORTESTONLY string
  /**
   * Still being recorded.
   */
  _active: boolean;
  /**
   * Tags for grouping alike manifests.
   */
  _tags: ManifestTag[];
  /**
   * Array of objects describing points.
   */
  _points: PointsManifest[];
  /**
   * A longer-form description.
   */
  _desc: string;
  /**
   * A place for a given database implementation's native "id"
   */
  _id?: string;
}

/**
 * A simple tag to group alike Manifests
 *
 * Surrogate key "_tid" (Tag ID) is used to
 * support changing tag labels without having
 * to actually change the _tid associated with
 * every Manifest with that tag.
 */
export interface ManifestTag {
  _tid: string; //surrogate key
  _label: string; //human-readable tag
}

/**
 * Minimum viable entry. These two criteria
 * must be included for any valid entry. Also
 * there should not be any two entries that
 * share the same _mid and _period.
 */
export interface MinimumEntry {
  _mid: string;
  _period: string;
}

/**
 * Full entries include all required properties.
 */
export interface FullEntry extends MinimumEntry {
  _eid: string;
  _created: Date;
  _updated: Date;
  _source: string;
  _note: string;
  _points?: EntryPointMap;
  _periodEnd: Date;
  _deleted: boolean;
}

/**
 * Entry Points are a map keyed with an
 * arbitrary quantity of _pid identifiers
 */
export interface EntryPointMap {
  1?: any;
  2?: any;
}

export interface PointsManifest{
  _pid: string;
  _label: string;
  _emoji: string;
  _type: PointType;
  _format: PointFormat;
  _rollup: RollupMethod;
  _desc: string;
}

/**
 * To support portability & interoperability,
 * any storage provider can be used that meets
 * this interface. This is the whole point, really.
 */
export interface StorageConnector {
  /**
   * This would be the main "data getter". I need
   * to think about this more.
   * @param params an object to filter against
   */
  getEntries(params: QueryParams): FullEntry[] | FullEntry;
  /**
   * The main "data setter" for entries.
   * @param entries an array of entries to bulk write
   * @param forceUpdate if entry.updated should be set
   *     *regardless* of if any data changed. Defaults false.
   */
  setEntries(entries: FullEntry[], forceUpdate?: boolean): any;
  /**
   * Return all Manifests' data.
   */
  getManifests(): Promise<FullManifest[]>;
  /**
   * The main "data setter" for manifests.
   * @param manifests Manifest data to create or update
   */
  setManifests(manifests: FullManifest[] | FullManifest): any;
}

/**
 * These are the ways to search for and shape entry data.
 */
export interface QueryParams {
  from?: string | Date;
  to?: string | Date;
  createdFrom?: string | Date;
  createdTo?: string | Date;
  updatedFrom?: string | Date;
  updatedTo?: string | Date;
  eid?: string | string[];
  mid?: string | string[];
  pid?: string | string[];
  tid?: string | string[];
  tag?: string | string[];
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  includeInactive?: boolean;
  onlyInactive?: boolean;
  scope?: ScopeName | ScopeName[];
  //@TODO - query params to the StorageConnector should
  //not have any shaping properties. getData should.
  terse?: any;
  verbose?: any;
  shape?: Shape;
  search?: any; //@TODO - think about this too
  includeEmptyPeriods?: boolean;
  rollupMethod?: RollupMethod;
}

//@TODO - think about this
enum Shape {
  "a",
  "b",
  "c",
  "d"
}

/**
 * The valid scopes a Manifest can take.
 */
type ScopeName =
  | "time"
  | "day"
  | "week"
  | "month"
  // "quarter" |
  | "year";

export interface ScopeMember {
  /**
   * Human-readable descriptor, eg 'day' or 'week'
   */
  label: string;
  /**
   * The regex for testing against
   */
  regex: RegExp;
  /**
   * How "big" the scope is, for ordering
   */
  size: number;
  /**
   * test if string is at that scope level
   *
   * returns 'true' if string is specifically
   * at that level of scope.
   * ```
   * //for scope.label == 'day'
   * dateStr("2021-07-25"); //returns true, exact match
   * dateStr("2021-07"); //returns false, too big
   * dateStr("2021-07-25T12:05:05") //returns false, too little
   * ```
   *
   * @param dateStr the string to check
   */
  isScope(dateStr: string): boolean;
}

type PointFormat = "@" | "#" | "#.#" | "yes/no" | "(hide)" | "list" | "json";

type PointType = 'text' | 'number' | 'yes/no' | 'list' | 'json'; // @TODO - duration/file/photo
export interface PointTypeMember {
  label: string;
  possibleFormats: PointFormat[];
  possibleRollups: RollupMethod[];
}

//@TODO - is this really an enum?
// enum RollupMethod {}
//how do I have a bound sent of rollup methods?
//they are both an interface and an enum.
type RollupMethod = 'count' | 'average' | 'count distinct' | 'count yes/no' | 'sum' | 'count of each';
export interface RollupMethodMember {
  label: string;
  rollup(params?: any): any;
}
//#endregion

// class Manifest {
//   /**
//    * The human-readable reference to the Manifest
//    */
//   // label: string;
//   // _mid: string;
//   // scope: Scope;
//   // first: Date;
//   // latest: Date;
//   // active: boolean;
//   // tags: string[];
//   // desc: string;
//   // points: Array<PointsManifest>
//   constructor(public _mid: string) {}

//   /**
//    * This is the first line of my JSDoc Comment.
//    *
//    * This is the paragraph underneath the first line. There are blank lines
//    * between the first line and this line. This line is long enough to
//    * include some line breaks. Let's so how this renders.
//    *
//    * @returns Placeholder text, for now.
//    */
//   getMid(): string {
//     //if(andLog) console.log("Logged, per your request");
//     console.log("getting label or something");
//     return this._mid;
//   }

//   /**
//    * This checks whether an import object can be parsed as a manifest.
//    *
//    * Manifests require a "mid" property.
//    *
//    * @param data object to check for manifest-i-ness
//    */
//   public static isManifest(data: Object): boolean {
//     return data.hasOwnProperty("_mid") && !data.hasOwnProperty("_eid");
//   }
// }
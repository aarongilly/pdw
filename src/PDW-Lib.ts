/**
 * The main class
 */
export default class PDW {
  /**
   * A simple test function. First line.
   *
   * This is a paragraph that describes the function.
   * It goes on for a few lines. But contains no test
   * code yet.
   *
   * ```
   * let x = testFun('whatever'); // returns 'whatever!'
   * ```
   *
   * @param aThing whatver you want to log
   */
  testFun(aThing: string): string {
    console.log(aThing);
    return aThing + "?!";
  }

  /**
   * Returns an ID string sufficiently unique for entries
   * @param seedDate optionally specify date component
   */
  makeId(seedDate?: Date | string): string {
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
    return new Date(dateStr) != "Invalid Date" && !isNaN(new Date(dateStr));
  }

  getManifests(): Manifest[] | void {
    //I need an object of a class that
    //implements StorageConnector...
    //but I don't want to implment that code here
    //@TODO THINK ABOUT THIS TOO
    //return manifestArray;
  }
}

/**
 * Minimum viable manifest. Just a label.
 *
 * All other manifest properties have default
 * valuse that can be assumed or are calculated.
 */
interface MinimumManifest {
  /**
   * Human-readable name. Like a column header in Excel.
   */
  _label: string;
}

/**
 * Full manifest including all properties
 */
interface FullManifest extends MinimumManifest {
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
  _scope: Scope;
  /**
   * Earliest-dated entry's entry.periodEnd
   */

  _first: Date;
  /**
   * Latest-dated entry's entry.periodEnd
   */
  _latest: Date;
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
}

/**
 * A simple tag to group alike Manifests
 *
 * Surrogate key "_tid" (Tag ID) is used to
 * support changing tag labels without having
 * to actually change the _tid associated with
 * every Manifest with that tag.
 */
interface ManifestTag {
  _tid: string; //surrogate key
  _label: string; //human-readable tag
}

/**
 * Minimum viable entry. These two criteria
 * must be included for any valid entry. Also
 * there should not be any two entries that
 * share the same _mid and _period.
 */
interface MinimumEntry {
  _mid: string;
  _period: string;
}

/**
 * Full entries include all required properties.
 */
interface FullEntry extends MinimumEntry {
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
interface EntryPointMap {
  1?: any;
  2?: any;
}

/**
 * To support portability & interoperability,
 * any storage provider can be used that meets
 * this interface. This is the whole point, really.
 */
interface StorageConnector {
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
  getManifests(): FullManifest[];
  /**
   * The main "data setter" for manifests.
   * @param manifests Manifest data to create or update
   */
  setManifests(manifests: FullManifest[] | FullManifest): any;
}

/**
 * These are the ways to search for and shape entry data.
 */
interface QueryParams {
  from?: ISOString | Date;
  to?: ISOString | Date;
  createdFrom?: ISOString | Date;
  createdTo?: ISOString | Date;
  updatedFrom?: ISOString | Date;
  updatedTo?: ISOString | Date;
  eid?: string | string[];
  mid?: string | string[];
  pid?: string | string[];
  tid?: string | string[];
  tag?: string | string[];
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
  includeInactive?: boolean;
  onlyInactive?: boolean;
  scope?: Scope | Scope[];
  //@TODO - query params to the StorageConnector should
  //not have any shaping properties. getData should.
  terse?: any;
  verbose?: any;
  shape?: Shape;
  search?: any; //@TODO - think about this too
  includeEmptyPeriods?: boolean;
  rollupMethod?: RollupMethod;
}

class Manifest {
  /**
   * The human-readable reference to the Manifest
   */
  // label: string;
  // _mid: string;
  // scope: Scope;
  // first: Date;
  // latest: Date;
  // active: boolean;
  // tags: string[];
  // desc: string;
  // points: Array<PointsManifest>
  constructor(public _mid: string) {}

  /**
   * This is the first line of my JSDoc Comment.
   *
   * This is the paragraph underneath the first line. There are blank lines
   * between the first line and this line. This line is long enough to
   * include some line breaks. Let's so how this renders.
   *
   * @returns Placeholder text, for now.
   */
  getMid(): string {
    //if(andLog) console.log("Logged, per your request");
    console.log("getting label or something");
    return this._mid;
  }

  /**
   * This checks whether an import object can be parsed as a manifest.
   *
   * Manifests require a "mid" property.
   *
   * @param data object to check for manifest-i-ness
   */
  public static isManifest(data: Object): boolean {
    return data.hasOwnProperty("_mid") && !data.hasOwnProperty("_eid");
  }
}

class PointsManifest {
  // pid: string;
  // label: string;
  // format: PointFormat;
  // emoji: string;
  // type: PointType;
  // rollup: RollupMethod;
  // desc: string;
}

class ISOString {
  //@TODO
}

class Period {
  //@TODO
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
enum Scope {
  "time",
  "day",
  "week",
  "month",
  "quarter",
  "year"
}

enum PointFormat {
  "@",
  "#",
  "#.#",
  "yes/no",
  "(hide)",
  "list",
  "json"
}

enum PointType {}

//@TODO - is this really an enum?
// enum RollupMethod {}
//how do I have a bound sent of rollup methods?
//they are both an interface and an enum.
interface RollupMethod {
  label: string;
  rollup(params?: any): any;
}

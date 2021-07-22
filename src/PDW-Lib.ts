class PDW {
    _testManifest: Manifest;
    constructor(){
        this._testManifest = new Manifest("1");
        console.log("constructed an instance");
    }

    /**
     * A simple test function. First line.
     * 
     * This is a paragraph that describes the function.
     * It goes on for a few lines. But contains no test
     * code yet.
     * 
     * @param aThing whatver you want to log
     */
    testFun(aThing: string){
        console.log(aThing);
    }
}

/**
 * This comment _supports_ [Markdown](https://marked.js.org/)... but doesn't show up?
 */
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
    constructor(public _mid: string) { };

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
        console.log("getting label or something")
        return this._mid;
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

/**
 * The valid scopes a Manifest can take.
 */
enum Scope {
    "time",
    "day",
    "week",
    "month",
    "year"
}

interface IRollupMethod {
    label: string;
    rollup(): any; 
}

enum PointFormat {

}

enum PointType {

}

enum RollupMethod {

}

/**
 * 
 * @param one whatever Manifest you want to include, yo
 * @param two any sort of number
 * @returns the word 'done'
 */
function testFunction(one: Manifest, two: number = 4): string{
    console.log("This function does nothing useful");
    console.log(one.getMid());
    console.log("You also passed in " + two);
    return "Done"
}

export { PDW, Manifest, testFunction}

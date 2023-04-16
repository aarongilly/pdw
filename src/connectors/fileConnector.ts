import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as pdw from '../pdw.js';
import { Temporal } from 'temporal-polyfill';


/**
 * The File Storage Connector is going to be developed in-tandem with this
 * iteration of the PDW. This connector will be unique, in that it will work
 * **in memory** and won't persist until explicitly saved via a mechanism
 * that doesn't exist yet. Also I (hope) to make this work across multiple 
 * data storage file types: 
 * - XLSX
 * - CSVs in a Folder
 * - JSON
 * - YAML
 * 
 * Synchronous reads & writes
 * to a file work work well and won't be nearly as portable.
 * 
 * We'll have to extract the loading & saving to their own, dedicated functions.
 * 
 * **For God's Sake don't let the co-development of this pollute the PDW library**.
 */
export class FileConnector implements pdw.StorageConnector {
    connectedDbName: string;
    serviceName: string;
    connectionStatus: "error" | "not connected" | "connected"
    private defs: pdw.Def[];
    private pointDefs: pdw.PointDef[];
    /**
     * A reference to the PDW instance this connection was
     * created to connect to. This variable is set in the 
     * {@link registerConnection} method
     */
    public pdw?: pdw.PDW;
    // private entries: pdw.Entry[];
    // private tags: pdw.Tag[];

    constructor() {
        this.connectedDbName = 'temporary';
        this.serviceName = 'In Memory';
        this.connectionStatus = 'not connected';
        this.defs = [];
        this.pointDefs = [];
    }

    //#BUG - PointDefs require DID AND a pid or lbl... think
    getPointDefs(didsAndOrLbls?: string[] | undefined): pdw.PointDef[] {
        if (didsAndOrLbls === undefined) return this.pointDefs;
        if (didsAndOrLbls) console.log('I see your ', didsAndOrLbls);
        const labelMatches = this.pointDefs.filter(def => didsAndOrLbls.some(p => p === def._lbl));
        const didMatches = this.pointDefs.filter(def => didsAndOrLbls.some(p => p === def._did));
        //in case a _lbl & _did were supplied for the same entry, remove the duplicate (tested, works)
        let noDupes = new Set([...labelMatches, ...didMatches]);
        return Array.from(noDupes);
    }

    setPointDefs(pointDefs: pdw.PointDefLike[]) {
        pointDefs.forEach(pd => {
            this.pointDefs.push(new pdw.PointDef(pd));
        })
    }

    setDefs(defs: pdw.MinimumDef[]) {
        defs.forEach(def => {
            this.defs.push(new pdw.Def(def));
        })
    }

    /**
     * Get Defs searches the array of Definitions. 
     * Specifying no param will return all definitions.
     * I think this one is done & working.
     * @param didsAndOrLbls array of _did or _lbl vales to get, leave empty to get all Defs
     * @returns array of all matching definitions
     */
    getDefs(didsAndOrLbls?: string[] | undefined, includeDeleted = true) {
        if (didsAndOrLbls === undefined) return this.defs;
        if (didsAndOrLbls) console.log('I see your ', didsAndOrLbls);
        const labelMatches = this.defs.filter(def => didsAndOrLbls.some(p => p === def._lbl));
        const didMatches = this.defs.filter(def => didsAndOrLbls.some(p => p === def._did));
        //in case a _lbl & _did were supplied for the same entry, remove the duplicate (tested, works)
        let noDupes = Array.from(new Set([...labelMatches, ...didMatches]));
        if (!includeDeleted) noDupes = noDupes.filter(def => def._deleted === false);
        return noDupes;
    }

    writeToFile(filepath: string) {
        const fileType = FileConnector.inferFileType(filepath)
        if (fileType === 'excel') return this.writeToExcel(filepath);
        if (fileType === 'json') return this.writeToJson(filepath);
        throw new Error('Unimplementd write type: ' + fileType)
    }

    loadFromFile(filepath: string) {
        const fileType = FileConnector.inferFileType(filepath)
        if (fileType === 'excel') return this.loadFromExcel(filepath);
        if (fileType === 'json') return this.loadFromJson(filepath);
        throw new Error('Unimplementd write type: ' + fileType)
    }

    private writeToExcel(filename: string) {
        const wb = XLSX.utils.book_new();

        let defBaseArr = this.defs.map(def => def.getTabularDefBase());
        defBaseArr.unshift(pdw.standardTabularDefHeaders);

        let pointDefArr = [pdw.standardTabularPointDefHeaders];
        this.defs.forEach(def => {
            const pointArr = def.getTabularPointDefs();
            pointArr?.forEach(point => {
                const stringifiedPoint = point.map(attr => attr.toString());
                pointDefArr.push(stringifiedPoint);
            })
        })

        let defSht = XLSX.utils.aoa_to_sheet(defBaseArr);
        let pointDefSht = XLSX.utils.aoa_to_sheet(pointDefArr);
        let entryBaseSht = XLSX.utils.aoa_to_sheet([pdw.standardTabularFullEntryHeaders]);
        let entryPointSht = XLSX.utils.aoa_to_sheet([pdw.standardTabularEntryPointHeaders]);
        let tagSht = XLSX.utils.aoa_to_sheet([pdw.standardTabularTagHeaders]);

        XLSX.utils.book_append_sheet(wb, defSht, "Defs");
        XLSX.utils.book_append_sheet(wb, pointDefSht, "Point Defs");
        XLSX.utils.book_append_sheet(wb, entryBaseSht, "Entries Base");
        XLSX.utils.book_append_sheet(wb, entryPointSht, "Entry Points");
        XLSX.utils.book_append_sheet(wb, tagSht, "Tags");
        XLSX.writeFile(wb, filename);
    }

    private writeToJson(filename: string) {
        let callback = () => {
            console.log('Wrote successfully?');
        }
        //#TODO - test to ensure pointDefs come along, also Entries & tags eventually
        const singleObject = {
            overview: '#TODO',
            defs: this.defs,
            //pointDefs: this.pointDefs, //??
            tags: [],
            entries: [],
            //entryPoints: this.entryPoints //??
        }
        let json = JSON.stringify(singleObject);
        fs.writeFile(filename, json, 'utf8', callback);
    }

    loadFromExcel(filepath: string) {
        console.log('loading...');
        XLSX.set_fs(fs);
        let loadedWb = XLSX.readFile(filepath);
        const shts = loadedWb.SheetNames;
        if (!shts.some(name => name === 'Defs')) {
            console.warn('No Defs sheet found in ' + filepath);
        } else {
            const defSht = loadedWb.Sheets['Defs'];
            const pointDefSht = loadedWb.Sheets['Point Defs'];

            //will be all plain text
            let defBaseRawArr = XLSX.utils.sheet_to_json(defSht) as pdw.DefLike[];
            let defBaseParsedArr: pdw.DefLike[] = defBaseRawArr.map(raw => destringifyElement(raw));
            this.mergeElements(defBaseParsedArr);

            let pointDefRawArr = XLSX.utils.sheet_to_json(pointDefSht) as pdw.PointDefLike[];
            let pointDefParsedArr: pdw.PointDefLike[] = pointDefRawArr.map(raw => destringifyElement(raw));
            this.mergeElements(pointDefParsedArr);

            console.log(this.defs);
        }
    }

    loadFromJson(filepath: string) {
        const file = JSON.parse(fs.readFileSync(filepath).toString());
        console.log(file);
    }

    private static inferFileType(path: string): "excel" | "json" | "csv" | "yaml" | "unknown" {
        if (path.slice(-5) === ".xlsx") return 'excel'
        if (path.slice(-5) === ".json") return 'json'
        if (path.slice(-4) === ".csv") return 'csv'
        if (path.slice(-5) === ".yaml") return 'yaml'
        return "unknown"
    }

    private mergeElements(newElements: pdw.ElementLike[]){
        newElements.forEach(newElement => {
            this.mergeElement(newElement)
        })
    }

    private mergeElement(newElementData: pdw.ElementLike){
        const type = pdw.getElementType(newElementData);
        if(type==='DefLike'){
            let existingDef = this.defs.find(def=>def._did == (<pdw.DefLike> newElementData)._did && def._deleted === false)
            if (existingDef === undefined) {
                this.defs.push(new pdw.Def((<pdw.DefLike> newElementData)));
                return
            }
            if (existingDef.shouldBeReplacedWith(newElementData)) {
                existingDef.markAsDeleted();
                this.defs.push(new pdw.Def((<pdw.DefLike> newElementData)));
            }
        }

        if(type==='PointDefLike'){
            let existingPointDef = this.pointDefs.find(pd=> pd._did == (<pdw.PointDefLike> newElementData)._did && pd._pid == (<pdw.PointDefLike> newElementData)._pid && pd._deleted === false)
            if (existingPointDef === undefined) {
                this.pointDefs.push(new pdw.PointDef((<pdw.PointDefLike> newElementData)));
                return
            }
            if (existingPointDef.shouldBeReplacedWith(newElementData)) {
                existingPointDef.markAsDeleted();
                this.pointDefs.push(new pdw.PointDef((<pdw.PointDefLike> newElementData)));
            }
        }
        throw new Error('#TODO')
        return undefined
    }
}

/**
 * Converts a map of strings into a map of properly-typed values, 
 * based on the observed key.
 * @param obj object containing properties to convert
 */
function destringifyElement(obj: pdw.DefLike | pdw.PointDefLike | pdw.EntryLike | pdw.TagLike): any {
    let returnObj = { ...obj }; //shallow copy deemed okay by Aaron circa 2023-03-12, get mad at him
    if (returnObj._created !== undefined) {
        //TODO - check for and handle native Excel dates
        returnObj._created = Temporal.PlainDateTime.from(returnObj._created);
    }
    if (returnObj._updated !== undefined) returnObj._updated = Temporal.PlainDateTime.from(returnObj._updated);
    if (returnObj._deleted !== undefined) returnObj._deleted = returnObj._deleted.toString().toUpperCase() === 'TRUE';
    if (returnObj.hasOwnProperty('_scope')) {
        (<pdw.DefLike>returnObj)._scope = (<pdw.DefLike>returnObj)._scope.toString().toUpperCase() as pdw.Scope;
    }

    //...others?
    return returnObj
}
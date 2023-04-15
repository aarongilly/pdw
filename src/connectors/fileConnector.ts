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
export class FileConnector implements pdw.StorageConnector{
    connectedDbName: string;
    serviceName: string;
    connectionStatus: "error" | "not connected" | "connected"
    private defs: pdw.Def[];
    /**
     * A reference to the PDW instance this connection was
     * created to connect to. This variable is set in the 
     * {@link registerConnection} method
     */
    public pdw?: pdw.PDW;
    // private entries: pdw.Entry[];
    // private tags: pdw.Tag[];
    
    constructor(){
        this.connectedDbName = 'temporary';
        this.serviceName = 'In Memory';
        this.connectionStatus = 'not connected';
        this.defs = [];
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
    getDefs(didsAndOrLbls?: string[] | undefined) {
        if(didsAndOrLbls === undefined) return this.defs;
        if(didsAndOrLbls) console.log('I see your ', didsAndOrLbls);
        const labelMatches = this.defs.filter(def=>didsAndOrLbls.some(p=>p===def._lbl));
        const didMatches = this.defs.filter(def=>didsAndOrLbls.some(p=>p===def._did));
        //in case a _lbl & _did were supplied for the same entry, remove the duplicate (tested, works)
        let noDupes = new Set([...labelMatches, ...didMatches]);
        return Array.from(noDupes);
    }

    writeToFile(fileType: 'excel' | 'json' | 'yaml' | 'csv', filename: string){
        //this one line feels out of place... makes the connector filesystem specific
        XLSX.set_fs(fs);
        if(fileType === 'excel') return this.writeToExcel(filename);
        throw new Error('Unimplementd write type: ' + fileType)
    }

    writeToExcel(filename: string){
        const wb = XLSX.utils.book_new();

        let defBaseArr = this.defs.map(def=>def.getTabularDefBase());
        defBaseArr.unshift(pdw.standardTabularDefHeaders);

        let pointDefArr = [pdw.standardTabularPointDefHeaders];
        this.defs.forEach(def => {
            const pointArr = def.getTabularPointDefs();
            pointArr?.forEach(point => {
                const stringifiedPoint = point.map(attr=> attr.toString());
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

    mergeWithFile(){
        
    }

    loadFromExcel(filepath: string){
        console.log('loading...');
        XLSX.set_fs(fs);
        let loadedWb = XLSX.readFile(filepath);
        const shts = loadedWb.SheetNames;
        if(!shts.some(name=>name==='Defs')){
            console.warn('No Defs sheet found in ' + filepath);
        }else{
            const defSht = loadedWb.Sheets['Defs'];
            const pointDefSht = loadedWb.Sheets['Point Defs'];

            //will be all plain text
            let defBaseRawArr = XLSX.utils.sheet_to_json(defSht) as pdw.DefLike[];
            let pointDefRawArr = XLSX.utils.sheet_to_json(pointDefSht) as pdw.PointDefLike[];

            //convert dates & booleans - (#TODO  - handle some variability)
            let defBaseParsedArr: pdw.DefLike[] = defBaseRawArr.map(raw=> destringifyElement(raw));
            let pointDefParsedArr: pdw.PointDefLike[] = pointDefRawArr.map(raw=> destringifyElement(raw));

            const combined = defBaseParsedArr.map(base=>{
                if(defBaseParsedArr.some(pd=> pd._did === base._did && pd._deleted === false)){
                    base._points = pointDefParsedArr.filter(pd=>pd._did === base._did && pd._deleted === false)
                }
                return base;
            });

            combined.forEach(def=>{
                /*
                #TODO - check for whether this.defs **should** load the new def 
                & if a previous needs marked deleted
                */
                this.defs.push(new pdw.Def(def));
            })
            console.log(this.defs);
        }   
    }
}

/**
 * Converts a map of strings into a map of properly-typed values, 
 * based on the observed key.
 * @param obj object containing properties to convert
 */
function destringifyElement(obj: pdw.DefLike | pdw.PointDefLike | pdw.EntryLike | pdw.TagLike): any {
    let returnObj = {...obj}; //shallow copy deemed okay by Aaron circa 2023-03-12, get mad at him
    if(returnObj._created !== undefined) {
        //TODO - check for and handle native Excel dates
        returnObj._created = Temporal.PlainDateTime.from(returnObj._created);
    }
    if(returnObj._updated !== undefined) returnObj._updated = Temporal.PlainDateTime.from(returnObj._updated);
    if(returnObj._deleted !== undefined) returnObj._deleted = returnObj._deleted.toString().toUpperCase() === 'TRUE';
    // if(returnObj._scope !== undefined) returnObj._deleted = returnObj._deleted.toString().toUpperCase() === 'TRUE';
    
    //...others?
    return returnObj
}
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as pdw from '../pdw.js';


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
    
    getDefs(params?: string[] | undefined) {
        if(params) console.log('I see your ', params);
        return this.defs;
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
}

/*
XLSX.set_fs(fs);
let demoSwitch = 'write';
demoSwitch = 'read';
if (demoSwitch == 'write') {
    const date = new Date();
    const myObj = { "hello": "world" }
    var wb = XLSX.utils.book_new(); var ws = XLSX.utils.aoa_to_sheet([
        ["Dynamic would be too nice", "<3", "CSV Test"],
        [72, , 'Then he said, "This should trip you up, dad".'],
        [, 62, myObj],
        [true, false, date],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "fs-test/textport.xlsx");
} else {
    let contents = XLSX.readFile('fs-test/textport.xlsx');
    console.log(contents.Sheets.Sheet1.A1.v);
}

*/
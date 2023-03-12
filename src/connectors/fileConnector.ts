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
    private wb?: XLSX.WorkBook;
    //@ts-ignore
    private defSht?: XLSX.WorkSheet;
    private pointDefSht?: XLSX.WorkSheet;
    private entrySht?: XLSX.WorkSheet;
    private tagSht?: XLSX.WorkSheet;
    
    constructor(filename = 'PDW Data.xlsx'){
        XLSX.set_fs(fs);
        this.connectedDbName = 'temporary';
        this.serviceName = 'Excel';
        this.connectionStatus = 'not connected';
        try{
            this.wb = XLSX.readFile(filename);
        }catch(e){
            this.initNewWorkbook(filename);
        }
    }

    setDefs() {
        if(this.wb === undefined) throw new Error('No workbook identified')
        
        /* #TODO
        Do I keep an array of Def objects in memory?
        Do I really want to implement that in a connector?
        **/
        console.log('TODO-- how will this work?');
        
        // throw new Error('Method not implemented.');
    }
    
    getDefs(params?: string[] | undefined) {
        if(params) console.log('I see your ', params);
        throw new Error('Method not implemented.');
        return []
    }

    writeToFile(filename: string){
        if(this.wb === undefined) throw new Error('No workbook identified')
       
        this.defSht = XLSX.utils.aoa_to_sheet([pdw.standardTabularDefHeaders],);
        this.pointDefSht = XLSX.utils.aoa_to_sheet([pdw.standardTabularPointDefHeaders]);
        this.entrySht = XLSX.utils.aoa_to_sheet([pdw.standardTabularEntryHeaders]);
        this.tagSht = XLSX.utils.aoa_to_sheet([pdw.standardTabularTagHeaders]);

        XLSX.utils.book_append_sheet(this.wb, this.defSht, "Defs");
        XLSX.utils.book_append_sheet(this.wb, this.pointDefSht, "Point Defs");
        XLSX.utils.book_append_sheet(this.wb, this.entrySht, "Entries");
        XLSX.utils.book_append_sheet(this.wb, this.tagSht, "Tags");
        XLSX.writeFile(this.wb, filename);
    }

    mergeWithFile(){

    }

    static newWorkbook(): pdw.StorageConnector{
        let instance = new FileConnector();
        return instance;
    }
    
    static loadWorkbook(fileNameWithDotXlsx: string): pdw.StorageConnector{
        let instance = new FileConnector(fileNameWithDotXlsx);
        return instance;
    }

    private initNewWorkbook(filename: string){
        console.log('Do you want to use a filename?' + filename);
        
        this.wb = XLSX.utils.book_new();
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
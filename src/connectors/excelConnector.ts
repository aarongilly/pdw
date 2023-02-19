import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as pdw from '../pdw.js';


/**
 * The Excel Storage Connector is going to be developed in-tandem with this
 * iteration of the PDW.
 * 
 * **For God's Sake don't let the co-development of this pollute the PDW library**.
 */
export class ExcelConnector implements pdw.StorageConnector{
    connectedDbName: string;
    serviceName: string;
    connectionStatus: "error" | "not connected" | "connected"
    private wb?: XLSX.WorkBook;
    private defSht?: XLSX.WorkSheet;
    private pointDefSht?: XLSX.WorkSheet;
    
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
        if(this.connectionStatus !== 'connected') throw new Error('Excel is not Connector')
        
        console.log('CALLED IN THE CONNECTOR');
        
        throw new Error('Method not implemented.');
    }
    
    getDefs(params?: string[] | undefined) {
        if(params) console.log('I see your ', params);
        throw new Error('Method not implemented.');
        return []
    }
    
    static connect(fileNameWithDotXlsx: string): pdw.StorageConnector{
        let instance = new ExcelConnector(fileNameWithDotXlsx);
        return instance;
    }

    private initNewWorkbook(filename: string){
        this.wb = XLSX.utils.book_new();
        this.defSht = XLSX.utils.aoa_to_sheet([pdw.standardTabularDefHeaders]);
        this.pointDefSht = XLSX.utils.aoa_to_sheet([pdw.standardTabularPointDefHeaders]);
        XLSX.utils.book_append_sheet(this.wb, this.defSht);
        XLSX.utils.book_append_sheet(this.wb, this.pointDefSht);
        XLSX.writeFile(this.wb, filename);
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
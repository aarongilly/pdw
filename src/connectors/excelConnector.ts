import * as XLSX from 'xlsx';
import { StorageConnector } from '../pdw';

/**
 * Testing basic connection
 */
export async function createXLSXFile(){
    // const f = await (await fetch("https://sheetjs.com/pres.xlsx")).arrayBuffer();
    // const wb = XLSX.read(f);
    const rows = [
        {
            "Name": "Bill Clinton",
            "Index": 42
        },
        {
            "Name": "GeorgeW Bush",
            "Index": 43
        },
        {
            "Name": "Barack Obama",
            "Index": 44
        },
        {
            "Name": "Donald Trump",
            "Index": 45
        },
        {
            "Name": "Joseph Biden",
            "Index": 46
        }
    ]
    const sht = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,sht,"My Data")
    ; //XLSX.utils.sheet_to_json<President>(wb.Sheets[wb.SheetNames[0]]);
    // console.log(data);
    
    /* Write File */
    XLSX.writeFile(wb, "node.xlsx");
}

/**
 * The Excel Storage Connector is going to be developed in-tandem with this
 * iteration of the PDW.
 * 
 * **For God's Sake don't let the co-development of this pollute the PDW library**.
 */
export class ExcelConnector implements StorageConnector{
    connectedDbName: string;
    serviceName: string;
    
    constructor(){
        this.connectedDbName = 'temporary';
        this.serviceName = "Excel";
    }
    setDefs() {
        throw new Error('Method not implemented.');
    }
    
    getDefs(params?: string[] | undefined) {
        if(params) console.log('I see your ', params);
        throw new Error('Method not implemented.');
        return []
    }
    
}
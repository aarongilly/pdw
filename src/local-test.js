import * as XLSX from 'xlsx';
import fetch from 'node-fetch'
import * as fs from 'fs';

XLSX.set_fs(fs);

export async function createXLSXFile(){
    const f = await (await fetch("https://sheetjs.com/pres.xlsx")).arrayBuffer();
    const wb = XLSX.read(f);
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    console.log(data);
    

    // Write File 
    XLSX.writeFile(wb, "node.xlsx");
    ii
}

export const test = () => {
    createXLSXFile();
    //How do we tie into the librarys in development?
}

test();

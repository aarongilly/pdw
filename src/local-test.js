import * as XLSX from 'xlsx';
import fetch from 'node-fetch'
// import sql from 'sqlite3';

import {test} from '../src/pdw.js'
// import * as fs from 'fs';
// import {SqliteConnector} from './connectors/sqliteConnector';

export async function createXLSXFile(){
    const f = await (await fetch("https://sheetjs.com/pres.xlsx")).arrayBuffer();
    const wb = XLSX.read(f);
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    console.log(data);
    

    // Write File 
    XLSX.writeFile(wb, "node.xlsx");
}

export const testFun = () => {
    console.log(test);
    // const sql = new SqliteConnector();
    // console.log('creating a DB');
    // sql.createDatabase();
     /**
     * For interim testing... nothing to do with PDW 
     */
        // const db = new sql.Database('generatedDatabase.db');

        // db.serialize(() => {
        //     db.run("CREATE TABLE lorem (info TEXT)");

        //     const stmt = db.prepare("INSERT INTO lorem VALUES (?)");
        //     for (let i = 0; i < 10; i++) {
        //         stmt.run("Ipsum " + i);
        //     }
        //     stmt.finalize();

        //     db.each("SELECT rowid AS id, info FROM lorem", (err, row) => {
        //         if(err) console.error(err);
        //         console.log(row.id + ": " + row.info);
        //     });
        // });

        // db.close();
    
}

testFun();

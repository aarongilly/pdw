import * as XLSX from 'xlsx';
import fetch from 'node-fetch'
import { SqliteConnector } from './connectors/sqliteConnector.js';
import * as fs from 'fs';



let testing: 'sql' | 'csv' | 'xlsx' | "firebase" | "mongo";

testing = 'csv'
// testing = 'firestore';
// testing = 'sql';
// testing = 'xlsx';

if (testing == 'csv') {
    XLSX.set_fs(fs);
    let demoSwitch = 'write';
    demoSwitch = 'read';
    if (demoSwitch == 'write') {
        const date = new Date();
        const myObj = { "hello": "world" }
        var wb = XLSX.utils.book_new(); var ws = XLSX.utils.aoa_to_sheet([
            ["Header", "<3", "CSV Test"],
            [72, , 'Then he said, "This should trip you up, dad".'],
            [, 62, myObj],
            [true, false, date],
        ]);
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, "fs-test/textport.csv");
    }else{
        let contents = XLSX.readFile('fs-test/textport.csv');
        console.log(contents.Sheets.Sheet1.A1.v);
    }
}

//@ts-expect-error
if (testing == 'sql') {



}
// import sql from 'sqlite3';

// import {test} from './pdw.js'
// import * as fs from 'fs';


export async function createXLSXFile() {
    const f = await (await fetch("https://sheetjs.com/pres.xlsx")).arrayBuffer();
    const wb = XLSX.read(f);
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    console.log(data);


    // Write File 
    XLSX.writeFile(wb, "node.xlsx");
}

export const testFun = () => {
    // console.log(test);
    const sql = new SqliteConnector();
    console.log('creating a DB');
    sql.createDatabase();
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

// testFun();

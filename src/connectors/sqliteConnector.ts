// import * as sql from 'sqlite3'

// let db = new sql.Database(':memory:');

export {} //delete this line when starting development 

//import { StorageConnector } from "../pdw";
// import sql from 'sqlite3';

//tried installing better-sqlite3, which ran into issues with Apple Silicon

/**
 * Try not to chase 3 rabbits. This is intended to KEEP THE END IN MIND.
 * 
 * Seems [helpful](https://www.linode.com/docs/guides/getting-started-with-nodejs-sqlite/)
 */
// export class SqliteConnector implements StorageConnector {
//     constructor() {
//         this.connectedDbName = 'Temporary';
//         this.serviceName = "SQLite3";
//     }
//     setDefs() {
//         throw new Error("Method not implemented.");
//     }
//     getDefs(params?: string[] | undefined) {
//         throw new Error("Method not implemented.");
//         if (params) console.log('I see your', params);
//         return []
//     }
//     connectedDbName: string;
//     serviceName: string;

//     /**
//      * For interim testing... nothing to do with PDW 
//      */
//     createDatabase() {
//         const db = new sql.Database('fs-test/generatedDatabase.db');

//         db.serialize(() => {
//             db.run("CREATE TABLE lorem (info TEXT)");

//             const stmt = db.prepare("INSERT INTO lorem VALUES (?)");
//             for (let i = 0; i < 10; i++) {
//                 stmt.run("Ipsum " + i);
//             }
//             stmt.run('And I am here too!')
//             stmt.finalize();

//             db.each("SELECT rowid AS id, info FROM lorem", (err, row) => {
//                 if(err) console.error(err);
//                 console.log(row.id + ": " + row.info);
//             });
//         });

//         db.close();
//     }
// }



// export const testFun = () => {
//     // console.log(test);
//     const sql = new SqliteConnector();
//     console.log('creating a DB');
//     sql.createDatabase();
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

// }

// testFun();

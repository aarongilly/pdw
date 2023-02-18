import { StorageConnector } from "../pdw";
import sql from 'sqlite3'; // straight up doesn't work right now.
//tried installing better-sqlite3, which ran into issues with Apple Silicon

/**
 * Try not to chase 3 rabbits. This is intended to KEEP THE END IN MIND.
 */
export class SqliteConnector implements StorageConnector {
    constructor() {
        this.connectedDbName = 'Temporary';
        this.serviceName = "SQLite3";
    }
    getDefs(params?: string[] | undefined) {
        if (params) console.log('I see your', params);
        throw new Error("Method not implemented.");
    }
    connectedDbName: string;
    serviceName: string;

    /**
     * For interim testing... nothing to do with PDW 
     */
    createDatabase() {
        const db = new sql.Database('generatedDatabase.db');

        db.serialize(() => {
            db.run("CREATE TABLE lorem (info TEXT)");

            const stmt = db.prepare("INSERT INTO lorem VALUES (?)");
            for (let i = 0; i < 10; i++) {
                stmt.run("Ipsum " + i);
            }
            stmt.finalize();

            db.each("SELECT rowid AS id, info FROM lorem", (err, row) => {
                if(err) console.error(err);
                console.log(row.id + ": " + row.info);
            });
        });

        db.close();
    }
}
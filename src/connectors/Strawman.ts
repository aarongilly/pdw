import { QueryObject, Entry, Def, Overview, DJ, DataJournal } from "../DJ.js";
import { Connector, Transaction } from "../pdw.js";

/**
 * Strawman connector. 
 * MINIMALLY fulfills the Connector interface for developing stuff.
 */

export class InMemoryDb implements Connector {
    internalDJ: DataJournal
    constructor(){
        this.internalDJ = {
            defs: [],
            entries: []
        }
    }
    commit(trans: Transaction): Promise<any> {
        //creates
        this.internalDJ.defs.push(...trans.create.defs);
        this.internalDJ.entries.push(...trans.create.entries);

        //updates
        trans.update.defs.forEach(def=>{
            let existing = this.internalDJ.defs.find(prev => prev._id === def._id);
            if(!existing) {
                this.internalDJ.defs.push(DJ.makeDef(def));
                return;
            }
            if(existing._updated > def._updated) return;
            //def and existing both exist, def is newer
            //I added this filter later, don't fully grasp why I have to remove this
            //rather than just mutate existing
            this.internalDJ.defs = this.internalDJ.defs.filter(prev => prev !== existing);
            //this spread notation will replace any existing props with what's in `def`,
            //while not deleting any other props that may already exist
            existing = {...existing, ...def} 
            this.internalDJ.defs.push(existing);
        })
        trans.update.entries.forEach(entry=>{
            let existing = this.internalDJ.entries.find(prev => prev._id === entry._id);
            if(!existing) {
                this.internalDJ.entries.push(DJ.makeEntry(entry));
                return;
            }
            if(existing._updated > entry._updated) return;
            //entry and existing both exist, def is newer
            //I added this filter later, don't fully grasp why I have to remove this
            //rather than just mutate existing
            this.internalDJ.entries = this.internalDJ.entries.filter(prev => prev !== existing);
            //this spread notation will replace any existing props with what's in `def`,
            //while not deleting any other props that may already exist
            existing = {...existing, ...entry};
            this.internalDJ.entries.push(existing);
        })

        //deletes
        trans.delete.defs.forEach(def=>{
            let existing = this.internalDJ.defs.find(prev => prev._id === def._id);
            if(!existing) {
                console.warn('Tried to delete or undelete a non-existing def with _id: ' + def._id);
                return;
            }
            if(existing._updated > def._updated) return;
            this.internalDJ.defs.filter(prev => prev !== existing);
        })
        trans.delete.entries.forEach(entry=>{
            let existing = this.internalDJ.entries.find(prev => prev._id === entry._id);
            if(!existing) {
                console.warn('Tried to delete or undelete a non-existing entry with _id: ' + entry._id);
                return;
            }
            if(existing._updated > entry._updated) return;
            this.internalDJ.entries.filter(prev => prev !== existing);
        })
        
        // return JSON.parse(JSON.stringify(this.internalDJ));
        return new Promise((resolve) => {
            // Simulate a delay of 100ms
            setTimeout(() => {
                resolve(JSON.parse(JSON.stringify(this.internalDJ))); // Resolve the promise
            }, 100);
        });
    }
    query(params: QueryObject): Promise<Entry[]> {
        return new Promise((resolve) => {
            // Simulate a delay of 100ms
            setTimeout(() => {
                const filteredArray = DJ.filterTo(params,this.internalDJ.entries);
                resolve(filteredArray as Entry[]); // Resolve the promise
            }, 100);
        });
    }
    getDefs(): Def[] {
        return this.internalDJ.defs;
    }
    getOverview(): Promise<Overview> {
        return new Promise((resolve) => {
            // Simulate a delay of 100ms
            setTimeout(() => {
                const overview = DJ.addOverview(this.internalDJ);
                resolve(overview.overview!); // Resolve the promise
            }, 100);
        });
    }
    connect(...params: any): Promise<Def[]> {
        return new Promise((resolve) => {
            // Simulate a delay of 100ms
            setTimeout(() => {
                resolve(this.internalDJ.defs); // Resolve the promise
            }, 100);
        });
    }
    getServiceName(): string {
        return 'Strawman In-Memory Database';
    }

}
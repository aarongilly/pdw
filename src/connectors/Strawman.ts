import { QueryObject, Entry, Def, Overview, DJ, DataJournal } from "../DJ.js";
import { Connector, TransactionObject } from "../pdw.js";

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

    commit(trans: TransactionObject): Promise<any> {
        //creates
        if(trans.defs.create) this.internalDJ.defs.push(...trans.defs.create as Def[]);
        if(trans.entries.create) this.internalDJ.entries.push(...trans.entries.create as Entry[]);

        //overwrites
        if(trans.defs.overwrite){
            trans.defs.overwrite.forEach(def=>{
                const standardizedID = DJ.standardizeKey(def._id)
                let existing = this.internalDJ.defs.find(prev => DJ.standardizeKey(prev._id) === standardizedID);
                if(!existing) {
                    this.internalDJ.defs.push(DJ.makeDef(def));
                    return;
                }
                if(existing._updated > def._updated) return;
                //def and existing both exist, def is newer
                //I added this filter later, don't fully grasp why I have to remove this
                //rather than just mutate existing
                this.internalDJ.defs = this.internalDJ.defs.filter(prev => prev !== existing);
                this.internalDJ.defs.push(def);
            })
        }
        if(trans.entries.overwrite){
            trans.entries.overwrite.forEach(entry=>{
                const standardizedID = DJ.standardizeKey(entry._id)
                let existing = this.internalDJ.entries.find(prev => DJ.standardizeKey(prev._id) === standardizedID);
                if(!existing) {
                    this.internalDJ.entries.push(DJ.makeEntry(entry));
                    return;
                }
                if(existing._updated > entry._updated) return;
                //def and existing both exist, def is newer
                //I added this filter later, don't fully grasp why I have to remove this
                //rather than just mutate existing
                this.internalDJ.entries = this.internalDJ.entries.filter(prev => prev !== existing);
                this.internalDJ.entries.push(entry);
            })
        }

        //updates
        if(trans.defs.append){
            trans.defs.append.forEach(def=>{
                const standardizedID = DJ.standardizeKey(def._id)
                let existing = this.internalDJ.defs.find(prev => DJ.standardizeKey(prev._id) === standardizedID);
                if(!existing) {
                    this.internalDJ.defs.push(DJ.makeDef(def));
                    return;
                }
                if(existing._updated > def._updated) return;
                //entry and existing both exist, def is newer
                //I added this filter later, don't fully grasp why I have to remove this
                //rather than just mutate existing
                this.internalDJ.defs = this.internalDJ.defs.filter(prev => prev !== existing);
                //this spread notation will replace any existing props with what's in `def`,
                //while not deleting any other props that may already exist
                existing = {...existing, ...def};
                this.internalDJ.defs.push(existing);
            })
        }
        if(trans.entries.append){
            trans.entries.append.forEach(entry=>{
                const standardizedID = DJ.standardizeKey(entry._id)
                let existing = this.internalDJ.entries.find(prev => DJ.standardizeKey(prev._id) === standardizedID);
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
        }

        //deletes
        if(trans.defs.delete){
            trans.defs.delete.forEach(defID=>{
                const standardizedID = DJ.standardizeKey(defID)
                this.internalDJ.defs = this.internalDJ.defs.filter(def =>  DJ.standardizeKey(def._id) !== standardizedID);
            })
        }
        if(trans.entries.delete){
            trans.entries.delete.forEach(entryId=>{
                const standardizedID = DJ.standardizeKey(entryId)
                let existing = this.internalDJ.entries.find(prev => DJ.standardizeKey(prev._id) === standardizedID);
                if(existing) existing._deleted = true; //mark as deleted
            })
        }
        
        return new Promise((resolve) => {
            // Simulate a delay of 10ms
            setTimeout(() => {
                resolve(JSON.parse(JSON.stringify(this.internalDJ))); // Resolve the promise
            }, 10);
        });
    }

    query(params: QueryObject): Promise<Entry[]> {
        return new Promise((resolve) => {
            // Simulate a delay of 10ms
            setTimeout(() => {
                const filteredArray = DJ.filterTo(params,this.internalDJ.entries);
                resolve(filteredArray as Entry[]); // Resolve the promise
            }, 10);
        });
    }

    getDefs(): Def[] {
        return this.internalDJ.defs;
    }

    getOverview(): Promise<Overview> {
        return new Promise((resolve) => {
            // Simulate a delay of 10ms
            setTimeout(() => {
                const overview = DJ.addOverview(this.internalDJ);
                resolve(overview.overview!); // Resolve the promise
            }, 10);
        });
    }
    
    connect(): Promise<Def[]> {
        return new Promise((resolve) => {
            // Simulate a delay of 10ms
            setTimeout(() => {
                resolve(this.internalDJ.defs); // Resolve the promise
            }, 10);
        });
    }

    getServiceName(): string {
        return 'Strawman In-Memory Database';
    }

}
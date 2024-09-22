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
        //#TODO - replace by calling the new DJ.commit method
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




/*** some code from the DJ file you wrote
 * //make static
        const newJournal = JSON.parse(JSON.stringify(dataJournal)) as DataJournal;
        let response: CommitResponse = {
            success: false //default
        }

        //creates
        if (trans.defs.create) {
            newJournal.defs.push(...trans.defs.create as Def[]);
            response.createdDefs = trans.defs.create.length;
        }
        if (trans.entries.create) {
            newJournal.entries.push(...trans.entries.create as Entry[]);
            response.createdEntries = trans.entries.create.length;
        }

        //replaces
        if (trans.defs.replace) {
            response.replaceDefs = 0;
            trans.defs.replace.forEach(def => {
                const standardizedID = DJ.standardizeKey(def._id)
                let existing = newJournal.defs.find(prev => DJ.standardizeKey(prev._id) === standardizedID);
                if (!existing) {
                    newJournal.defs.push(DJ.makeDef(def));
                    if (response.createdDefs === undefined) response.createdDefs = 0;
                    response.createdDefs += 1;
                    return;
                }
                if (existing._updated > def._updated) return;
                //def and existing both exist, def is newer
                //I added this filter later, don't fully grasp why I have to remove this
                //rather than just mutate existing
                newJournal.defs = newJournal.defs.filter(prev => prev !== existing);
                newJournal.defs.push(def);
                response.replaceDefs! += 1;
            })
        }
        if (trans.entries.replace) {
            response.replaceEntries = 0;
            trans.entries.replace.forEach(entry => {
                const standardizedID = DJ.standardizeKey(entry._id)
                let existing = newJournal.entries.find(prev => DJ.standardizeKey(prev._id) === standardizedID);
                if (!existing) {
                    newJournal.entries.push(DJ.makeEntry(entry));
                    if (response.createdEntries === undefined) response.createdEntries = 0;
                    response.createdEntries += 1;
                    return;
                }
                if (existing._updated > entry._updated) return;
                //def and existing both exist, def is newer
                //I added this filter later, don't fully grasp why I have to remove this
                //rather than just mutate existing
                newJournal.entries = newJournal.entries.filter(prev => prev !== existing);
                newJournal.entries.push(entry);
                response.createdEntries! += 1;
            })
        }

        //modifys
        if (trans.defs.modify) {
            response.modifyDefs = 0;
            trans.defs.modify.forEach(def => {
                const standardizedID = DJ.standardizeKey(def._id)
                let existing = newJournal.defs.find(prev => DJ.standardizeKey(prev._id) === standardizedID);
                if (!existing) {
                    newJournal.defs.push(DJ.makeDef(def));
                    if (response.createdDefs === undefined) response.createdDefs = 0;
                    response.createdDefs += 1;
                    return;
                }
                if (existing._updated > def._updated) return;
                //entry and existing both exist, def is newer
                //I added this filter later, don't fully grasp why I have to remove this
                //rather than just mutate existing
                newJournal.defs = newJournal.defs.filter(prev => prev !== existing);
                //this spread notation will replace any existing props with what's in `def`,
                //while not deleting any other props that may already exist
                existing = { ...existing, ...def };
                newJournal.defs.push(existing);
                response.modifyDefs! += 1;
            })
        }
        if (trans.entries.modify) {
            response.modifyEntries = 0;
            trans.entries.modify.forEach(entry => {
                const standardizedID = DJ.standardizeKey(entry._id)
                let existing = newJournal.entries.find(prev => DJ.standardizeKey(prev._id) === standardizedID);
                if (!existing) {
                    newJournal.entries.push(DJ.makeEntry(entry));
                    if (response.createdEntries === undefined) response.createdEntries = 0;
                    response.createdEntries += 1;
                    return;
                }
                if (existing._updated > entry._updated) return;
                //entry and existing both exist, def is newer
                //I added this filter later, don't fully grasp why I have to remove this
                //rather than just mutate existing
                newJournal.entries = newJournal.entries.filter(prev => prev !== existing);
                //this spread notation will replace any existing props with what's in `def`,
                //while not deleting any other props that may already exist
                existing = { ...existing, ...entry };
                newJournal.entries.push(existing);
                response.modifyEntries! += 1;
            })
        }

        //deletes
        if (trans.defs.delete) {
            trans.defs.delete.forEach(defID => {
                response.deleteDefs = 0;
                const standardizedID = DJ.standardizeKey(defID)
                const foundDefIndex = newJournal.defs.findIndex(def => DJ.standardizeKey(def._id) === standardizedID);
                if (foundDefIndex !== -1) {
                    newJournal.defs.splice(foundDefIndex, 1);
                    response.deleteDefs += 1;
                }
            })
        }
        if (trans.entries.delete) {
            response.deleteEntries = 0;
            trans.entries.delete.forEach(entryId => {
                const standardizedID = DJ.standardizeKey(entryId)
                let existing = newJournal.entries.find(prev => DJ.standardizeKey(prev._id) === standardizedID);
                if (existing){
                    existing._deleted = true; //mark as deleted
                    response.deleteEntries! += 1;
                }
            })
        }

        response.success = true;
        return response;
 */
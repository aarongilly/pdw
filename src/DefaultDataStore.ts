import * as pdw from "./pdw.js"; //why was this erroring before I put ".js" on there?


export class DefaultDataStore implements pdw.DataStore {
    serviceName: string;
    pdw: pdw.PDW;
    defs: pdw.Def[];
    entries: pdw.Entry[];
    tags: pdw.Tag[];

    constructor(pdwRef: pdw.PDW) {
        this.serviceName = 'In memory dataset';
        this.pdw = pdwRef;
        this.defs = [];
        this.entries = [];
        this.tags = [];
    }

    /**
     * Reset all the arrays to nil.
     * Right now only used for **testing**
     */
    clearAllStoreArrays() {
        this.defs = [];
        this.entries = [];
        this.tags = [];
    }

    query(params: pdw.SanitizedParams): pdw.QueryResponse {
        throw new Error("Method not implemented.");
    }

    getAll(params: pdw.SanitizedParams): pdw.CompleteishDataset {
        return {
            defs: this.getDefs(params),
            entries: this.getEntries(params),
            tags: this.getTags(params),
        };
    }

    getDefs(params: pdw.SanitizedParams): pdw.DefLike[] {
        const allMatches = this.defs.filter(def => def.passesFilters(params));
        let noDupes = new Set(allMatches);
        return Array.from(noDupes).map(def => def.makeStaticCopy())
    }

    /**
     * For pulling entries that you know the eid of
     * @param eids
     * @param includeDeleted
     * @returns an array of all entries matching the criteria
     */
    getEntries(params: pdw.SanitizedParams): pdw.EntryLike[] {
        const allMatches = this.entries.filter(entry => entry.passesFilters(params));
        let noDupes = new Set(allMatches);
        return Array.from(noDupes).map(entry => new pdw.Entry(entry, false, entry.__def));
    }

    getTags(params: pdw.SanitizedParams): pdw.TagLike[] {
        const allMatches = this.tags.filter(tag => tag.passesFilters(params));
        let noDupes = new Set(allMatches);
        return Array.from(noDupes).map(tag => new pdw.Tag(tag, false));
    }

    /**
     * This function is a bit strange, but was extracted from
     * the 6 functions below, which were duplicates code-wise
     * @param elementsIn list of Elements (Defs, Entries, etc) to set
     * @param elementRepo the existing set of Elements in the DataStore (this.defs, this.entries, etc)
     */
    setElementsInRepo(elementsIn: pdw.Element[], elementRepo: pdw.ElementLike[]) {
        let newElements: pdw.Element[] = [];
        elementsIn.forEach(el => {
            //if we're *only* deleting or undeleting, this should find match.
            let sameUid = elementRepo.find(existingElement => existingElement._uid == el._uid);
            if(sameUid !== undefined){
                //only replace if the setDefs def is newer, necessary for StorageConnector merges
                if (sameUid.isOlderThan(el)) {
                    sameUid._deleted = el._deleted;
                    sameUid._updated = el._updated;
                }
                return
            }
            
            //if we're *updating* then we need to find based on the same element ID
            let sameId = elementRepo.find(existingElement => existingElement._deleted === false && existingElement.sameIdAs(el));
            if (sameId !== undefined) {
                //only replace if the setDefs def is newer, necessary for StorageConnector merges
                if (sameId.isOlderThan(el)) {
                    sameId._deleted = true;
                    sameId._updated = pdw.makeEpochStr();
                    newElements.push(el.makeStaticCopy());
                }
            } else {
                newElements.push(el.makeStaticCopy());
            }
        });

        elementRepo.push(...newElements);
        return elementsIn;
    }

    setDefs(defsIn: pdw.Def[]): pdw.Def[] {
        return this.setElementsInRepo(defsIn, this.defs) as pdw.Def[];
    }

    setEntries(entriesIn: pdw.Entry[]): pdw.Entry[] {
        return this.setElementsInRepo(entriesIn, this.entries) as pdw.Entry[];
    }

    setTags(tagData: pdw.Tag[]): pdw.TagLike[] {
        return this.setElementsInRepo(tagData, this.tags) as pdw.Tag[];
    }

    getOverview(): pdw.DataStoreOverview {
        throw new Error("Method not implemented.");
    }

    setAll(completeData: pdw.CompleteishDataset): pdw.CompleteishDataset {
        throw new Error("Method not implemented.");
    }

    connect(..._params: any): boolean {
        throw new Error("Method not implemented.");
    }

}

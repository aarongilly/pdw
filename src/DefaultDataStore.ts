import * as pdw from "./pdw";


export class DefaultDataStore implements pdw.DataStore {
    serviceName: string;
    pdw: pdw.PDW;
    defs: pdw.Def[];
    pointDefs: pdw.PointDef[];
    entries: pdw.Entry[];
    entryPoints: pdw.EntryPoint[];
    tagDefs: pdw.TagDef[];
    tags: pdw.Tag[];

    constructor(pdwRef: pdw.PDW) {
        this.serviceName = 'In memory dataset';
        this.pdw = pdwRef;
        this.defs = [];
        this.pointDefs = [];
        this.entries = [];
        this.entryPoints = [];
        this.tagDefs = [];
        this.tags = [];
    }

    query(params: pdw.QueryParams): pdw.QueryResponse {

        throw new Error("Method not implemented.");
    }

    getAll(params: pdw.SanitizedParams): pdw.CompleteDataset {
        return {
            defs: this.getDefs(params),
            pointDefs: this.getPointDefs(params),
            entries: this.getEntries(params),
            entryPoints: this.getEntryPoints(params),
            tagDefs: this.getTagDefs(params),
            tags: this.getTags(params),
        };
    }

    getDefs(params: pdw.SanitizedParams): pdw.DefLike[] {
        const allMatches = this.defs.filter(def => def.passesFilters(params));
        let noDupes = new Set(allMatches);
        return Array.from(noDupes);
    }

    getPointDefs(params: pdw.SanitizedParams): pdw.PointDefLike[] {
        const allMatches = this.pointDefs.filter(pd => pd.passesFilters(params));
        let noDupes = new Set(allMatches);
        return Array.from(noDupes);
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
        return Array.from(noDupes);
    }

    getEntryPoints(params: pdw.SanitizedParams): pdw.EntryPointLike[] {
        const allMatches = this.entryPoints.filter(entryPoint => entryPoint.passesFilters(params));
        let noDupes = new Set(allMatches);
        return Array.from(noDupes);
    }

    getTags(params: pdw.SanitizedParams): pdw.TagLike[] {
        const allMatches = this.tags.filter(tag => tag.passesFilters(params));
        let noDupes = new Set(allMatches);
        return Array.from(noDupes);
    }

    getTagDefs(params: pdw.SanitizedParams): pdw.TagDefLike[] {

        const allMatches = this.tagDefs.filter(tagDef => tagDef.passesFilters(params));
        let noDupes = new Set(allMatches);
        return Array.from(noDupes);
    }

    /**
     * This function is a bit strange, but was extracted from
     * the 6 functions below, which were duplicates code-wise
     * @param elementsIn list of Elements (Defs, Entries, etc) to set
     * @param elementRepo the existing set of Elements in the DataStore (this.defs, this.entries, etc)
     */
    setElementsInRepo(elementsIn: pdw.Element[], elementRepo: pdw.Element[]) {
        let newElements: pdw.Element[] = [];
        elementsIn.forEach(el => {
            if(el.__isNew){
                newElements.push(el);
                return;
            }
            let existing = elementRepo.find(existingElement => existingElement._deleted === false && existingElement.sameIdAs(el));
            if (existing !== undefined) {
                //only replace if the setDefs def is newer, necessary for StorageConnector merges
                if (existing.shouldBeReplacedWith(el)) {
                    existing.markDeleted();
                    if (!el._deleted)
                        newElements.push(el); //don't duplicate in case of calling setElement purely to delete
                }
            } else {
                newElements.push(el);
            }
        });
        elementRepo.push(...newElements);
        return elementsIn;
    }

    setDefs(defsIn: pdw.Def[]): pdw.Def[] {
        return this.setElementsInRepo(defsIn, this.defs) as pdw.Def[];
    }

    setPointDefs(pointDefsIn: pdw.PointDef[]) {
        return this.setElementsInRepo(pointDefsIn, this.pointDefs) as pdw.PointDef[];
    }

    setEntries(entriesIn: pdw.Entry[]): pdw.Entry[] {
        return this.setElementsInRepo(entriesIn, this.entries) as pdw.Entry[];
    }

    setEntryPoints(entryPointData: pdw.EntryPoint[]): pdw.EntryPoint[] {
        return this.setElementsInRepo(entryPointData, this.entryPoints) as pdw.EntryPoint[];
    }

    setTags(tagData: pdw.Tag[]): pdw.TagLike[] {
        return this.setElementsInRepo(tagData, this.tags) as pdw.Tag[];
    }

    setTagDefs(tagDefsIn: pdw.TagDef[]): pdw.TagDefLike[] {
        return this.setElementsInRepo(tagDefsIn, this.tagDefs) as pdw.TagDef[];
    }

    getOverview(): pdw.DataStoreOverview {
        throw new Error("Method not implemented.");
    }

    setAll(completeData: pdw.CompleteDataset): pdw.CompleteDataset {
        throw new Error("Method not implemented.");
    }

    connect(..._params: any): boolean {
        throw new Error("Method not implemented.");
    }

}

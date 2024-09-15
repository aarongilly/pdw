//@ts-ignore

export class Query {
    // private verbosity: 'terse' | 'normal' | 'verbose'
    // private rollup: boolean
    public pdw: PDW;
    private params: StandardParams
    private sortOrder: undefined | 'asc' | 'dsc'
    private sortBy: undefined | string
    private _manifest: Manifest;
    
    constructor(pdwRef: PDW, paramsIn?: StandardParams) {
        // this.verbosity = 'normal';
        // this.rollup = false;
        this.pdw = pdwRef;
        this.params = { includeDeleted: 'no' }; //default
        if (paramsIn !== undefined) this.parseParamsObject(paramsIn)
    }

    parseParamsObject(paramsIn: StandardParams) {
        if (paramsIn?.includeDeleted !== undefined) {
            if (paramsIn.includeDeleted === 'no') this.includeDeleted(false);
            if (paramsIn.includeDeleted === 'yes') this.includeDeleted(true);
            if (paramsIn.includeDeleted === 'only') this.onlyIncludeDeleted();
        }
        if (paramsIn?.allOnPurpose !== undefined) this.allOnPurpose(paramsIn.allOnPurpose);
        if (paramsIn?.createdAfter !== undefined) this.createdAfter(paramsIn.createdAfter);
        if (paramsIn?.createdBefore !== undefined) this.createdBefore(paramsIn.createdBefore);
        if (paramsIn?.updatedAfter !== undefined) this.updatedAfter(paramsIn.updatedAfter);
        if (paramsIn?.updatedBefore !== undefined) this.updatedBefore(paramsIn.updatedBefore);
        if (paramsIn?.defLbl !== undefined) this.forDefsLbld(paramsIn.defLbl);
        if (paramsIn?.did !== undefined) this.forDids(paramsIn.did);
        if (paramsIn?.uid !== undefined) this.uids(paramsIn.uid);
        if (paramsIn?.eid !== undefined) this.eids(paramsIn.eid);
        if (paramsIn?.tag !== undefined) this.tags(paramsIn.tag);
        if (paramsIn?.from !== undefined) this.from(paramsIn.from);
        if (paramsIn?.to !== undefined) this.to(paramsIn.to);
        if (paramsIn?.inPeriod !== undefined) this.inPeriod(paramsIn.inPeriod);
        if (paramsIn?.scope !== undefined) this.scope(paramsIn.scope);
        if (paramsIn?.today !== undefined) this.inPeriod(Period.now(Scope.DAY));
        if (paramsIn?.thisWeek !== undefined) this.inPeriod(Period.now(Scope.WEEK));
        if (paramsIn?.thisMonth !== undefined) this.inPeriod(Period.now(Scope.MINUTE));
        if (paramsIn?.thisQuarter !== undefined) this.inPeriod(Period.now(Scope.QUARTER));
        if (paramsIn?.thisYear !== undefined) this.inPeriod(Period.now(Scope.YEAR));
        return this
    }

    static parseFromURL(url: string): Query {
        console.log(url);

        throw new Error('unimplemented')

    }

    encodeAsURL(): string {
        //new URLSearchParams(obj).toString(); //ref code
        throw new Error('unimplemented')
    }

    includeDeleted(b = true) {
        if (b) {
            this.params.includeDeleted = 'yes';
        } else {
            this.params.includeDeleted = 'no';
        }
        return this
    }

    onlyIncludeDeleted() {
        this.params.includeDeleted = 'only';
        return this
    }

    forDids(didList: string[] | string) {
        if (!Array.isArray(didList)) didList = [didList];
        this.params.did = didList;
        return this
    }

    forDefsLbld(defLbls: string[] | string) {
        if (!Array.isArray(defLbls)) defLbls = [defLbls];
        this.params.defLbl = defLbls;
        return this
    }

    createdAfter(epochDateOrTemporal: EpochStr | Date | Temporal.ZonedDateTime) {
        const epoch = makeEpochStrFrom(epochDateOrTemporal);
        this.params.createdAfter = epoch;
        return this;
    }

    createdBefore(epochDateOrTemporal: EpochStr | Date | Temporal.ZonedDateTime) {
        const epoch = makeEpochStrFrom(epochDateOrTemporal);
        this.params.createdBefore = epoch;
        return this;
    }

    updatedAfter(epochDateOrTemporal: EpochStr | Date | Temporal.ZonedDateTime) {
        const epoch = makeEpochStrFrom(epochDateOrTemporal);
        this.params.updatedAfter = epoch;
        return this;
    }

    updatedBefore(epochDateOrTemporal: EpochStr | Date | Temporal.ZonedDateTime) {
        const epoch = makeEpochStrFrom(epochDateOrTemporal);
        this.params.updatedBefore = epoch;
        return this;
    }

    forDefs(defList: Def[] | Def) {
        if (!Array.isArray(defList)) defList = [defList];
        return this.forDids(defList.map(def => def.did));
    }

    uids(uid: string[] | string) {
        if (!Array.isArray(uid)) uid = [uid];
        this.params.uid = uid;
        return this
    }

    eids(eid: string[] | string) {
        if (!Array.isArray(eid)) eid = [eid];
        this.params.eid = eid;
        return this
    }

    rollup(to: Scope) {
        to = to.toUpperCase() as Scope;
        this.params.rollup = to;
        return this
    }

    /**
     * Cannot be used in conjuction with dids. This sets `params.did` internally.
     * @param tid tag ID of tags to be used
     * @returns 
     */
    tags(tags: string[] | string) {
        if (!Array.isArray(tags)) tags = [tags];
        //convert tags into dids
        const dids = this.pdw.manifest.filter(def => def.hasTag(tags))
        this.params.did = dids.map(d => d.data._did);
        return this
    }

    scope(scopes: Scope[] | Scope): Query {
        if (!Array.isArray(scopes)) scopes = [scopes];
        let defs = this.pdw.manifest.filter(def => (<Scope[]>scopes).some(scope => scope === def.scope));
        this.params.did = defs.map(def => def.did);
        return this
    }

    scopeMin(scope: Scope): Query {
        let scopes = Object.values(Scope);
        let index = scopes.indexOf(scope);
        return this.scope(scopes.slice(index));
    }

    scopeMax(scope: Scope): Query {
        let scopes = Object.values(Scope);
        let index = scopes.indexOf(scope);
        return this.scope(scopes.slice(0, index + 1));
    }

    allOnPurpose(allIn = true): Query {
        this.params.allOnPurpose = allIn;
        return this
    }

    from(period: Period | PeriodStr) {
        this.params.from = period;
        return this
    }

    to(period: Period | PeriodStr) {
        this.params.to = period;
        return this
    }

    inPeriod(period: Period | PeriodStr) {
        this.params.from = period;
        this.params.to = period;
        return this
    }

    /**
     * How to sort the entries in the result.
     * @param propName underscore-prefixed known prop, or the pid of the Point to sort by
     * @param type defaults to 'asc'
     */
    sort(propName: string, type: undefined | 'asc' | 'dsc') {
        if (type === undefined) type = 'asc';
        this.sortOrder = type;
        this.sortBy = propName;
    }

    async run(): Promise<QueryResponse> {
        //empty queries are not allowed
        if (this.params === undefined ||
            (!this.params.allOnPurpose && Object.keys(this.params).length <= 1)
        ) {
            return {
                success: false,
                count: 0,
                params: {
                    paramsIn: this.params,
                    asParsed: this.pdw.sanitizeParams(this.params)
                },
                msgs: ['Empty queries not allowed. If seeking all, include {allOnPurpose: true}'],
                entries: []
            }
        }
        let entries = await this.pdw.getEntries(this.params);
        if (this.sortBy !== undefined) entries = this.applySort(entries);
        let resp: QueryResponse = {
            success: true,
            count: entries.length,
            params: {
                paramsIn: this.params,
                asParsed: this.pdw.sanitizeParams(this.params)
            },
            entries: entries,
            summary: this.params.hasOwnProperty('rollup') ? PDW.summarize(entries, this.params.rollup as Scope) : undefined
        }
        return resp
    }

    private applySort(entries: Entry[]): Entry[] {
        return entries.sort((a, b) => {
            if (this.sortOrder === 'asc') {
                //@ts-expect-error
                return a[this.sortBy] > b[this.sortBy] ? 1 : -1
            }
            //@ts-expect-error
            return a[this.sortBy] > b[this.sortBy] ? -1 : 1
        })
    }
}
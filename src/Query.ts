//#TODO

import { Temporal } from "temporal-polyfill";
import { QueryObject, Entry, Def, EpochStr } from "./DJ";
import { PDW } from "./pdw";
import { Period, PeriodStr, Scope } from "./Period";

/**
 * The full set of parameters that can be used for building a Query.
 * This is a superset of {@link QueryObject}
 */
export interface StandardParams extends QueryObject {
    /**
     * Include things marked as deleted?
     * no - default
     * yes - include all
     * only - only include deleted things
     */
    includeDeleted?: 'yes' | 'no' | 'only',
    /**
     * Lower-bound of Entry.period.
     * Like all Periods, does not contain Time Zone info.
     * Will be treated as the FIRST SECOND of the Period or PeriodStr provided.
     * Example:
     * "2023-Q2" would be synonymous with "2023-04-01T:00:00:00"
     */
    from?: Period | PeriodStr,
    /**
     * Upper-bound of Entry.period. 
     * Like all Periods, does not contain Time Zone info.
     * Will be treated as the LAST SECOND of the Period or PeriodStr provided.
     * Example:
     * "2023-Q2" would be synonymous with "2023-08-31T:23:59:59"
     */
    to?: Period | PeriodStr,
    /**
     * Entry period. Sets the Query.from and Query.to values internally.
     */
    inPeriod?: Period | string
    /**
     * The lower-bound of Element.created, represented as an {@link EpochStr}
     * or Temporal.ZonedDateTime. 
     */
    createdAfter?: Temporal.ZonedDateTime | EpochStr,
    /**
     * The upper-bound of Element.created, represented as an {@link EpochStr}
     * or Temporal.ZonedDateTime. 
     */
    createdBefore?: Temporal.ZonedDateTime | EpochStr,
    /**
     * The lower-bound of Element.updated, represented as an {@link EpochStr}
     * or Temporal.ZonedDateTime. 
     */
    updatedAfter?: Temporal.ZonedDateTime | EpochStr,
    /**
     * The upper-bound of Element.updated, represented as an {@link EpochStr}
     * or Temporal.ZonedDateTime. 
     */
    updatedBefore?: Temporal.ZonedDateTime | EpochStr,
    /**
     * A list of Entry._id. Will filter to Elements in the list.
     */
    entryId?: string[] | string,
    /**
     * A list of Def._id. Will filter to Elements in the list.
     */
    defId?: string[] | string,
    /**
     * A list of strings for the associated with Def.lbl
     * Internally, this is translated into a list of _did strings, and behaves like
     * {@link StandardParams.did}
     * For Entry and Def elements, will return those with Element.did in the list.
     */
    defLbl?: string[] | string,
    //pointLbl?: string[] | string, do you want to support this
    /**
     * A list of strings.
     * Will return any Tag(s) whose Tag.lbl is in the list.
     */
    tag?: string,
    /**
     * Reduces the resulting {@link Def} and {@link} Entry results to those whose
     * scope is in the provided list.
     */
    scope?: Scope | Scope[];
    /**
     * A limit on the number of responses returned. Probably unsorted and therefore
     * not super helpful, but this is something I'd like to support.
     */
    limit?: number,//#TODO
    /**
     * If an empty query is sent without this field, the query is rejected.
     * This is prevent the error trap of accidentally asking for *everything*,
     * which could be expensive in cloud-based datastores.
     */
    allOnPurpose?: boolean
    /**
     * If provdided, will query for the current day. Will ignore any provided values
     */
    today?: any;
    /**
     * If provdided, will query for the current week. Will ignore any provided values
     */
    thisWeek?: any;
    /**
     * If provdided, will query for the current month. Will ignore any provided values
     */
    thisMonth?: any;
    /**
     * If provdided, will query for the current quarter. Will ignore any provided values
     */
    thisQuarter?: any;
    /**
     * If provdided, will query for the current year. Will ignore any provided values
     */
    thisYear?: any;
    /**
     * If provided, the query response will include Period rollups
     */
    rollup?: Scope
}

export class Query {
    // private verbosity: 'terse' | 'normal' | 'verbose'
    // private rollup: boolean
    public pdw: PDW;
    private params: StandardParams
    private sortOrder: undefined | 'asc' | 'dsc'
    private sortBy: undefined | string
    
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

    /**
     * Enforces defaults. Sanity check some types.
     * Less variability in the output
     * @param params rawParams in
     * @returns santized params out
     */
    sanitizeParams(params: StandardParams): dj.QueryObject {
        //ensure default
        if (params.includeDeleted === undefined) params.includeDeleted = 'no';

        if (params?.today !== undefined) params.inPeriod = Period.now(Scope.DAY);
        if (params?.thisWeek !== undefined) params.inPeriod = Period.now(Scope.WEEK);
        if (params?.thisMonth !== undefined) params.inPeriod = Period.now(Scope.MINUTE);
        if (params?.thisQuarter !== undefined) params.inPeriod = Period.now(Scope.QUARTER);
        if (params?.thisYear !== undefined) params.inPeriod = Period.now(Scope.YEAR);

        if (params.hasOwnProperty("inPeriod")) {
            let period = params.inPeriod as Period
            if (typeof params.inPeriod === 'string') period = new Period(params.inPeriod);
            params.from = new Period(period).getStart();
            params.to = new Period(period).getEnd();
        }

        //make periods from period strings
        if (params.from !== undefined) {
            if (typeof params.from === 'string') {
                params.from = new Period(params.from);
            }
            //otherwise I guess I'll assume it's okay
        }
        if (params.to !== undefined) {
            if (typeof params.to === 'string') {
                params.to = new Period(params.to);
            }
            //otherwise I guess I'll assume it's okay
        }

        //make Temporal & EpochStr options
        if (params.createdAfter !== undefined) {
            if (typeof params.createdAfter === 'string') {
                params.createdAfter = parseTemporalFromEpochStr(params.createdAfter);
                (<ReducedParams>params).createdAfterEpochStr = makeEpochStrFrom(params.createdAfter);
            } else {
                (<ReducedParams>params).createdAfterEpochStr = makeEpochStrFrom(params.createdAfter);
                params.createdAfter = parseTemporalFromEpochStr((<ReducedParams>params).createdAfterEpochStr!);
            }
        }
        if (params.createdBefore !== undefined) {
            if (typeof params.createdBefore === 'string') {
                params.createdBefore = parseTemporalFromEpochStr(params.createdBefore);
                (<ReducedParams>params).createdBeforeEpochStr = makeEpochStrFrom(params.createdBefore);
            } else {
                (<ReducedParams>params).createdBeforeEpochStr = makeEpochStrFrom(params.createdBefore);
                params.createdBefore = parseTemporalFromEpochStr((<ReducedParams>params).createdBeforeEpochStr!);
            }
        }
        if (params.updatedAfter !== undefined) {
            if (typeof params.updatedAfter === 'string') {
                params.updatedAfter = parseTemporalFromEpochStr(params.updatedAfter);
                (<ReducedParams>params).updatedAfterEpochStr = makeEpochStrFrom(params.updatedAfter);
            } else {
                (<ReducedParams>params).updatedAfterEpochStr = makeEpochStrFrom(params.updatedAfter);
                params.updatedAfter = parseTemporalFromEpochStr((<ReducedParams>params).updatedAfterEpochStr!);
            }
        }
        if (params.updatedBefore !== undefined) {
            if (typeof params.updatedBefore === 'string') {
                params.updatedBefore = parseTemporalFromEpochStr(params.updatedBefore);
                (<ReducedParams>params).updatedBeforeEpochStr = makeEpochStrFrom(params.updatedBefore);
            } else {
                (<ReducedParams>params).updatedBeforeEpochStr = makeEpochStrFrom(params.updatedBefore);
                params.updatedBefore = parseTemporalFromEpochStr((<ReducedParams>params).updatedBeforeEpochStr!);
            }
        }

        //ensure arrays
        if (params.uid !== undefined && typeof params.uid == 'string') params.uid = [params.uid]
        if (params.eid !== undefined && typeof params.eid == 'string') params.eid = [params.eid]
        if (params.defLbl !== undefined && typeof params.defLbl == 'string') params.did = this._manifest.filter(def => (<string[]>params.defLbl)!.some(dl => dl === def.lbl)).map(def => def.did);
        if (params.did !== undefined && typeof params.did == 'string') params.did = [params.did]
        if (params.scope !== undefined && typeof params.scope == 'string') params.scope = [params.scope];

        if (params.tag !== undefined && typeof params.tag == 'string') params.did = this._manifest.filter(def => def.hasTag(params.tag!)).map(def => def.did);

        if (params.limit !== undefined && typeof params.limit !== "number") {
            console.error('Your params were: ', params)
            throw new Error('You tried to supply a limit param with a non-number.')
        }

        return params as ReducedParams
    }

import { DataJournal, Def, DJ, Entry, EpochStr, QueryObject } from "./DataJournal.js";
import { Period, PeriodStr, Scope } from "./Period.js";
import { Temporal } from "temporal-polyfill";

/**
 * QueryMaker is a class to build {@link QueryObject}s.
 * Some of the methods to make a QueryObject require knowledge
 * of the set of {@link Def}s being used. So the constructor 
 * takes in an optional array of Defs.
 * 
 * QueryMaker uses a "Builder" pattern.
 */
export class QueryBuilder {
    private _defs: Def[];
    private _queryObject: QueryObject
    /**
     * QueryMaker is a class to build {@link QueryObject}s.
     * Some of the methods to make a QueryObject require knowledge
     * of the set of {@link Def}s being used. So the constructor 
     * takes in an optional array of Defs.
     */
    constructor(inputObj?: { defs?: Def[], dj?: DataJournal, params?: StandardParams, queryObject?: QueryObject }) {
        this._queryObject = {};
        this._defs = [];
        if (inputObj === undefined) return
        if (Object.hasOwn(inputObj, 'defs')) this._defs = inputObj.defs!;
        if (Object.hasOwn(inputObj, 'dj')) this._defs = inputObj.dj!.defs;
        if (Object.hasOwn(inputObj, 'queryObject')) this._queryObject = inputObj.queryObject!;
        if (Object.hasOwn(inputObj, 'params')) this.parseStandardParams(inputObj.params!);
    }

    toQueryObject(): QueryObject {
        return this._queryObject;
    }

    /* Static version for implicitly making then using a QueryBuilder instance */
    static makeQueryObject(inputObj: { defs?: Def[], dj?: DataJournal, params?: StandardParams, queryObject?: QueryObject }): QueryObject {
        let tempQueryMaker = new QueryBuilder(inputObj);
        return tempQueryMaker.toQueryObject();
    }

    parseStandardParams(params: StandardParams) {
        if (params?.deleted !== undefined) this.deleted(params?.deleted);
        if (params?.updatedAfter !== undefined) this.updatedAfter(params.updatedAfter);
        if (params?.updatedBefore !== undefined) this.updatedBefore(params.updatedBefore);
        if (params?.defLbl !== undefined) this.forDefsLbld(params.defLbl);
        if (params?.defId !== undefined) this.forDids(params.defId);
        if (params?.entryId !== undefined) this.eids(params.entryId);
        if (params?.tag !== undefined) this.tags(params.tag);
        if (params?.from !== undefined) this.from(params.from);
        if (params?.to !== undefined) this.to(params.to);
        if (params?.inPeriod !== undefined) this.inPeriod(params.inPeriod);
        if (params?.scope !== undefined) this.scope(params.scope);
        if (params?.today !== undefined) this.inPeriod(Period.now(Scope.DAY));
        if (params?.thisWeek !== undefined) this.inPeriod(Period.now(Scope.WEEK));
        if (params?.thisMonth !== undefined) this.inPeriod(Period.now(Scope.MINUTE));
        if (params?.thisQuarter !== undefined) this.inPeriod(Period.now(Scope.QUARTER));
        if (params?.thisYear !== undefined) this.inPeriod(Period.now(Scope.YEAR));

        if (params.limit !== undefined && typeof params.limit !== "number") {
            console.error('Your params were: ', params)
            throw new Error('You tried to supply a limit param with a non-number.')
        }
        if (params.limit) this._queryObject.limit = params.limit;

        return this
    }

    /**
     * Applies the built-up internal QueryObject against a DataJournal
     * @param entriesOrJournal The Entries or DataJournal to filter
     */
    runQueryOn(entriesOrJournal: Entry[] | DataJournal): Entry[] | DataJournal {
        return DJ.filterTo(this._queryObject, entriesOrJournal)
    }

    deleted(include: boolean) {
        this._queryObject.deleted = include;
    }

    deletedAndUndeleted() {
        this._queryObject.deleted = undefined;
    }

    forDids(didList: string[] | string) {
        if (!Array.isArray(didList)) didList = [didList];
        if(this._defs.length === 0) throw new Error('There are no defs loaded in the QueryBuilder')
        this._queryObject.defs = didList;
        return this
    }

    forDefsLbld(defLbls: string[] | string) {
        if (!Array.isArray(defLbls)) defLbls = [defLbls];
        if(this._defs.length === 0) throw new Error('There are no defs loaded in the QueryBuilder');
        this._queryObject.defs = this._defs.filter(def => defLbls.some(d => DJ.standardizeKey(d) === DJ.standardizeKey(def._lbl!))).map(def => def._id);
        return this
    }

    updatedAfter(epochDateOrTemporal: EpochStr | Date | Temporal.ZonedDateTime) {
        if (epochDateOrTemporal instanceof Temporal.ZonedDateTime) epochDateOrTemporal = new Date(epochDateOrTemporal.epochMilliseconds);
        const epoch = DJ.makeEpochStrFrom(epochDateOrTemporal);
        this._queryObject.updatedAfter = epoch;
        return this;
    }

    updatedBefore(epochDateOrTemporal: EpochStr | Date | Temporal.ZonedDateTime) {
        if (epochDateOrTemporal instanceof Temporal.ZonedDateTime) epochDateOrTemporal = new Date(epochDateOrTemporal.epochMilliseconds);
        const epoch = DJ.makeEpochStrFrom(epochDateOrTemporal);
        this._queryObject.updatedBefore = epoch;
        return this;
    }

    forDefs(defList: Def[] | Def) {
        if (!Array.isArray(defList)) defList = [defList];
        if(this._defs.length === 0) throw new Error('There are no defs loaded in the QueryBuilder')
        this._queryObject.defs = defList.map(def => def._id);
        return this;
    }

    eids(eid: string[] | string) {
        if (!Array.isArray(eid)) eid = [eid];
        this._queryObject.entryIds = eid;
        return this
    }

    /**
     * Cannot be used in conjuction with dids. This sets `_queryObject.did` internally.
     */
    tags(tags: string[] | string) {
        if (!Array.isArray(tags)) tags = [tags];
        if(this._defs.length === 0) throw new Error('There are no defs loaded in the QueryBuilder')
        //convert tags into dids
        const dids: Def[] = this._defs.filter(def => {
            if (def._tags === undefined) return false
            return DJ.strArrayShareElementStandardized(def._tags, tags);
        })
        this._queryObject.defs = dids.map(d => d._id);
        return this
    }

    scope(scopes: Scope[] | Scope) {
        if (!Array.isArray(scopes)) scopes = [scopes];
        if(this._defs.length === 0) throw new Error('There are no defs loaded in the QueryBuilder')
        this._queryObject.defs = this._defs.filter(def => scopes.some(s => s === def._scope)).map(def=>def._id);
        return this
    }

    scopeMin(scope: Scope) {
        let scopes = Object.values(Scope);
        let index = scopes.indexOf(scope);
        return this.scope(scopes.slice(index));
    }

    scopeMax(scope: Scope) {
        let scopes = Object.values(Scope);
        let index = scopes.indexOf(scope);
        return this.scope(scopes.slice(0, index + 1));
    }

    from(period: Period | PeriodStr) {
        if (typeof period === 'string') {
            period = new Period(period);
        }
        this._queryObject.from = period.zoomTo(Scope.SECOND).toString()
        return this
    }

    to(period: Period | PeriodStr) {
        if (typeof period === 'string') {
            period = new Period(period)
        }
        this._queryObject.to = period.zoomTo(Scope.SECOND).toString()
        return this
    }

    inPeriod(period: Period | PeriodStr) {
        let periodStart, periodEnd;
        if (typeof period === 'string') {
            periodStart = new Period(period).getStart().toString();
            periodEnd = new Period(period).getEnd().toString();
        }
        this._queryObject.from = periodStart;
        this._queryObject.to = periodEnd;
        return this
    }
}

/**
 * The full set of parameters that can be used for building a Query.
 * This is a superset of {@link QueryObject}, but with looser types.
 */
export interface StandardParams {
    /**
     * Filters entries based on their _deleted key
     * true - includes ONLY deleted entries
     * false - includes ONLY undeleted entries
     * 
     * Omit to include *all* entries
     */
    deleted?: boolean,
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
    limit?: number,
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
}
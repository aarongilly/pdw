import { Temporal } from "temporal-polyfill";
import { Entry, DataJournal, Def, DJ, Rollup, DefType } from "./DataJournal.js";
import { Period, PeriodStr, Scope } from "./Period.js";

export const temp = "todo";

export interface EntryRollup {
    defId: string,
    val: any,
    method: Rollup,
    rawVals: any[],
}

export interface PeriodSummary {
    period: PeriodStr | "ALL";
    entryRollups: EntryRollup[];
    entries: Entry[]
}

export interface OneEntryPerPeriodReport {
    /**
     * The level of granularity the report covers
     */
    scope: Scope,
    /**
     * The Earliest Period found
     */
    firstPeriod: PeriodStr
    /**
     * The Earliest Period found
     */
    lastPeriod: PeriodStr
    /**
     * The Def to check for
     */
    def: Def,
    /**
     * Periods containing no Entries with the Def
     */
    emptyPeriods: PeriodStr[],
    /**
     * Periods with more than one Entry containing the Def
     */
    overFilledPeriods: PeriodStr[]
}

export class Summarizor {
    static summarize(dataJournal: DataJournal, toScope: Scope | "ALL" = "ALL", includeEmpty = false) {
        const defs = dataJournal.defs;
        let periodGroupedEntries = {}
        if (toScope !== 'ALL') periodGroupedEntries = DJ.groupByPeriod(dataJournal.entries, toScope, includeEmpty);
        if (toScope === 'ALL') periodGroupedEntries = { "ALL": dataJournal.entries };
        const periodSummaries: PeriodSummary[] = [];
        Object.keys(periodGroupedEntries).forEach(periodStr => {
            periodSummaries.push(Summarizor.createPeriodSummary(periodStr, periodGroupedEntries[periodStr], defs))
        })
        return periodSummaries;
    }

    private static createPeriodSummary(periodStr: PeriodStr | 'ALL', entries: Entry[], defs: Def[]) {
        const returnObj: PeriodSummary = {
            period: periodStr,
            entries: entries,
            entryRollups: []
        }
        const groupByDefs = DJ.groupByDefs(entries);
        Object.keys(groupByDefs).forEach(defId => {
            const associatedDef = defs.find(def => def._id === defId);
            if (associatedDef === undefined) return;
            returnObj.entryRollups.push(Summarizor.rollupEntryPoint(groupByDefs[defId], associatedDef))
        })
        return returnObj;
    }

    static rollupEntryPoint(entries: Entry[], propDef: Def, methodOverride?: Rollup) {
        let method = propDef._rollup!;
        if (methodOverride !== undefined) method = methodOverride as Rollup;
        if (method === undefined) method = Rollup.COUNT; //default if no _rollup key was defined no an override used

        const rawVals = entries.map(entry => entry[propDef._id]);
        if (rawVals.some(val => val === undefined)) throw new Error("Undefined value found in rollupEntryPoint");

        const val = Summarizor.applyRollup(rawVals, method, propDef._type);

        const returnObj: EntryRollup = {
            defId: propDef._id,
            val: val,
            method: method,
            rawVals: rawVals
        }
        return returnObj
    }

    static checkOnePerPeriod(journal: DataJournal, defId: string, scope: Scope): OneEntryPerPeriodReport {
        if (!DJ.isValidDataJournal(journal)) throw new Error('The supplied DataJournal is invalid');
        const defFound = journal.defs.find(def => DJ.stringsAreEqualStandardized(def._id, defId));
        if (defFound === undefined) throw new Error('The supplied defId was not found in the supplied Journal');
        if (scope === Scope.SECOND || scope === Scope.MINUTE || scope === Scope.HOUR) throw new Error("Scopes less than Scope.DAY not supported");

        const periodsContained = journal.entries
            .filter(entry=> entry[defId] !== undefined)
            .map(entry => new Period(entry._period).zoomTo(scope).toString())
            .sort((a: string, b: string) => a > b ? 1 : -1);
        
        const returnObj: OneEntryPerPeriodReport = {
            scope: scope,
            firstPeriod: new Period(periodsContained[0]).zoomTo(scope).toString(),
            lastPeriod: new Period(periodsContained[periodsContained.length - 1]).zoomTo(scope).toString(),
            def: defFound,
            emptyPeriods: [],
            overFilledPeriods: []
        }

        const allPeriodsInRange = Period.allPeriodsIn(new Period(returnObj.firstPeriod), new Period(returnObj.lastPeriod), scope, true) as string[];
        const [missing, duplicated] = compareSortedArrays(allPeriodsInRange, periodsContained);
        

        //make periods reflect the granularity of the request
        returnObj.firstPeriod = new Period(returnObj.firstPeriod).zoomTo(scope).toString();
        returnObj.lastPeriod = new Period(returnObj.lastPeriod).zoomTo(scope).toString();
        returnObj.emptyPeriods = missing;
        returnObj.overFilledPeriods = duplicated;
        return returnObj;

        function compareSortedArrays(allPeriodsInRange: string[], periodsContained: string[]): [string[], string[]] {
            const missingPeriods: string[] = [];
            const duplicatePeriods: string[] = [];
            let i = 0;
            let j = 0;
          
            while (i < allPeriodsInRange.length && j < periodsContained.length) {
              if (allPeriodsInRange[i] < periodsContained[j]) {
                missingPeriods.push(allPeriodsInRange[i]);
                i++;
              } else if (allPeriodsInRange[i] > periodsContained[j]) {
                j++;
              } else {
                let count = 0;
                while (i < allPeriodsInRange.length && allPeriodsInRange[i] === periodsContained[j]) {
                  count++;
                  j++;
                }
                i++;
                if (count > 1) {
                    duplicatePeriods.push(allPeriodsInRange[i - 1]);
                }
              }
            }
          
            // Add any remaining elements from allPeriodsInRange to missingPeriods
            while (i < allPeriodsInRange.length) {
              missingPeriods.push(allPeriodsInRange[i]);
              i++;
            }
          
            return [missingPeriods, duplicatePeriods];
          }
    }

    private static applyRollup(rawVals: any[], method: Rollup, valType: DefType) {
        if (method === Rollup.COUNT) return rawVals.length;
        if (method === Rollup.AVERAGE) {
            if (valType === DefType.DURATION) return doAverageDuration(rawVals);
            if (valType === DefType.NUMBER) return doAverage(rawVals);
            if (valType === DefType.TIME) return doAverageTime(rawVals);
            throw new Error("Tried to average an unsupported type: " + valType)
        }
        if (method === Rollup.SUM) {
            if (valType === DefType.NUMBER) return doSum(rawVals);
            if (valType === DefType.DURATION) return doSumDuration(rawVals);
            throw new Error("Tried to sum an unsupported type: " + valType)
        }
        //@ts-expect-error - supporting an old name
        if (method === Rollup.COUNTDISTINCT || method === "COUNTUNIQUE") {
            if (valType === DefType.MULTISELECT) return doCountDistinctMultiselect(rawVals)
            return doCountDistinct(rawVals);
        }
        if (method === Rollup.COUNTOFEACH) {
            if (valType === DefType.MULTISELECT) return doCountOfEachMultiselect(rawVals)
            return doCountOfEach(rawVals);
        }
        throw new Error('Tried to rollup and unsuppored Method: ' + method);
    }
}

function doAverage(vals: number[]) {
    let sum = doSum(vals)
    const ave = sum / vals.length;
    const rounded = Math.round(ave * 100) / 100 //2 decimals
    return rounded
}

function doAverageDuration(vals: string[]): string {
    if (typeof vals[0] !== 'string') throw new Error('Period average saw a non-string');
    const sum = vals.reduce((pv, val) => Math.round(pv + Temporal.Duration.from(val).total('seconds')), 0);
    const ave = sum / vals.length;
    const temp = Temporal.Duration.from({ seconds: ave }).round({ largestUnit: 'day' });
    return temp.toLocaleString();
}

function doAverageTime(vals: string[]) {// Temporal.PlainTime {
    //want average to be about 4pm, so any time *before* 4pm I add 1-day's worth of seconds to
    let runningTotalInSeconds = 0;
    vals.forEach(val => {
        const time = Temporal.PlainTime.from(val)
        let delta = Temporal.PlainTime.from('00:00:00').until(time)
        const hrs = delta.hours;
        const mins = delta.minutes;
        const secs = delta.seconds;
        //add 24hrs if its before 4am
        if (hrs < 4) runningTotalInSeconds = runningTotalInSeconds + 86400; //add 24 hrs if its before 4am
        runningTotalInSeconds = runningTotalInSeconds + hrs * 3600;
        runningTotalInSeconds = runningTotalInSeconds + mins * 60;
        runningTotalInSeconds = runningTotalInSeconds + secs;

    })
    // let sum = doSum(vals)
    const averageSeconds = Math.round(runningTotalInSeconds / vals.length);
    const timeAverage = Temporal.PlainTime.from('00:00:00').add({ seconds: averageSeconds })
    return timeAverage.toString();
}

function doSum(vals: number[]) {
    return vals.reduce((pv, val) => pv + val, 0);
}

function doSumDuration(vals: string[]) {
    if (typeof vals[0] !== 'string') throw new Error('Duration average saw a non-string')
    // let temp = Temporal.Duration.from(vals[0]).total('seconds');
    const sum = vals.reduce((pv, val) => pv + Temporal.Duration.from(val).total('seconds'), 0);
    const temp = Temporal.Duration.from({ seconds: sum }).round({ largestUnit: 'day' });
    return temp.toLocaleString();
}

function doCountOfEach(vals: string[]) {
    let strings = [...new Set(vals)];
    let stringCounts = '';
    strings.forEach(str => {
        stringCounts = str + ": " + vals.filter(s => s == str).length + ", " + stringCounts;
    })
    return stringCounts.substring(0, stringCounts.length - 2);
}

function doCountOfEachMultiselect(vals: string[][]): string {
    //convert array of arrays into one big array, then just treat same as "count of each"
    const convertedVals: string[] = [];
    vals.forEach(arr => { convertedVals.push(...arr) });
    return doCountOfEach(convertedVals);
}

function doCountDistinct(vals: any[]): number {
    return [...new Set(vals)].length;

}

function doCountDistinctMultiselect(vals: string[][]): number {
    //convert array of arrays into one big array, then just treat same as "count of each"
    const convertedVals: string[] = [];
    vals.forEach(arr => { convertedVals.push(...arr) });
    return doCountDistinct(convertedVals);
}

//#TODO


export interface PointRollup {
    val: any;
    method: dj.Rollup;
    vals: any[];
}

export interface EntryRollup {
    def: dj.Def;
    pts: PointRollup[];
}

export interface PeriodSummary {
    period: PeriodStr | "ALL";
    entryRollups: EntryRollup[];
    entries: dj.Entry[]
}

export class Summarizor{
    
}


    /**
     * Takes in an array of {@link Entry} instances sharing a common Def and applies the default rollup to 
     * each of the EntryPoints contained in the Entries. Produces an {@link EntryRollup}
     */
    function rollupEntries(entries: EntryData[]): EntryRollup { //#TODO - add RollupOverride param
        const def = this.getDefFromManifest(entries[0]._did);
        if (def === undefined) throw new Error("No definition found with _did: " + entries[0]._did);
        return PDW.rollupEntries(entries, def)
    }

    /**
     * Takes in an array of {@link Entry} instances sharing a common Def and applies the default rollup to 
     * each of the EntryPoints contained in the Entries. Produces an {@link EntryRollup}
     */
    function rollupEntries(entries: EntryData[], def: Def): EntryRollup { //#TODO - add RollupOverride param
        if (def === undefined) console.log(entries[0])
        const pointDefs = def.pts;
        let returnObj = {
            did: def.did,
            lbl: def.lbl,
            emoji: def.emoji,
            pts: [] as PointRollup[]
        }
        //**********TEMP CHANGE*/
        return returnObj
        //************ */

        pointDefs.forEach(pd => {
            let vals: any[] = [];
            entries.forEach(e => {

                let point = e[pd.pid];
                if (point !== undefined) vals.push(point);
            })
            let ptRlp: PointRollup = {
                pid: pd.pid,
                lbl: pd.lbl,
                emoji: pd.emoji,
                method: pd.rollup,
                vals: vals,
                val: undefined
            }
            if (pd.rollup === Rollup.COUNT) ptRlp.val = vals.length;
            if (pd.rollup === Rollup.AVERAGE) {
                const type = pd.type;
                if (type === PointType.NUMBER) ptRlp.val = doAverage(vals);
                if (type === PointType.DURATION) ptRlp.val = doAverageDuration(vals);
                if (type === PointType.TIME) ptRlp.val = doAverageTime(vals);
                if (type !== PointType.NUMBER && type !== PointType.DURATION && type !== PointType.TIME) {
                    console.warn('Tried averaging a point with unsupported type ' + type);
                    ptRlp.val = -1; //hint at an error in the UI
                }
            }
            if (pd.rollup === Rollup.SUM) {
                const type = pd.type;
                if (type === PointType.NUMBER) ptRlp.val = doSum(vals);
                if (type === PointType.DURATION) ptRlp.val = doSumDuration(vals);
            }
            if (pd.rollup === Rollup.COUNTOFEACH) ptRlp.val = doCountOfEach(vals);
            if (pd.rollup === Rollup.COUNTUNIQUE) ptRlp.val = doCountUnique(vals);

            returnObj.pts.push(ptRlp);
        })
        return returnObj

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
            return Temporal.Duration.from({ seconds: ave }).toLocaleString();
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
            return Temporal.Duration.from({ seconds: sum }).toLocaleString();
        }

        function doCountOfEach(vals: string[]) {
            let strings = [...new Set(vals)];
            let stringCounts = '';
            strings.forEach(str => {
                stringCounts = str + ": " + vals.filter(s => s == str).length + ", " + stringCounts;
            })
            return stringCounts.substring(0, stringCounts.length - 2);
        }

        function doCountUnique(vals: any[]): number {
            return [...new Set(vals)].length;

        }
    }

    function summarize(entries: Entry[] | EntryData[], scope: Scope | "ALL"): PeriodSummary[] {
        if (entries.length === 0) throw new Error("No entries to summarize");
        if (scope === Scope.MINUTE || scope === Scope.SECOND) throw new Error("Rollups to scopes below one hour are not supported."); //I imagine if this happens it would be unintentional
        let entryDataArr = entries as EntryData[];
        if (!entryDataArr[0].hasOwnProperty('_eid')) entryDataArr = entryDataArr.map(e => e.toData()) as EntryData[];
        let periodStrs: PeriodStr[] = [...new Set(entryDataArr.map(e => e._period))];
        let earliest = periodStrs.reduce((prev, periodStr) => {
            const start = new Period(periodStr).getStart().toString();
            return start < prev ? start : prev
        });
        let latest = periodStrs.reduce((prev, periodStr) => {
            const end = new Period(periodStr).getEnd().toString();
            return end > prev ? end : prev
        });

        /* Added this to support transitioning to a static function */
        const defMap: { [did: string]: Def } = {};
        entries.forEach(entry => {
            defMap[entry.def.did] = entry.def;
        })

        if (scope === 'ALL') {
            let entsByType = splitEntriesByType(entryDataArr);
            const keys = Object.keys(entsByType);
            let rollups: EntryRollup[] = [];
            keys.forEach(key =>
                rollups.push(PDW.rollupEntries(entsByType[key], defMap[key])))
            return [{
                period: 'ALL',
                entryRollups: rollups,
                entries: entryDataArr
            }];
        }
        console.log('PERIODS SPOT')
        let periods = Period.allPeriodsIn(new Period(earliest), new Period(latest), (<Scope>scope), false) as Period[];
        return periods.map(p => {
            console.log(p.periodStr);
            let ents = entryDataArr.filter(e => p.contains(e._period));
            let entsByType = splitEntriesByType(ents);
            const keys = Object.keys(entsByType);
            let rollups: EntryRollup[] = [];
            keys.forEach(key =>
                rollups.push(PDW.rollupEntries(entsByType[key], defMap[key])))
            return {
                period: p.toString(),
                entryRollups: rollups,
                entries: ents
            }
        })

        function splitEntriesByType(entries: EntryData[]): { [dids: string]: any; } {
            let entryTypes: { [dids: string]: any; } = {};
            entries.forEach(entry => {
                if (entryTypes.hasOwnProperty(entry._did)) {
                    entryTypes[entry._did].push(entry);
                } else {
                    entryTypes[entry._did] = [entry];
                }
            })
            return entryTypes
        }
    }
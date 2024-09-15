import { Temporal } from "temporal-polyfill";

/**
 * A String that's parsable to a {@link Period}
 */
export type PeriodStr = string

/**
 * Level of granularity.
 * 
 * Note - all Entries take place at Scope.SECOND.  
 * Def._scope is for use by the PDW class or as a general
 * flag for quality checks elsewhere.
 */
export enum Scope {
    SECOND = 'SECOND',
    MINUTE = 'MINUTE',
    HOUR = 'HOUR',
    DAY = 'DAY',
    WEEK = 'WEEK',
    MONTH = 'MONTH',
    QUARTER = 'QUARTER',
    YEAR = 'YEAR',
}


/**
 * Periods are Immutable. All methods return new copies of Period.
 * They are basically wrappers around a string.
 */

export class Period {
    /**
     * The Period itself, represented in a {@link PeriodStr} format.
     *
     * **Examples**:
     * - '2020'
     * - '2020-Q1'
     * - '2020-03'
     * - '2020-03-19'
     * - '2020-03-19T18'
     * - '2020-03-19T18:59'
     * - '2020-03-19T18:59:25'
     */
    periodStr: PeriodStr;
    scope: Scope;
    private _zoomLevel: number;

    constructor(periodStr: PeriodStr | Period, desiredScope?: Scope) {
        if (typeof periodStr !== 'string') periodStr = periodStr.periodStr;
        this.periodStr = periodStr;
        this.scope = Period.inferScope(periodStr);
        if (this.scope === Scope.SECOND && this.periodStr.length > 20) this.periodStr = convertFullISOToPlainDateStr(this.periodStr);
        this._zoomLevel = Period.zoomLevel(this.scope);

        if (desiredScope !== undefined && this.scope !== desiredScope) {
            console.log('Converting ' + periodStr + ' to scope ' + desiredScope);
            return this.zoomTo(desiredScope);
        }

        /**
         * This sucked to figure out and was annoying to need to do at all.
         * @param isoString an ISO formatting string, along with the timezone offset
         * @returns an ISO formatted string without the offset, representing the time *in that timezone*
         */
        function convertFullISOToPlainDateStr(isoString: string): string {
            let temp = Temporal.PlainDateTime.from(isoString);
            const tzString = Temporal.TimeZone.from(isoString).toString();
            const offsetString = tzString.substring(0, 1) + 'PT' + Number.parseInt(tzString.substring(1, 3)) + 'h' + +Number.parseInt(tzString.substring(5, 7)) + 'm';
            console.log(offsetString);
            temp = temp.add(offsetString);
            let str = temp.toJSON();
            return str;
        }
    }

    private static zoomLevel(scope: Scope): number {
        return [
            Scope.SECOND,
            Scope.MINUTE,
            Scope.HOUR,
            Scope.DAY,
            Scope.WEEK,
            Scope.MONTH,
            Scope.QUARTER,
            Scope.YEAR
        ].findIndex(val => val === scope);
    }

    /**
     * Yay overriding default Object prototype methods!
     * @returns periodStr
     */
    toString() {
        return this.periodStr;
    }

    toTemporalPlainDate() {
        return Temporal.PlainDate.from(this.periodStr);
    }

    toTemporalPlainDateTime() {
        return Temporal.PlainDateTime.from(this.periodStr);
    }

    getEnd(): Period {
        if (this.scope === Scope.SECOND) return new Period(this.periodStr);
        if (this.scope === Scope.MINUTE) return new Period(this.periodStr + ':59');
        if (this.scope === Scope.HOUR) return new Period(this.periodStr + ':59:59');
        if (this.scope === Scope.DAY) return new Period(this.periodStr + 'T23:59:59');

        if (this.scope === Scope.WEEK) {
            let numWks = Number.parseInt(this.periodStr.split('W')[1]) - 1;
            //some years dont' start until after the 1st
            if (Period.needsWeekShift(this.periodStr.substring(0, 4))) numWks = numWks + 1;
            let init = Temporal.PlainDate.from(this.periodStr.split('-')[0] + '01-01');

            let sun = init.add({ days: 7 - init.dayOfWeek });
            sun = sun.add({ days: numWks * 7 });
            return new Period(sun.toString() + 'T23:59:59');

        }
        if (this.scope === Scope.MONTH) {
            let lastDay = Temporal.PlainDate.from(this.periodStr + '-01').daysInMonth;
            return new Period(this.periodStr + '-' + lastDay.toString() + 'T23:59:59');
        }
        if (this.scope === Scope.QUARTER) {
            const year = this.periodStr.substring(0, 4);
            const q = Number.parseInt(this.periodStr.slice(-1));
            const month = q * 3;
            const d = Temporal.PlainDate.from(year + '-' + month.toString().padStart(2, '0') + '-01').daysInMonth;
            return new Period(year + '-' + month.toString().padStart(2, '0') + '-' + d + 'T23:59:59');
        }
        return new Period(this.periodStr + "-12-31T23:59:59");
    }

    /**
     *
     * @returns the first second of the period (e.g. 2020-01-01T00:00:00)
     */
    getStart(): Period {
        if (this._zoomLevel === 0) return new Period(this);
        if (this.scope === Scope.YEAR) return new Period(this.toString() + '-01-01T00:00:00');
        if (this.scope === Scope.QUARTER) return new Period(this.zoomIn() + '-01T00:00:00');
        if (this.scope === Scope.MONTH) return new Period(this.toString() + '-01T00:00:00');
        //above preempts week, cause it's not purely hierarchical,
        //from here you can just "zoomIn" to the beginning of the period
        let per = this.zoomIn();
        while (per._zoomLevel !== 0) {
            per = per.zoomIn();
        }
        return per;
    }

    /**
     *
     */
    zoomTo(desiredScope: Scope): Period {
        const desiredLevel = Period.zoomLevel(desiredScope);
        if (this._zoomLevel === desiredLevel) return new Period(this);
        if (this._zoomLevel < desiredLevel) {
            let zoomOut = this.zoomOut();
            while (zoomOut._zoomLevel < desiredLevel) {
                //need to bypass weeks
                if (desiredLevel !== 4 && zoomOut._zoomLevel === 3) {
                    zoomOut = new Period(zoomOut.periodStr.substring(0, 7));
                } else {
                    zoomOut = zoomOut.zoomOut();
                }
            }
            return zoomOut;
        }
        let zoomIn = this.zoomIn();
        while (zoomIn._zoomLevel > desiredLevel) {
            if (desiredLevel !== 4 && zoomIn._zoomLevel === 5) {
                zoomIn = new Period(zoomIn.periodStr + '-01');
            } else {
                zoomIn = zoomIn.zoomIn();
            }
        }
        return zoomIn;
    }

    /**
     * Zooms in on the BEGINNING (?) of the Period
     * @returns the next level finer-grain scope at the beginning of this scope
     */
    zoomIn(): Period {
        if (this.scope === Scope.YEAR) return new Period(this.periodStr + '-Q1');
        if (this.scope === Scope.QUARTER) {
            const year = this.periodStr.substring(0, 4);
            const month = Number.parseInt(this.periodStr.slice(-1)) * 3 - 2;
            return new Period(year + '-' + month.toString().padStart(2, '0'));
        }
        if (this.scope === Scope.MONTH) {
            const temp = Temporal.PlainDate.from(this.periodStr + "-01");
            let year = temp.year;
            if (temp.weekOfYear > 50 && temp.dayOfYear < 14) year = year - 1;
            if (temp.weekOfYear == 1 && temp.dayOfYear > 360) year = year + 1;
            const weekNum = temp.weekOfYear;
            return new Period(year + "-W" + weekNum.toString().padStart(2, '0'));
        }
        if (this.scope === Scope.WEEK) {
            let numWks = Number.parseInt(this.periodStr.split('W')[1]) - 1;
            //if the previous year had 53 weeks, this is necessary
            if (Period.needsWeekShift(this.periodStr.substring(0, 4))) numWks = numWks + 1;
            let init = Temporal.PlainDate.from(this.periodStr.split('-')[0] + '01-01');
            let mon = init.add({ days: 1 - init.dayOfWeek }).add({ days: numWks * 7 });
            return new Period(mon.toString());
        }
        if (this.scope === Scope.DAY) return new Period(this.periodStr + "T00");
        if (this.scope === Scope.HOUR) return new Period(this.periodStr + ":00");
        if (this.scope === Scope.MINUTE) return new Period(this.periodStr + ":00");
        //zooming in from a second returns itself
        return new Period(this.periodStr);
    }

    zoomOut(): Period {
        if (this.scope === Scope.SECOND) return new Period(this.periodStr.slice(0, -3));
        if (this.scope === Scope.MINUTE) return new Period(this.periodStr.slice(0, -3));
        if (this.scope === Scope.HOUR) return new Period(this.periodStr.slice(0, -3));
        if (this.scope === Scope.DAY) {
            //this SHOULD be usign Temporal.PlaidDateTime.weekOfYear(), but that's not implemented on this polyfill
            const temp = Temporal.PlainDateTime.from(this.periodStr);
            //catching edge cases like 2019-12-31 => 2020-W01 & 2023-01-01 => 2022-W52
            let year = temp.year;
            if (temp.weekOfYear > 50 && temp.dayOfYear < 14) year = year - 1;
            if (temp.weekOfYear == 1 && temp.dayOfYear > 360) year = year + 1;
            return new Period(year + "-W" + temp.weekOfYear.toString().padStart(2, '0'));
        }
        if (this.scope === Scope.WEEK) {
            return new Period(Period.getMidWeek(this).toString().substring(0, 7));
            // //weeks zooming out resolve to whichever month contains the THURSDAY of the week
            // let numWks = Number.parseInt(this.periodStr.split('W')[1]) - 1;
            // //if the previous year had 53 weeks, this is necessary
            // if (Period.prevYearHas53Weeks(this.periodStr.substring(0, 4))) numWks = numWks + 1
            // let init = Temporal.PlainDate.from(this.periodStr.split('-')[0] + '01-01')
            // let thur = init.add({ days: 4 - init.dayOfWeek }).add({ days: numWks * 7 })
            // return new Period(thur.toPlainYearMonth().toString());
        }
        if (this.scope === Scope.MONTH) {
            let yearStr = this.periodStr.split('-')[0];
            let month = Number.parseInt(this.periodStr.split('-')[1]);
            let quarterStr = Math.ceil(month / 3).toString();
            return new Period(yearStr + '-Q' + quarterStr);
        }
        // else is a Scope.QUARTER or Scope.YEAR, I think I'm goign to let Scope.YEAR return itself
        return new Period(this.periodStr.substring(0, 4));
    }

    addDuration(temporalDurationStr: string): Period {
        const startTemp = Temporal.PlainDateTime.from(this.getStart().periodStr);
        const endTemp = startTemp.add(temporalDurationStr);
        return new Period(endTemp.toString()).zoomTo(this.scope);
    }

    contains(period: Period | PeriodStr): boolean {
        if (typeof period === 'string') period = new Period(period);
        //converting week scopes to THURSDAY of that week
        if (period.scope === Scope.WEEK) period = Period.getMidWeek(period);
        const inBegin = Temporal.PlainDateTime.from(period.getStart().periodStr);
        const inEnd = Temporal.PlainDateTime.from(period.getEnd().periodStr);
        const thisBegin = Temporal.PlainDateTime.from(this.getStart().periodStr);
        const thisEnd = Temporal.PlainDateTime.from(this.getEnd().periodStr);
        const start = Temporal.PlainDateTime.compare(inBegin, thisBegin);
        const end = Temporal.PlainDateTime.compare(thisEnd, inEnd);
        return start !== -1 && end !== -1;
    }

    isBefore(period: Period): boolean {
        const start = Temporal.PlainDateTime.from(this.getEnd().periodStr);
        const end = Temporal.PlainDateTime.from(period.getStart().periodStr);
        return Temporal.PlainDateTime.compare(start, end) === -1;
    }

    isAfter(period: Period): boolean {
        const start = Temporal.PlainDateTime.from(this.getStart().periodStr);
        const end = Temporal.PlainDateTime.from(period.getEnd().periodStr);
        return Temporal.PlainDateTime.compare(start, end) === 1;
    }

    // I can't believe I was able to reduce these to a 1 liner
    getNext(): Period {
        // let start = this.getStart();
        // let end = this.getEnd();
        // let plusOne = end.addDuration('PT1S');
        // let zoomed = plusOne.zoomTo(this.scope);
        return this.getEnd().addDuration('PT1S').zoomTo(this.scope);

    }
    getPrev(): Period {
        return this.getStart().addDuration('-PT1S').zoomTo(this.scope);
    }

    private static needsWeekShift(yearStr: string): boolean {
        return Temporal.PlainDate.from(yearStr + '-01-01').dayOfWeek > 4;

    }

    private static getMidWeek(period: Period) {
        if (period.scope !== Scope.WEEK) return period;
        return period.getStart().zoomTo(Scope.DAY).addDuration('P3D');
    }

    static allPeriodsIn(start: Period, end: Period, scope: Scope, asStrings = false): Period[] | string[] {
        if (Temporal.PlainDateTime.compare(Temporal.PlainDateTime.from(start.getStart().periodStr), Temporal.PlainDateTime.from(end.getStart().periodStr)) === 1) {
            console.warn('You may have flipped your start and end dates accidentally... or something');
            const temp = start;
            start = end;
            end = temp;
        }
        // const startOfStart = start.getStart().periodStr;
        // const endOfEnd = end.getEnd().periodStr;
        let first, last, list: any[];
        first = start.zoomTo(scope);
        last = end.getNext().zoomTo(Scope.SECOND).addDuration('-PT1S').zoomTo(scope);

        let member = first;
        list = [];
        if (asStrings) {
            do {
                // list.push({[member.periodStr]: {from: member.getStart().toString(), to: member.getEnd().toString()}});
                list.push(member.periodStr);
                member = member.getNext();
            } while (member.periodStr <= last.periodStr);
            return list as string[];
        } else {
            do {
                list.push(member);
                member = member.getNext();

            } while (member.periodStr <= last.periodStr);
            return list as Period[];
        }
    }

    //getEntriesInPeriodMatchingFilter(params: StandardFilters): Element[]
    static now(scope: Scope): PeriodStr {
        let seedStr = '';
        let nowTemp = Temporal.Now.zonedDateTimeISO();
        if (scope === Scope.YEAR) seedStr = nowTemp.year.toString();
        if (scope === Scope.QUARTER) seedStr = nowTemp.year.toString() + '-Q' + Math.ceil(nowTemp.month / 3);
        if (scope === Scope.MONTH) seedStr = nowTemp.toPlainYearMonth().toString();
        if (scope === Scope.WEEK) seedStr = nowTemp.year.toString() + '-W' + nowTemp.weekOfYear.toString();
        if (scope === Scope.DAY) seedStr = nowTemp.toPlainDate().toString();
        if (scope === Scope.HOUR) seedStr = nowTemp.toString().substring(0, 13);
        if (scope === Scope.MINUTE) seedStr = nowTemp.toString().substring(0, 16);
        if (scope === Scope.SECOND) seedStr = nowTemp.toString().substring(0, 19);
        return seedStr;
    }

    static nowAsPeriod(scope: Scope): Period {
        return new Period(Period.now(scope));
    }

    static inferScope(ISOString: string): Scope {
        // /https://xkcd.com/208/
        if (/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d/i.test(ISOString))
            return Scope.SECOND;
        if (/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d/i.test(ISOString))
            return Scope.MINUTE;
        if (/\d{4}-[01]\d-[0-3]\dT[0-2]\d/i.test(ISOString))
            return Scope.HOUR;
        if (/^([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$/.test(ISOString))
            return Scope.DAY;
        if (/^([0-9]{4})-?W(5[0-3]|[1-4][0-9]|0[1-9])$/i.test(ISOString))
            return Scope.WEEK;
        if (/^([0-9]{4})-(1[0-2]|0[1-9])$/.test(ISOString))
            return Scope.MONTH;
        if (/^[0-9]{4}-Q[1-4]$/i.test(ISOString))
            return Scope.QUARTER;
        if (/^([0-9]{4})$/.test(ISOString))
            return Scope.YEAR;
        throw new Error('Attempted to infer scope failed for: ' + ISOString);
    }
}

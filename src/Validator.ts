import { Temporal } from "temporal-polyfill";
import { DataJournal, Def, DefType, DJ, Entry, Rollup, Scope } from "./DataJournal.js";

export interface Complaint {
    severity: 'LOW' | 'MEDIUM' | 'CRITICAL',
    text: string,
    [prop: string]: any //any other props are okay
}

export interface ValidationReport {
    complaints: Complaint[],
    highestSeverity: 'LOW' | 'MEDIUM' | 'CRITICAL' | 'NONE',
}

/**
 * Create a 
 */
export class Validator {
    static validate(dataJournal: DataJournal): ValidationReport {
        if (!DJ.isValidDataJournal(dataJournal)) {
            return {
                complaints: [{ text: 'INVALID DATA JOURNAL', severity: 'CRITICAL' }],
                highestSeverity: 'CRITICAL'
            }
        }

        const report: ValidationReport = {
            complaints: [],
            highestSeverity: 'NONE'
        }

        const logs = DJ.qualityCheck(dataJournal, "logs only");
        logs.forEach(log => {
            addComplaint({
                severity: log.important ? 'CRITICAL' : 'LOW',
                text: log.msg
            })
        })

        validateDefs(dataJournal.defs);
        validateEntries(dataJournal.entries, dataJournal.defs);

        report.complaints.forEach(complaint=>{
            if(report.highestSeverity === 'CRITICAL') return;
            if(complaint.severity === 'CRITICAL') report.highestSeverity = 'CRITICAL';
            if(report.highestSeverity === 'MEDIUM') return;
            if(complaint.severity === 'MEDIUM') report.highestSeverity = 'MEDIUM';
            if(report.highestSeverity === 'LOW') return
            if(complaint.severity === 'LOW') report.highestSeverity = 'LOW';
        })

        return report

        function addComplaint(complaint: Complaint) {
            complaint.type = complaint.text.split(':')[0];
            report.complaints.push(complaint);
        }

        function validateDefs(defs: Def[]) {
            defs.forEach(def => {
                if (!Object.values(DefType).includes(def._type))
                    addComplaint({ severity: 'MEDIUM', text: 'Invalid Def Type: ' + def._type });
                if (def._tags && !Array.isArray(def._tags))
                    addComplaint({ severity: 'LOW', text: '_tags is not an array for: ' + def._id });
                if (def._scope && !Object.values(Scope).includes(def._scope))
                    addComplaint({ severity: 'MEDIUM', text: 'Invalid Def Scope: ' + def._scope });
                if (def._rollup && !Object.values(Rollup).includes(def._rollup))
                    addComplaint({ severity: 'MEDIUM', text: 'Invalid Def Rollup: ' + def._rollup });
                if (def._range && !Array.isArray(def._range))
                    addComplaint({ severity: 'LOW', text: '_range is not an array for: ' + def._id });
            })
        }

        function validateEntries(entries: Entry[], defs: Def[]) {
            const defTypeMap: { [id: string]: DefType } = {};
            const defRangeMap: { [id: string]: string[] } = {};

            defs.forEach(def => {
                const standardizedID = DJ.standardizeKey(def._id)
                defTypeMap[standardizedID] = def._type;
                if (def._range) defRangeMap[standardizedID] = def._range;
            })

            entries.forEach(entry => {
                if (entry._created && epochStrIsImplausible(entry._created))
                    addComplaint({ severity: 'LOW', text: 'Entry._created is implausible: ' + entry._created + ' ...created was:' + entry._created });
                const pointKeys = Object.keys(entry).filter(key => !key.startsWith('_'));
                pointKeys.forEach(key => {
                    const standardizedID = DJ.standardizeKey(key)
                    const type = defTypeMap[standardizedID];
                    const val = entry[key];
                    if (type === undefined) return //unknown props should already be reported by DJ.qualityCheck()
                    if (type === DefType.BOOL && typeof val !== 'boolean')
                        addComplaint({ severity: 'LOW', text: 'Boolean-type point with non-boolean value for: ' + entry._id + ' ...val was: ' + val});
                    if (type === DefType.NUMBER && typeof val !== 'number')
                        addComplaint({ severity: 'LOW', text: 'Number-type point with non-number value for: ' + entry._id + ' ...val was: ' + val });
                    if (type === DefType.MULTISELECT && !Array.isArray(val))
                        addComplaint({ severity: 'LOW', text: 'Multiselect-type point with non-Array value for: ' + entry._id + ' ...val was: ' + val });
                    if (type === DefType.DURATION && typeof val !== 'string')
                        addComplaint({ severity: 'LOW', text: 'Duration-type point with non-string value for: ' + entry._id + ' ...val was: ' + val });
                    if (type === DefType.DURATION && typeof val === 'string' && !val.startsWith('PT'))
                        addComplaint({ severity: 'LOW', text: 'Duration-type point with a wrong-looking string value for: ' + entry._id + ' ...val was: ' + val });
                    if (type === DefType.TEXT && typeof val !== 'string')
                        addComplaint({ severity: 'LOW', text: 'Text-type point with a non-string value for: ' + entry._id + ' ...val was: ' + val });
                    if (type === DefType.SELECT && typeof val !== 'string')
                        addComplaint({ severity: 'LOW', text: 'Select-type point with a non-string value for: ' + entry._id + ' ...val was: ' + val });
                    if (type === DefType.TIME && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/.test(val))
                        addComplaint({ severity: 'LOW', text: 'Time-type point with a wrong-looking string value for: ' + entry._id + ' ...val was: ' + val });

                    //ranges
                    const range = defRangeMap[standardizedID];
                    if (range === undefined || !Array.isArray(range) || range.length === 0) return;
                    if (type === DefType.DURATION) {
                        if (isOutOfRangeDur(range, val))
                            addComplaint({ severity: 'LOW', text: 'Duration-type out of range for: ' + entry._id });
                    }
                    if (type === DefType.MULTISELECT) {
                        if (isOutOfRangeMultiSelect(range, val))
                            addComplaint({ severity: 'LOW', text: 'Multiselect-type out of range for: ' + entry._id });
                    }
                    if (type === DefType.SELECT) {
                        if (isOutOfRangeSelect(range, val))
                            addComplaint({ severity: 'LOW', text: 'Select-type out of range for: ' + entry._id });
                    }
                    if (type === DefType.NUMBER) {
                        if (isOutOfRangeNumber(range, val))
                            addComplaint({ severity: 'LOW', text: 'Number-type out of range for: ' + entry._id });
                    }
                })
            })
        }

        function epochStrIsImplausible(epochStr: string) {
            //@ts-expect-error - hacking into private member
            if (!DJ.isValidEpochStr(epochStr)) return true;
            const date = DJ.parseDateFromEpochStr(epochStr);
            const year = date.getFullYear();
            //covering the span of years I'm unlikely to track beyond. This code will be so relevant in 76 years
            if (year < 2000 || year > 2100) return true;
            return false
        }

        function isOutOfRangeDur(range: string[], dur: string): boolean {
            //convert all durations to numbers of seconds then call isOutOfRangeNumber
            let durationSeconds = Temporal.Duration.from(dur).total({unit:'second'});
            let even = 0;
            let rangeSeconds = range.map(element=>{
                even += 1;
                if(even % 2 === 1) return element
                return Temporal.Duration.from(element).total({unit:'second'}).toString();
            })
            return isOutOfRangeNumber(rangeSeconds, durationSeconds)
        }

        function isOutOfRangeMultiSelect(range: string[], multiselect: string[]): boolean {
            const standardized = range.map(text => DJ.standardizeKey(text));
            const standardizedVals = multiselect.map(text=>DJ.standardizeKey(text));
            let returnVal = false;
            standardizedVals.forEach(val=>{
                if(!returnVal){
                    if(!standardized.some(rangeVal=>rangeVal===val)) returnVal = true;
                }
            })
            return returnVal;
        }
        function isOutOfRangeSelect(range: string[], select: string): boolean {
            const standardized = range.map(text => DJ.standardizeKey(text));
            const standardizedVal = DJ.standardizeKey(select)
            return !standardized.some(val=>val===standardizedVal);
        }
        function isOutOfRangeNumber(range: string[], num: number): boolean {
            let returnVal = false
            range = JSON.parse(JSON.stringify(range)); //make static, was causing side effect issue
            while(range.length > 1 && !returnVal){
                const operand = range.shift();
                const val = Number.parseFloat(range.shift()!);
                if(operand === '<'){
                    returnVal = num >= val;
                    continue; 
                }
                if(operand === '<='){
                    returnVal = num > val;
                    continue; 
                }
                if(operand === '>'){
                    returnVal = num <= val;
                    continue; 
                }
                if(operand === '>='){
                    returnVal = num < val;
                    continue; 
                }
            }
            return returnVal
        }
    }
}

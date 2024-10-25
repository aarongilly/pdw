import { DefType, Rollup, Scope, Def, DJ } from "../src/DataJournal";
import { describe, test, expect } from "vitest";
import { Validator } from '../src/Validator'

describe('Validator', () => {
    test('Invalid Journal', () => {
        //@ts-expect-error
        expect(Validator.validate({})).toEqual({
            complaints: [{
                "severity": "CRITICAL",
                "text": "INVALID DATA JOURNAL",
            }],
            highestSeverity: 'CRITICAL'
        })
    });

    test('Invalid Def contents', () => {
        const badDef = {
            _id: 'test',
            _updated: 'm2m2m2m2',
            _type: 'myInvalidType',
            _tags: 'not an array',
            _scope: 'notValidScope',
            _rollup: 'notValidRollup',
            _range: 'not an array'
        }
        //@ts-expect-error
        let report = Validator.validate({ defs: [badDef], entries: [] })
        expect(report.complaints.length).toBe(5);
        expect(report.complaints[0]).toEqual({
            severity: "MEDIUM",
            text: "Invalid Def Type: myInvalidType",
        });
        expect(report.highestSeverity).toBe('MEDIUM');
        expect(report.complaints[1]).toEqual({
            severity: "LOW",
            text: "_tags is not an array for: test",
        });
        expect(report.complaints[2]).toEqual({
            severity: "MEDIUM",
            text: "Invalid Def Scope: notValidScope",
        });
        expect(report.complaints[3]).toEqual({
            severity: "MEDIUM",
            text: "Invalid Def Rollup: notValidRollup",
        });
        expect(report.complaints[4]).toEqual({
            severity: "LOW",
            text: "_range is not an array for: test",
        });

        const goodDef = {
            _id: 'test',
            _updated: 'm2m2m2m2',
            _type: DefType.BOOL,
            _tags: ['array'],
            _scope: Scope.SECOND,
            _rollup: Rollup.COUNT,
            _range: []
        }
        let newReport = Validator.validate({ defs: [goodDef], entries: [] })
        expect(newReport.complaints.length).toBe(0);
    })

    test('Invalid Entry contents', () => {
        const myBool =
        {
            _id: "boolType",
            _updated: "m2m2m2m2",
            _type: DefType.BOOL
        }
        const myNum =
        {
            _id: 'numType',
            _updated: 'm2m2m2m2',
            _type: DefType.NUMBER
        }
        const myDur =
        {
            _id: 'durType',
            _updated: 'm2m2m2m2',
            _type: DefType.DURATION
        }
        const myTime =
        {
            _id: 'timeType',
            _updated: 'm2m2m2m2',
            _type: DefType.TIME
        }
        const myMulti =
        {
            _id: 'multiselType',
            _updated: 'm2m2m2m2',
            _type: DefType.MULTISELECT
        }
        const myText =
        {
            _id: 'textType',
            _updated: 'm2m2m2m2',
            _type: DefType.TEXT //covers SELECT, MARKDOWN, LINK 
        }

        const badEntry = {
            _id: 'test',
            _period: '2024-02-22T02:30:55',
            _updated: 'm2m2m2m2',
            _created: 'not valid epochstr',
            boolType: 'not a bool',
            numType: 'not a num',
            durType: 39, //not a duration string
            multiselType: 'not an array',
            timeType: 'not a time',
            textType: true
        }
        const myDJ = {
            defs: [myBool, myDur, myMulti, myNum, myText, myTime],
            entries: [badEntry]
        }
        let newReport = Validator.validate(myDJ);
        expect(newReport.complaints.length).toBe(7);
        expect(newReport.complaints).toEqual(
            [
                {
                    severity: "LOW",
                    text: "Entry._created is implausible: not valid epochstr",
                },
                {
                    severity: "LOW",
                    text: "Boolean-type point with non-boolean value for: test",
                },
                {
                    severity: "LOW",
                    text: "Number-type point with non-number value for: test",
                },
                {
                    severity: "LOW",
                    text: "Duration-type point with non-string value for: test",
                },
                {
                    severity: "LOW",
                    text: "Multiselect-type point with non-Array value for: test",
                },
                {
                    severity: "LOW",
                    text: "Time-type point with a wrong-looking string value for: test",
                },
                {
                    severity: "LOW",
                    text: "Text-type point with a non-string value for: test",
                },
            ]
        )
        expect(newReport.highestSeverity).toBe('LOW');
    })

    test('Utilizing the _range property', () => {
        const mySelect: Def = {
            _id: "mySelect",
            _updated: "m2m2m2m2",
            _type: DefType.SELECT,
            _range: ['a', 'StAndArdIzed_vals']
        }
        const myMulti: Def = {
            _id: "myMulti",
            _updated: "m2m2m2m2",
            _type: DefType.MULTISELECT,
            _range: ['a', 'StAndArdIzed_vals', 'b']
        }
        const myNum: Def = {
            _id: "myNum",
            _updated: "m2m2m2m2",
            _type: DefType.NUMBER,
            _range: ['>=', '0', '<=', '10']
        }
        const myDur: Def = {
            _id: "myDur",
            _updated: "m2m2m2m2",
            _type: DefType.DURATION,
            _range: ['>=', 'PT1H', '<=', 'PT10H']
        }
        const myEntry = DJ.makeEntry({ _id: 'entry1', _period: '2024-10-02T20:33:49' });
        let myDj = {
            defs: [mySelect, myDur, myMulti, myNum],
            entries: [myEntry]
        }

        //select
        myEntry.mySelect = 'not included'; //forcing out-of-range
        let report = Validator.validate(myDj);
        expect(report.complaints.length).toBe(1);
        expect(report.complaints[0]).toEqual({
            severity: "LOW",
            text: "Select-type out of range for: entry1",
        },);
        myEntry.mySelect = 'standardized vals'; //string comparisons in range are standradized
        report = Validator.validate(myDj);
        expect(report.complaints.length).toBe(0); //vals are standardized via DJ.standardizeKeys()

        //multiselect
        myEntry.myMulti = ['a', 'b', 'c not in range'];
        report = Validator.validate(myDj);
        expect(report.complaints.length).toBe(1);
        expect(report.complaints[0]).toEqual({
            severity: "LOW",
            text: "Multiselect-type out of range for: entry1",
        },);
        myEntry.myMulti = ['a', 'b', 'b']; //duplicate values are not validated
        report = Validator.validate(myDj);
        expect(report.complaints.length).toBe(0);
        
        //number
        myEntry.myNum = 11;
        report = Validator.validate(myDj);
        expect(report.complaints.length).toBe(1);
        expect(report.complaints[0]).toEqual({
            severity: "LOW",
            text: "Number-type out of range for: entry1",
        },);

        myEntry.myNum = -1;
        report = Validator.validate(myDj);
        expect(report.complaints.length).toBe(1);

        myEntry.myNum = 10;
        report = Validator.validate(myDj);
        expect(report.complaints.length).toBe(0);
        
        //duration
        myEntry.myDur = 'PT12H'; //too high
        report = Validator.validate(myDj);
        expect(report.complaints.length).toBe(1);
        expect(report.complaints[0]).toEqual({
            severity: "LOW",
            text: "Duration-type out of range for: entry1",
        },);

        myEntry.myDur = 'PT12M'; //too low
        report = Validator.validate(myDj);
        expect(report.complaints.length).toBe(1);
        
        myEntry.myDur = 'PT120M'; //just riight
        report = Validator.validate(myDj);
        expect(report.complaints.length).toBe(0);
        
        expect(report.highestSeverity).toBe('NONE');
    })

});
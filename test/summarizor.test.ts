import { Entry, DefType, Rollup, DataJournal, DJ, Scope } from "../src/DataJournal";
import { describe, test, expect } from "vitest";
import * as testData from './test_datasets';
import { Summarizor } from '../src/Summarizor'

describe('Summarizor', () => {
    test('Whole Data Journal "All" Summary', () => {
        expect(Summarizor.summarize(testData.biggerJournal)).toEqual(testData.expectedSummary);
    })
    test('Explicit Summary Behaviors', () => {
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

        let myEntries: Entry[] = [
            {
                _id: "one",
                _period: "2024-08-01T11:12:13",
                _updated: "m2m2m2m2",
                boolType: false,
                numType: 3,
                durType: 'PT1H',
                timeType: '22:00:00',
                multiselType: ['A', 'B'],
                textType: 'Yo.'
            },
            {
                _id: "two",
                _period: "2024-08-01T11:12:13",
                _updated: "m2m2m2m2",
                boolType: true,
                numType: 4,
                durType: 'PT2H',
                timeType: '23:00:00',
                multiselType: ['B', 'C'],
                textType: 'Ay.'
            },
            {
                _id: "three",
                _period: "2024-08-01T11:12:13",
                _updated: "m2m2m2m2",
                boolType: false,
                numType: 6,
                durType: 'PT1H',
                timeType: '02:00:00',
                multiselType: ['C', 'D'],
                textType: 'HI MOM.'
            }
        ]
        //Count is valid for all types
        expect(Summarizor.rollupEntryPoint(myEntries, myBool).val).toEqual(3);

        //Boolean Type
        expect(Summarizor.rollupEntryPoint(myEntries, myBool, Rollup.COUNTOFEACH).val).toEqual("true: 1, false: 2");
        expect(Summarizor.rollupEntryPoint(myEntries, myBool, Rollup.COUNTDISTINCT).val).toEqual(2);
        //all other summary types for bool throw error
        expect(() => {Summarizor.rollupEntryPoint(myEntries, myBool, Rollup.AVERAGE)}).toThrowError();
        expect(() => {Summarizor.rollupEntryPoint(myEntries, myBool, Rollup.SUM)}).toThrowError();

        //Number type
        expect(Summarizor.rollupEntryPoint(myEntries, myNum, Rollup.COUNTOFEACH).val).toEqual("6: 1, 4: 1, 3: 1");
        expect(Summarizor.rollupEntryPoint(myEntries, myNum, Rollup.COUNTDISTINCT).val).toEqual(3);
        expect(Summarizor.rollupEntryPoint(myEntries, myNum, Rollup.AVERAGE).val).toEqual(4.33); //average always maxes at 2 decimals
        expect(Summarizor.rollupEntryPoint(myEntries, myNum, Rollup.SUM).val).toEqual(13);
        
        //Duration type
        expect(Summarizor.rollupEntryPoint(myEntries, myDur, Rollup.COUNTOFEACH).val).toEqual("PT2H: 1, PT1H: 2");
        expect(Summarizor.rollupEntryPoint(myEntries, myDur, Rollup.COUNTDISTINCT).val).toEqual(2);
        expect(Summarizor.rollupEntryPoint(myEntries, myDur, Rollup.AVERAGE).val).toEqual('PT1H20M'); //average always maxes at 2 decimals
        expect(Summarizor.rollupEntryPoint(myEntries, myDur, Rollup.SUM).val).toEqual('PT4H');
        
        //Time type
        expect(Summarizor.rollupEntryPoint(myEntries, myTime, Rollup.COUNTOFEACH).val).toEqual("02:00:00: 1, 23:00:00: 1, 22:00:00: 1");
        expect(Summarizor.rollupEntryPoint(myEntries, myTime, Rollup.COUNTDISTINCT).val).toEqual(3);
        //Times are averaged about 4AM, so 00:00:00 to 03:59:59 are treated like 24:00:00 to 27:59:59
        expect(Summarizor.rollupEntryPoint(myEntries, myTime, Rollup.AVERAGE).val).toEqual('23:40:00'); 
        //Sums on times aren't allowed & throw error
        expect(() => {Summarizor.rollupEntryPoint(myEntries, myTime, Rollup.SUM)}).toThrowError();
        
        //Multiselect type
        expect(Summarizor.rollupEntryPoint(myEntries, myMulti, Rollup.COUNTOFEACH).val).toEqual("D: 1, C: 2, B: 2, A: 1");
        expect(Summarizor.rollupEntryPoint(myEntries, myMulti, Rollup.COUNTDISTINCT).val).toEqual(4); //4 unique elements contained in arrays
        //all other summary types for bool throw error
        expect(() => {Summarizor.rollupEntryPoint(myEntries, myMulti, Rollup.AVERAGE)}).toThrowError();
        expect(() => {Summarizor.rollupEntryPoint(myEntries, myMulti, Rollup.SUM)}).toThrowError();
    })

    test('One per Period Function', () => {
        const whateverEpochIsFine = DJ.makeEpochStr();
        const testJournal: DataJournal = {
            defs: [{
                _id: 'TEST_DEF',
                _type: DefType.TEXT,
                _updated: whateverEpochIsFine
            }],
            entries: [
                {
                    _id: "ABC",
                    _period: "2024-10-01T11:11:11",
                    _updated: whateverEpochIsFine,
                    TEST_DEF: "good."
                },
                {
                    _id: "BCD",
                    _period: "2024-10-02T11:11:11",
                    _updated: whateverEpochIsFine,
                    TEST_DEF: "good."
                },
                {
                    _id: "CDE",
                    _period: "2024-10-05T11:11:11",
                    _updated: whateverEpochIsFine,
                    TEST_DEF: "skipped a couple days."
                },
                {
                    _id: "EFG",
                    _period: "2024-10-06T11:11:11",
                    _updated: whateverEpochIsFine,
                    TEST_DEF: "Same day as below"
                },
                {
                    _id: "FGH",
                    _period: "2024-10-06T01:11:11",
                    _updated: whateverEpochIsFine,
                    TEST_DEF: "Same day as above"
                },
            ]
        }
        const expectedResult = {
            scope: "DAY",
            firstPeriod: "2024-10-01",
            lastPeriod: "2024-10-06",
            def: {
              _id: "TEST_DEF",
              _type: "TEXT",
              _updated: whateverEpochIsFine,
            },
            emptyPeriods: [
                '2024-10-03',
                '2024-10-04',
            ],
            overFilledPeriods: [
                '2024-10-06'
            ],
          }
        const onePerPeriodReport = Summarizor.checkOnePerPeriod(testJournal,'TEST_DEF',Scope.DAY);
        expect(onePerPeriodReport).toEqual(expectedResult);
    })
})
import { expect, test } from 'vitest'
import {Period, Scope, parseTemporalFromUid} from '../src/pdw';
import { Temporal } from 'temporal-polyfill';
// Edit an assertion and save to see HMR in action

// test('Math.sqrt()', () => {
//   expect(Math.sqrt(4)).toBe(2)
//   expect(Math.sqrt(144)).toBe(12)
//   expect(Math.sqrt(2)).toBe(Math.SQRT2)
// })

// test('JSON', () => {
//   const input = {
//     foo: 'hello',
//     bar: 'world',
//   }

//   const output = JSON.stringify(input)

//   expect(output).eq('{"foo":"hello","bar":"world"}')
//   assert.deepEqual(JSON.parse(output), input, 'matches original')
// })

// test("Make UID", ()=>{
//     let testUid = makeUid();
//     let parsedDate = parseTemporalFromUid(testUid);
    
//     expect(testUid).toBeTypeOf('string');
//     expect(testUid.length).toBe(13);
//     expect(parsedDate).toBeTypeOf('object');
// })

test('Period Contains', ()=>{
    expect(new Period('2020').contains(new Period('2020'))).toBe(true)
    expect(new Period('2020').contains(new Period('2020-12-31T23:59:59'))).toBe(true)
    expect(new Period('2020').contains(new Period('2020-01-01T00:00:00'))).toBe(true)
    expect(new Period('2020').contains(new Period('2020-01'))).toBe(true)
    expect(new Period('2021').contains(new Period('2021-Q4'))).toBe(true)

    expect(new Period('2021-Q3').contains(new Period('2021-Q3'))).toBe(true)
    expect(new Period('2021-Q3').contains(new Period('2021-08'))).toBe(true)
    expect(new Period('2021-03').contains(new Period('2021-03-19'))).toBe(true)
    
    expect(new Period('2021-W03').contains(new Period('2021-01-19'))).toBe(true)
    expect(new Period('2021-03-05T07:08:55').contains(new Period('2021-03-05T07:08:55'))).toBe(true)

    expect(new Period('2020').contains(new Period('2021'))).toBe(false)
    expect(new Period('2020').contains(new Period('2021-Q4'))).toBe(false)
    expect(new Period('2021-01').contains(new Period('2021'))).toBe(false)
})

test('Sliding periods', ()=>{
    expect(new Period('2020').getNext().periodStr).toBe('2021')
    expect(new Period('2020-Q1').getNext().periodStr).toBe('2020-Q2')
    expect(new Period('2020-Q4').getNext().periodStr).toBe('2021-Q1')
    expect(new Period('2020-06').getNext().periodStr).toBe('2020-07')
    // expect(new Period('2020-W52').getNext().periodStr).toBe('2020-W53') //#BUG
    expect(new Period('2020-08-08').getNext().periodStr).toBe('2020-08-09')
    expect(new Period('2020-03-03T02').getNext().periodStr).toBe('2020-03-03T03')
    expect(new Period('2020-03-03T02:18').getNext().periodStr).toBe('2020-03-03T02:19')
    expect(new Period('2020-12-30T09:09:10').getNext().periodStr).toBe('2020-12-30T09:09:11')
    expect(new Period('2021-12-31T23:59:59').getNext().periodStr).toBe('2022-01-01T00:00:00') //EDGE COVERED
})

test.skip('Period Type Parsing', ()=>{
    expect(Period.inferScope(Period.now(Scope.SECOND))).toBe(Scope.SECOND);
    expect(Period.inferScope(Period.now(Scope.MINUTE))).toBe(Scope.MINUTE);
    expect(Period.inferScope(Period.now(Scope.HOUR))).toBe(Scope.HOUR);
    expect(Period.inferScope(Period.now(Scope.DAY))).toBe(Scope.DAY);
    expect(Period.inferScope(Period.now(Scope.WEEK))).toBe(Scope.WEEK);
    expect(Period.inferScope(Period.now(Scope.MONTH))).toBe(Scope.MONTH);
    expect(Period.inferScope(Period.now(Scope.QUARTER))).toBe(Scope.QUARTER);
    expect(Period.inferScope(Period.now(Scope.YEAR))).toBe(Scope.YEAR);
})

test.skip('Period End & Begin', ()=>{
    expect(new Period('2020').getStart().periodStr).toBe('2020-01-01T00:00:00')
    expect(new Period('2020-Q1').getStart().periodStr).toBe('2020-01-01T00:00:00')
    expect(new Period('2020-01').getStart().periodStr).toBe('2020-01-01T00:00:00')
    expect(new Period('2020-W01').getStart().periodStr).toBe('2020-01-06T00:00:00')
    expect(new Period('2020-01-01').getStart().periodStr).toBe('2020-01-01T00:00:00')
    expect(new Period('2020-01-01T00').getStart().periodStr).toBe('2020-01-01T00:00:00')
    expect(new Period('2020-01-01T00:00').getStart().periodStr).toBe('2020-01-01T00:00:00')
    expect(new Period('2020-01-01T00:00:00').getStart().periodStr).toBe('2020-01-01T00:00:00')

    expect(new Period('2020').getEnd().periodStr).toBe('2020-12-31T23:59:59');
    expect(new Period('2020-Q1').getEnd().periodStr).toBe('2020-03-31T23:59:59');
    expect(new Period('2020-02').getEnd().periodStr).toBe('2020-02-29T23:59:59'); //edge case
    expect(new Period('2021-02').getEnd().periodStr).toBe('2021-02-28T23:59:59');
    expect(new Period('2021-W02').getEnd().periodStr).toBe('2021-01-17T23:59:59');
    expect(new Period('2021-01-01').getEnd().periodStr).toBe('2021-01-01T23:59:59');
    expect(new Period('2021-01-01T04').getEnd().periodStr).toBe('2021-01-01T04:59:59');
    expect(new Period('2021-01-01T04:30').getEnd().periodStr).toBe('2021-01-01T04:30:59');
    expect(new Period('2021-01-01T04:30:33').getEnd().periodStr).toBe('2021-01-01T04:30:33');
    
    // per = new Period('2023-04-27')
    // expect(per.getPeriodEnd()).toBe('2023-04-27T23:59:59');
})

test.skip('Period Hierarchy', ()=>{
    let per = new Period('2023-04-27T08:06:47');
    expect(per.scope).toBe(Scope.SECOND);
    
    per = new Period(per.zoomOut());
    expect(per.periodStr).toBe('2023-04-27T08:06')
    expect(per.scope).toBe(Scope.MINUTE)
    
    per = new Period(per.zoomOut());
    expect(per.periodStr).toBe('2023-04-27T08')
    expect(per.scope).toBe(Scope.HOUR)
    
    per = new Period(per.zoomOut());
    expect(per.periodStr).toBe('2023-04-27')
    expect(per.scope).toBe(Scope.DAY)

    per = new Period(per.zoomOut());
    expect(per.periodStr).toBe('2023-W17')
    expect(per.scope).toBe(Scope.WEEK)
    //edge cases
    expect(new Period('2022-01-01').zoomOut().periodStr).toBe('2021-W52')
    expect(new Period('2023-01-01').zoomOut().periodStr).toBe('2022-W52')
    expect(new Period('2020-12-31').zoomOut().periodStr).toBe('2020-W53')
    expect(new Period('2019-12-31').zoomOut().periodStr).toBe('2020-W01')

    per = new Period(per.zoomOut());
    expect(per.periodStr).toBe('2023-04')
    expect(per.scope).toBe(Scope.MONTH)
    //edge case
    const endOfJan = new Period('2023-01-30')
    const januaryDateButFirstWeekOfFeb = new Period(endOfJan.zoomOut());
    expect(januaryDateButFirstWeekOfFeb.zoomOut().periodStr).toBe('2023-02') //expected

    per = new Period(per.zoomOut());
    expect(per.periodStr).toBe('2023-Q2')
    expect(per.scope).toBe(Scope.QUARTER)
    
    per = new Period(per.zoomOut());
    expect(per.periodStr).toBe('2023')
    expect(per.scope).toBe(Scope.YEAR)
    per = new Period(per.zoomOut());
    expect(per.periodStr).toBe('2023') //zooming out from year returns year again

    per = new Period(per.zoomIn());
    expect(per.periodStr).toBe('2023-Q1');

    per = new Period(per.zoomIn());
    expect(per.periodStr).toBe('2023-01');
    
    per = new Period(per.zoomIn());
    expect(per.periodStr).toBe('2022-W52');

    per = new Period(per.zoomIn());
    expect(per.periodStr).toBe('2022-12-26');

    per = new Period(per.zoomIn());
    expect(per.periodStr).toBe('2022-12-26T00');

    per = new Period(per.zoomIn());
    expect(per.periodStr).toBe('2022-12-26T00:00');

    per = new Period(per.zoomIn());
    expect(per.periodStr).toBe('2022-12-26T00:00:00');
    per = new Period(per.zoomIn());
    expect(per.periodStr).toBe('2022-12-26T00:00:00'); //zooming in returns second again
})
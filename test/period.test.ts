import { expect, test } from 'vitest'
import {Period, Scope} from '../src/pdw';
// Edit an assertion and save to see HMR in action

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

    /**
     * WEEKS are weird.
     */
    let wkTen = new Period('2023-W10'); //2023-02-27 to 2023-03-05, Thur is 2023-03-02
    let feb = new Period('2023-02');
    let mar = new Period('2023-03');
    expect(feb.contains(wkTen)).toBe(false);
    expect(mar.contains(wkTen)).toBe(true);
})

test('Sliding periods', ()=>{
    expect(new Period('2020').getNext().periodStr).toBe('2021')
    expect(new Period('2020-Q1').getNext().periodStr).toBe('2020-Q2')
    expect(new Period('2020-Q4').getNext().periodStr).toBe('2021-Q1')
    expect(new Period('2020-06').getNext().periodStr).toBe('2020-07')
    expect(new Period('2020-W52').getNext().periodStr).toBe('2020-W53') //year with 53 weeks ✅
    expect(new Period('2024-W52').getNext().periodStr).toBe('2025-W01') //year with 52 weeks ✅
    expect(new Period('2020-08-08').getNext().periodStr).toBe('2020-08-09')
    expect(new Period('2020-03-03T02').getNext().periodStr).toBe('2020-03-03T03')
    expect(new Period('2020-03-03T02:18').getNext().periodStr).toBe('2020-03-03T02:19')
    expect(new Period('2020-12-30T09:09:10').getNext().periodStr).toBe('2020-12-30T09:09:11')
    expect(new Period('2021-12-31T23:59:59').getNext().periodStr).toBe('2022-01-01T00:00:00') //EDGE COVERED
})

test('All periods in',()=>{
    expect(Period.allPeriodsIn(new Period('2020'),new Period('2020'),Scope.YEAR,true).join(', ')).toBe('2020')
    expect(Period.allPeriodsIn(new Period('2020-W01'),new Period('2020-W02'),Scope.DAY,true).length).toBe(14)
    expect(Period.allPeriodsIn(new Period('2020'),new Period('2020'),Scope.DAY,true).length).toBe(366)
    expect(Period.allPeriodsIn(new Period('2021'),new Period('2021'),Scope.DAY,true).length).toBe(365)
    expect(Period.allPeriodsIn(new Period('2021-01-01'),new Period('2021-01-01'),Scope.HOUR,true).length).toBe(24)
    expect(Period.allPeriodsIn(new Period('2021-01-01T01'),new Period('2021-01-01T01'),Scope.MINUTE,true).length).toBe(60)
})

test('Period Type Parsing', ()=>{
// test.skip('Period Type Parsing', ()=>{
    expect(Period.inferScope(Period.now(Scope.SECOND))).toBe(Scope.SECOND);
    expect(Period.inferScope(Period.now(Scope.MINUTE))).toBe(Scope.MINUTE);
    expect(Period.inferScope(Period.now(Scope.HOUR))).toBe(Scope.HOUR);
    expect(Period.inferScope(Period.now(Scope.DAY))).toBe(Scope.DAY);
    expect(Period.inferScope(Period.now(Scope.WEEK))).toBe(Scope.WEEK);
    expect(Period.inferScope(Period.now(Scope.MONTH))).toBe(Scope.MONTH);
    expect(Period.inferScope(Period.now(Scope.QUARTER))).toBe(Scope.QUARTER);
    expect(Period.inferScope(Period.now(Scope.YEAR))).toBe(Scope.YEAR);
})

test('Period End & Begin', ()=>{
// test.skip('Period End & Begin', ()=>{
    expect(new Period('2020').getStart().periodStr).toBe('2020-01-01T00:00:00')
    expect(new Period('2020-Q1').getStart().periodStr).toBe('2020-01-01T00:00:00')
    expect(new Period('2020-01').getStart().periodStr).toBe('2020-01-01T00:00:00')
    expect(new Period('2020-W01').getStart().periodStr).toBe('2019-12-30T00:00:00')
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

test('Period Hierarchy', ()=>{
// test.skip('Period Hierarchy', ()=>{
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

    let day = new Period('2007-07-22');
    let wk = new Period(day).zoomOut();
    console.log(wk.toString());
    console.log(wk.getStart().toString() + ' to ' + wk.getEnd().toString());
    expect(wk.contains(day)).toBe(true);

    
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
    //edge case -- zooming out twice goes from jan to feb due to week's weirdness
    const endOfJan = new Period('2023-01-31');
    const januaryDateButFirstWeekOfFeb = new Period(endOfJan.zoomOut());
    expect(januaryDateButFirstWeekOfFeb.periodStr).toBe('2023-W05');
    expect(januaryDateButFirstWeekOfFeb.zoomOut().periodStr).toBe('2023-02')

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
    
    //temp while bug on line above this exists
    per = new Period('2022-12-26')

    per = new Period(per.zoomIn());
    expect(per.periodStr).toBe('2022-12-26T00');

    per = new Period(per.zoomIn());
    expect(per.periodStr).toBe('2022-12-26T00:00');

    per = new Period(per.zoomIn());
    expect(per.periodStr).toBe('2022-12-26T00:00:00');
    per = new Period(per.zoomIn());
    expect(per.periodStr).toBe('2022-12-26T00:00:00'); //zooming in returns second again
})

test('Before and After', ()=>{
    /**
     * Before, at all scopes
     */
    let one = new Period('2021-01-01T01:01:01');
    let two = new Period('2021-01-01T01:01:02');
    expect(one.isBefore(two)).toBe(true);
    expect(two.isBefore(one)).toBe(false);

    one = new Period('2021-01-01T01:01');
    two = new Period('2021-01-01T01:02');
    expect(one.isBefore(two)).toBe(true);
    expect(two.isBefore(one)).toBe(false);
    
    one = new Period('2021-01-01T01');
    two = new Period('2021-01-01T02');
    expect(one.isBefore(two)).toBe(true);
    expect(two.isBefore(one)).toBe(false);

    one = new Period('2021-01-01');
    two = new Period('2021-01-02');
    expect(one.isBefore(two)).toBe(true);
    expect(two.isBefore(one)).toBe(false);

    one = new Period('2021-W01');
    two = new Period('2021-W02');
    expect(one.isBefore(two)).toBe(true);
    expect(two.isBefore(one)).toBe(false);
    
    one = new Period('2021-01');
    two = new Period('2021-02');
    expect(one.isBefore(two)).toBe(true);
    expect(two.isBefore(one)).toBe(false);

    one = new Period('2021-Q1');
    two = new Period('2021-Q2');
    expect(one.isBefore(two)).toBe(true);
    expect(two.isBefore(one)).toBe(false);
    
    one = new Period('2020');
    two = new Period('2021');
    expect(one.isBefore(two)).toBe(true);
    expect(two.isBefore(one)).toBe(false);

    /**
     * Before, between scopes
     */
    one = new Period('2021-01');
    two = new Period('2021-02-01');
    expect(one.isBefore(two)).toBe(true);
    expect(two.isBefore(one)).toBe(false);

    one = new Period('2021-03-05T08:54:28');
    two = new Period('2022');
    expect(one.isBefore(two)).toBe(true);
    expect(two.isBefore(one)).toBe(false);

    /**
     * Same is not before
    */
   one = new Period('2021-03-05T08:54:28');
   two = new Period('2021-03-05T08:54:28');
   expect(two.isBefore(one)).toBe(false);
   one = new Period('2021-01');
   two = new Period('2021-01');    
   expect(two.isBefore(one)).toBe(false);
   
   /**
    * Contains is not before
    */
   one = new Period('2021-01');
   two = new Period('2021-01-20');
   expect(one.isBefore(two)).toBe(false);
   expect(two.isBefore(one)).toBe(false);

    /**
     * The logic is completely mirrored for 'isAfter'.
     * All the same stuff should apply.
     */
    one = new Period('2023');
    two = new Period('2022-Q4');
    expect(one.isAfter(two)).toBe(true);
})
import { DataJournal, DJ, Entry, Def, DefType, QueryObject } from "../src/DataJournal";
import { Period, Scope } from "../src/Period";
import { QueryBuilder, StandardParams } from "../src/QueryBuilder.js";
import { describe, test, expect } from "vitest";
import * as testData from './test_datasets';

describe('Building QueryObjects', () => {
    test('Without Defs', () => {
        const q = new QueryBuilder();
        expect(q.toQueryObject()).toEqual({});
        q.deleted(true);
        expect(q.toQueryObject()).toEqual({ deleted: true });
        q.deletedAndUndeleted();
        expect(q.toQueryObject()).toEqual({});
        q.eids('myEntry')
        expect(q.toQueryObject()).toEqual({ entryIds: ['myEntry'] });
        q.from(new Period('2024'))
        expect(q.toQueryObject()).toEqual({
            entryIds: ['myEntry'],
            from: '2024-01-01T00:00:00'
        });
        q.inPeriod('2024-02')
        expect(q.toQueryObject()).toEqual({
            entryIds: ['myEntry'],
            from: '2024-02-01T00:00:00',
            to: '2024-02-29T23:59:59'
        });
        const theEpochStr = DJ.makeEpochStrFrom('2024-03-02T12:12:12')
        q.updatedAfter('2024-03-02T12:12:12');
        expect(q.toQueryObject()).toEqual({
            entryIds: ['myEntry'],
            from: '2024-02-01T00:00:00',
            to: '2024-02-29T23:59:59',
            updatedAfter: theEpochStr
        });
        q.updatedBefore(theEpochStr);
        expect(q.toQueryObject()).toEqual({
            entryIds: ['myEntry'],
            from: '2024-02-01T00:00:00',
            to: '2024-02-29T23:59:59',
            updatedAfter: theEpochStr,
            updatedBefore: theEpochStr
        });

        // there are no Defs passed in, so any method relying on Defs ot complete will throw
        const defToSearchFor: Def = {
            _id: 'BOOK_NAME',
            _type: DefType.TEXT,
            _updated: 'm0ofg4dw'
        }
        expect(() => q.forDefs([defToSearchFor])).toThrowError()
        expect(() => q.forDefsLbld(['BOOK_NAME'])).toThrowError()
        expect(() => q.tags('tagname')).toThrowError();
        expect(() => q.scope(Scope.DAY)).toThrowError()
    })

    test("With Defs", () => {
        const myDj = testData.biggerJournal;
        const q = new QueryBuilder({ dj: myDj });
        q.forDefs(myDj.defs[2]);
        expect(q.toQueryObject()).toEqual({ defs: ["WORKOUT_NAME"] });
        q.forDefsLbld(['WORKOUT_TYPE'])
        expect(q.toQueryObject()).toEqual({ defs: ["WORKOUT_TYPE"] });
        q.tags('health');
        expect(q.toQueryObject()).toEqual({ defs: ["WORKOUT_TYPE", "WORKOUT_NAME"] });
        q.scope(Scope.DAY);
        expect(q.toQueryObject()).toEqual({ defs: [] });

        const otherDJ = testData.defsOnlyABC;
        const otherQ = new QueryBuilder({ defs: otherDJ.defs });
        otherQ.scope(Scope.DAY);
        expect(otherQ.toQueryObject()).toEqual({ defs: ['SLEEP_DURATION'] });
    })

    test('Convenience filtering', () => {
        const actualToday = new Date(new Date().getTime() - new Date().getTimezoneOffset()*60*1000);
        const todayStr = actualToday.toISOString().slice(0,10);
        let q = new QueryBuilder({ params: { today: '' } });
        expect(q.toQueryObject()).toEqual({
            to: todayStr + 'T23:59:59',
            from: todayStr + 'T00:00:00'
        })
    })

    test('Static Method & starter object', () => {
        const starterQueryObject: QueryObject = {
            deleted: false,
        }
        const obj = QueryBuilder.makeQueryObject({ queryObject: starterQueryObject, params: { 'updatedAfter': 'm2m2m2m2' } });
        expect(obj).toEqual({
            deleted: false,
            updatedAfter: 'm2m2m2m2'
        })
    })
})
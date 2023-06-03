import { expect, test } from 'vitest'
import * as pdw from '../src/pdw';
import { Temporal } from 'temporal-polyfill';
import { DefaultDataStore } from '../src/DefaultDataStore';

const pdwRef = pdw.PDW.getInstance();

test.skip('Def Basics', () => {
    /**
     * Most Basic Def Creation
    */
    let firstDef = pdwRef.newDef({
        _lbl: 'First Def'
    });
    expect(firstDef._lbl).toBe('First Def'); //return value
    expect(firstDef._scope).toBe(pdw.Scope.SECOND); //default scope
    expect(firstDef._emoji).toBe('🆕') //default emoji
    expect(firstDef._tempCreated.epochMilliseconds).toBeGreaterThan(Number.parseInt(Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString()) - 5000) //created not long ago...
    expect(firstDef._tempCreated.epochMilliseconds).toBeLessThan(Number.parseInt(Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString())) //...but not in the future

    /**
     * Fully specified Def Creation
     */
    let secondDef = pdwRef.newDef({
        _created: '2023-05-19T16:13:30',
        _updated: '2023-05-19T16:13:30',
        _deleted: false,
        _emoji: '🌭',
        _scope: pdw.Scope.DAY,
        _uid: 'handjammed-30so',
        _did: 'gggg',
        _lbl: 'Second Def',
        _desc: 'Test Desc'
    });
    expect(secondDef._desc).toBe('Test Desc');
    expect(secondDef._emoji).toBe('🌭');
    expect(secondDef._scope).toBe('DAY');
    expect(secondDef._uid).toBe('handjammed-30so');
    expect(secondDef._did).toBe('gggg');
    expect(secondDef._lbl).toBe('Second Def');

    //@ts-expect-error
    expect(() => pdwRef.newDef({ _lbl: 'invalid scope test', _scope: 'millisecond' })).toThrowError('Invalid scope supplied when creating Def: millisecond')

    /**
    * Wide-open getter
    */
    let defs = pdwRef.getDefs();
    expect(defs[0]).toEqual(firstDef); //REF deep equal code
    expect(defs[1]).toEqual(secondDef);

    /**
     * Specified getter
     */
    defs = pdwRef.getDefs({ did: ['gggg'] });
    expect(defs[0]._desc).toBe('Test Desc');

    /**
     * Directly update a Def
     */
    secondDef.updateTo({
        _lbl: 'Updated Second Def'
    });

    /**
     * Check current def is updated
     */
    defs = pdwRef.getDefs({ did: 'gggg', includeDeleted: 'no' });
    expect(defs[0]._lbl).toBe('Updated Second Def');

    /**
     * Indirectly update a Def
     */
    pdwRef.setDefs([{
        _did: 'gggg',
        _lbl: 'Updated Second Def Again'
    }]);

    /**
     * Check current def is updated
     */
    defs = pdwRef.getDefs({ did: 'gggg', includeDeleted: 'no' });

    expect(defs[0]._lbl).toBe('Updated Second Def Again');

    /**
     * Check that out of date def was marked deleted
     */
    defs = pdwRef.getDefs({ did: 'gggg', includeDeleted: 'only' });
    expect(defs[0]._lbl).toBe('Second Def');

    /**
     * Check simple deletion
     */
    firstDef.markDeleted();
    defs = pdwRef.getDefs({ includeDeleted: 'only', did: firstDef._did });
    expect(defs[0]._lbl).toBe('First Def');

    /**
     * Setting PointDef
     */
    let points = secondDef.setPointDefs([
        {
            _lbl: 'Test point one',
            _type: pdw.PointType.TEXT,
        },
        {
            _lbl: 'Test point 2',
            _type: pdw.PointType.NUMBER,
        }
    ]);
    expect(points.length).toBe(2);

    let samePoints = secondDef.getPoints();
    expect(points).toEqual(samePoints);

    /**
     * Defs are Deflike
     */
    expect(pdw.Def.isDefLike(firstDef)).toBe(true);

    /**
     * But PointDefs are not DefLike
     */
    expect(pdw.Def.isDefLike(points[0])).toBe(false);

    /**
     * Fancy way to establish a new Def with PointDefs.
     * Nest PointDef in using a desired _pid as the key
     */
    let thirdDef = pdwRef.newDef({
        _lbl: 'has points!',
        _did: 'thre',
        'aheo': {
            _lbl: 'Point with _pid equal to aheo'
        },
        'thqe': {
            _lbl: 'Point with _pid equal to thqe',
            _type: pdw.PointType.NUMBER
        }
    });
    defs = pdwRef.getDefs({ did: 'thre' });
    expect(defs[0]).toEqual(thirdDef);
    points = pdwRef.getPointDefs({ did: 'thre' });
    expect(thirdDef.getPoints()).toEqual(points);
    points = pdwRef.getPointDefs({ pid: 'aheo' });
    expect(points.length).toBe(1);
    points = pdwRef.getPointDefs({ pid: 'thqe' });
    expect(points.length).toBe(1);
})

test.skip('PointDef Basics', () => {
    //Reset DataStore for test
    (<DefaultDataStore>pdwRef.dataStores[0]).clearAllStoreArrays();

    /**
     * Throw error if there's no associated Definition
     */
    expect(() => pdwRef.setPointDefs([{
        _did: 'doesntexist',
        _lbl: 'should error'
    }])).toThrowError('No associated Def for PointDef');

    /**
     * Make Def & PointDef Simultaneously
     */
    const testDef = pdwRef.newDef({
        _lbl: 'Test Def',
        _did: 'thre',
        'aheo': {
            _lbl: 'Test Point One'
        }
    });
    expect(testDef.getPoints().length).toBe(1);

    /**
     * Append implicitly
     */
    pdwRef.newPointDef({
        _did: 'thre',
        _lbl: 'Test Point Two'
    })
    expect(testDef.getPoints().length).toBe(2);

    /**
     * Test bad point type
     */
    expect(() => pdwRef.newPointDef({
        _did: 'thre',
        //@ts-expect-error
        _type: 'should error'
    })).toThrowError()

    /**
     * Test bad rollup
     */
    expect(() => pdwRef.newPointDef({
        _did: 'thre',
        //@ts-expect-error
        _rollup: 'should error'
    })).toThrowError()
})

test('Entry Basics', () => {
    (<DefaultDataStore>pdwRef.dataStores[0]).clearAllStoreArrays();

    const testDef = pdwRef.newDef({
        _did: 'aaaa',
        _lbl: 'Default Scope test',
        'yyyy': {
            _lbl: 'Point A'
        },
        'zzzz': {
            _lbl: 'Point B',
            _type: pdw.PointType.BOOL
        }
    });

    /**
     * Basic Entry Creation
     */
    const sameSecond = pdw.Period.now(pdw.Scope.SECOND);
    pdwRef.newEntry({
        _did: 'aaaa',
    });
    let entries = pdwRef.getEntries();
    expect(entries.length).toBe(1);
    expect(entries[0]._tempCreated.epochMilliseconds).toBeGreaterThan(Number.parseInt(Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString()) - 5000) //created not long ago...
    expect(entries[0]._tempCreated.epochMilliseconds).toBeLessThan(Number.parseInt(Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString())) //...but not in the future
    expect(entries[0]._period).toBe(sameSecond); //technically could fail every 1000 or so runs

    /**
     * Create Entry with Points
    */
    let testEntry = pdwRef.newEntry({
        _did: 'aaaa',
        'yyyy': 'Text value', //by _pid
        'Point B': true //by _lbl
    })
    entries = pdwRef.getEntries();
    expect(entries.length).toBe(2);
    expect(testEntry._did).toBe('aaaa');
    let points = entries[1].getPoints();
    expect(points.length).toBe(2);
    let point = testEntry.getPoint('yyyy');
    expect(point!._val).toBe('Text value');
    point = testEntry.getPoint('zzzz');
    expect(point!._val).toBe(true);

    /**
    * Direct Entry Creation    
    */
    let epochStr = pdw.makeEpochStr();
    testEntry = pdwRef.setEntries([{
        _did: 'aaaa',
        _created: epochStr,
        _deleted: false,
        _eid: 'hand-jammed',
        _note: 'Direct set all values',
        _period: '2023-06-03T11:29:08',
        _source: "Testing code",
        _uid: 'also-hand-jammed',
        _updated: epochStr
    }])[0]
    entries = pdwRef.getEntries();
    expect(entries.length).toBe(3);
    expect(entries[2]).toEqual(testEntry);
    expect(testEntry._created).toBe(epochStr);
    expect(testEntry._updated).toBe(epochStr);
    expect(testEntry._period).toBe('2023-06-03T11:29:08');
    expect(testEntry._source).toBe("Testing code");
    expect(testEntry._uid).toBe("also-hand-jammed");
    expect(testEntry._note).toBe("Direct set all values");
    expect(testEntry._eid).toBe("hand-jammed");
    expect(testEntry._deleted).toBe(false);
    expect(testEntry._did).toBe('aaaa');

    /**
     * Get Specified entry
     */
    entries = pdwRef.getEntries({eid: 'hand-jammed'});
    expect(entries.length).toBe(1);

    /**
     * Entry.getDef
     */
    expect(testEntry.getDef()).toEqual(testDef)

    /**
     * Def.newEntry method
     */
    testEntry = testDef.newEntry({});
    expect(testEntry._did).toBe('aaaa');

    /**
     * Entry.getPoints for an Entry with no EntryPoints
     */
    points = testEntry.getPoints();
    expect(points.length).toBe(0);

    /**
     * Entry.getPoint for an Entry without that DataPoint
     */
    expect(testEntry.getPoint('zzzz')).toBe(null);
    
    /**
     * Entry.setPoint method for EntryPoint creation
     */
    testEntry.setPoint('zzzz', false);
    let testPoint = testEntry.getPoint('zzzz');
    expect(testPoint!._val).toBe(false);

    /**
     * Entry.setPoint for EntryPoint overwrite
     */
    testEntry.setPoint('zzzz', true);
    testPoint = testEntry.getPoint('zzzz');
    expect(testPoint!._val).toBe(true);

    /**
     * Ensure the overwritten EntryPoint wasn't erased
     */
    expect(testEntry.getPoints().length).toBe(1);
    expect(testEntry.getPoints(true).length).toBe(2);

    /**
     * Create entry with bad point value types
     */
    expect(() => pdwRef.newEntry({
        _did: 'aaaa',
        'yyyy': { 'an': 'Object can be converted to strings but...' },
        'zzzz': { '...this bool': 'should fail' }
    })).toThrowError();

    /**
     * Create entry with bad EntryPoint ID
     */
    expect(() => {
        pdwRef.newEntry({
            _did: 'aaaa',
            'bbbb': { 'a': 'non-existant pointDef value' },
            'yyyy': 'Testing failure given an extra point supplied (bbbb)',
            'zzzz': true
        })
    }).toThrowError()

    //setting up further tests
    const dayScopeDef = pdwRef.newDef({
        _did: 'bbbb',
        _scope: pdw.Scope.DAY,
        _lbl: 'Day scope test def',
        'rvew': {
            _lbl: 'Day Rating',
            _type: pdw.PointType.NUMBER
        }
    })

    /**
     * Scope default inheritance
     */
    let testDayEntry = dayScopeDef.newEntry({
        //period not specified, should inhereit scope from Def
    });
    expect(pdw.Period.inferScope(testDayEntry._period)).toBe(pdw.Scope.DAY);
    
    /**
     * Specified period with correct scope
     */
    testDayEntry = dayScopeDef.newEntry({
        _period: '2023-06-03'
    })
    expect(testDayEntry._period).toBe('2023-06-03');

    /**
     * Scope too granular
     */
    testDayEntry = dayScopeDef.newEntry({
        _period: '2023-06-03T12:24:49'
    })
    expect(testDayEntry._period).toBe('2023-06-03');

    /**
     * Scope too broad, defaults to beginning of period
     */
    testEntry = testDef.newEntry({
        _period: '2023-06-03'
    });
    expect(testEntry._period).toBe('2023-06-03T00:00:00');

    /**
     * Entry.setPeriod
     */
    let updatedTestDayEntry = testDayEntry.setPeriod('2023-06-04');
    expect(updatedTestDayEntry._period).toBe('2023-06-04');
    expect(testDayEntry._period).toBe('2023-06-03'); //original isn't changed
    expect(testDayEntry._deleted).toBe(true); //...but is marked deleted
    expect(testDayEntry._eid).toBe(updatedTestDayEntry._eid);
    
    /**
     * Entry.setNote
     */
    updatedTestDayEntry = updatedTestDayEntry.setNote('Now with note');
    expect(updatedTestDayEntry._note).toBe('Now with note');
    
})

test.skip('Bleedover test', () => {
    const pdwRef = pdw.PDW.getInstance();
    let test = pdwRef.getDefs({});

    expect(test.length).toBe(0);

})
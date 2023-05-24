import { expect, test } from 'vitest'
import * as pdw from '../src/pdw';
import { Temporal } from 'temporal-polyfill';
// Edit an assertion and save to see HMR in action

// test('JSON', () => {
//   const input = {
//     foo: 'hello',
//     bar: 'world',
//   }

//   const output = JSON.stringify(input)

//   expect(output).eq('{"foo":"hello","bar":"world"}')
//   assert.deepEqual(JSON.parse(output), input, 'matches original')
// })

const pdwRef = pdw.PDW.getInstance();

test('Def Basics', () => {

    /**
     * Most Basic Def Creation
    */
    let firstDef = pdwRef.newDef({ 
        _lbl: 'First Def' 
    });
    expect(firstDef._lbl).toBe('First Def'); //return value

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

    /**
    * Wide-open getter
    */
    let defs = pdwRef.getDefs();
    expect(defs[0]).toEqual(firstDef); //REF deep equal code
    expect(defs[1]).toEqual(secondDef);

    /**
     * Specified getter
     */
    defs = pdwRef.getDefs({did:['gggg']});
    expect(defs[0]._desc).toBe('Test Desc');

    pdwRef.setDefs([{
        _did: 'gggg',
        _lbl: 'Upated First Def'
    }])

    firstDef.setPointDefs([
        {
            _lbl: "First Def Point Def", 
            _type: pdw.PointType.TEXT,
            _desc: "A Point",
            _emoji: "🍕",
            _pid: 'uuuu',
            _rollup: pdw.Rollup.COUNT
        }
        ])

    // //getDefs
    // defs = pdwRef.getDefs({ includeDeleted: 'yes' });
    // expect(defs.length).toBe(3);
    // defs = pdwRef.getDefs({ includeDeleted: 'no' });
    // expect(defs.length).toBe(2);
    // defs = pdwRef.getDefs({ includeDeleted: 'only' });
    // expect(defs.length).toBe(1);
    // defs = pdwRef.getDefs({ did: ['gggg'] });
    // expect(defs.length).toBe(1);


    // firstDef.setPointDefs([{
    //     _lbl: 'Point 1',
    //     _pid: 'hhhh',
    //     _type: pdw.PointType.BOOL,
    //     _desc: 'set via Def.setPointDefs()'
    // }])
    // let pointTwo = pdwRef.setPointDefs([{
    //     _did: 'gggg',
    //     _pid: 'iiii',
    //     _lbl: 'Point 2',
    //     _desc: 'set via PDW.setPointDefs'
    // }])[0]

    // let pointDefs = firstDef.getPoints();
    // expect(pointDefs.length).toBe(2);

    // pointTwo.markDeleted();

    // pointDefs = firstDef.getPoints();
    // expect(pointDefs.length).toBe(1);

    //new entry for non-existant def
    // expect(() => pdwRef.newEntry({ _did: 'should err' })).toThrowError()
    // //write to a deleted PointDef
    // expect(() => pdwRef.newEntryPoint({ _eid: 'silent error', _did: 'gggg', _pid: 'iiii', _val: false })).toThrowError()

    // pdwRef.setEntries([{
    //     _did: 'gggg',
    //     hhhh: true
    // }]);
})

test('Entry Basics', () => {


})

test.skip('Bleedover test', () => {
    const pdwRef = pdw.PDW.getInstance();
    let test = pdwRef.getDefs({});

    expect(test.length).toBe(0);

})
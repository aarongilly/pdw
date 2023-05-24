import { expect, test } from 'vitest'
import * as pdw from '../src/pdw';
import { Temporal } from 'temporal-polyfill';

const pdwRef = pdw.PDW.getInstance();

test('Def Basics', () => {
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

    /**
     * Update a Def
     */
    pdwRef.setDefs([{
        _did: 'gggg',
        _lbl: 'Updated Second Def'
    }]);

    /**
     * Check current def is the update
     */
    defs = pdwRef.getDefs({did: 'gggg', includeDeleted: 'no'});
    expect(defs[0]._lbl).toBe('Updated Second Def');
    
    /**
     * Check that out of date def was marked deleted
     */
    defs = pdwRef.getDefs({did: 'gggg', includeDeleted: 'only'});
    expect(defs[0]._lbl).toBe('Second Def');

    /**
     * Check simple deletion
     */
    firstDef.markDeleted();
    defs = pdwRef.getDefs({includeDeleted: 'only', did: firstDef._did});
    expect(defs[0]._lbl).toBe('First Def')
})

test('Entry Basics', () => {

})

test.skip('Bleedover test', () => {
    const pdwRef = pdw.PDW.getInstance();
    let test = pdwRef.getDefs({});

    expect(test.length).toBe(0);

})
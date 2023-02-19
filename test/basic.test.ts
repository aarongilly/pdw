import { expect, test } from 'vitest'
import {makeUid, parseTemporalFromUid} from '../src/pdw';
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

test("Make UID", ()=>{
    let testUid = makeUid();
    let parsedDate = parseTemporalFromUid(testUid);
    
    expect(testUid).toBeTypeOf('string');
    expect(testUid.length).toBe(13);
    expect(parsedDate).toBeTypeOf('object');
})
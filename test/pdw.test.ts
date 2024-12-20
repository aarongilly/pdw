import { describe, expect, test } from 'vitest'
import * as pdw from '../src/pdw';
import { Def, DefType, DJ, Entry, TransactionUpdateMember } from '../src/DataJournal';
// import { Temporal } from 'temporal-polyfill';

const config: pdw.Config = {
    translators: [
        {
            serviceName: 'JSON',
            filePath: 'test/localTestFileDir/dataset.json'
        },
        {
            serviceName: 'JSON',
            filePath: 'test/localTestFileDir/dataset.json'
        }
    ]
}

let pdwRef: pdw.PDW | undefined;

describe('Basic PDW Creation', () => {
    test('No Connectors or Translators', async () => {
        pdwRef = await pdw.PDW.newPDW();
        expect(pdwRef.translators.length).toBe(0);
        expect(pdwRef.connectors.length).toBe(1);
        expect((await pdwRef.query()).length).toBe(0);
        //@ts-expect-error bit of a shortcut here is ok
        pdwRef.connectors[0].commit({defs: {create: [{_id:'tobedeleted',_type:'TEXT',_updated:'m0a3fajl'}]},entries:{}})
        expect(pdwRef.getDefs().length).toBe(1);

        //testing the tester suite, basically, here....
        expect(()=>{
            pdw.PDW.getPDW(); // the instance exists
        }).not.toThrowError()
        //@ts-expect-error - hacking to test my tester & kill the instance
        pdwRef.clearForTest();
        expect(()=>{
            pdw.PDW.getPDW(); // the instance has been destroyed
        }).toThrowError()
    }) 

    test('Using Translators', async () => {
        const singleTranslatorConfig: pdw.Config = {
            translators: [
                {
                    serviceName: 'JSON',
                    filePath: 'test/localTestFileDir/dataset.json'
                }
            ]
        } 
        pdwRef = await pdw.PDW.newPDW(singleTranslatorConfig);
        expect(pdwRef.connectors.length).toBe(1); //default in-memory connector
        expect(pdwRef.translators.length).toBe(1);
        //#THINK - how should this be handled
        // await pdwRef.
        expect(pdwRef.getDefs().length).toBe(3);
        expect(pdwRef.getDefs().find(def=>def._id==='BOOK_NAME')?._desc)
            .toEqual('The name of the book you read.') //data is loaded
        expect((await pdwRef.query()).length).toBe(4);
        //@ts-expect-error - hacking to test my tests
        pdwRef.clearForTest();
        const dualTranslatorConfig: pdw.Config = {
            translators: [
                {
                    serviceName: 'JSON',
                    filePath: 'test/localTestFileDir/dataset.json'
                },
                {
                    serviceName: 'JSON',
                    filePath: 'test/localTestFileDir/tinyAddition.json'
                }
            ]
        }
        pdwRef = await pdw.PDW.newPDW(dualTranslatorConfig);
        expect(pdwRef.connectors.length).toBe(1); //default in-memory connector
        expect(pdwRef.translators.length).toBe(2);
        expect(pdwRef.getDefs().length).toBe(3); //one def was updated
        expect(pdwRef.getDefs().find(def=>def._id==='BOOK_NAME')?._desc)
            .toEqual('The name of the book you read. WITH UPDATE') //updated def was used
        expect((await pdwRef.query()).length).toBe(5); //one entry was added

        //@ts-expect-error - hacking to allow for further testing
        pdwRef.clearForTest();
    })

    test('Single Connector', async () => {
        const singleConfig: pdw.Config = {
            connectors: [
                {
                    serviceName: 'In-Memory Database',
                }
            ]
        }

        pdwRef = await pdw.PDW.newPDW(singleConfig);    
        testTransactions(pdwRef,1); //reusing tests via functions, sweet.
        //testQueries(pdwRef) //#TODO
        //@ts-expect-error - hacking to allow for further testing
        pdwRef.clearForTest();
    })

    test('Dual Connectors', async () => {
        const dualConfig: pdw.Config = {
            connectors: [
                {
                    serviceName: 'In-Memory Database',
                },
                {
                    serviceName: 'In-Memory Database',
                }
            ]
        }
        pdwRef = await pdw.PDW.newPDW(dualConfig);
        testTransactions(pdwRef,2) //reusing tests via functions, sweet.

        //@ts-expect-error - hacking to allow for further testing
        pdwRef.clearForTest();
    })

    async function testTransactions(pdwRef: pdw.PDW, expectedConnectionCount: number){
        expect(pdwRef.connectors.length).toBe(expectedConnectionCount);

        //### DEF things
        //adding a Def
        let myDef: Def = {
            _id: 'defOne',
            _updated: 'm0ofg4dw',
            _type: DefType.NUMBER,
        }
        await pdwRef.setDefs({create:[myDef]})
        expect(pdwRef.getDefs().length).toBe(1);
        let retreivedDef = pdwRef.getDefs()[0];
        //checking provided inputs
        expect(retreivedDef._id).toBe('defOne');
        expect(retreivedDef._updated).toBe('m0ofg4dw');
        expect(retreivedDef._type).toEqual(DefType.NUMBER);
        //no non-required keys are spawned - this is desired?
        expect(Object.keys(retreivedDef).length).toBe(3);
        
        //modifying the Def
        let myUpdate: Def  = {
            _id: 'defOne',
            _updated: 'm0ofzzzz', //manually supplied newer update time
            _type: DefType.NUMBER,
            _desc: 'Now with a description'
        }
        await pdwRef.setDefs({modify: [myUpdate]});
        expect(pdwRef.getDefs().length).toBe(1);
        retreivedDef = pdwRef.getDefs()[0];
        expect(retreivedDef._updated).toBe('m0ofzzzz');
        expect(retreivedDef._desc).toEqual('Now with a description');
        
        //modifying a new field doesn't delete existing ones
        let secondUpdate: TransactionUpdateMember = { 
            _id: 'defOne',
            _lbl: 'Now with label',
        }
        await pdwRef.setDefs({modify: [secondUpdate]})
        expect(pdwRef.getDefs().length).toBe(1);
        retreivedDef = pdwRef.getDefs()[0];
        expect(retreivedDef._updated).not.toBe('m0ofzzzz'); //was changed during update
        expect(retreivedDef._lbl).toEqual('Now with label'); //is added
        expect(retreivedDef._desc).toEqual('Now with a description'); //is NOT REMOVED!
        
        //overwriting DOES remove existing fields
        const oneSecondFromNow = DJ.makeEpochStrFrom(new Date(new Date().getTime() + 1000))
        let thirdUpdate = {
            _id: 'defOne',
            _updated: oneSecondFromNow,
            _type: DefType.NUMBER,
            _emoji: '⭐️'
        }
        await pdwRef.setDefs({replace: [thirdUpdate]})
        expect(pdwRef.getDefs().length).toBe(1);
        retreivedDef = pdwRef.getDefs()[0];
        expect(retreivedDef._updated).toBe(oneSecondFromNow);
        expect(retreivedDef._emoji).toEqual('⭐️'); //is added
        expect(retreivedDef._lbl).toBeUndefined(); //IS REMOVED
        expect(retreivedDef._desc).toBeUndefined(); //IS REMOVED

        //deletion literally removes defs
        await pdwRef.setDefs({delete: ['defOne']})
        expect(pdwRef.getDefs().length).toBe(0);
        
        //appending and updating both also will create if defs don't already exist
        const newDefA: Def = {
            _id: 'addedA',
            _updated: 'm0ofspai',
            _type: DefType.NUMBER
        }
        const newDefB: Def = {
            _id: 'addedB',
            _updated: 'm0ofspai',
            _type: DefType.NUMBER
        }
        await pdwRef.setDefs({
            modify: [newDefA], //doesn't exist, so will be created
            replace: [newDefB] //doesn't exist, so will be created
        })
        expect(pdwRef.getDefs().length).toBe(2);
        
        //### ENTRY things
        const entryA: Entry = {
            _id: 'whateverUniqueIDSchemaAFPEIAH',
            _period: '2024-09-20T17:22:31',
            _updated: 'm0ofg4dw',
            nonExistingDef: 'Is not a problem!'
        }
        await pdwRef.setEntries({create: [entryA]});
        let retreivedEntry = await pdwRef.query({})[0];

        //@ts-expect-error - hacking to allow for further testing
        pdwRef.clearForTest();
    }

    test('Using Connectors AND Translators', async () => {
        /**
         * A common use case in real world, I expect.
         * Load data from static files to memory, and
         * make connections to database(s). Capability
         * to effectively query **all** of it.
         */
        const config: pdw.Config = {
            translators: [
                {
                    serviceName: 'JSON',
                    filePath: 'test/localTestFileDir/dataset.json'
                },
            ],
            connectors: [{
                serviceName: 'In-Memory Database'
            }]
        };
        pdwRef = await pdw.PDW.newPDW(config);
        expect(pdwRef.connectors.length).toBe(1);
        expect(pdwRef.translators.length).toBe(1);
        //wouldn't typically grab the connector directly, but 
        //the test is seeing if the translator JSON file was
        //imported to the connector, so this is the only way
        const connector = pdwRef.connectors[0];
        const connectorDefs = connector.getDefs();
        expect(connectorDefs).toEqual([
            {
                "_id": "BOOK_NAME",
                "_lbl": "Book",
                "_emoji": "📖",
                "_desc": "The name of the book you read.",
                "_updated": "m0ofg4dw",
                "_scope": "MINUTE",
                "_rollup": "COUNTDISTINCT",
                "_type": "TEXT",
                "_tags": [
                    "media"
                ],
                "_range": []
            },
            {
                "_id": "WORKOUT_TYPE",
                "_lbl": "Workout Type",
                "_emoji": "🏋️",
                "_desc": "You did a broad workout of this type",
                "_updated": "m0ofg4dw",
                "_scope": "HOUR",
                "_type": "SELECT",
                "_tags": [
                    "health"
                ],
                "_range": [
                    "CARDIO",
                    "STRENGTH",
                    "MOBILITY"
                ]
            },
            {
                "_id": "WORKOUT_NAME",
                "_lbl": "Workout Name",
                "_emoji": "💪",
                "_desc": "The name of the routine, or brief description of it.",
                "_updated": "m0ofg4dw",
                "_scope": "HOUR",
                "_type": "TEXT",
                "_tags": [
                    "health"
                ],
                "_range": []
            }
        ],)
        const connectorEntries = await connector.query({});
        expect(connectorEntries).toEqual([
            {
                "_id": "m0ofgfio_gjlp",
                "_period": "2024-09-04T18:39:00",
                "_created": "m0ofgfio",
                "_updated": "m0ofgfio",
                "_deleted": false,
                "_note": "A very typical entry",
                "_source": "Test data",
                "BOOK_NAME": "Atomic Habits"
            },
            {
                "_id": "m0ogacof_3fjk",
                "_period": "2024-09-05T11:09:00",
                "_created": "m0ogacof",
                "_updated": "m0ogbzzz",
                "_deleted": false,
                "_note": "An *updated* entry, now with 3 points",
                "_source": "Test data, with edit!",
                "BOOK_NAME": "Atomic Habits",
                "WORKOUT_TYPE": "CARDIO",
                "WORKOUT_NAME": "Biked"
            },
            {
                "_id": "m0ogdggg_ca3t",
                "_period": "2024-09-05T11:05:00",
                "_created": "m0ogdggg",
                "_updated": "m0ogdggg",
                "_deleted": false,
                "_note": "Got so swole",
                "_source": "Test data",
                "WORKOUT_TYPE": "STRENGTH",
                "WORKOUT_NAME": "Starting Strength A"
            },
            {
                "_id": "m0ofacho_poax",
                "_period": "2024-09-06T10:38:00",
                "_created": "m0ofacho",
                "_updated": "m0zzzzzz",
                "_deleted": true,
                "_note": "Demo a deleted entry",
                "_source": "Test daaata"
            }
        ])
    })
    
})


// const pdwRef = await pdw.PDW.newPDW({connectors: [{
//     serviceName: 'Strawman In-Memory Database'
// }]});


// function resetTestDataset() {
//     //@ts-expect-error - hacking to set the private manifest prop, it has no setter on purpose
//     pdwRef._manifest = [];
//     (<pdw.DefaultDataStore>pdwRef.dataStore).clearAllStoreArrays();
// }

// test('Basic setup', async ()=>{
//     resetTestDataset();
//     let pdwOne = await pdw.PDW.newPDW([]);
//     let pdwTwo = await pdw.PDW.newPDW([]);
//     await pdwOne.newDef({_did:'test'});
//     await pdwTwo.newDef({_did:'two instances'});
//     /**
//      * Independent Instances of PDW can be created & manipulated
//      */
//     expect(pdwOne.manifest.length).toBe(1);
//     expect(pdwOne.getDefFromManifest('test')!.did).toBe('test');
//     expect(pdwTwo.manifest.length).toBe(1);
//     expect(pdwTwo.getDefFromManifest('two instances')!.did).toBe('two instances');

//     let pdwThree = await pdw.PDW.newPDW([{_did:'three instances'}]);
//     expect(pdwThree.manifest.length).toBe(1);
//     expect(pdwThree.getDefFromManifest('three instances')!.did).toBe('three instances')
// })

// test('Def Creation and Getting', async () => {
//     resetTestDataset();
//     /**
//      * Most Basic Def Creation
//     */
//     let firstDef = await pdwRef.newDef({
//         _did: 'aaaa'
//     });
//     expect(firstDef.did).toBe('aaaa'); //accepts input value
//     expect(firstDef.lbl).toBe('aaaa'); //return value #TODO - changed default behavior here
//     expect(firstDef.scope).toBe(pdw.Scope.SECOND); //default scope
//     expect(firstDef.emoji).toBe('🆕') //default emoji
//     expect(firstDef.pts).toEqual([]); //default points = empty array
//     expect(firstDef.tags).toEqual([]); //default tags = empty array
//     expect(firstDef.desc).toBe('Set a description'); //default description
//     expect(firstDef.deleted).toBe(false); //default deletion status
//     expect(firstDef.tempCreated.epochMilliseconds).toBeGreaterThan(Number.parseInt(Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString()) - 5000) //created not long ago...
//     expect(firstDef.tempCreated.epochMilliseconds).toBeLessThan(Number.parseInt(Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString())) //...but not in the future
//     expect(pdwRef.getDefFromManifest('aaaa')).toEqual(firstDef); //defs are added to the manifest

//     /**
//      * Fully specified Def Creation
//      */
//     let secondDef = await pdwRef.newDef({
//         _created: '2023-05-19T16:13:30',
//         _updated: '2023-05-19T16:13:30',
//         _deleted: false,
//         _emoji: '🌭',
//         _scope: pdw.Scope.DAY,
//         _uid: 'handjammed-30so',
//         _tags: ['mytag'],
//         _did: 'gggg',
//         _lbl: 'Second Def',
//         _desc: 'Test Desc'
//     })
//     expect(secondDef.desc).toBe('Test Desc');
//     expect(secondDef.emoji).toBe('🌭');
//     expect(secondDef.scope).toBe('DAY');
//     expect(secondDef.uid).toBe('handjammed-30so');
//     expect(secondDef.did).toBe('gggg');
//     expect(secondDef.lbl).toBe('Second Def');
//     expect(secondDef.tags).toEqual(['mytag']);
//     expect(secondDef.deleted).toBe(false);
//     //checking epochStr
//     const epochMillis = parseInt(secondDef.created, 36)
//     const parsedTemporal = Temporal.Instant.fromEpochMilliseconds(epochMillis).toZonedDateTimeISO(Temporal.Now.timeZone());
//     const localeString = parsedTemporal.toLocaleString();
//     expect(localeString).toBe('5/19/2023, 4:13:30\u202fPM CDT'); //until daylight savings hits, then it will be an hour off. also \u202f is the non-breaking space char code    
//     expect(secondDef.created).toEqual(secondDef.updated); //created & updated are the same if the Element isn't an update to an existing one

//     /**
//      * Some base class {@link Element} methods
//      */
//     expect(firstDef.getType()).toBe('DefData');
//     expect(firstDef.isOlderThan(secondDef)).toBe(false); //because secondDef was backdated on creation
//     expect(firstDef.shouldBeReplacedWith(secondDef)).toBe(false); //not the same _did
//     expect(firstDef.sameIdAs(secondDef)).toBe(false); //not the same _did
//     expect(firstDef.sameTypeAs(secondDef)).toBe(true); //both 'DefLike'
//     expect(secondDef.toData()).toEqual({
//         _created: "lhv25fo0", //converted from date string in Element constructor
//         _updated: "lhv25fo0", //converted from date string in Element constructor
//         _deleted: false,
//         _emoji: '🌭',
//         _scope: pdw.Scope.DAY,
//         _uid: 'handjammed-30so',
//         _tags: ['mytag'],
//         _did: 'gggg',
//         _lbl: 'Second Def',
//         _desc: 'Test Desc',
//         _pts: [] //added as default
//     });
//     let copy = firstDef.makeStaticCopy() as pdw.Def;
//     expect(copy).toEqual(firstDef); //copies start off equal
//     copy.lbl = 'changed.'
//     expect(copy.lbl).toBe('changed.'); //copy IS changed.
//     expect(firstDef.lbl).toBe('aaaa'); //original is NOT changed

//     /**
//      * Def.hasTag
//      */
//     expect(secondDef.hasTag('MYtAg')).toBe(true); //tags aren't case-sensitive

//     /**
//     * Wide-open getter
//     */
//     let defs = await pdwRef.getDefs();
//     expect(defs[0]).toEqual(firstDef); //REF deep-equal syntax
//     expect(defs[1]).toEqual(secondDef);

//     /**
//      * Specified getter
//      */
//     defs = (await pdwRef.getDefs()).filter(def=>def.did==='gggg');
//     expect(defs[0].lbl).toBe('Second Def');

//     /**
//      * Bulk Def Creation
//      */
//     let thirdAndForthDef = await pdwRef.setDefs(
//         [
//             {
//                 _did: 'Third def'
//             },
//             {
//                 _did: 'Forth def'
//             }
//         ]
//     );
//     expect(thirdAndForthDef.defData![0]._lbl).toBe('Third def');
//     expect(thirdAndForthDef.defData![1]._lbl).toBe('Forth def');
//     defs = await pdwRef.getDefs();
//     expect(defs.length).toBe(4);

//     /**
//      * Emoji not emoji error
//      */
//     expect(async () =>
//         await pdwRef.newDef({
//             _did: 'temp',
//             _emoji: 'not an emoji' //emoji isn't 1 character long
//         })).rejects.toThrowError()  //interesting syntax

//     /**
//      * Invalid Scope Error
//      */
//     expect(() => pdwRef.newDef(
//         {
//             _lbl: 'invalid scope test',
//             //@ts-expect-error // luckily typescript warns me on this
//             _scope: 'millisecond'
//         }
//     )).rejects.toThrowError()  //interesting syntax

//     //###### reset datasets for fresh testing below #######
//     resetTestDataset();

//     /**
//      * Setting Def with explicity ._pts PointDefs 
//      */
//     firstDef = await pdwRef.newDef({
//         _did: 'aaaa',
//         _lbl: 'Def 1',
//         _pts: [
//             {
//                 _pid: 'a111',
//                 _lbl: 'Def 1 point 1',
//                 _emoji: '1️⃣',
//                 _desc: 'Text type',
//                 _type: pdw.PointType.TEXT
//             },
//             {
//                 _pid: 'a222',
//                 _lbl: 'Def 1 point 2',
//                 _emoji: '2️⃣',
//                 _desc: "Boolean Type",
//                 _type: pdw.PointType.BOOL
//             }
//         ]
//     })
//     expect(firstDef.pts.length).toBe(2);
//     expect(firstDef.pts[0].lbl).toBe('Def 1 point 1');
//     expect(firstDef.pts[1].lbl).toBe('Def 1 point 2');

//     /**
//      * Setting Def with implicit Points
//      */
//     secondDef = await pdwRef.newDef({
//         _did: 'bbbb',
//         _lbl: 'Def 2',
//         'b111': {
//             _lbl: 'Def 2 point 1',
//             _type: pdw.PointType.NUMBER,
//             _desc: 'Number Type'
//         },
//         'b222': {
//             _lbl: 'Def 2 point 2',
//             _type: pdw.PointType.SELECT,
//             _desc: 'Select type'
//         }
//     })
//     expect(secondDef.pts.length).toBe(2);
//     expect(secondDef.pts[0].lbl).toBe('Def 2 point 1');
//     expect(secondDef.pts[1].lbl).toBe('Def 2 point 2');

//     /**
//      * Setting a Def using both - probably not common to do in practice
//      */
//     let thirdDef = await pdwRef.newDef({
//         _did: 'cccc',
//         _lbl: 'Def 3',
//         'c111': {
//             _lbl: 'Def 3 point 1',
//             _type: pdw.PointType.MARKDOWN,
//             _desc: 'Markdown type'
//         },
//         _pts: [
//             {
//                 _pid: 'c222',
//                 _lbl: 'Def 3 point 2',
//                 _type: pdw.PointType.MULTISELECT,
//                 _desc: 'Multiselect Type'
//             }
//         ]
//     })
//     expect(thirdDef.pts.length).toBe(2);
//     expect(thirdDef.pts[1].lbl).toBe('Def 3 point 1'); //order cannot be trusted I guess
//     expect(thirdDef.pts[0].lbl).toBe('Def 3 point 2');

//     /**
//      * Setting Defs & PointDefs implicitly, mixing point setter methods
//      */
//     let defsFourAndFive = await pdwRef.setDefs([
//         {
//             _did: 'dddd',
//             _pts: [
//                 {
//                     _pid: 'd1111',
//                     _lbl: 'Def 4 point 1',
//                     _type: pdw.PointType.DURATION,
//                 }
//             ]
//         },
//         {
//             _did: 'eeee',
//             'e111': {
//                 _lbl: 'Def 5 point 1',
//                 _type: pdw.PointType.TIME
//             }
//         }
//     ]);
//     expect(defsFourAndFive.defData![0]._pts[0]._lbl).toBe('Def 4 point 1');
//     expect(defsFourAndFive.defData![1]._pts[0]._lbl).toBe('Def 5 point 1');

//     /**
//      * Def.getPoint(pid)
//      */
//     let point = firstDef.getPoint('a111')!;
//     expect(point.type).toBe(pdw.PointType.TEXT);

//     /**
//      * Def.getPoint(lbl)
//      */
//     point = firstDef.getPoint('Def 1 point 2')!;
//     expect(point.type).toBe(pdw.PointType.BOOL);

//     /**
//      * Def.getPoint() that doesn't exist
//      */
//     expect(firstDef.getPoint('NO SUCH POINT')).toBeUndefined()

//     /**
//      * Point.getDef
//      */
//     expect(point.getDef()).toEqual(firstDef);

//     /**
//      * Should have Options Property
//      */
//     let textType = firstDef.getPoint('a111')!;
//     let selectType = secondDef.getPoint('b222')!;
//     let multiselectType = thirdDef.getPoint('c222')!;
//     //predicate
//     expect(pdw.PointDef.shouldHaveOpts(textType.type)).toBe(false);
//     expect(pdw.PointDef.shouldHaveOpts(selectType.type)).toBe(true);
//     expect(pdw.PointDef.shouldHaveOpts(multiselectType.type)).toBe(true);
//     //existance & type of prop
//     expect(textType.opts).toBeUndefined();
//     expect(multiselectType.opts).toEqual([]);

//     /**
//      * Invalid PointDef (bad Type)
//      */
//     expect(async () => {
//         await pdwRef.newDef({
//             _did: 'test',
//             _pts: [
//                 {
//                     _pid: 'test',
//                     //@ts-expect-error //nice
//                     _type: 'Invalid type'
//                 }
//             ]
//         })
//     }).rejects.toThrowError();

//     /**
//      * Invalid PointDef (bad Rollup)
//     */
//     expect(async () => {
//         await pdwRef.newDef({
//             _did: 'test',
//             _pts: [
//                 {
//                     _pid: 'test',
//                     //@ts-expect-error //nice
//                     _rollup: 'Invalid rollup'
//                 }
//             ]
//         })
//     }).rejects.toThrowError();

//     /**
//      * Defs are Deflike, but not PointDefs
//      */
//     expect(pdw.Def.isDefData(firstDef.data)).toBe(true);
//     expect(pdw.Def.isDefData(point.data)).toBe(false);

//     /**
//      * Vice Versa
//      */
//     expect(pdw.PointDef.isPointDefData(point.data)).toBe(true);
//     expect(pdw.PointDef.isPointDefData(firstDef.data)).toBe(false);

//     /**
//      * PointDef with _opts --- Opt manipulations
//      */
//     const defWithOptions = await pdwRef.newDef({
//         _did: 'ffff',
//         _pts: [
//             {
//                 _pid: 'aaaa',
//                 _type: pdw.PointType.SELECT,
//                 _opts: ['Opt 1', 'Opt 2']
//             }
//         ]
//     });
//     const pointWithOptions = defWithOptions.getPoint('aaaa')!;
//     expect(Object.keys(pointWithOptions.opts!).length).toBe(2);
//     expect(pointWithOptions.hasOpt('Opt 1')).toBe(true);
//     expect(pointWithOptions.hasOpt('Opt 3')).toBe(false);
//     //implicitly testing that this doesn't throw an error;
//     pointWithOptions.removeOpt('non-existant opt');
//     pointWithOptions.addOpt('Opt 3');
//     expect(pointWithOptions.hasOpt('Opt 3')).toBe(true);
//     pointWithOptions.removeOpt('Opt 3');
//     expect(pointWithOptions.hasOpt('Opt 3')).toBe(false);
//     expect(Object.keys(pointWithOptions.opts).length).toBe(2);
// })

// test('Entry Creation and Getting', async () => {
//     resetTestDataset();

//     const testDef = await pdwRef.newDef({
//         _did: 'aaaa',
//         _lbl: 'Default Scope test',
//         'yyyy': {
//             _lbl: 'Point A',
//             _desc: 'Test point desc'
//         },
//         'zzzz': {
//             _lbl: 'Point B',
//             _type: pdw.PointType.BOOL
//         }
//     });

//     /**
//      * Basic Entry Creation
//      */
//     const sameSecond = pdw.Period.now(pdw.Scope.SECOND);
//     pdwRef.newEntry({
//         _did: 'aaaa',
//     });
//     let entries = await pdwRef.getEntries();
//     expect(entries.length).toBe(1);
//     let entry = entries[0];
//     expect(entry.tempCreated.epochMilliseconds).toBeGreaterThan(Number.parseInt(Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString()) - 5000) //created not long ago...
//     expect(entry.tempCreated.epochMilliseconds).toBeLessThan(Number.parseInt(Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString())) //...but not in the future
//     expect(entry.period.toString()).toBe(sameSecond); //technically could fail every 1000 or so runs
//     expect(entry.getPoints().length).toBe(0); //points weren't supplied, they aren't generated
//     expect(entry.note).toBe(''); //default
//     expect(entry.source).toBe(''); //default

//     /**
//      * Create Entry with explicit Points
//     */
//     let testEntry = await pdwRef.newEntry({
//         _did: testDef.did,
//         'yyyy': 'Text value', //by _pid
//         'PoiNT b': true //by _lbl - case doesn't matter
//     })
//     entries = await pdwRef.getEntries();
//     expect(entries.length).toBe(2);
//     entry = entries[1];
//     expect(testEntry.did).toBe('aaaa');
//     expect(entry.data['yyyy']).toBe('Text value');
//     expect(entry.data['zzzz']).toBe(true);


//     testEntry = await pdwRef.newEntry({
//         _did: testDef.did,
//         _pts: {
//             'yyyy': "text",
//             "zzzz": false
//         }
//     });
//     entries = await pdwRef.getEntries();
//     expect(entries.length).toBe(3);
//     expect(testEntry.did).toBe('aaaa');
//     //checking values - the typical, easy way
//     expect(testEntry.data['yyyy']).toBe('text');
//     expect(testEntry.data['zzzz']).toBe(false);

//     /**
//      * Entry.getPoints
//      */
//     //getPoints returns an object with these keys
//     let points = entry.getPoints();
//     expect(points.length).toBe(2);
//     let entryPointObj = points.find(point => point.pid === 'yyyy')!;
//     expect(entryPointObj.pointDef.desc).toBe('Test point desc');
//     expect(entryPointObj.pid).toBe('yyyy');
//     expect(entryPointObj.lbl).toBe('Point A');
//     expect(entryPointObj.val).toBe('Text value');

//     /**
//      * Entry.getPoint with pid and with lbl
//      */
//     //getPoint returns the same keys, but for only the point specified by pid or lbl
//     expect(entry.getPoint('yyyy')).toEqual(entryPointObj);
//     expect(entry.getPoint('yyyy')).toEqual(entry.getPoint('Point A'));

//     /**
//      * Entry.getPoint for a non-existnt point
//      */
//     expect(entry.getPoint('zzzz not real')).toBeUndefined();

//     /**
//     * Full Entry Creation    
//     */
//     let epochStr = pdw.makeEpochStr();
//     let tempArr = await pdwRef.setEntries([{
//         _did: 'aaaa',
//         _created: epochStr,
//         _deleted: false,
//         _eid: 'hand-jammed',
//         _note: 'Direct set all values',
//         _period: '2023-06-03T11:29:08',
//         _source: "Testing code",
//         _uid: 'also-hand-jammed',
//         _updated: epochStr
//     }]);

//     testEntry = new pdw.Entry(tempArr.entryData![0], pdwRef);
//     entries = await pdwRef.getEntries();
//     expect(entries.length).toBe(4);
//     expect(entries[3]).toEqual(testEntry);
//     expect(testEntry.created).toBe(epochStr);
//     expect(testEntry.updated).toBe(epochStr);
//     expect(testEntry.period.toString()).toBe('2023-06-03T11:29:08');
//     expect(testEntry.source).toBe("Testing code");
//     expect(testEntry.uid).toBe("also-hand-jammed");
//     expect(testEntry.note).toBe("Direct set all values");
//     expect(testEntry.eid).toBe("hand-jammed");
//     expect(testEntry.deleted).toBe(false);
//     expect(testEntry.did).toBe('aaaa');

//     /**
//      * Get Specified entry
//      */
//     entries = await pdwRef.getEntries({ eid: 'hand-jammed' });
//     expect(entries.length).toBe(1);

//     /**
//      * Def.newEntry method
//      */
//     expect((await pdwRef.getEntries()).length).toBe(4);
//     //_did is not required in the "Def.newEntry()" method. It's pulled from said Def
//     testEntry = await testDef.newEntry({});
//     expect((await pdwRef.getEntries()).length).toBe(5);
//     expect(testEntry.did).toBe('aaaa');

//     /**
//      * Create entry with bad point value types
//      */
//     expect(async () => await pdwRef.newEntry({
//         _did: 'aaaa',
//         'yyyy': { 'an': 'Object is implicitly coerced to string but...' },
//         'zzzz': { '...this bool': 'should fail' }
//     })).rejects.toThrowError()

//     /**
//      * Create entry with bad EntryPoint ID
//      */
//     expect(async () => {
//         await pdwRef.newEntry({
//             _did: 'aaaa',
//             'bbbb': { 'a': 'non-existant pointDef value' }
//         })
//     }).rejects.toThrowError();

//     //setting up further tests
//     const dayScopeDef = await pdwRef.newDef({
//         _did: 'bbbb',
//         _scope: pdw.Scope.DAY,
//         _lbl: 'Day scope test def',
//         'rvew': {
//             _lbl: 'Day Rating',
//             _type: pdw.PointType.NUMBER
//         }
//     })

//     /**
//      * Scope default inheritance
//      */
//     let testDayEntry = await dayScopeDef.newEntry({
//         //period not specified, should inhereit scope from Def
//         'rvew': 10
//     });
//     expect(pdw.Period.inferScope(testDayEntry.period.toString())).toBe(pdw.Scope.DAY);
//     expect(testDayEntry.getPoint('rvew')!.val).toBe(10)

//     /**
//      * Specified period with correct scope
//      */
//     testDayEntry = await dayScopeDef.newEntry({
//         _period: '2023-06-03'
//     })
//     expect(testDayEntry.period.toString()).toBe('2023-06-03');

//     /**
//      * Scope too granular, zooms out to correct level
//      */
//     testDayEntry = await dayScopeDef.newEntry({
//         _period: '2023-06-03T12:24:49'
//     })
//     expect(testDayEntry.period.toString()).toBe('2023-06-03');

//     /**
//      * Scope too broad, defaults to beginning of period
//      */
//     testEntry = await testDef.newEntry({
//         _period: '2023-06-03'
//     });
//     expect(testEntry.period.toString()).toBe('2023-06-03T00:00:00');

//     /**
//      * Opts
//      */
//     let defWithOpts = await pdwRef.newDef({
//         _did: 'cccc',
//         _pts: [
//             {
//                 _pid: 'c111',
//                 _lbl: 'Select Point',
//                 _type: pdw.PointType.SELECT,
//                 _opts: ['Opt 1', 'Opt 2']
//             }
//         ]
//     })
//     /**
//      * Basic creation of entry with a Select
//      */
//     let entryWithOpts = await defWithOpts.newEntry({
//         _note: 'Setting Opt 1',
//         'c111': 'Opt 1'
//     })
//     expect(entryWithOpts.getPoint('Select Point')?.val).toBe('Opt 1');

//     /**
//      * New select options are allowed, but don't get added to the Def.
//      * Def.addOpt() has to be explicitly called.
//      */
//     expect(defWithOpts.pts[0].hasOpt('NEW OPT')).toBe(false);
//     entryWithOpts = await defWithOpts.newEntry({
//         _note: 'Setting Non-existant opt',
//         'c111': 'NEW OPT'
//     })
//     let point = entryWithOpts.getPoint('Select Point')!;
//     expect(point.val).toBe('NEW OPT'); //value is set
//     expect(defWithOpts.pts[0].hasOpt('NEW OPT')).toBe(false);// but it's still not in the def
    
//     let defWithMultiselect = await pdwRef.newDef({
//         _did: 'dddd',
//         _pts: [
//             {
//                 _pid: 'd111',
//                 _type: pdw.PointType.MULTISELECT,
//                 _opts: ['ddd1', 'ddd2']
//             }
//         ]
//     })
//     let none = await defWithMultiselect.newEntry({
//         'd111': []
//     });
//     let one = await defWithMultiselect.newEntry({
//         'd111': ['ddd1']
//     });
//     let both = await defWithMultiselect.newEntry({
//         'd111': ['ddd1', 'ddd2']
//     });
//     expect(none.getPoint('d111')?.val).toEqual([]);
//     expect(one.getPoint('d111')?.val).toEqual(['ddd1']);
//     expect(both.getPoint('d111')?.val).toEqual(['ddd1', 'ddd2']);
// })

// test('Update Logic', async () => {
//     resetTestDataset();

//     let origUid = pdw.makeUID();

//     let def = await pdwRef.newDef({
//         _uid: origUid,
//         _did: 'aaaa',
//         _lbl: 'Def 1',
//         _desc: 'Def Desc',
//         _pts: [
//             {
//                 _pid: 'a111',
//                 _lbl: 'Def 1 point 1',
//                 _desc: 'Point Desc'
//             },
//             {
//                 _pid: 'a222',
//                 _lbl: 'Def 1 point 2',
//                 _desc: 'Numero Dos'
//             }
//         ]
//     });

//     /**
//      * Not modified to begin with.
//      */
//     expect(def.isSaved()).toBe(true);

//     /**
//      * Element.delete
//     */
//     //modify Def
//     expect(def.deleted).toBe(false);
//     def.deleted = true;
//     expect(def.deleted).toBe(true);
//     expect(def.isSaved()).toBe(false);
//     //its counterpart from the manifest isn't changed yet
//     let defFromManifest = pdwRef.getDefFromManifest('aaaa')!;
//     expect(defFromManifest.deleted).toBe(false);
//     //its counterpart in the DataStore isn't changed yet
//     let defFromStores = await pdwRef.getDefs();
//     expect(defFromStores.length).toBe(1);
//     let defFromStore = defFromStores[0];
//     expect(defFromStore.deleted).toBe(false);
//     expect((await pdwRef.getDefs()).length).toBe(1);
//     expect((await pdwRef.getDefs(true)).length).toBe(1);

//     //save it to the datastore
//     await def.save();
//     expect(def.isSaved()).toBe(true);
//     //DataStore now has the deletion, but didnt' spawn any additional elements
//     expect((await pdwRef.getDefs()).length).toBe(0);
//     expect((await pdwRef.getDefs(true)).length).toBe(1);
//     //manifest no longer has the def
//     expect(() => {
//         pdwRef.getDefFromManifest('aaaa'); //no longer exists, this throws error
//     }).toThrowError();

//     //undelete the def in memory
//     def.deleted = false;
//     expect(def.isSaved()).toBe(false);
//     //data store didn't change
//     expect((await pdwRef.getDefs()).length).toBe(0);
//     expect((await pdwRef.getDefs(true)).length).toBe(1);
//     //manifest still has no matching def
//     expect(() => {
//         pdwRef.getDefFromManifest('aaaa'); //no longer exists, this throws error
//     }).toThrowError();

//     //write undelete back to datastore
//     await def.save();
//     expect(def.isSaved()).toBe(true);
//     //DataStore now reflects the undeletion, but didnt' spawn any additional elements
//     expect((await pdwRef.getDefs()).length).toBe(1);
//     expect((await pdwRef.getDefs(true)).length).toBe(1); //no deleted elements were spawned
//     //its counterpart from the manifest is also reflects the undeletion.
//     defFromManifest = pdwRef.getDefFromManifest('aaaa')!;
//     expect(defFromManifest.deleted).toBe(false);

//     /**
//      * Do other types of modifications.
//      */
//     def.lbl = "Def 1 with new Label";
//     expect(def.isSaved()).toBe(false);
//     //no change yet
//     expect((await pdwRef.getDefs()).length).toBe(1);
//     //check on the def in the manifest as well
//     defFromManifest = pdwRef.getDefFromManifest(def.did)!;
//     expect(defFromManifest.lbl).toBe('Def 1');

//     //write change to the data store
//     await def.save();
//     let notDeletedFromStore = await pdwRef.getDefs();
//     let deletedFromStore = (await pdwRef.getDefs(true)).filter(def=>def.deleted);
//     expect(notDeletedFromStore.length).toBe(1);
//     expect(notDeletedFromStore[0].lbl).toBe('Def 1 with new Label');
//     expect(deletedFromStore.length).toBe(1);
//     expect(deletedFromStore[0].lbl).toBe('Def 1');
//     //check on the def in the manifest as well
//     defFromManifest = pdwRef.getDefFromManifest(def.did)!;
//     expect(defFromManifest.lbl).toBe('Def 1 with new Label');

//     def.created = pdw.makeEpochStr();
//     def.lbl = 'Def ONE';
//     def.emoji = '🤿';
//     def.desc = 'Modify *then* verify';
//     await def.save()

//     deletedFromStore = await pdwRef.getDefs(true)
//     expect(deletedFromStore.length).toBe(3);
//     notDeletedFromStore = await pdwRef.getDefs();
//     expect(notDeletedFromStore[0].lbl).toBe('Def ONE');
//     expect(notDeletedFromStore[0].emoji).toBe('🤿');
//     expect(notDeletedFromStore[0].desc).toBe('Modify *then* verify');

//     /**
//      * Other base Def properties cannot be set due to lack of setter.
//      * Cannot change _uid, _did, or _scope
//      */
//     expect(() => {
//         //@ts-expect-error
//         def.did = 'fails'
//     }).toThrowError();

//     /**
//      * Tag Stuff
//      */
//     def.addTag('#taggy');
//     // #TODO - were you going to test this? You forgot.

//     /**
//      * saving without any changes no props doesn't change datastore
//      */
//     expect((await pdwRef.getDefs(true)).length).toBe(3);
//     await def.save();
//     expect((await pdwRef.getDefs(true)).length).toBe(3);

//     /**
//      * Data validation for Emoji
//      */
//     def.emoji = 'Something that is not an emoji'; //will fail internally
//     expect(def.emoji).toBe('🤿')

//     /**
//      * Data validation for _updated & _created
//      */
//     let stringDate = '2023-07-22T15:55:27'; //plaindatetime string
//     def.created = stringDate
//     expect(def.created).toBe('lkehoqoo') //lkehoqoo is right
//     let date = new Date();
//     //firstDef.setProps({_created: date}); //also works, but difficult to prove again and again

//     //#### Updating PointDef stuff ####
//     /**
//      * Def.addPoint
//      */
//     def.addPoint({
//         _pid: 'a333',
//         _lbl: 'Added',
//         _type: pdw.PointType.SELECT
//     });
//     expect(def.getPoint('a111')!.pid).toBe('a111');
//     expect(def.getPoint('a222')!.pid).toBe('a222');
//     expect(def.getPoint('a333')!.pid).toBe('a333');

//     /**
//      * PointDef modification
//      */
//     let point = def.getPoint('Added')!;
//     expect(point.pid).toBe('a333');
//     point.desc = "Added dynamically";
//     expect(point.desc).toBe('Added dynamically');
//     //added point hasn't effected the store yet
//     notDeletedFromStore = await pdwRef.getDefs();
//     expect(notDeletedFromStore.length).toBe(1);
//     expect(notDeletedFromStore[0].pts.length).toBe(2);
//     point.save();
//     notDeletedFromStore = await pdwRef.getDefs();
//     expect(notDeletedFromStore.length).toBe(1);
//     expect(notDeletedFromStore[0].pts.length).toBe(3);
//     expect(notDeletedFromStore[0].getPoint('a333')!.desc).toBe('Added dynamically');

//     /**
//      * Data Validation on PointDef.setProps on emoji, rollup, and type
//      */
//     expect(point.emoji).toBe('🆕');
//     point.emoji = 'Invalid emoji';
//     expect(point.emoji).toBe('🆕'); //no change
//     expect(point.rollup).toBe(pdw.Rollup.COUNT);
//     //@ts-expect-error - typescript warning, nice
//     point.rollup = 'Invalid rollup';
//     expect(point.rollup).toBe(pdw.Rollup.COUNT); //no change

//     /**
//      * Opts
//      */
//     point = def.getPoint('a333')!;
//     expect(point.shouldHaveOpts()).toBe(true);
//     point.addOpt('Option 1');
//     expect(Object.keys(point.opts).length).toBe(1);
//     point.addOpt('Option 2');
//     expect(Object.keys(point.opts).length).toBe(2);
//     point.removeOpt('Option 2');
//     expect(Object.keys(point.opts).length).toBe(1);

//     /**
//      * Entries
//      */
//     let entry = await pdwRef.newEntry({ //minimal entry input using newEntry on PDW
//         _did: def.did,
//         'Added': 'o111', //addressed using point.lbl
//         'a222': 'Point value' //addressed using point.pid
//     });

//     /**
//      * Base entry props updating
//      */
//     expect(entry.note).toBe('');
//     expect(entry.getPointVal('a222')).toBe('Point value');
//     expect(entry.isSaved()).toBe(true);
//     entry.note = "Added note";
//     expect(entry.isSaved()).toBe(false);
//     expect(entry.note).toBe('Added note');
//     entry.source = 'Test procedure';
//     expect(entry.source).toBe('Test procedure');

//     entry.period = '2023-07-21T14:04:33';
//     expect(entry.period.toString()).toBe('2023-07-21T14:04:33');
//     let fromStore: any = (await pdwRef.getEntries())[0];
//     expect(fromStore.note).toBe(''); //store not updated yet
//     await entry.save(); //update stored entry
//     fromStore = (await pdwRef.getEntries({ includeDeleted: 'no' }))[0];
//     expect(fromStore.note).toBe('Added note'); //store updated with new entry
//     expect(fromStore.getPointVal('a222')).toBe('Point value'); //point is retained
//     let original = (await pdwRef.getEntries({ includeDeleted: 'only' }))[0];
//     expect(original.note).toBe(''); //original entry retained unchanged
//     expect(original.uid !== fromStore.uid).toBe(true); //uid is different
//     expect(original.eid === fromStore.eid).toBe(true); //eid is the same

//     /**
//      * Entry Point Values
//      */
//     entry.setPointVals([
//         { 'a333': 'o333' },
//         { 'a222': 'Other point new value!' }
//     ]);
//     expect(entry.getPoint('a222')!.val).toBe('Other point new value!');
//     expect(entry.getPoint('a333')!.val).toBe('o333');
//     //or set one at a time:
//     entry.setPointVal('a333', 'o111');
//     expect(entry.getPoint('a333')!.val).toBe('o111');

//     /**
//      * Multiselect Opts
//      */
//     def.addPoint({
//         _pid: 'a444',
//         _lbl: 'Multiselect Test',
//         _type: pdw.PointType.MULTISELECT,
//         _opts: ['A','B']
//     })
//     await def.save(); //must save to make the new point available to new entries
//     entry = await def.newEntry({
//         'a444': []
//     });
//     expect(entry.getPoint('Multiselect Test')!.val).toEqual([]);
//     entry.setPointVal('a444', ['aaaa', 'bbbb']); //change multiselect selections
//     expect(entry.getPoint('Multiselect Test')!.val).toEqual(['aaaa', 'bbbb']); //works
//     entry.setPointVal('a444', 'aaaa, bbbb, cccc'); //can also just have comma-delimited string
//     expect(entry.getPoint('Multiselect Test')!.val).toEqual(['aaaa', 'bbbb', 'cccc']); //works, doesn't care about the non-existant 'cccc' opt
//     entry.setPointVal('a444', 'aaaa,bbbb'); //spacing on a comma-delimited string is ignored
//     expect(entry.getPoint('Multiselect Test')!.val).toEqual(['aaaa', 'bbbb']); //works
//     entry.setPointVal('a444', 'aaaa'); //and a single string value is converted to an array
//     expect(entry.getPoint('Multiselect Test')!.val).toEqual(['aaaa']); //works

//     /**
//      * Entry Period scope protection
//      */
//     entry.period = '2023-07-21';
//     expect(entry.period.toString()).toBe('2023-07-21T00:00:00');
// })

// test('Get All', async () => {
//     resetTestDataset();
//     let def = await pdwRef.newDef({
//         _did: 'yoyo',
//         _pts: [
//             {
//                 _pid: 'aaaa'
//             }
//         ]
//     })
//     let entry = def.newEntry({
//         _note: 'for test'
//     });
//     await def.save(); //updates the Def
//     let all = await pdwRef.getAll({ includeDeleted: 'yes' });
//     expect(Object.keys(all)).toEqual(['defs', 'entries', 'overview']);
//     expect(all.entries.length).toBe(1);
//     expect(all.defs.length).toBe(1);
// })

// test('Query Basics', async () => {
//     resetTestDataset()

//     await createTestDataSet();

//     /**
//      * Empty queries are rejected
//      */
//     let q = new pdw.Query(pdwRef);
//     let result = await q.run();
//     expect(result.success).toBe(false);
//     expect(result.msgs![0]).toBe('Empty queries not allowed. If seeking all, include {allOnPurpose: true}')
//     q.allOnPurpose(); //set 'all' explicitly.
//     result = await q.run()
//     expect(result.success).toBe(true);
//     expect(result.msgs).toBeUndefined();
//     expect(result.count).toBe(9);

//     /**
//      * Query.includeDeleted 
//      * and 
//      * Query.onlyIncludeDeleted
//      */
//     q = new pdw.Query(pdwRef);
//     q.allOnPurpose(); //"include deleted" isn't narrow enough to bypass the need for expliciy 'all'
//     q.includeDeleted();
//     result = await q.run();
//     expect(result.count).toBe(10);
//     //q = new pdw.Query(pdwRef); //good practice, probably, but not needed here
//     q.includeDeleted(false);
//     result = await q.run();
//     expect(result.count).toBe(9);
//     q.onlyIncludeDeleted();
//     result = await q.run();
//     expect(result.count).toBe(1);

//     /**
//      * Query.forDids
//      * Query.forDefs
//      * Querty.forDefsLbld
//      */
//     //these all internally set the StandardParam "_did", so you don't need to make new Query instances
//     q = new pdw.Query(pdwRef);
//     q.forDids(['aaaa']); //no need for "all()"
//     let origResult = await q.run();
//     expect(origResult.count).toBe(3);
//     q.forDids('aaaa'); //converted to array internally
//     expect((await q.run())).toEqual(origResult);
//     let def = (await pdwRef.getDefs()).filter(def=>def.did==='aaaa')[0];
//     q.forDefs([def]);
//     expect((await q.run())).toEqual(origResult);
//     q.forDefs(def); //converted to array internally
//     expect((await q.run())).toEqual(origResult);
//     q.forDefsLbld('Nightly Review'); //label for that def
//     expect((await q.run())).toEqual(origResult);

//     /**
//      * Query.uids()
//      */
//     q = new pdw.Query(pdwRef);
//     q.uids(['lkfkuxob-0av3', 'lkfkuxo8-9ysw']);
//     expect((await q.run()).count).toBe(2);

//     /**
//      * Query.eids()
//      */
//     q = new pdw.Query(pdwRef);
//     q.eids(['lkfkuxon-f9ys']); // the entry that was updated
//     expect((await q.run()).count).toBe(1);
//     q.includeDeleted();
//     result = await q.run();
//     expect(result.count).toBe(2); //now returning both versions
//     expect(result.entries.map(e => e.getPointVal('bbb2'))).toEqual(['Michael Jordan', 'Michael SCOTT'])


//     /**
//      * Created & Updated, both Before & After
//     */
//     q = new pdw.Query(pdwRef);
//     q.includeDeleted().allOnPurpose();
//     expect((await q.run()).entries.length).toBe(10)
//     q = new pdw.Query(pdwRef).includeDeleted();
//     expect((await q.createdBefore('2023-07-23').run()).entries.length).toBe(4);
//     q = new pdw.Query(pdwRef).includeDeleted();
//     expect((await q.createdAfter('2023-07-23').run()).entries.length).toBe(6);
//     q = new pdw.Query(pdwRef).includeDeleted();
//     expect((await q.updatedBefore('2023-07-23').run()).entries.length).toBe(2);
//     q = new pdw.Query(pdwRef).includeDeleted();
//     expect((await q.updatedAfter('2023-07-23').run()).entries.length).toBe(8);
//     //all of which also works with epochStr, Dates, Temporal.ZonedDateTimes and full ISO strings;
//     q = new pdw.Query(pdwRef).includeDeleted();
//     let fullISO = '2023-07-23T03:04:50-05:00';
//     let epochStr = pdw.makeEpochStrFrom('2023-07-23T03:04:50-05:00')!;
//     let temp = pdw.parseTemporalFromEpochStr(epochStr);
//     let date = new Date('2023-07-23T03:04:50-05:00');
//     result = await q.updatedAfter(fullISO).run();
//     expect((await q.updatedAfter(epochStr).run()).entries).toEqual(result.entries);
//     expect((await q.updatedAfter(temp).run()).entries).toEqual(result.entries);
//     expect((await q.updatedAfter(date).run()).entries).toEqual(result.entries);

//     /**
//      * Entry Period: From, To, and inPeriod
//      */
//     q = new pdw.Query(pdwRef);
//     q.from('2023-07-22');
//     expect((await q.run()).entries.length).toBe(6);
//     q = new pdw.Query(pdwRef);
//     q.to('2023-07-22');
//     expect((await q.run()).entries.length).toBe(4);
//     q = new pdw.Query(pdwRef);
//     q.from('2023-07-20').to('2023-07-25'); //specify both ends explicitly
//     expect((await q.run()).entries.length).toBe(6)
//     q = new pdw.Query(pdwRef);
//     q.from('2023-07-22').to('2023-07-22'); //from = from START, end = from END, so this gets all day
//     let fromTo = (await q.run()).entries;
//     expect(fromTo.length).toBe(1)
//     q = new pdw.Query(pdwRef);
//     q.inPeriod('2023-07-22'); //same as specifying from().to() for same period
//     expect((await q.run()).entries).toEqual(fromTo);
//     q = new pdw.Query(pdwRef);
//     q.inPeriod('2022'); //same as specifying from().to() for same period
//     expect((await q.run()).entries.map(e => e.getPoint('ddd1')!.val)).toEqual(['The Time Traveller 2']);

//     /**
//      * Tags
//      */
//     q = new pdw.Query(pdwRef);
//     q.tags('tag1');
//     origResult = await q.run();
//     expect(origResult.entries.length).toBe(5);

//     /**
//      * Scopes
//      */
//     q = new pdw.Query(pdwRef);
//     q.scope(pdw.Scope.DAY);
//     expect((await q.run()).count).toBe(3);
//     q.scope([pdw.Scope.DAY, pdw.Scope.SECOND]);
//     expect((await q.run()).count).toBe(9);

//     q.scopeMax(pdw.Scope.YEAR); //statement doesn't filter anything, but won't break anything
//     expect((await q.run()).count).toBe(9);
//     q.scopeMax(pdw.Scope.SECOND);
//     expect((await q.run()).count).toBe(6);

//     q.scopeMin(pdw.Scope.SECOND); //statement doesn't filter anything, but won't break anything
//     expect((await q.run()).count).toBe(9);
//     q.scopeMin(pdw.Scope.DAY);
//     expect((await q.run()).count).toBe(3);

//     /**
//      * Sort
//      */
//     q = new pdw.Query(pdwRef);
//     q.forDefsLbld('Nightly Review');
//     q.sort('_updated', 'asc');
// })

// test('Data Merge', () => {
//     (<pdw.DefaultDataStore>pdwRef.dataStore).clearAllStoreArrays();

//     let a: pdw.ElementData[] = tinyDataA().defs!;
//     let b: pdw.ElementData[] = tinyDataB().defs!;
//     expect(a.length).toBe(1);
//     expect(b.length).toBe(2);
//     let merge: any = pdwRef.merge(a, b);
//     expect(merge.length).toBe(3); //original, first update, 2nd update

//     merge = pdwRef.merge(a, merge); //merging the same dataset in again...
//     expect(merge.length).toBe(3);//...adds nothing new

//     a = tinyDataA().entries!;
//     b = tinyDataB().entries!;
//     expect(a.length).toBe(1);
//     expect(b.length).toBe(3);
//     merge = pdwRef.merge(a, b);
//     expect(merge.length).toBe(3); //a was marked deleted in b

//     a = tinyDataA().defs!;
//     let c: pdw.ElementData[] = tinyDataA().defs!;

//     merge = pdwRef.merge(a, c);
//     expect(merge.length).toBe(1); //a is same as c

//     //combine all at the same time
//     merge = pdwRef.mergeComplete(tinyDataA(), tinyDataB());
//     expect(merge.defs.length).toBe(3);
//     expect(merge.entries.length).toBe(3);

//     function tinyDataA(): pdw.CanonicalDataset {
//         return {
//             defs: [
//                 {
//                     "_uid": "lkljr435-phsn",
//                     "_deleted": false,
//                     "_updated": "lkljr435",
//                     "_created": "lkljr435",
//                     "_did": "cccc",
//                     "_lbl": "Movie",
//                     "_tags": ['tag1'],
//                     "_desc": "Set a description",
//                     "_emoji": "🎬",
//                     "_scope": pdw.Scope.SECOND,
//                     "_pts": [
//                         {
//                             "_lbl": "Name",
//                             "_desc": "Set a description",
//                             "_emoji": "🎬",
//                             "_type": pdw.PointType.TEXT,
//                             "_rollup": pdw.Rollup.COUNT,
//                             "_pid": "ccc1",
//                             "_opts": []
//                         }
//                     ]
//                 },
//             ],
//             entries: [
//                 {
//                     "_uid": "lkljr4sj-grd4",
//                     "_deleted": false,
//                     "_updated": "lkljr4sk",
//                     "_created": "lkljr4sk",
//                     "_eid": "lkljr4sk-526e",
//                     "_note": "",
//                     "_did": "cccc",
//                     "_period": "2023-07-24T18:45:00",
//                     "_source": "",
//                     "ccc1": "Oppenheimer"
//                 },
//             ]
//         }
//     }

//     function tinyDataB(): pdw.CanonicalDataset {
//         return {
//             defs: [
//                 {
//                     "_uid": "lkljr888-zzzz",
//                     "_deleted": true,
//                     "_updated": "lkljr888",
//                     "_created": "lkljr435",
//                     "_did": "cccc",
//                     "_lbl": "Movie",
//                     "_tags": ['tag1'],
//                     "_desc": "Now has a description!",
//                     "_emoji": "🎬",
//                     "_scope": pdw.Scope.SECOND,
//                     "_pts": [
//                         {
//                             "_lbl": "Name",
//                             "_desc": "This is now also described.",
//                             "_emoji": "🎬",
//                             "_type": pdw.PointType.TEXT,
//                             "_rollup": pdw.Rollup.COUNT,
//                             "_pid": "ccc1",
//                             "_opts": []
//                         }
//                     ]
//                 },
//                 {
//                     "_uid": "lkljr999-zzzz",
//                     "_deleted": false,
//                     "_updated": "lkljr999",
//                     "_created": "lkljr435",
//                     "_did": "cccc",
//                     "_lbl": "Movie",
//                     "_tags": ['tag1'],
//                     "_desc": "Now has an UPDATED description!",
//                     "_emoji": "🎬",
//                     "_scope": pdw.Scope.SECOND,
//                     "_pts": [
//                         {
//                             "_lbl": "Name",
//                             "_desc": "This is now also described.",
//                             "_emoji": "🎬",
//                             "_type": pdw.PointType.TEXT,
//                             "_rollup": pdw.Rollup.COUNT,
//                             "_pid": "ccc1",
//                             "_opts": []
//                         }
//                     ]
//                 },
//             ],
//             entries: [
//                 {
//                     "_uid": "lkljr4sg-aayg",
//                     "_deleted": false,
//                     "_updated": "lkljr4si",
//                     "_created": "lkljr4sh",
//                     "_eid": "lkljr4sj-bulk",
//                     "_note": "",
//                     "_did": "cccc",
//                     "_period": "2023-07-24T13:15:00",
//                     "_source": "",
//                     "ccc1": "Barbie"
//                 },
//                 {
//                     "_uid": "lkljr4sj-grd4",
//                     "_deleted": true,
//                     "_updated": "lkljr4sk",
//                     "_created": "lkljr4sk",
//                     "_eid": "lkljr4sk-526e",
//                     "_note": "",
//                     "_did": "cccc",
//                     "_period": "2023-07-24T18:45:00",
//                     "_source": "",
//                     "ccc1": "Oppenheimer"
//                 },
//                 {
//                     "_uid": "lkljr999-grd4",
//                     "_deleted": false,
//                     "_updated": "lkljr999",
//                     "_created": "lkljr4sk",
//                     "_eid": "lkljr4sk-526e",
//                     "_note": "This movie bombed",
//                     "_did": "cccc",
//                     "_period": "2023-07-24T18:45:00",
//                     "_source": "",
//                     "ccc1": "Oppenheimer"
//                 },
//             ]
//         }
//     }

// })

// test('Summarizer', async () => {
//     resetTestDataset()

//     await createSummaryDataSet();

//     let q = pdwRef.query();

//     let all = (await new pdw.Query(pdwRef).inPeriod(new pdw.Period('2023-08-21').zoomOut()).run()).entries;

//     //summarize by week
//     let periods = pdw.PDW.summarize(all, pdw.Scope.WEEK);
//     expect(periods.length).toBe(1);
    
//     let checkRollup = periods[0].entryRollups.find(er=>er.lbl === 'Nap')!
//     expect(checkRollup.pts.find(pt=>pt.pid==='b111')!.val).toBe('PT14760S')
//     expect(checkRollup.pts.find(pt=>pt.pid==='b222')!.val).toBe('false: 1, true: 3')
//     expect(checkRollup.pts.find(pt=>pt.pid==='b333')!.val).toBe('21:02:58')
//     checkRollup = periods[0].entryRollups.find(er=>er.lbl === 'Event')!
//     expect(checkRollup.pts.find(pt=>pt.pid==='aaaa')!.val).toBe(3); //point._rollup = COUNT
//     expect(checkRollup.pts.find(pt=>pt.pid==='bbbb')!.val).toBe(2); //point._rollup = COUNTUNIQUE

//     //summarize by day
//     periods = pdw.PDW.summarize(all, pdw.Scope.DAY);
//     expect(periods.length).toBe(3);
//     checkRollup = periods[0].entryRollups.find(er=>er.lbl === 'Nap')!
//     expect(checkRollup.pts.find(pt=>pt.pid==='b111')!.val).toBe('PT9360S')
//     expect(checkRollup.pts.find(pt=>pt.pid==='b222')!.val).toBe('true: 1, false: 1')
//     expect(checkRollup.pts.find(pt=>pt.pid==='b333')!.val).toBe('22:05:28')
    
//     //summarize all into one "ALL" period
//     periods = pdw.PDW.summarize(all, "ALL");
//     expect(periods.length).toBe(1);
//     // console.log(periods[0].entryRollups, 'yo');
    
// })

// async function createTestDataSet() {
//     const nightly = await pdwRef.newDef({
//         _did: 'aaaa',
//         _lbl: 'Nightly Review',
//         _scope: pdw.Scope.DAY,
//         _emoji: '👀',
//         _pts: [
//             {
//                 _emoji: '👀',
//                 _lbl: 'Review',
//                 _desc: 'Your nightly review',
//                 _pid: 'aaa1',
//                 _type: pdw.PointType.MARKDOWN
//             },
//             {
//                 _emoji: '👔',
//                 _lbl: 'Work Status',
//                 _desc: 'Did you go in, if so where?',
//                 _pid: 'aaa2',
//                 _type: pdw.PointType.SELECT,
//                 _opts: [
//                     'Weekend/Holiday',
//                     'North',
//                     'WFH',
//                     'Vacation',
//                     'sickday',
//                 ]
//             },
//             {
//                 _emoji: '1️⃣',
//                 _desc: '10 perfect 1 horrid',
//                 _lbl: 'Satisfaction',
//                 _pid: 'aaa3',
//                 _type: pdw.PointType.NUMBER
//             },
//             {
//                 _emoji: '😥',
//                 _desc: '10 perfect 1 horrid',
//                 _lbl: 'Physical Health',
//                 _pid: 'aaa4',
//                 _type: pdw.PointType.NUMBER
//             }
//         ]
//     });
//     const quotes = await pdwRef.newDef({
//         _did: 'bbbb',
//         _lbl: 'Quotes',
//         _desc: 'Funny or good sayings',
//         _scope: pdw.Scope.SECOND,
//         _emoji: "💬",
//         'bbb1': {
//             _emoji: "💬",
//             _lbl: "Quote",
//             _desc: 'what was said',
//             _type: pdw.PointType.TEXT
//         },
//         'bbb2': {
//             _emoji: "🙊",
//             _lbl: "Quoter",
//             _desc: 'who said it',
//             _type: pdw.PointType.TEXT
//         },
//     })
//     const movies = await pdwRef.newDef({
//         _did: 'cccc',
//         _lbl: 'Movie',
//         _emoji: "🎬",
//         _tags: ['tag1'],
//         _scope: pdw.Scope.SECOND,
//         'ccc1': {
//             _lbl: 'Name',
//             _emoji: "🎬",
//         },
//         'ccc2': {
//             _lbl: 'First Watch?',
//             _emoji: '🆕',
//             _type: pdw.PointType.BOOL
//         }
//     })
//     const book = await pdwRef.newDef({
//         _did: 'dddd',
//         _lbl: 'Book',
//         _emoji: "📖",
//         _tags: ['tag1'],
//         _scope: pdw.Scope.SECOND,
//         'ddd1': {
//             _lbl: 'Name',
//             _emoji: "📖",
//         },
//     })
//     /**
//      * Several entries
//      */
//     let quote = await quotes.newEntry({
//         _eid: 'lkfkuxon-f9ys',
//         _period: '2023-07-21T14:02:13',
//         _created: '2023-07-22T20:02:13Z',
//         _updated: '2023-07-22T20:02:13Z',
//         _note: 'Testing updates',
//         'bbb1': 'You miss 100% of the shots you do not take',
//         'bbb2': 'Michael Jordan' //updated later
//     });

//     nightly.newEntry({
//         _uid: 'lkfkuxo8-9ysw',
//         _eid: 'lkfkuxol-mnhe',
//         _period: '2023-07-22',
//         _created: '2023-07-22T01:02:03Z',
//         _updated: '2023-07-22T01:02:03Z',
//         _deleted: false,
//         _source: 'Test data',
//         _note: 'Original entry',
//         'aaa1': "Today I didn't do **anything**.",
//         'aaa2': 'Weekend/Holiday',
//         'aaa3': 9,
//         'aaa4': 10
//     });
//     nightly.newEntry({
//         _uid: 'lkfkuxob-0av3',
//         _period: '2023-07-23',
//         _source: 'Test data',
//         'aaa1': "Today I wrote this line of code!",
//         'aaa2': 'opt3',
//         'aaa3': 5,
//         'aaa4': 9
//     });
//     nightly.newEntry({
//         _period: '2023-07-21',
//         _created: '2023-07-20T22:02:03Z',
//         _updated: '2023-07-20T22:02:03Z',
//         _note: 'pretending I felt bad',
//         _source: 'Test data',
//         'aaa1': "This was a Friday. I did some stuff.",
//         'aaa2': 'WFH',
//         'aaa3': 6,
//         'aaa4': 5
//     });
//     book.newEntry({
//         'ddd1': "Oh the places you'll go!"
//     })
//     book.newEntry({
//         _period: '2025-01-02T15:21:49',
//         'ddd1': "The Time Traveller"
//     })
//     book.newEntry({
//         _period: '2022-10-04T18:43:22',
//         'ddd1': "The Time Traveller 2"
//     });
//     movies.newEntry({
//         _period: '2023-07-24T13:15:00',
//         'Name': 'Barbie',
//         'First Watch?': true
//     });
//     movies.newEntry({
//         _period: '2023-07-24T18:45:00',
//         'ccc1': 'Oppenheimer',
//         'ccc2': true
//     });

//     await quote.setPointVal('bbb2', 'Michael SCOTT').save();
// }

// async function createSummaryDataSet() {
//     const nap = await pdwRef.newDef({
//         _did: 'nap',
//         _lbl: "Nap",
//         _scope: pdw.Scope.SECOND,
//         _pts: [
//             {
//                 _pid: "b111",
//                 _lbl: "Duration",
//                 _emoji: "🕰️",
//                 _rollup: pdw.Rollup.SUM,
//                 _type: pdw.PointType.DURATION
//             },
//             {
//                 _pid: "b222",
//                 _lbl: "Felt Rested",
//                 _emoji: "😀",
//                 _rollup: pdw.Rollup.COUNTOFEACH,
//                 _type: pdw.PointType.BOOL
//             },
//             {
//                 _pid: "b333",
//                 _lbl: "Start time",
//                 _rollup: pdw.Rollup.AVERAGE,
//                 _type: pdw.PointType.TIME
//             }
//         ]
//     })
//     const event = await pdwRef.newDef({
//         _did: 'event',
//         _lbl: "Event",
//         _scope: pdw.Scope.HOUR,
//         _pts: [
//             {
//                 _pid: 'aaaa',
//                 _type: pdw.PointType.TEXT
//             },
//             {
//                 _pid: 'bbbb',
//                 _type: pdw.PointType.NUMBER,
//                 _rollup: pdw.Rollup.COUNTUNIQUE
//             }
//         ]

//     })
//     const daily = await pdwRef.newDef({
//         _did: 'dddd',
//         _lbl: "Journal",
//         _scope: pdw.Scope.DAY,
//         _pts: [
//             {
//                 _pid: 'ddd1',
//                 _lbl: 'Nightly Review',
//                 _type: pdw.PointType.MARKDOWN
//             }
//         ]
//     })

//     event.newEntry({
//         _period: '2023-08-23T01',
//         'aaaa': 'Whatever',
//         'bbbb': 1,
//     });
//     event.newEntry({
//         _period: '2023-08-23T02',
//         'aaaa': 'Something else',
//         'bbbb': 2,
//     });
//     event.newEntry({
//         _period: '2023-08-23T03',
//         'aaaa': 'A third time, but only a second new number',
//         'bbbb': 2,
//     });

//     daily.newEntry({
//         _period: '2023-08-23',
//         'ddd1': "Today I did *a lot*"
//     })
    
//     nap.newEntry({
//         _period: "2023-08-23T16:30:29",
//         'b111': "PT25M",
//         "b222": true,
//         'b333': "23:30:29"
//     })
//     nap.newEntry({
//         _period: "2023-08-21T12:42:26",
//         'b111': "PT25M",
//         "b222": false,
//         'b333': '02:28:29'
//     })
//     nap.newEntry({
//         _period: "2023-08-21T17:42:26",
//         'b111': "PT2H11M",
//         "b222": true,
//         'b333': '17:42:26'
//     })
//     nap.newEntry({
//         _period: "2023-08-22T16:30:29",
//         'b111': "PT1H5M",
//         "b222": true,
//         'b333': '16:30:29'
//     })
// }
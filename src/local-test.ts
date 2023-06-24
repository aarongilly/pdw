//// @ts-nocheck
import * as pdw from './pdw.js'
import { Scope } from './pdw.js'
import { AsyncExcelNatural, altTempExport, exportToFile } from './dataStores/fileAsyncDataStores.js';
import { importFromFile, altTempImport } from './dataStores/fileAsyncDataStores.js';
import { Temporal, toTemporalInstant } from 'temporal-polyfill';
import { importFirestore, importMongo, importOldV9, importOldest } from './onetimeImports.js'

const pdwRef = pdw.PDW.getInstance();

const origUid = pdw.makeUID();

let firstDef = pdwRef.newDef({
    _uid: origUid,
    _did: 'aaaa',
    _lbl: 'Def 1',
    _desc: 'Def Desc',
    _pts: [
        {       
            _pid: 'a111',
            _lbl: 'Def 1 point 1',
            _desc: 'Point Desc'
        }
    ]
});

/**
 * Element.deleteAndSave()
 */
firstDef = firstDef.deleteAndSave() as pdw.Def;
let savedDef = pdwRef.getDefs({includeDeleted: 'yes'});

/**
 * Element.unDeleteAndSave()
 */
firstDef = firstDef.unDeleteAndSave() as pdw.Def;

/**
 * Update Props, don't save yet
*/
let modified = firstDef.setProps({_lbl: 'DEF ONE'}) as pdw.Def;

/**
 * Save after updating
*/
modified.save();
let defs = pdwRef.getDefs({did: 'aaaa'})
let balls = 'sack'
//    expect(firstDef.)

// importFromFile('data-files/OutJSON.json');
// altTempImport('data-files/SmallNested.yaml');

// createTestFilesDataElements();

// const defOne = pdwRef.getDefs({ did: '0m7w' })[0]
// const defTwo = pdwRef.getDefs({ did: '05a8' })[0]

// defOne.newEntry({
//     '8esq': 'Entry value'
// })
// let all = pdwRef.getAll({includeDeleted: 'yes'});

// console.log(def);
// console.log(def.getType());

// altTempExport(all, 'data-files/TestNest.yaml')

//Write to file before any updates
// let outFileOneame = 'data-files/newYaml.yaml';
// exportToFile(outFileOneame, pdwRef.getAll({ includeDeleted: 'yes' }));

/* old stuff
//the firestore/mongo big merge
// importFromFile('real-data/out-fromfirestore.csv');
// importFromFile('real-data/out-frommongo-xlated.csv');
// exportToFile('real-data/merged.csv', pdw.getAll({includeDeleted:'yes'}))

// if(false){

// importFromFile('real-data/workouts.csv');
// importFromFile('real-data/partial-old-more.csv')
// importFromFile('real-data/nearly-complete.csv')
// importFromFile('data-files/newYaml.yaml')
// importOldV9('real-data/V9-massaged.xlsx')
// exportToFile('real-data/final.yaml', pdw.getAll({}))
// const allData = pdw.getAll({});
// console.log(allData);

// importOldest('real-data/final-import.xlsx')

// importFromFile('real-data/merged-firestore-mongo.csv')
// importFromFile('real-data/partial-old-more.csv')

// const data = pdw.getAll({includeDeleted: 'yes'});
// exportToFile('real-data/partial-old-dataset.csv',data)
// exportToFile('real-data/partial-old-dataset.yaml',data)

//create all current file types from firestore & mongo data
// importFromFile('real-data/merged-firestore-mongo.csv')
// const allData = pdw.getAll({includeDeleted:'yes', did:['hovt']})
// const entries = pdw.getAll({'includeDeleted': 'yes'})
// console.log(allData);
// exportToFile('real-data/combotest.csv', entries)
// exportToFile('real-data/combotest.xlsx', entries)
// exportToFile('real-data/combotest.json', entries)
// exportToFile('real-data/combotest.yaml', entries)
// }

// exportToFile('real-data/merged.json', allData)
// exportToFile('real-data/merged.yaml', allData)
// exportToFile('real-data/merged.xlsx', allData)

// importFromFile('real-data/out-fromfirestore.csv')
// console.log('yo');
// exportToFile('real-data/deleteme.csv',pdw.getAll({}))

// createTestFiles();

// this worked. Old data, updated, import of new data merge behaved as expected
// importFromFile('data-files/OutExcel1.xlsx');
// pdw.newEntry({
//     _did: '0m7w',
//     '8esq': '0vvb'
// })
// importFromFile('data-files/OutExcel2.xlsx');
// exportToFile('data-files/OutExcel4.xlsx', pdw.getAll({includeDeleted: 'yes'}))

// exportToFile('real-data/out-frommongo.csv', pdw.getAll({includeDeleted:'yes'}))
// importFromFile('data-files/outCSV.csv');
// console.log('yo');

// exportToFile('data-files/out-',pdw.getAll({}))

// createTestFiles();

// importFromFile('data-files/OutJSON.json');
// importFromFile('data-files/OutExcel2.xlsx');
// let xl = new AsyncExcelNatural().importFrom('data-files/Excel_Test.xlsx')

// const endOfJan = new Period('2023-01-30')
// const januaryDateButFirstWeekOfFeb = new Period(endOfJan.zoomOut());
// const toMonth = januaryDateButFirstWeekOfFeb.zoomOut()
// console.log(januaryDateButFirstWeekOfFeb);

// let mydef = pdw.getDefs({
//     updatedBefore: 'lgvn3a11',
//     includeDeleted: 'yes'
// })

// importFromFile('data-files/OutYaml.yaml');

// console.log(pdw.allDataSince());
*/

// function createTestFilesDataElements() {
//     //Testing newDef && Def.setPointDefs
//     const one = pdwRef.newDef({
//         _did: '0m7w',
//         _lbl: 'Friends',
//         _emoji: '1️⃣',
//         _scope: Scope.SECOND,
//         _desc: 'A definition with a multiselect Point',
//         '8esq': {
//             _lbl: 'Friends',
//             _type: pdw.PointType.MULTISELECT,
//             _emoji: '⛏️',
//             _desc: 'For testing Multiselects',
//             _pid: '8esq',
//             _rollup: pdw.Rollup.COUNTOFEACH
//         }
//     })

//     //Def-level tag
//     pdwRef.newTagDef({
//         _lbl: 'Journal',
//         _tid: 'apio'
//     })
//     one.addTag('apio');

//     //PointDef Multiselect Option tags
//     const selectPointDef = one.getPointsAsArray()[0];
//     selectPointDef.addEnumOption('Krista', 'tagk');
//     selectPointDef.addEnumOption('Nick', 'tagn');
//     selectPointDef.addEnumOption('Josh', 'tagj');

//     one.newEntry({
//         _period: '2023-06-10T17:34:17',
//         _source: 'Test File Data',
//         '8esq': ['tagk', 'tagn']
//     })

//     one.newEntry({
//         _period: '2023-06-11T18:29:20',
//         _source: 'Test File Data',
//         _note: 'Had a good time',
//         '8esq': ['tagj']
//     })

//     one.newEntry({
//         _period: '2023-05-28T09:29:27',
//         _source: 'Test File Data',
//         _note: 'Testing deleted stuff',
//         _deleted: true,
//         // '8esq': ['tagk'] //#THINK - marking entry as deleted doesn't mark its entryPoint as deleted.
//     })

//     const two = pdwRef.newDef({
//         _did: 'ay7l',
//         _lbl: 'Fitness Hour',
//         _emoji: '2️⃣',
//         _scope: Scope.HOUR,
//         _desc: 'Scoped at an **hour**. With two points',
//         'paxl': {
//             _type: pdw.PointType.NUMBER,
//             _lbl: 'Exercise Minutes',
//             _emoji: '🏃',
//             _rollup: pdw.Rollup.SUM
//         },
//         '0pc6': {
//             _type: pdw.PointType.NUMBER,
//             _lbl: 'Move Calories',
//             _emoji: '#️⃣',
//             _rollup: pdw.Rollup.AVERAGE
//         },
//         '0tb7': {
//             _type: pdw.PointType.BOOL,
//             _lbl: 'Stood',
//             _emoji: '👍',
//             _desc: 'For testing boolean points'
//         }
//     });

//     two.newEntry({
//         _period: '2023-06-10T17',
//         _note: '5PM Auto-check in',
//         _source: 'Hypothetical automation',
//         'paxl': 7,
//         '0pc6': 288,
//         '0tb7': true
//     });
//     two.newEntry({
//         _period: '2023-06-10T18',
//         _note: '6PM Auto-check in',
//         _source: 'Hypothetical automation',
//         'paxl': 0,
//         '0pc6': 98,
//         '0tb7': false
//     });

//     const three = pdwRef.newDef({
//         _did: 'cpsa',
//         _lbl: 'Daily Summary',
//         _emoji: '👀',
//         _scope: pdw.Scope.DAY,
//         _desc: 'Definition with no PointDefs - would use Notes here, maybe.',
//     })
//     three.addTag('Journal')

//     three.newEntry({
//         _period: '2023-06-10',
//         _note: 'Wrote this code. Remember notes are **supposed** to support Markdown eventually.'
//     })

//     /*
//     #THINK - how to treat PointDefs, EntryPoints, and Tags when their associated Defs & Entries & TagDefs are deleted
//     pdwRef.newDef({
//         _did: 'dltd',
//         _lbl: 'Def for deletion test',
//         _desc: 'This is created, then marked deleted',
//         _emoji: '❌',
//         _scope: pdw.Scope.DAY
//     }).setPointDefs([{
//         _lbl: 'PointDef for Deleted Def',
//         _type: pdw.PointType.TEXT,
//         _desc: 'Testing points not being marked deleted if a Def is',
//         _pid: 'dlt1',
//         _emoji: '🐈‍⬛',
//         _rollup: pdw.Rollup.COUNT
//     }])

//     pdwRef.setDefs([{
//         _did: 'dltd',
//         _deleted: true
//     }])
//     //tested that not having this does throw errors for now, so, adding it back
//     pdwRef.setPointDefs([{
//         _did: 'dltd',
//         _pid: 'dlt1',
//         _deleted: true
//     }])
//     */

//     //while you think on teh deleted stuff above, here's a simple test that should work for half
//     pdwRef.newDef({
//         _did: 'dltd',
//         _lbl: 'Def for deletion test',
//         _desc: 'This is created, then marked deleted',
//         _emoji: '❌',
//         _scope: pdw.Scope.DAY,
//         _deleted: true
//     })
// }
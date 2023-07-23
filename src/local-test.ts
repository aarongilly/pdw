//// @ts-nocheck
import * as pdw from './pdw.js'
import { Scope } from './pdw.js'
import { AsyncExcelNatural, altTempExport, exportToFile } from './dataStores/fileAsyncDataStores.js';
import { importFromFile, altTempImport } from './dataStores/fileAsyncDataStores.js';
import { Temporal, toTemporalInstant } from 'temporal-polyfill';
import { importFirestore, importMongo, importOldV9, importOldest } from './onetimeImports.js'
import { DefaultDataStore } from './DefaultDataStore.js';

const pdwRef = pdw.PDW.getInstance();

// let def = pdwRef.newDef({
//     _did: 'yoyo',
//     _pts: [
//         {
//             _pid: 'aaaa',
//             _type: pdw.PointType.SELECT,
//             _opts: {
//                 'a111': 'Opt 1',
//                 'a222': 'Opt 2',
//             }
//         }
//     ]
// })
// let tag = pdwRef.newTag({
//     _lbl: 'my tag'
// });

// let entry = def.newEntry({
//     _note: 'for test'
// });
// let entryWithPoint = def.newEntry({
//     'aaaa': 'a111'
// })

// def.addTag(tag);
// def.save();

importFromFile('data-files/test.yaml');
let all = pdwRef.getAll({includeDeleted:'yes'});
console.log(all);

// exportToFile('data-files/test.yaml', all);



/** -- Multi DataStore experimentation
pdwRef.newDef({_lbl: 'Pre joining'})
let inMemoryDataStoreTwo = new DefaultDataStore(pdwRef);
pdwRef.dataStores.push(inMemoryDataStoreTwo);
pdwRef.newDef({_lbl: 'post join'});
let defs = pdwRef.getDefs();
console.log(defs);
let def = pdwRef.getDefs({defLbl: 'Pre joining'})[0];
def.setProp('_lbl', 'Updated!').save();
defs = pdwRef.getDefs();
console.log(defs);
*/

function createTestDataSet(){
    pdwRef.newDef({
        _did: 'aaaa',
        _lbl: 'Nightly Review',
        _scope: Scope.DAY,
        _pts: [
            {
                _emoji: '👀',
                _lbl: 'Review',
                _pid: 'aaa1',
                _type: pdw.PointType.MARKDOWN
            },
            {
                _emoji: '👔',
                _lbl: 'Work Status',
                _pid: 'aaa2',
                _type: pdw.PointType.SELECT,
                _opts: {
                        'opt2': 'North',
                        'opt3': 'WFH',
                        'opt1': 'Weekend/Holiday',
                        'opt4': 'Vacation',
                        'opt5': 'sickday',
                    }
            },
            
        ]
    })
}

// expect(entry.__tempCreated.epochMilliseconds).toBeGreaterThan(Number.parseInt(Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString()) - 5000) //created not long ago...
// expect(entry.__tempCreated.epochMilliseconds).toBeLessThan(Number.parseInt(Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString())) //...but not in the future
// expect(entry._period).toBe(sameSecond); //technically could fail every 1000 or so runs
// expect(entry._pts.length).toBe(0); //points weren't supplied, they aren't generated
// expect(entry._note).toBe(''); //default
// expect(entry._source).toBe(''); //default

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


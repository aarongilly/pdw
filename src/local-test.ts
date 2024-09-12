import * as pdw from './PDW.js'
import * as ie from './translators/fileTranslators.js'
import * as obs from './translators/obsidianTranslator.js'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
// import { Query, Scope } from './pdw.js'
// import { exportToFile, importFromFile } from './dataStores/fileAsyncDataStores.js';
// import { Temporal, toTemporalInstant } from 'temporal-polyfill';
// import { importFirestore, importMongo, importOldV9, importOldest, importPreviousCSV } from './onetimeImports.js'
// import * as test from '../../pdw-firestore-plugin/'

// let q = new pdw.Query();
// q.tags('tag1');
// const origResult = await q.run();
// console.log(origResult);

XLSX.set_fs(fs);
const filename = '/Users/aaron/Desktop/out.csv' //'harvey.csv'

const importer = new ie.AsyncJson();
const rawData = (await importer.toCanonicalData('/Users/aaron/Desktop/PDW-export-lnqqwbkd.json'))
const exporter = new ie.AsyncCSV();
console.log(rawData);
const entries = rawData.entries;
const wb = XLSX.utils.book_new();

let exportSht = XLSX.utils.json_to_sheet(entries);
XLSX.utils.book_append_sheet(wb, exportSht, 'PDW Export');
XLSX.writeFile(wb, filename);

// const vaultPath = '/Users/aaron/Desktop/Journal Island';
// const configFileSubpath = "PDW/PDW Config.md"
// // obs.ObsidianTranslator.BuildConfigFileAndTemplatesForDefs(data.defs, vaultPath)
// let ODS = await obs.ObsidianTranslator.NewObsidianTranslator(vaultPath, configFileSubpath);
// console.log('converting...')
// await ODS.fromCanonicalData(data);
//// @ts-expect-error - accesssing a not-exposed member:
// let resultData = await ODS._internalPDW.getAll({includeDeleted: 'yes'});
//now actually reading the written files & pushing out to canonicalData...
// let resultTwo = await ODS.toCanonicalData();
// resultData.entries.sort((a:any, b:any)=> a._uid > b._uid ? 1 : -1)
// resultTwo.entries.sort((a:any, b:any)=> a._uid > b._uid ? 1 : -1)
    
// console.log(resultTwo)//resultData.overview);

// function getTestData(): pdw.CanonicalDataset {
//     return {
//         "defs": [
//             {
//                 "_did": "aaaa",
//                 "_uid": "m0in0kbx-cn3q",
//                 "_deleted": false,
//                 "_created": "m0in0kc0",
//                 "_updated": "m0in0kc0",
//                 "_lbl": "Nightly Review",
//                 "_desc": "Set a description",
//                 "_emoji": "👀",
//                 "_scope": pdw.Scope.DAY,
//                 "_tags": [],
//                 "_pts": [
//                     {
//                         "_pid": "aaa1",
//                         "_lbl": "Review",
//                         "_type": pdw.PointType.MARKDOWN,
//                         "_desc": "Your nightly review",
//                         "_emoji": "👀",
//                         "_rollup": pdw.Rollup.COUNT
//                     },
//                     {
//                         "_pid": "aaa2",
//                         "_lbl": "Work Status",
//                         "_type": pdw.PointType.SELECT,
//                         "_desc": "Did you go in, if so where?",
//                         "_emoji": "👔",
//                         "_rollup": pdw.Rollup.COUNT,
//                         "_opts": [
//                             "Weekend/Holiday",
//                             "North",
//                             "WFH",
//                             "Vacation",
//                             "sickday"
//                         ]
//                     },
//                     {
//                         "_pid": "aaa3",
//                         "_lbl": "Satisfaction",
//                         "_type": pdw.PointType.NUMBER,
//                         "_desc": "10 perfect 1 horrid",
//                         "_emoji": "1️⃣",
//                         "_rollup": pdw.Rollup.COUNT,
//                     },
//                     {
//                         "_pid": "aaa4",
//                         "_lbl": "Physical Health",
//                         "_type": pdw.PointType.NUMBER,
//                         "_desc": "10 perfect 1 horrid",
//                         "_emoji": "😥",
//                         "_rollup": pdw.Rollup.COUNT,
//                     }
//                 ]
//             },
//             {
//                 "_did": "bbbb",
//                 "_uid": "m0in0kc4-stcc",
//                 "_deleted": false,
//                 "_created": "m0in0kc4",
//                 "_updated": "m0in0kc4",
//                 "_lbl": "Quotes",
//                 "_desc": "Funny or good sayings",
//                 "_emoji": "💬",
//                 "_scope": pdw.Scope.SECOND,
//                 "_tags": [],
//                 "_pts": [
//                     {
//                         "_pid": "bbb1",
//                         "_lbl": "Quote",
//                         "_type": pdw.PointType.TEXT,
//                         "_desc": "what was said",
//                         "_emoji": "💬",
//                         "_rollup": pdw.Rollup.COUNT,
//                     },
//                     {
//                         "_pid": "bbb2",
//                         "_lbl": "Quoter",
//                         "_type": pdw.PointType.TEXT,
//                         "_desc": "who said it",
//                         "_emoji": "🙊",
//                         "_rollup": pdw.Rollup.COUNT,
//                     }
//                 ]
//             },
//             {
//                 "_did": "cccc",
//                 "_uid": "m0in0kc6-0pth",
//                 "_deleted": false,
//                 "_created": "m0in0kc6",
//                 "_updated": "m0in0kc6",
//                 "_lbl": "Movie",
//                 "_desc": "Set a description",
//                 "_emoji": "🎬",
//                 "_scope": pdw.Scope.SECOND,
//                 "_tags": [
//                     "tag1"
//                 ],
//                 "_pts": [
//                     {
//                         "_pid": "ccc1",
//                         "_lbl": "Name",
//                         "_type": pdw.PointType.TEXT,
//                         "_desc": "Set a description",
//                         "_emoji": "🎬",
//                         "_rollup": pdw.Rollup.COUNT,
//                     },
//                     {
//                         "_pid": "ccc2",
//                         "_lbl": "First Watch?",
//                         "_type": pdw.PointType.BOOL,
//                         "_desc": "Set a description",
//                         "_emoji": "🆕",
//                         "_rollup": pdw.Rollup.COUNT,
//                     }
//                 ]
//             },
//             {
//                 "_did": "dddd",
//                 "_uid": "m0in0kc8-0i9r",
//                 "_deleted": false,
//                 "_created": "m0in0kc8",
//                 "_updated": "m0in0kc8",
//                 "_lbl": "Book",
//                 "_desc": "Set a description",
//                 "_emoji": "📖",
//                 "_scope": pdw.Scope.SECOND,
//                 "_tags": [
//                     "tag1"
//                 ],
//                 "_pts": [
//                     {
//                         "_pid": "ddd1",
//                         "_lbl": "Name",
//                         "_type": pdw.PointType.TEXT,
//                         "_desc": "Set a description",
//                         "_emoji": "📖",
//                         "_rollup": pdw.Rollup.COUNT,
//                     }
//                 ]
//             }
//         ],
//         "entries": [
//             {
//                 "_did": "aaaa",
//                 "_uid": "lkfkuxo8-9ysw",
//                 "_deleted": false,
//                 "_created": "lkdb20oo",
//                 "_updated": "lkdb20oo",
//                 "_period": "2023-07-22",
//                 "_eid": "lkfkuxol-mnhe",
//                 "_note": "Original entry",
//                 "_source": "Test data",
//                 "aaa1": "Today I didn't do **anything**.",
//                 "aaa2": "Weekend/Holiday",
//                 "aaa3": 9,
//                 "aaa4": 10
//             },
//             {
//                 "_did": "aaaa",
//                 "_uid": "lkfkuxob-0av3",
//                 "_deleted": false,
//                 "_created": "m0in0kcc",
//                 "_updated": "m0in0kcc",
//                 "_period": "2023-07-23",
//                 "_eid": "m0in0kcc-bxnf",
//                 "_note": "",
//                 "_source": "Test data",
//                 "aaa1": "Today I wrote this line of code!",
//                 "aaa2": "opt3",
//                 "aaa3": 5,
//                 "aaa4": 9
//             },
//             {
//                 "_did": "aaaa",
//                 "_uid": "m0in0kcd-g2cd",
//                 "_deleted": false,
//                 "_created": "lkbp6ooo",
//                 "_updated": "lkbp6ooo",
//                 "_period": "2023-07-21",
//                 "_eid": "m0in0kcd-49wh",
//                 "_note": "pretending I felt bad",
//                 "_source": "Test data",
//                 "aaa1": "This was a Friday. I did some stuff.",
//                 "aaa2": "WFH",
//                 "aaa3": 6,
//                 "aaa4": 5
//             },
//             {
//                 "_did": "dddd",
//                 "_uid": "m0in0kce-6t7u",
//                 "_deleted": false,
//                 "_created": "m0in0kce",
//                 "_updated": "m0in0kce",
//                 "_period": "2024-08-31T16:10:58",
//                 "_eid": "m0in0kcf-fcyn",
//                 "_note": "",
//                 "_source": "",
//                 "ddd1": "Oh the places you'll go!"
//             },
//             {
//                 "_did": "dddd",
//                 "_uid": "m0in0kcg-duqm",
//                 "_deleted": false,
//                 "_created": "m0in0kcg",
//                 "_updated": "m0in0kcg",
//                 "_period": "2025-01-02T15:21:49",
//                 "_eid": "m0in0kch-02hv",
//                 "_note": "",
//                 "_source": "",
//                 "ddd1": "The Time Traveller"
//             },
//             {
//                 "_did": "dddd",
//                 "_uid": "m0in0kch-np1c",
//                 "_deleted": false,
//                 "_created": "m0in0kch",
//                 "_updated": "m0in0kch",
//                 "_period": "2022-10-04T18:43:22",
//                 "_eid": "m0in0kci-ki59",
//                 "_note": "",
//                 "_source": "",
//                 "ddd1": "The Time Traveller 2"
//             },
//             {
//                 "_did": "cccc",
//                 "_uid": "m0in0kci-04kl",
//                 "_deleted": false,
//                 "_created": "m0in0kci",
//                 "_updated": "m0in0kci",
//                 "_period": "2023-07-24T13:15:00",
//                 "_eid": "m0in0kcj-09vz",
//                 "_note": "",
//                 "_source": "",
//                 "ccc1": "Barbie",
//                 "ccc2": true
//             },
//             {
//                 "_did": "cccc",
//                 "_uid": "m0in0kcj-0m6l",
//                 "_deleted": false,
//                 "_created": "m0in0kcj",
//                 "_updated": "m0in0kcj",
//                 "_period": "2023-07-24T18:45:00",
//                 "_eid": "m0in0kck-qkts",
//                 "_note": "",
//                 "_source": "",
//                 "ccc1": "Oppenheimer",
//                 "ccc2": true
//             },
//             {
//                 "_did": "bbbb",
//                 "_uid": "m0in0kck-wjuf",
//                 "_deleted": false,
//                 "_created": "lkefsa6g",
//                 "_updated": "m0in0kck",
//                 "_period": "2023-07-21T14:02:13",
//                 "_eid": "lkfkuxon-f9ys",
//                 "_note": "Testing updates",
//                 "_source": "",
//                 "bbb1": "You miss 100% of the shots you do not take",
//                 "bbb2": "Michael SCOTT"
//             }
//         ],
//         "overview": {
//             "defs": {
//                 "current": 4,
//                 "deleted": 0
//             },
//             "entries": {
//                 "current": 9,
//                 "deleted": 0
//             },
//             "lastUpdated": "m0in0kck"
//         }
//     }
// }

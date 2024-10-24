import * as pdw from './pdw.js';
import * as ie from './translators/fileTranslators.js';
import * as fs from 'fs';
import * as obs from './translators/obsidianTranslator.js'
import * as XLSX from 'xlsx'
import * as testData from '../test/test_datasets.js';
import { Def, DefType, DJ, DataJournal, Entry, Scope, Rollup, TransactionObject, QueryObject } from './DataJournal.js';
import { AliasKeyer, AliasKeyes } from './AliasKeyer.js';
import { JsonTranslator, MarkdownTranslator } from './translators/fileTranslators.js';
import { Note } from './translators/MarkdownParsers.js';
import { QueryBuilder } from './QueryBuilder.js';
import { Summarizor } from './Summarizor.js';
import { Temporal } from 'temporal-polyfill';
import { Validator } from './Validator.js';
import { FolderTranslator } from './translators/folderTranslator.js';
import * as dotenv from 'dotenv'
import { SheetsTranslator } from './translators/sheetsTranslator.js';
import { Period } from './Period.js';
import { SheetsConnector } from './connectors/sheetsConnector.js';



const allData =  await ie.JsonTranslator.toDataJournal('.archiveOfOutdated/All_PDW_Cleaned.json');
let query = new QueryBuilder(allData).forDefsLbld(['event']).toQueryObject();
const queryResult = DJ.filterTo(query, allData) as DataJournal;
console.log(queryResult);
await SheetsTranslator.fromDataJournal(queryResult, 'Events')

// const myDj = DJ.filterTo(query.toQueryObject(),allData) as DataJournal;
// console.log(myDj)

// dotenv.config();
// const testUrl = process.env.TEST_DEPLOYMENT_URL as string;
// const options = {
//             method: 'GET',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'authorization': 'Bearer ' + process.env.OAUTH
//             },
//             // body: JSON.stringify(bodyObj)
//         };
// const getUrl = testUrl + "?method=query&entryIds=m2me51eq_yxh4";
// const result = await fetch(getUrl, options);
// const text = await result.text();
// const data = JSON.parse(text);
// console.log(data);
// const testSht = process.env.TEST_SHEET_ID as string;

// const shtId = '1QyKxdbQfk3v-jovRD1wscMZpS0eYjHH7t-Vb_bplrTE';

// const dj = await SheetsConnector.query({},shtId);
// const update = await SheetsConnector.commit({
//     entries: {
//         modify: [{
//             _id: 'aprieupae_gooe',
//             _updated: DJ.makeEpochStr(),
//             _period: '2024-10-20T20:20:10',
//             WORKOUT_type: 'Jump rope, yo'
//         }]
//     }
// },shtId)

// const query = await SheetsConnector.query({'entriesWithDef':['WORKOUT_TYPE']},shtId);

console.log(query);

/** NOT SPECIFYING ID WILL USE THE MANIFEST */
// SIGN OF PROGRESS - GET DEFS WORKS BOTH WAYS
// const result = await SheetsConnector.getDefs(); //worked
/** SPECIFYING THE ID WILL USE THAT ONE SHEET ONLY */
// const result = await SheetsConnector.getDefs('testSht'); //worked

// SIGN OF PROGRESS - QUERY WORKS BOTH WAYS
// const queryObj: QueryObject = {entriesWithDef: ['WORKOUT_TYPE']}
// const result = await SheetsConnector.query(queryObj); //worked
/** SPECIFYING THE ID WILL USE THAT ONE SHEET ONLY */
// const result = await SheetsConnector.query(queryObj, 'testSht'); //worked

// const commmitObj: TransactionObject = {
//     defs: {},
//     entries: {
//         create: [
//             {
//                 _id: DJ.makeID(),
//                 _period: '2024-10-24T20:20:20',
//                 _updated: DJ.makeEpochStr(),
//                 _created: DJ.makeEpochStr(),
//                 _note: 'Just created',
//                 WORKOUT_NAME: 'LIFTED',
//                 WORKOUT_TYPE: 'Strength',
//             }
//         ],
//         modify: [
//             {
//                 _id: 'm2mbr4j6_xw6q',
//                 _note: 'Modified with Source',
//                 _period: '2024-10-24T10:23:03',
//                 _source: 'Here now',
//                 WORKOUT_NAME: 'LIFTED',
//             }
//         ],
//         replace: [
//             {
//                 _id: 'testtwo',
//                 _period: '2024-10-24T05:05:05',
//                 _updated: DJ.makeEpochStr(),
//             }
//         ],
//         delete: ['testing']
//     }
// }
// SIGN OF PROGRESS - QUERY WORKS BOTH WAYS
// const result = await SheetsConnector.commit(commmitObj); //worked
/** SPECIFYING THE ID WILL USE THAT ONE SHEET ONLY */
// const result = await SheetsConnector.commit(commmitObj, 'testSht'); //worked //worked
// console.log(result)

// postRequest([
//     {
//         _id: DJ.makeID(),
//         _period: '2024-10-24T20:20:20',
//         _updated: DJ.makeEpochStr(),
//         _created: DJ.makeEpochStr(),
//         _note: 'CREATED TWORE',
//         WORKOUT_NAME: 'LIFTED',
//         WORKOUT_TYPE: 'Strength',
//     },
//     {
//         _id: DJ.makeID(),
//         _period: '2024-10-24T20:20:21',
//         _updated: DJ.makeEpochStr(),
//         _created: DJ.makeEpochStr(),
//         _note: 'HECK YES',
//         WORKOUT_NAME: 'STRETCHED',
//         WORKOUT_TYPE: 'Mobility',
//     }
// ], 'createOnly')

// async function postRequest(payload: any, method: 'createOnly' | 'commit' | 'query' | 'getDefs', singleFileId?: string) {
//     const bodyObj: any = {
//         data: payload
//     }
//     if (singleFileId !== undefined) bodyObj.id = singleFileId;

//     const options = {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(bodyObj)
//     };

//     //@ts-expect-error - typing complaints
//     if (true) options.headers.authorization = "Bearer " + process.env.OAUTH;

//     const postURL = process.env.TEST_DEPLOYMENT_URL + "?method=" + method;
//     let result: any = null;
//     await fetch(postURL, options)
//         .then(response => response.text())
//         .then(data =>
//             result = JSON.parse(data))
//         .catch(error =>
//             console.error(error));
//     // console.log('Result was:', JSON.parse(result));
//     return result
// }



// const allData =  await ie.JsonTranslator.toDataJournal('.archiveOfOutdated/All_PDW_Cleaned.json');

// const defs = allData.defs

// await ie.JsonTranslator.fromDataJournal({defs:defs, entries:[]},'.archiveOfOutdated/DefsOnly.json')

// const defTypeMap: { [did: string]: DefType } = {};

// let report = Validator.validate(allData);
// report.complaints = report.complaints.filter(comp => !comp.text.startsWith('Multiselect')); //not fixing this now

// await ie.JsonTranslator.fromDataJournal({defs:defs,entries:allData.entries},'.archiveOfOutdated/All_PDW.json')

// console.log(entries);
// const myQuery = new QueryBuilder(allData);
// myQuery.deleted(false).inPeriod('2024-03').forDids('ATE_OUT')
// const queryResult = myQuery.runQueryOn(allData) as DataJournal;
// const mySummary = Summarizor.rollupEntryPoint(queryResult.entries, allData.defs.find(def => def._id === 'ATE_OUT')!, Rollup.COUNTOFEACH);
// console.log(mySummary)

// Validator.validate(allData);



// import sqlite3 from 'sqlite3';
// Create a new database
// const db = new sqlite3.Database('test/localTestFileDir/mydatabase.db', (err) => {
//   if (err) {
//     return console.error(err.message);
//   }
//   console.log('Database created.');
// });

// // Create a table
// // db.run(`CREATE TABLE users (
// //   id INTEGER PRIMARY KEY AUTOINCREMENT,
// //   name TEXT NOT NULL
// // )`, (err) => {
// //   if (err) {
// //     return console.error(err.message);
// //   }
// //   console.log('Table created.');
// // });

// // Insert a record
// const insertStmt = db.prepare('INSERT INTO users (name) VALUES (?)');
// insertStmt.run('Alice');
// insertStmt.finalize();

// // Close the database
// db.close((err) => {
//   if (err) {
//     return console.error(err.message);
//   }
//   console.log('Database closed.');
// });

// //#region ---- WHERE YOU ARE GOING
// /*
// // Sort of a note to self - beginning with the end in mind. You want to enable this.
// //const
// //const config = loadConfigFileAtPath('path/to/pdw_config.json')d
// //...or
// const config = {
//     translators: [
//         {
//             type: 'excel',
//             path: 'path/to/excel.xlsx'
//         },
//         {
//             type: 'csv',
//             path: 'path/to/csv.csv'
//         },
//         {g
//             type: 'yaml',
//             path: 'path/to/yaml.yaml'
//         },
//         {
//             type: 'json',
//             path: 'path/to/json.json'
//         },
//         {
//             type: 'markdown', //uses obsidian & dataview syntax
//             path: 'path/to/markdown.md'
//         },
//         {
//             type: 'folder', //supports files of all the above types
//             path: 'path/to/folder'
//         },
//     ],
//     connectors: [
//         {
//             type: 'sqlite',
//             config: { //contents set by the connector class
//                 location: 'path/to/database',
//                 user: 'aaron',
//                 pass: 'whatever'
//             },
//             readonly: false //allow writes to database for PDW.sync() (which may exist at some point)
//         },
//         {
//             type: 'firestore',
//             config: {
//                 location: 'url or whatever',
//                 otherProps: 'whatever key value pairs the connector class uses'
//             },
//             readonly: true //don't allow writes to database
//         }
//     ]
// }
// const PDW = await pdw.PDW.newPDW(config)
// PDW.saveToFile('path/to/output.xlsx');

// const QUERY = PDW.buildQuery().from('2024').defs(['lbl a', 'id b']);
// const result = PDW.query(QUERY)
// const altWayToResult = await PDW.buildQuery().from('2024').defs(['lbl a', 'id b']).run();
// expect(result).toEqual(altWayToResult);
// */
// //#endregion


// //#region ---- New "final version" one time import


// /**
//  * Translating from medium new to new new
//  */
// // const filepath = '.archiveOfOutdated/All-REAL-DATA-AFTER.json'

// // const file = JSON.parse(fs.readFileSync(filepath).toString());

// // const defs: any[] = [];

// // (<any[]>file.defs).forEach((defish: any) => {
// //     // console.log(defish);
// //     defish._pts.forEach(pt => {
// //         console.log(defish);
// //         console.log(pt);
// //         const def: Def = {
// //             _id: defish._did + "_" + pt._pid,
// //             _type: pt._type,
// //             _updated: defish._updated,
// //             _lbl: defish._lbl + "_" + pt._lbl,
// //             _desc: pt._desc,
// //             _emoji: pt._emoji,
// //             _rollup: pt._rollup,
// //             _scope: defish._scope
// //         }
// //         defs.push(def);
// //     })
// // })

// // const entries: any[] = [];

// // file.entries.forEach((entryish: any) => {
// //     const entry: Entry = {
// //         _id: entryish._uid,
// //         _period: entryish._period,
// //         _updated: entryish._updated,
// //         _created: entryish._created,
// //         _source: entryish._source,
// //         _note: entryish._note,
// //         _deleted: entryish._deleted
// //     }
// //     const keys = Object.keys(entryish);
// //     keys.forEach(key => {
// //         if (key.startsWith('_')) return
// //         entry[entryish._did + "_" + key] = entryish[key]
// //     })
// //     entries.push(entry)
// // })

// // console.log(defs)

// // const returnData: DataJournal = {
// //     defs: defs,
// //     entries: entries
// // }

// // const translator = new ie.JsonTranslator();
// // translator.fromDataJournal(returnData, '.archiveOfOutdated/ALL-DEFS-AFTER.json')


// //#endregion

// function someCleaning(allData: DataJournal) {
//     allData.defs.forEach(def => {
//         //@ts-expect-error
//         if (def._tags && !Array.isArray(def._tags)) def._tags = def._tags.split(',').map(str => str.trim())
//         //@ts-expect-error
//         if (def._range && !Array.isArray(def._range)) def._range = def._range.split(',').map(str => str.trim())
//         if (defTypeMap[DJ.standardizeKey(def._id)] === undefined) {
//             defTypeMap[DJ.standardizeKey(def._id)] = def._type;
//         }
//     })

//     allData.entries.forEach(entry => {
//         if (typeof entry._deleted === 'string') {
//             //@ts-expect-error
//             entry._deleted = entry._deleted.toUpperCase() === 'TRUE'
//         }
//         Object.keys(entry).filter(key => !key.startsWith('_')).forEach(key => {
//             const standardizedKey = DJ.standardizeKey(key);
//             const defType = defTypeMap[standardizedKey];
//             if (defType === undefined) {
//                 console.log('No def type found for ' + key)
//                 return;
//             }
//             if (defType === DefType.NUMBER) {
//                 if (typeof entry[key] === 'string') entry[key] = Number.parseFloat(entry[key]);
//             }
//             if (defType === DefType.BOOL) {
//                 if (typeof entry[key] === 'string') entry[key] = entry[key].toUpperCase() === 'TRUE'
//             }
//             if (defType === DefType.TIME) {
//                 const val = entry[key] as string;
//                 if (val.length === 19) {
//                     entry[key] = val.substring(11);
//                     return
//                 }
//                 console.log(entry[key])
//             }
//             if (defType === DefType.DURATION) {
//                 const val = entry[key] as string;
//                 if (val.startsWith('PT')) return;
//                 const numSecs = Number.parseFloat(val) * 60;
//                 const temp = Temporal.Duration.from({ seconds: Math.round(numSecs) })
//                 const newVal = temp.round({ largestUnit: 'day' }).toString();
//                 entry[key] = newVal;
//                 // console.log(entry[key])
//             }
//             if (defType === DefType.MULTISELECT) {
//                 const val = entry[key];
//                 if (!Array.isArray(val)) {
//                     if (typeof val === 'string') {
//                         entry[key] = val.split(',').map(text => text.trim());
//                         return
//                     }
//                     console.log('h')
//                 }
//             }
//         })
//     })
// }
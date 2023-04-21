//// @ts-nocheck
import {PDW, PointType, parseTemporalFromEpochStr, parseTemporalFromUid} from './pdw.js'
import {Scope} from './pdw.js'
import { exportToFile } from './connectors/fileConnector.js';
import { importFromFile } from './connectors/fileConnector.js';
import { sampleDefinitions, samplePointDefs } from './sampleData.js';
// import { FileConnector } from "./connectors/fileConnector.js";

const pdw = PDW.getInstance();

// pdw.setDefs(sampleDefinitions);
// pdw.setPointDefs(samplePointDefs);

// pdw.createNewDef({_lbl: "test one", _desc: 'Initial desc', _emoji: '1️⃣'})
// pdw.createNewDef({_lbl: "twooo", _scope: Scope.WEEK, _emoji: '2️⃣', _desc: 'now with a description'});
// pdw.createNewDef({_lbl: "afree", _emoji: '3️⃣', _desc: 'Edited with description!'});
// let four = pdw.createNewDef({_lbl: "FOUR", _desc: 'having fun', _emoji: '4️⃣'});
// let five = pdw.createNewDef({_lbl: "Five", _desc: 'not in first file, added to second', _emoji: '5️⃣'});

// pdw.setPointDefs([{_did: 'e0bq', _lbl: 'updated label', _type: PointType.BOOL, _emoji: '☝️'}])
// let myPd = four.setPointDefs([{_lbl: 'test point', _type: PointType.TEXT}])

// console.log(
//     parseTemporalFromUid(myPd[0]._uid).toLocaleString()
// );

importFromFile('data-files/OutExcel1.xlsx');
importFromFile('data-files/OutExcel2.xlsx');
// importFromFile('data-files/DevFile.json');

let myDef = pdw.getDefs(['FOUR']);
console.log(myDef);
let myPoint = myDef[0].getPoints(true);
console.log(myPoint);

//Testing implicit merge
// loadFile('data-files/OutExcel.xlsx');
// loadFile('data-files/OutExcel2.xlsx');

// let outFilename = 'data-files/OutExcel3.xlsx';
// exportToFile(outFilename, pdw.allDataSince());
// let outJsonname = 'data-files/DevFile.json';
// exportToFile(outJsonname, pdw.allDataSince());
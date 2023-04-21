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
// pdw.createNewDef({_lbl: "four", _emoji: '4️⃣'});
// let five = pdw.createNewDef({_lbl: "five", _desc: 'having fun', _emoji: '5️⃣'});

// pdw.createNewPointDef({_did: five._did, _lbl: 'set alternatively', _type: PointType.BOOL, _emoji: '☝️'})
// let myPd = five.setPointDefs([{_lbl: 'test point', _type: PointType.TEXT}])

// console.log(
//     parseTemporalFromUid(myPd[0]._uid).toLocaleString()
// );

// importFromFile('data-files/OutExcel4.xlsx');
importFromFile('data-files/DevFile.json');

console.log(pdw.getDefs());

//Testing implicit merge
// loadFile('data-files/OutExcel.xlsx');
// loadFile('data-files/OutExcel2.xlsx');

// let outFilename = 'data-files/OutExcel4.xlsx';
// exportToFile(outFilename, pdw.allDataSince());
// let outJsonname = 'data-files/DevFile.json';
// exportToFile(outJsonname, pdw.allDataSince());
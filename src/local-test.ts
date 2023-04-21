import {PDW, PointType, parseTemporalFromEpochStr, parseTemporalFromUid} from './pdw.js'
import {Scope} from './pdw.js'
import { exportToFile } from './connectors/fileConnector.js';
import { importFromFile } from './connectors/fileConnector.js';
// import { FileConnector } from "./connectors/fileConnector.js";
// import { sampleDefinitions } from './sampleData.js';

const pdw = PDW.getInstance();
// const fileConnector = new FileConnector(pdw);
// pdw.registerConnection(fileConnector);

pdw.createNewDef({_lbl: "test one", _desc: 'Initial desc', _emoji: '1️⃣'})
pdw.createNewDef({_lbl: "twooo", _scope: Scope.WEEK, _emoji: '2️⃣', _desc: 'now with a description'});
pdw.createNewDef({_lbl: "four", _emoji: '4️⃣'});
let five = pdw.createNewDef({_lbl: "five", _desc: 'having fun', _emoji: '5️⃣'});

pdw.createNewPointDef({_did: five._did, _lbl: 'set alternatively', _type: PointType.BOOL, _emoji: '☝️'})
let myPd = five.setPointDefs([{_lbl: 'test point', _type: PointType.TEXT}])

console.log(
    parseTemporalFromUid(myPd[0]._uid).toLocaleString()
);

// console.log(pdw.getDefs());

//Testing implicit merge
// loadFile('data-files/OutExcel.xlsx');
// loadFile('data-files/OutExcel2.xlsx');

// const localDefCopy = pdw.getDefs(['test one'], false);

// pdw.createNewPointDef({
//     _lbl: 'Test Point',
//     _did: localDefCopy[0]._did,
//     _type: PointType.TEXT
// })

// console.log(DefaultConnector.getPointDefs())
// pdw.setDefs(sampleDefinitions);

let outFilename = 'data-files/OutExcel4.xlsx';
exportToFile(outFilename, pdw.allDataSince());
// let outFilename = 'data-files/DevFile.json';
// (<DefaultConnector> pdw.connection).writeToFile(outFilename);

// console.log(makeUID());

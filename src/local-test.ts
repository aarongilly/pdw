//// @ts-nocheck
import {PDW, Period, PointType, parseTemporalFromEpochStr, parseTemporalFromUid} from './pdw.js'
import {Scope} from './pdw.js'
import { exportToFile } from './connectors/fileConnector.js';
import { importFromFile } from './connectors/fileConnector.js';
import { sampleDefinitions, sampleEntries, samplePointDefs } from './sampleData.js';
// import { FileConnector } from "./connectors/fileConnector.js";

const pdw = PDW.getInstance();

createTwoTestFiles();


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

// importFromFile('data-files/OutExcel1.xlsx');
// importFromFile('data-files/OutExcel2.xlsx');
// importFromFile('data-files/DevFile.json');

// let myDef = pdw.getDefs(['FOUR']);
// console.log(myDef);
// let myPoint = myDef[0].getPoints(true);
// console.log(myPoint);

//Testing implicit merge
// loadFile('data-files/OutExcel.xlsx');
// loadFile('data-files/OutExcel2.xlsx');

// pdw.setEntries(sampleEntries);

// let outFilename = 'data-files/OutExcel4.xlsx';
// exportToFile(outFilename, pdw.allDataSince());
// let outJsonName = 'data-files/DevFile.json';
// exportToFile(outJsonName, pdw.allDataSince());

function createTwoTestFiles(){
    pdw.createNewDef({
        _did: '0m7w',
        _lbl: 'defOne',
        _emoji: '1️⃣',
        _scope: Scope.SECOND,
    })
    pdw.createNewDef({
        _did: 'ay7l',
        _lbl: 'TWO',
        _emoji: '2️⃣',
        _scope: Scope.HOUR,
        _desc: 'Scoped at an **hour**, cause why not have that option?'
    })
    pdw.createNewDef({
        _did: '05a8',
        _lbl: 'FREE',
        _emoji: '3️⃣',
        _scope: Scope.DAY,
    })
    pdw.createNewPointDef({
        _did: '05a8',
        _type: PointType.TEXT,
        _lbl: 'Free Item',
        _emoji: '🆓'
    })
    pdw.createNewPointDef({
        _did: 'ay7l',
        _pid: '0pc6',
        _type: PointType.NUM,
        _lbl: 'Numeric Thing',
        _emoji: '#️⃣'
    })
    pdw.createNewPointDef({
        _did: 'ay7l',
        _pid: '0tb7',
        _type: PointType.BOOL,
        _lbl: 'Boolean Thing',
        _emoji: '👍'
    })
    pdw.createNewEntry({
        _did: 'ay7l',
        '0tb7': false,
        '0pc6': 5
    })
    pdw.createNewEntry({
        _did: '0m7w'
    })
    let outFileOneame = 'data-files/OutExcel1.xlsx';
    exportToFile(outFileOneame, pdw.allDataSince());
}
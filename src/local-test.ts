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
        _desc: 'This is now inerited'
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
        _emoji: '👍',
        _desc: 'Orig desc'
    })
    pdw.createNewEntry({
        _eid: 'lgricx7k-08al',
        _did: 'ay7l',
        _note: 'Orig note',
        _period: '2023-04-22T06',
        '0tb7': false,
        '0pc6': 5
    })
    pdw.createNewEntry({
        _did: '0m7w',
    })
    let outFileOneame = 'data-files/OutExcel1.xlsx';
    exportToFile(outFileOneame, pdw.allDataSince());
    //update def
    pdw.setDefs([{
        _did: '0m7w',
        _lbl: 'One Relabeled'
    }]);
    //update a pointdef
    pdw.setPointDefs([{
        _did: 'ay7l',
        _pid: '0tb7',
        _lbl: 'Changed Label',
    }])
    pdw.setEntries([{
        _eid: 'lgricx7k-08al',
        _note: 'Updated noted'
    }])
    //update an entrypoint
    pdw.setEntryPoints([{
        _eid: 'lgricx7k-08al',
        _pid: '0pc6',
        _val: 6
    }])
    let data = pdw.allDataSince();
    let outFileTwoName = 'data-files/OutExcel2.xlsx';
    exportToFile(outFileTwoName, data);
    let outJsonName = 'data-files/OutJSON.json';
    exportToFile(outJsonName, data);
}
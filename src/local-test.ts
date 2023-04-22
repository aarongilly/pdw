//// @ts-nocheck
import {PDW, Period, PointType, Rollup, parseTemporalFromEpochStr, parseTemporalFromUid} from './pdw.js'
import {Scope} from './pdw.js'
import { exportToFile } from './connectors/fileConnector.js';
import { importFromFile } from './connectors/fileConnector.js';
import { sampleDefinitions, sampleEntries, samplePointDefs } from './sampleData.js';
// import { FileConnector } from "./connectors/fileConnector.js";

const pdw = PDW.getInstance();

// console.log(Period.inferScope(Period.now(Scope.SECOND)));
// console.log(Period.inferScope(Period.now(Scope.MINUTE)));
// console.log(Period.inferScope(Period.now(Scope.HOUR)));
// console.log(Period.inferScope(Period.now(Scope.DAY)));
// console.log(Period.inferScope(Period.now(Scope.WEEK)));
// console.log(Period.inferScope(Period.now(Scope.MONTH)));
// console.log(Period.inferScope(Period.now(Scope.QUARTER)));
// console.log(Period.inferScope(Period.now(Scope.YEAR)));

// createTwoTestFiles();

// importFromFile('data-files/OutJSON.json');
importFromFile('data-files/OutExcel2.xlsx');

console.log(pdw.allDataSince());

function createTwoTestFiles(){
    //Testing createNewDef && Def.setPointDefs
    pdw.createNewDef({
        _did: '0m7w',
        _lbl: 'defOne',
        _emoji: '1️⃣',
        _scope: Scope.SECOND,
        _desc: 'This is now inerited'
    }).setPointDefs([{
        _lbl: 'Select Test',
        _type: PointType.SELECT,
        _emoji: '⛏️',
        _desc: 'For testing selects',
        _pid: '8esq',
        _rollup: Rollup.COUNTOFEACH
    }])
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
        _emoji: '#️⃣',
        _rollup: Rollup.AVERAGE
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
    pdw.createNewTagDef({
        _lbl: 'My Tag!',
    })
    pdw.createNewTagDef({
        _lbl: 'Orig Tag Label',
        _tid: 'vvct'
    })
    pdw.createNewTagDef({
        _lbl: 'Select Option Test',
        _tid: '0vvi'
    })
    pdw.createNewTag({
        _did: 'ay7l',
        _tid: 'vvct'
    })
    pdw.createNewTag({
        _did: '0m7w',
        _tid: '0vvi',
        _pid: '8esq'
    })
    //Write to file before any updates
    let outFileOneame = 'data-files/OutExcel1.xlsx';
    exportToFile(outFileOneame, pdw.allDataSince());

    //update def (and pointdef)
    pdw.setDefs([{
        _did: 'ay7l',
        _lbl: 'Two Relabeled',
        '0pc6': {
            _lbl: 'Test Relabel'
        }
    }]);
    //update a pointdef
    pdw.setPointDefs([{
        _did: 'ay7l',
        _pid: '0tb7',
        _emoji: '👎',
    }])
    //update an entry (and entrypoint)
    pdw.setEntries([{
        _eid: 'lgricx7k-08al',
        _note: 'Updated noted',
        '0tb7': true
    }])
    //update an entrypoint explicitly
    pdw.setEntryPoints([{
        _eid: 'lgricx7k-08al',
        _pid: '0pc6',
        _val: 6
    }])
    //update a tagDef
    pdw.setTagDefs([{
        _tid: 'vvct',
        _lbl: 'New Label'
    }])
    //update a tag
    pdw.setTags([{
        _did: 'ay7l',
        _tid: 'vvct',
        _deleted: true
    }])

    //Write to updated files
    let data = pdw.allDataSince();
    let outFileTwoName = 'data-files/OutExcel2.xlsx';
    exportToFile(outFileTwoName, data);
    let outJsonName = 'data-files/OutJSON.json';
    exportToFile(outJsonName, data);
}
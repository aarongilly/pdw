import {PDW} from './pdw.js'
import { DefaultConnector } from "./connectors/defaultConnector.js";
// import { sampleDefinitions } from './sampleData.js';

const pdw = PDW.getInstance();
const fileConnector = new DefaultConnector();
pdw.registerConnection(fileConnector);

// pdw.createNewDef({_lbl: "test one", _desc: 'Initial desc', _emoji: '1️⃣'})
// pdw.createNewDef({_lbl: "twooo", _scope: Scope.WEEK, _emoji: '2️⃣', _desc: 'now with a description'});
// pdw.createNewDef({_lbl: "four", _emoji: '🕒'});

//Testing implicit merge
loadFile('data-files/OutExcel.xlsx');
loadFile('data-files/OutExcel2.xlsx');

// const localDefCopy = pdw.getDefs(['test one'], false);

// pdw.createNewPointDef({
//     _lbl: 'Test Point',
//     _did: localDefCopy[0]._did,
//     _type: PointType.TEXT
// })

// console.log(DefaultConnector.getPointDefs())
// pdw.setDefs(sampleDefinitions);

let outFilename = 'data-files/OutExcel3.xlsx';
(<DefaultConnector> pdw.connections).writeToFile(outFilename);
// let outFilename = 'data-files/DevFile.json';
// (<DefaultConnector> pdw.connection).writeToFile(outFilename);

// console.log(makeUID());

function loadFile(fileName: string){
    (<DefaultConnector> pdw.connections).loadFromFile(fileName);
}
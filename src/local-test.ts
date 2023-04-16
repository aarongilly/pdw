import {PDW, PointType, Scope} from './pdw.js'
import { FileConnector } from "./connectors/fileConnector.js";
// import { sampleDefinitions } from './sampleData.js';

const pdw = PDW.getInstance();
const fileConnector = new FileConnector();
pdw.registerConnection(fileConnector);

pdw.createNewDef({_lbl: "test one", _desc: 'Updated here'})
pdw.createNewDef({_lbl: "test three", _scope: Scope.WEEK})

//Testing implicit merge
// loadFile('fs-test/PDW-OutFile1.xlsx')
// loadFile('fs-test/PDW-OutFile2.xlsx')
// loadFile('fs-test/PDW-OutFile3.json')

const localDefCopy = pdw.getDefs(['test one'], false);

pdw.createNewPointDef({
    _lbl: 'Test Point',
    _did: localDefCopy[0]._did,
    _type: PointType.TEXT
})

console.log(fileConnector.getPointDefs())
// pdw.setDefs(sampleDefinitions);

let outFilename = 'OutExcel.xlsx';
(<FileConnector> pdw.connection).writeToFile(outFilename);
// let outFilename = 'DevFile.json';
// (<FileConnector> pdw.connection).writeToFile(outFilename);

// console.log(makeUID());

// function loadFile(fileName: string){
//     (<FileConnector> pdw.connection).loadFromFile(fileName);
// }
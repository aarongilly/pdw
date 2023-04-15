import {PDW} from './pdw.js'
import { FileConnector } from "./connectors/fileConnector.js";
// import { sampleDefinitions } from './sampleData.js';

const pdw = PDW.getInstance();
const fileConnector = new FileConnector();
pdw.registerConnection(fileConnector);

//Testing implicit merge
loadFile('fs-test/PDW-OutFile.xlsx')
loadFile('fs-test/PDW-OutFile2.xlsx')

// const localDefCopy = pdw.getDefs(['Event', 'doae', 'seae']);

// console.log(localDefCopy);

// pdw.setDefs(sampleDefinitions);

// let outFilename = 'fs-test/PDW-OutFile3.xlsx';
// (<FileConnector> pdw.connection).writeToFile('excel', outFilename);
let outFilename = 'fs-test/PDW-OutFile3.json';
(<FileConnector> pdw.connection).writeToFile('json', outFilename);

// console.log(makeUID());

function loadFile(fileName: string){
    (<FileConnector> pdw.connection).loadFromExcel(fileName);
}
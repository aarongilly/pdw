import {PDW} from './pdw.js'
import { FileConnector } from "./connectors/fileConnector.js";
// import { sampleDefinitions } from './sampleData.js';

const pdw = PDW.getInstance();
const filename = 'fs-test/ExcelDevFile2.xlsx';
const fileConnector = new FileConnector();

pdw.registerConnection(fileConnector);

(<FileConnector> pdw.connection).loadFromExcel(filename);

const localDefCopy = pdw.getDefs(['Event', 'doae', 'seae']);

console.log(localDefCopy);

// pdw.setDefs(sampleDefinitions);
// (<FileConnector> pdw.connection).writeToFile('excel', filename);

// console.log(makeUID());


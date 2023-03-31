import {PDW, /*sampleDefinitions*/} from './pdw.js'
import { FileConnector } from "./connectors/fileConnector.js";

const pdw = PDW.getInstance();
const filename = 'fs-test/ExcelDevFile.xlsx';
const fileConnector = new FileConnector();

pdw.registerConnection(fileConnector);

(<FileConnector> pdw.connection).loadFromExcel(filename);

// pdw.setDefs(sampleDefinitions);
// (<FileConnector> pdw.connection).writeToFile('excel', filename);
import {PDW, sampleDefinitions} from './pdw.js'
import { FileConnector } from "./connectors/fileConnector.js";

const pdw = PDW.getInstance();
const filename = 'fs-test/ExcelDevFile.xlsx';

pdw.registerConnection(FileConnector.newWorkbook());

const testDef = sampleDefinitions[0];

pdw.setDefs([testDef]);

(<FileConnector> pdw.connection).writeToFile(filename);
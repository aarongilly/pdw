import {PDW} from './pdw.js'
import { ExcelConnector } from "./connectors/excelConnector.js";

const pdw = PDW.getInstance();
const filename = 'fs-test/ExcelDevFile.xlsx';

pdw.registerConnection(ExcelConnector.connect(filename));



// pdw.connection?.setDefs([]);

import { InMemoryDb } from './connectors/inMemoryConnector.js';
import { Connector, Translator } from './pdw.js';
import * as file from './translators/fileTranslators.js';

//#TODO - keep this file up to date with active translators

export type TranslatorListMember = 
    "JSON" |
    "YAML" |
    "Excel" |
    "CSV"

export function getTranslator(serviceName: TranslatorListMember): Translator {
    if(serviceName === 'JSON') return new file.JsonTranslator();
    if(serviceName === 'YAML') return new file.YamlTranslator();
    if(serviceName === 'Excel') return new file.ExcelTranslator();
    if(serviceName === 'CSV') return new file.CsvTranslator();
    throw new Error('Invalid Translator Service Name: ' + serviceName);
}

export type ConnectorListMember = 
"In-Memory Database" |
"SQLite" // todo |
//"Firestore" |
//"Google Sheets"

export function getConnector(serviceName: ConnectorListMember): Connector {
    if(serviceName === 'In-Memory Database') return new InMemoryDb();
    if(serviceName === 'SQLite') throw new Error("Not implmeented");
    throw new Error('Invalid Connector Service Name: ' + serviceName);
}
import { InMemoryDb } from './connectors/Strawman.js';
import { Connector, Translator } from './pdw.js';
import * as file from './translators/fileTranslators.js';

//#TODO - keep this file up to date with active translators

export type TranslatorListMember = 
    "JSON" |
    "YAML" |
    "Excel"

export function getTranslator(serviceName: TranslatorListMember): Translator {
    if(serviceName === 'JSON') return new file.JsonTranslator();
    if(serviceName === 'YAML') return new file.YamlTranslator();
    if(serviceName === 'Excel') return new file.ExcelTranslator();
    throw new Error('Invalid Translator Service Name: ' + serviceName);
}

export type ConnectorListMember = 
"Strawman In-Memory Database" |
"SQLite" // todo |
//"Firestore"

export function getConnector(serviceName: ConnectorListMember): Connector {
    if(serviceName === 'Strawman In-Memory Database') return new InMemoryDb();
    if(serviceName === 'SQLite') throw new Error("Not implmeented");
    throw new Error('Invalid Connector Service Name: ' + serviceName);
}
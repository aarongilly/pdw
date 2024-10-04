import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as YAML from 'yaml';
import * as dj from '../DataJournal.js';
import { Translator } from '../pdw.js';
import { AliasKeyer, AliasKeyes } from '../AliasKeyer.js';
import { Note, Block } from './MarkdownParsers.js'
// import { Period } from '../Period.js';

//#region ### EXPORTED FUNCTIONS ###
export function dataJournalToFile(filepath: string, data: dj.DataJournal) {
    const fileType = inferFileType(filepath)
    if (fileType === 'excel') return new ExcelTranslator().fromDataJournal(data, filepath);
    if (fileType === 'json') return new JsonTranslator().fromDataJournal(data, filepath);
    if (fileType === 'yaml') return new YamlTranslator().fromDataJournal(data, filepath);
    if (fileType === 'csv') return new CsvTranslator().fromDataJournal(data, filepath);
    if (fileType === 'markdown') return new MarkdownTranslator().fromDataJournal(data, filepath);
    throw new Error('Unimplemented export type: ' + fileType);
}

export async function fileToDataJournal(filepath: string) {
    const fileType = inferFileType(filepath)
    if (fileType === 'excel') return await new ExcelTranslator().toDataJournal(filepath);
    if (fileType === 'json') return await new JsonTranslator().toDataJournal(filepath);
    if (fileType === 'yaml') return await new YamlTranslator().toDataJournal(filepath);
    if (fileType === 'csv') return await new CsvTranslator().toDataJournal(filepath);
    if (fileType === 'markdown') return new MarkdownTranslator().toDataJournal(filepath);
    throw new Error('Unimplemented import type: ' + fileType);
}

//#endregion

//#region #### DONE ####

/**
 * Raw Data Journals output to and input from JSON. 
 * The Data Journal native format. Nothing changed at all.
 */
export class JsonTranslator implements Translator {
    getServiceName(): string {
        return 'JSON Translator'
    }

    /* adding static methods for convenience rather than fully refactoring */
    static async fromDataJournal(dataJournal: dj.DataJournal, filename: string){
        return new JsonTranslator().fromDataJournal(dataJournal,filename);
    }
    static toDataJournal(filepath:string){
        return new JsonTranslator().toDataJournal(filepath);
    }

    async fromDataJournal(data: dj.DataJournal, filepath: string) {
        // data = pdw.PDW.flattenCompleteDataset(data); //remove circular references and stuff
        let json = JSON.stringify(data);
        fs.writeFileSync(filepath, json, 'utf8');
    }

    async toDataJournal(filepath: string): Promise<dj.DataJournal> {
        const file = JSON.parse(fs.readFileSync(filepath).toString());
        const returnData: dj.DataJournal = {
            defs: file.defs,
            entries: file.entries
        }
        return dj.DJ.addOverview(returnData);
    }
}

/**
 * The Data Journal with minor modifications, output to and input from YAML.
 * Including minor modifications:
 * 1. using {@link AliasKeyer} to standardize prop
 * length to make visually parsing Defs & Entries easier.
 * 2. changing the _created & _updated keys (called "cre" and "upd") to use
 * ISO strings.
 */
export class YamlTranslator implements Translator {
    getServiceName(): string {
        return 'YAML Translator'
    }

    /* adding static methods for convenience rather than fully refactoring */
    static async fromDataJournal(dataJournal: dj.DataJournal, filename: string){
        return new YamlTranslator().fromDataJournal(dataJournal,filename);
    }
    static toDataJournal(filepath:string){
        return new YamlTranslator().toDataJournal(filepath);
    }

    async fromDataJournal(data: dj.DataJournal, filepath: string) {

        const aliasedDJ = AliasKeyer.applyAliases(data, YamlTranslator.aliasKeys);
        //crazy simple implementation
        const newData = this.translateToYamlFormat(aliasedDJ);
        const yaml = YAML.stringify(newData);
        fs.writeFileSync(filepath, yaml, 'utf8');
    }

    async toDataJournal(filepath: string): Promise<dj.DataJournal> {
        const file = YAML.parse(fs.readFileSync(filepath).toString());
        const aliasedDJ: dj.DataJournal = {
            defs: file.defs,
            entries: file.entries
        }
        const translated = this.translateFromYamlFormat(aliasedDJ);
        const returnDJ = AliasKeyer.unapplyAliases(translated, YamlTranslator.aliasKeys);
        return dj.DJ.addOverview(returnDJ);
    }

    translateToYamlFormat(data: dj.DataJournal) {
        //make static
        const newData = JSON.parse(JSON.stringify(data))
        newData.defs.forEach(def => {
            if (def.upd) def.upd = dj.DJ.parseDateFromEpochStr(def.upd).toISOString();
        })
        newData.entries.forEach(entry => {
            if (entry.upd) entry.upd = dj.DJ.parseDateFromEpochStr(entry.upd).toISOString();
            if (entry.cre) entry.cre = dj.DJ.parseDateFromEpochStr(entry.cre).toISOString();
        })
        return newData
    }

    translateFromYamlFormat(data: any) {
        data.defs.forEach(def => {
            if (def.upd) def.upd = dj.DJ.makeEpochStrFrom(def.upd);
        })
        data.entries.forEach(entry => {
            if (entry.upd) entry.upd = dj.DJ.makeEpochStrFrom(entry.upd);
            if (entry.cre) entry.cre = dj.DJ.makeEpochStrFrom(entry.cre);
        })
        return data
    }

    static aliasKeys = {
        "id": "_id",
        "per": "_period",
        "lbl": "_lbl",
        "typ": "_type",
        "dsc": "_desc",
        "emo": "_emoji",
        "rlp": "_rollup",
        "tag": "_tags",
        "rng": "_range",
        "scp": "_scope",
        "cre": "_created",
        "upd": "_updated",
        "del": "_deleted",
        "src": "_source",
        "nte": "_note",
    }
}

//#endregion

export class CsvTranslator implements Translator {
    getServiceName(): string {
        return 'CSV Translator'
    }

    /* adding static methods for convenience rather than fully refactoring */
    static async fromDataJournal(dataJournal: dj.DataJournal, filename: string, useFs = true){
        return new CsvTranslator().fromDataJournal(dataJournal,filename,useFs);
    }
    static toDataJournal(filepath:string, useFs = true){
        return new CsvTranslator().toDataJournal(filepath, useFs);
    }
    static async fromEntries(entries: dj.Entry[], filename: string, useFs = true) {
        return new CsvTranslator().fromEntries(entries,filename,useFs);
    }
    static async fromDefs(defs: dj.Def[], filename: string, useFs = true) {
        return new CsvTranslator().fromDefs(defs,filename,useFs);
    }
    static async toEntries(filepath: string, useFs = true): Promise<dj.Entry[]>{
        return new CsvTranslator().toEntries(filepath,useFs);
    }
    static async toDefs(filepath: string, useFs = true): Promise<dj.Def[]>{
        return new CsvTranslator().toDefs(filepath,useFs);
    }

    /**
     * Builds a csv file representing an entire data journal. 
     * Does this by include ALL Def information transposed above the header for
     * each Def column. Defs are stacked horizontally, whereas entries are 
     * stacked vertically like a standard csv.
     */
    async fromDataJournal(dataJournal: dj.DataJournal, filename: string, useFs = true) {
        if (useFs) XLSX.set_fs(fs);
        const wb = XLSX.utils.book_new();
        const data: string[][] = CsvTranslator.build2DArrayFor(dataJournal);

        let exportSht = XLSX.utils.aoa_to_sheet(data);

        XLSX.utils.book_append_sheet(wb, exportSht, 'Data Journal');

        XLSX.writeFile(wb, filename);
        return
    }

    async toDataJournal(filepath: string, useFs = true): Promise<dj.DataJournal> {
        console.log('loading...');
        if (useFs) XLSX.set_fs(fs);
        let loadedWb = XLSX.readFile(filepath, { dense: true });
        const shts = loadedWb.SheetNames;
        if (shts.length !== 1) throw new Error("Wrong number of sheets found");
        const shtData = loadedWb.Sheets[shts[0]]['!data']!;

        const defsTransposed: any[] = [];

        //middle slice section
        const sliceSpot = findSecondNonUndefinedIndex(shtData[0]);

        //this begins a nightmare of complexity and terribleness... 
        //If you start to have to debug this reconsider your life choices
        while (shtData[0][0].v !== '---') {
            const potentialRow = shtData.shift()?.map(cell => cell.v);
            const header = potentialRow![0];
            potentialRow?.splice(0, sliceSpot - 1)
            potentialRow![0] = header;
            if (potentialRow?.some(val => val !== undefined)) defsTransposed.push(potentialRow);
        }
        //remove delimiter separating defs from entries
        shtData.shift();

        //jam it into an indecipherable mess. 
        const defs = convert2DArrayToObjects(transposeMatrix(defsTransposed));
        defs.forEach((def: any) => {
            if (def._range !== undefined && typeof def._range === 'string') def._range = def._range.split(', ');
            if (def._tags !== undefined && typeof def._tags === 'string') def._tags = def._tags.split(', ');

        })

        const entryTextValues = shtData.map(row => row.map(cell => cell.w));
        const entries = convert2DArrayToObjects(entryTextValues);
        //fix _deleted key - force boolean, and other keys
        entries.forEach((entry: any) => {
            if (entry._deleted !== undefined && typeof entry._deleted === 'string') entry._deleted = entry._deleted.toUpperCase().trim() == "TRUE";
        })
        //@ts-expect-error
        return {
            defs: defs,
            entries: entries
        } as dj.DataJournal;

        //helper functions
        function findSecondNonUndefinedIndex(array) {
            let count = 0;
            for (let i = 0; i < array.length; i++) {
                if (array[i] !== undefined) {
                    count++;
                    if (count === 2) {
                        return i;
                    }
                }
            }
            return -1; // If no second non-undefined element is found
        }
        function transposeMatrix<T>(matrix: T[][]): T[][] {
            const numRows = matrix.length;
            const numCols = matrix[0].length;

            const transposedMatrix: T[][] = [];

            for (let i = 0; i < numCols; i++) {
                transposedMatrix.push([]);
                for (let j = 0; j < numRows; j++) {
                    transposedMatrix[i].push(matrix[j][i]);
                }
            }

            return transposedMatrix;
        }
        function convert2DArrayToObjects<T>(array: T[][]): T[] {
            const keys = array[0];
            const objects: T[] = [];

            for (let i = 1; i < array.length; i++) {
                const object: T = {} as T;
                for (let j = 0; j < keys.length; j++) {
                    //@ts-ignore
                    object[keys[j] as keyof T] = array[i][j];
                }
                objects.push(object);
            }

            return objects;
        }
    }

    async fromEntries(entries: dj.Entry[], filename: string, useFs = true) {
        if (useFs) XLSX.set_fs(fs);
        const wb = XLSX.utils.book_new();

        const tempDJ = {
            defs: [],
            entries: entries
        }
        const data: string[][] = CsvTranslator.build2DArrayFor(tempDJ, true);

        let exportSht = XLSX.utils.aoa_to_sheet(data);

        XLSX.utils.book_append_sheet(wb, exportSht, 'Data Journal');

        XLSX.writeFile(wb, filename);
        return
    }

    async fromDefs(defs: dj.Def[], filename: string, useFs = true) {
        if (useFs) XLSX.set_fs(fs);
        const wb = XLSX.utils.book_new();

        //flatten arrays
        defs.forEach(def => {
            //@ts-expect-error
            if (def._range !== undefined) def._range = def._range.join(', ')
            //@ts-expect-error
            if (def._tags !== undefined) def._tags = def._tags.join(', ')
        })

        let exportSht = XLSX.utils.json_to_sheet(defs);

        XLSX.utils.book_append_sheet(wb, exportSht, 'Data Journal');

        XLSX.writeFile(wb, filename);
        return
    }

    async toEntries(filepath: string, useFs = true): Promise<dj.Entry[]> {
        if (useFs) XLSX.set_fs(fs);
        const loadedWb = XLSX.readFile(filepath, { raw: true });
        const shts = loadedWb.SheetNames;
        if (shts.length !== 1) throw new Error("Wrong number of sheets found");
        const arrayOfEntries = XLSX.utils.sheet_to_json(loadedWb.Sheets[shts[0]])

        //clean sanity check results
        arrayOfEntries.forEach((entry: any) => {
            //since we're reading *everything* as text, need to convert the deleted key
            if (entry._deleted !== undefined && typeof entry._deleted === 'string') entry._deleted = entry._deleted.toUpperCase().trim() === "TRUE"

            //probably need some sort of method here to sanity check other entry properties for things like arrays & numbers.

            if (!dj.DJ.isValidEntry(entry as Partial<dj.Entry>)) {
                console.error("INVALID Entry PARSING FOUND 👇")
                console.error(entry);
                throw new Error('Entry Parsing resulted in an invalid Entry. See logs above this.');
            }
        })
        return arrayOfEntries as dj.Entry[];
    }

    async toDefs(filepath: string, useFs = true): Promise<dj.Def[]> {
        if (useFs) XLSX.set_fs(fs);
        const loadedWb = XLSX.readFile(filepath);
        const shts = loadedWb.SheetNames;
        if (shts.length !== 1) throw new Error("Wrong number of sheets found");
        const arrayOfDefs = XLSX.utils.sheet_to_json(loadedWb.Sheets[shts[0]]);

        //sanity check results
        arrayOfDefs.forEach((def: any) => {
            // if (def.__rowNum__ !== undefined) delete def.__rowNum__;
            if (!dj.DJ.isValidDef(def as Partial<dj.Def>)) {
                console.error("INVALID DEF PARSING FOUND 👇")
                console.error(def);
                throw new Error('Def Parsing resulted in an invalid Def. See logs above this.');
            }
        })
        return arrayOfDefs as dj.Def[];
    }

    // async loadAliasKeysFromCSV(filepath: string, useFs = true): Promise<AliasKeyes> {
    //#TODO maybe eventually, support AliasKeying
    // }

    private static build2DArrayFor(dataJournal: dj.DataJournal, entriesOnly = false): string[][] {
        const data: string[][] = [];
        //establish header arrays (for both Defs and Entries)
        const defHeaders: string[] = []
        const defHeaderMap: { [key: string]: any } = {}
        const defIds: string[] = [];
        const defIdMap: { [key: string]: any } = {}
        dataJournal.defs.forEach(def => {
            Object.keys(def).forEach(key => {
                if (defHeaderMap[key] !== undefined) return;
                defHeaders.push(key);
                defHeaderMap[key] = defHeaders.length;
            })
            if (defIdMap[def._id] !== undefined) return;
            defIdMap[def._id] = true; // just need key to exist
            defIds.push(def._id);
        })

        const entryHeaders: string[] = []
        const entryHeaderMap: { [key: string]: any } = {}
        dataJournal.entries.forEach(entry => {
            Object.keys(entry).forEach(key => {
                if (entryHeaderMap[key] !== undefined) return;
                entryHeaderMap[key] = entryHeaders.length;
                entryHeaders.push(key);
            })
        })
        if (!entriesOnly) {
            //Create Def Rows
            defHeaders.forEach(header => {
                const newRow: any[] = [];
                newRow[0] = header
                dataJournal.defs.forEach(def => {
                    let value = def[header];
                    if (Array.isArray(value)) value = value.join(', ');
                    newRow[entryHeaderMap[def._id]] = value;
                })
                data.push(newRow)
            });
            //add entry / def delimiter header
            data.push(['---']);

        }
        //add entry headers
        data.push(entryHeaders);
        //create entry rows
        dataJournal.entries.forEach(entry => {
            const newRow: any[] = [];
            entryHeaders.forEach(header => {
                if (entry[header] === undefined) return;
                let value = entry[header];
                if (Array.isArray(value)) value = value.join(', ');
                newRow[entryHeaderMap[header]] = value; //not sure why I'm needing to subtract one
            })
            data.push(newRow);
        })
        return data;
    }
}

/**
 * Static Utilities for Importing and Exporting to 
 * TABULAR Excel. These stack all types on one-another
 * and are **not** the "natural" way of working within Excel
 */
export class ExcelTranslator implements Translator {
    static overViewShtName = 'Overview';
    static defShtName = 'Defs';
    static entryShtName = 'Entries';

    getServiceName(): string {
        return 'Excel Translator';
    }

    /* adding static methods for convenience rather than fully refactoring */
    static async fromDataJournal(dataJournal: dj.DataJournal, filename: string, useFs = true){
        return new ExcelTranslator().fromDataJournal(dataJournal,filename,useFs);
    }
    static toDataJournal(filepath:string, useFs = true){
        return new ExcelTranslator().toDataJournal(filepath, useFs);
    }

    fromDataJournal(data: dj.DataJournal, filename: string, useFs = true) {
        if (useFs) XLSX.set_fs(fs);
        const wb = XLSX.utils.book_new();
        data.overview = dj.DJ.makeOverview(data);

        if (data.overview !== undefined) {
            let aoa: any[] = [];
            if (data.overview!.counts !== undefined) {
                if (data.overview?.counts!.defs !== undefined) aoa.push(['Defs:', data.overview!.counts.defs!]);
                if (data.overview?.counts!.activeEntries !== undefined) aoa.push(['Active Entries:', data.overview!.counts.activeEntries!]);
                if (data.overview?.counts!.deletedEntries !== undefined) aoa.push(['Deleted Entries:', data.overview!.counts.deletedEntries!]);
            }
            if (data.overview?.updated !== undefined) {
                if (data.overview.updated.epochStr !== undefined) aoa.push(['Updated (EpochStr)', data.overview.updated.epochStr])
                if (data.overview.updated.isoStr !== undefined) aoa.push(['Updated (Iso)', data.overview.updated.isoStr])
                if (data.overview.updated.localeStr !== undefined) aoa.push(['Updated (Locale)', data.overview.updated.localeStr])
            }
            let overviewSht = XLSX.utils.aoa_to_sheet(aoa);
            XLSX.utils.book_append_sheet(wb, overviewSht, ExcelTranslator.overViewShtName);
        }

        //create defSht
        if (data.defs.length > 0) {
            let excelifiedDefs = data.defs.map(def => ExcelTranslator.convertToExcelFormats(def))
            let defSht = XLSX.utils.json_to_sheet(excelifiedDefs);
            XLSX.utils.book_append_sheet(wb, defSht, ExcelTranslator.defShtName);
        }

        //create entrySht
        if (data.entries.length > 0) {
            let excelifiedEntries = data.entries.map(entry => ExcelTranslator.convertToExcelFormats(entry))
            let entrySht = XLSX.utils.json_to_sheet(excelifiedEntries);
            XLSX.utils.book_append_sheet(wb, entrySht, ExcelTranslator.entryShtName);
        }

        XLSX.writeFile(wb, filename);
    }

    static convertToExcelFormats(element: dj.Def | dj.Entry): object {
        const converted: object = {};
        Object.keys(element).forEach(key => {
            // if(key === '__rowNum__') return; 
            let value = element[key];
            if (key === '_created' || key === '_updated') value = dj.DJ.parseDateFromEpochStr(value);
            if (key === '_period') value = new Date(value) //value.replaceAll('T',' ')
            if (Array.isArray(value)) value = value.join(', ');
            converted[key] = value;
        })
        return converted;
    }

    async toDataJournal(filepath: string, useFs = true): Promise<dj.DataJournal> {
        console.log(filepath,useFs) //stop errors
        throw new Error('Unimplemented - cannot open Excel file on Mac, seemingly');
        /**
         * Note to self: ran into an issue with XLSX.JS wherein it doesn't like opening
         * files with the .xlsx file type here on Mac. You could fight it later, perhaps.
         */
        // console.log('loading...');
        // let returnData: dj.DataJournal = {
        //     defs: [],
        //     entries: []
        // }
        // if (useFs) XLSX.set_fs(fs);
        // let loadedWb = XLSX.readFile(filepath);
        // const shts = loadedWb.SheetNames;

        // if (!shts.some(name => name === ExcelTranslator.defShtName)) {
        //     console.warn('No Defs sheet found, skipping Defs import');
        // } else {
        //     const defSht = loadedWb.Sheets[ExcelTranslator.defShtName];
        //     let defBaseRawArr = XLSX.utils.sheet_to_json(defSht, { raw: false }) as pdw.DefLike[];
        //     //...
        // }
    }

    static convertFromExcelFormats(element: dj.Def | dj.Entry): object {
        const converted: object = {};
        Object.keys(element).forEach(key => {
            // if(key === '__rowNum__') return; 
            let value = element[key];
            if (key === '_created' || key === '_updated') value = dj.DJ.parseDateFromEpochStr(value);
            if (key === '_period') value = new Date(value) //value.replaceAll('T',' ')
            if (Array.isArray(value)) value = value.join(', ');
            converted[key] = value;
        })
        return converted;
    }

    // static parseExcelDef(defRow: any, points: any): pdw.DefLike {
    //     //check structure
    //     if (defRow._deleted == undefined || defRow._did == undefined) throw new Error('Cannot parseExcelDefRow for ', defRow);
    //     const defData: pdw.DefData = {
    //         _did: defRow._did.toString(), //in case I got unlucky with an all-numeric SmallID
    //         _lbl: defRow._lbl,
    //         _desc: defRow._desc,
    //         _emoji: defRow._emoji,
    //         _tags: JSON.parse(defRow._tags),
    //         _scope: defRow._scope,
    //         _pts: points.map((point: any) => this.parseExcelPointDefRow(point)),
    //         _uid: defRow._uid,
    //         _deleted: defRow._deleted, //checked for type later
    //         _created: '',
    //         _updated: ''
    //     }

    //     if (typeof defRow._deleted === 'string') defData._deleted = defRow._deleted.toUpperCase() === "TRUE";
    //     defData._created = ExcelTranslator.makeEpochStrFromExcelDate(defRow._created);
    //     defData._updated = ExcelTranslator.makeEpochStrFromExcelDate(defRow._updated);

    //     if (!pdw.Def.isDefData(defData)) throw new Error('Failed to correctly parseExcelDefRow for ', defRow);

    //     return defData
    // }

    // static makeEpochStrFromExcelDate(dateCellVal: any): any {
    //     if (typeof dateCellVal === 'string') {
    //         if (pdw.isValidEpochStr(dateCellVal)) return pdw.parseTemporalFromEpochStr(dateCellVal);
    //         return pdw.makeEpochStrFrom(Temporal.Instant.fromEpochMilliseconds(new Date(dateCellVal).getTime()).toZonedDateTimeISO(Temporal.Now.timeZone()));
    //     }
    //     if (typeof dateCellVal === 'number') {
    //         return pdw.makeEpochStrFrom(Temporal.Instant.fromEpochMilliseconds((dateCellVal - (25567 + 1)) * 86400 * 1000).toZonedDateTimeISO(Temporal.Now.timeZone()));
    //     }
    // }
}

export class MarkdownTranslator implements Translator {
    // aliasKeys: AliasKeyes;
    // constructor(aliasKeys?: AliasKeyes){
    //     if(aliasKeys === undefined){
    //         this.aliasKeys = {}
    //     }else{
    //         this.aliasKeys = aliasKeys!;
    //     }
    // }

    getServiceName(): string {
        return 'Markdown Translator'
    }

    async fromDataJournal(data: dj.DataJournal, filepath: string, aliasKeys: AliasKeyes = {}) {
        try {
            const stats = fs.statSync(filepath);
            if (stats.isDirectory()) {
                throw new Error("Supplied file path is a folder, please supply a full file path including filename & '.md' extension")
            }
            this.updateMarkdownDataJournal(data, filepath, aliasKeys);
            //if that doesn't error, the file exists.
        } catch (err: any) {
            if (err.code === 'ENOENT') {
                this.createNewMarkdownDataJournal(data, filepath, aliasKeys);
            } else {
                throw err;
            }
        }
    }

    async updateMarkdownDataJournal(data: dj.DataJournal, filepath: string, aliasKeys: AliasKeyes = {}, readOnly = false): Promise<dj.DataJournal> {
        const note = new Note(filepath);
        const staticDJ = JSON.parse(JSON.stringify(data));

        let containedAliases: object = {}

        //obtain all aliases contained in the note
        note.blocks.forEach(block => {
            if (MarkdownTranslator.blockIsAliasKey(block)) {
                let mergeObj = MarkdownTranslator.mergeObjectIntoMarkdownString(block.text, aliasKeys, false);
                containedAliases = { ...containedAliases, ...mergeObj.keyValuesContained };
                block.text = mergeObj.resultString;
            }
        })

        //create aliased Data Journal applying aliases passed in AND read from the file, where passed-in trumps
        const combinedAliases = { ...aliasKeys, ...containedAliases };
        const aliasedDJ = AliasKeyer.applyAliases(staticDJ, combinedAliases);

        let containedDefs: object[] = [];
        let containedEntries: object[] = [];

        let defsToAppend = JSON.parse(JSON.stringify(aliasedDJ.defs));
        let entriesToAppend = JSON.parse(JSON.stringify(aliasedDJ.entries));
        let aliasesToAppend = JSON.parse(JSON.stringify(aliasKeys));
        //this is untested.
        Object.keys(containedAliases).forEach(containedKey => {
            if(Object.hasOwn(aliasesToAppend, containedKey)) delete aliasesToAppend[containedKey]
        })

        //do other stuff
        let idKey = '_id';
        const positionOfIdAlias = Object.values(combinedAliases).findIndex(canonKey => canonKey === idKey);
        if (positionOfIdAlias !== -1) idKey = Object.keys(combinedAliases)[positionOfIdAlias];

        note.blocks.forEach(block => {
            if (MarkdownTranslator.blockIsDef(block)) {
                let relatedDef: any = aliasedDJ.defs.filter(def => block.text.includes('::'+def[idKey]+']'));
                if (relatedDef.length > 1) {
                    throw new Error('More than one Def._id match found in block!')
                }
                if (relatedDef.length === 1) defsToAppend = defsToAppend.filter(def => dj.DJ.standardizeKey(def[idKey]) !== dj.DJ.standardizeKey(relatedDef[0][idKey]))
                if (relatedDef.length === 0) relatedDef = [{}];
                let mergeObj = MarkdownTranslator.mergeObjectIntoMarkdownString(block.text, relatedDef[0], true);
                containedDefs.push(mergeObj.keyValuesContained);
                block.text = mergeObj.resultString;
            }
            if (MarkdownTranslator.blockIsEntry(block)) {
                let relatedEntry: any = aliasedDJ.entries.filter(entry => block.text.includes(entry[idKey]));
                if (relatedEntry.length > 1) {
                    throw new Error('More than one Entry._id match found in block!')
                }
                if (relatedEntry.length === 1) entriesToAppend = entriesToAppend.filter(entry => dj.DJ.standardizeKey(entry[idKey]) !== dj.DJ.standardizeKey(relatedEntry[0][idKey]))
                if (relatedEntry.length === 0) relatedEntry = [{}];
                let mergeObj = MarkdownTranslator.mergeObjectIntoMarkdownString(block.text, relatedEntry[0], true);
                containedEntries.push(mergeObj.keyValuesContained)
                block.text = mergeObj.resultString;
            }
        })


        if(!readOnly){
            let returnNoteText = '';
            note.blocks.forEach(block => returnNoteText += block.text + '\n');
            if(defsToAppend.length > 0) returnNoteText += MarkdownTranslator.makeBlocksOfDefs(defsToAppend, {});
            if(entriesToAppend.length > 0) returnNoteText += MarkdownTranslator.makeBlocksOfEntries(entriesToAppend, {});
            if(aliasesToAppend.length > 0) returnNoteText += MarkdownTranslator.makeBlockOfKeyAliases(aliasesToAppend);
            containedDefs = [...containedDefs, ...defsToAppend];
            containedEntries = [...containedEntries, ...entriesToAppend];

            fs.writeFileSync(filepath.slice(0,filepath.length-3)+" (new).md", returnNoteText, 'utf8');
        }

        const unaliasedDJ = AliasKeyer.unapplyAliases({
            defs: containedDefs,
            entries: containedEntries
        }, aliasKeys)

        //convert any entry._deleted into actual boolean
        unaliasedDJ.entries.forEach(entry=>{
            //@ts-expect-error
            if(entry._deleted !== undefined && typeof entry._deleted === 'string') entry._deleted = entry._deleted.toUpperCase() === 'TRUE'
        })

        return unaliasedDJ
    }

    private static mergeObjectIntoMarkdownString(str: string, keyVals: object, appendMissingKeys = false): { keyValuesContained: object, resultString: string } {
        // const unmodified = str;
        const splitText = str.split('::');
        const keyValuesToAppend = JSON.parse(JSON.stringify(keyVals));
        let delimterUsed = ''; //variable shared within nested functions
        while (splitText.length > 1) {
            let key = findKey(splitText[0]);
            if (key === null) {
                //merge 0th element into 1st
                splitText[1] = splitText[0] + '::' + splitText[1]
                //remove 0th element
                splitText.shift();
                continue; //back to the top of the loop
            }
            const existsInPassedInObject = Object.hasOwn(keyVals, key);
            let val = findVal(splitText[1]);
            if (val === null) {
                //not sure if this can happen
                throw new Error('unhandled situation fapeihml');
            }
            if (!existsInPassedInObject) {
                //just reading it into keyVals
                keyVals[key] = val;
            } else {
                //replace value in the text that was found with passed in key/value value
                splitText[1] = keyVals[key] + splitText[1].substring(val!.length);
                delete keyValuesToAppend[key];
            }

            //merge 0th element into 1st
            splitText[1] = splitText[0] + '::' + splitText[1]
            //remove 0th element
            splitText.shift();
        }
        //append any remaining keyValuesToAppend
        let returnStr = splitText[0]
        let returnValsContained = keyVals;
        if (appendMissingKeys) {
            returnStr = appendKeyValues(returnStr, keyValuesToAppend);
            returnValsContained = { ...keyVals, ...keyValuesToAppend };
        }

        return {
            keyValuesContained: returnValsContained,
            resultString: returnStr
        }

        function appendKeyValues(toText: string, keyValuesToAppend: object): string {
            let returnText = toText;
            const middleBit = `\n\t- `;
            Object.keys(keyValuesToAppend).forEach(key => {
                returnText = returnText + middleBit + '[' + key + '::' + keyValuesToAppend[key] + ']'
            })
            return returnText
        }

        function findVal(text: string): string | null {
            if (delimterUsed === 'bracket') return findValWithBracket(text);
            if (delimterUsed === 'paren') return findValWithParen(text);
            throw new Error('whelp.')
        }

        function findValWithBracket(str: string): string | null {
            let openCount = 0;
            let closeCount = 0;
            for (let i = 0; i < str.length; i++) {
                if (str[i] === "[") {
                    openCount++;
                } else if (str[i] === "]") {
                    closeCount++;
                }

                if (closeCount === openCount
                    + 1) {
                    return str.slice(0, i);
                }
            }
            return null; // If no valid closing bracket is found
        }

        function findValWithParen(str: string): string | null {
            let openCount = 0;
            let closeCount = 0;
            for (let i = 0; i < str.length; i++) {
                if (str[i] === "(") {
                    openCount++;
                } else if (str[i] === ")") {
                    closeCount++;
                }

                if (closeCount === openCount
                    + 1) {
                    return str.slice(0, i);
                }
            }
            return null; // If no valid closing bracket is found
        }

        function findKey(text: string): string | null {
            delimterUsed = 'bracket';
            let key = findKeyWithBracket(text);
            if (key !== null) return key;
            delimterUsed = 'paren';
            return findKeyWithParen(text)
        }

        function findKeyWithBracket(text: string) {
            //key cannot have any () or [] in it
            const bracketSplit = text.split('[');
            if (bracketSplit.length === 1) return null
            let candidateKey = bracketSplit.pop()!;
            //key cannot have any other delimiters in it
            if (!candidateKey?.includes(']') &&
                !candidateKey?.includes('(') &&
                !candidateKey?.includes(')')) {
                return candidateKey;
            }
            return null
        }
        function findKeyWithParen(text: string) {
            //key cannot have any () or [] in it
            const bracketSplit = text.split('(');
            if (bracketSplit.length === 1) return null
            let candidateKey = bracketSplit.pop()!;
            //key cannot have any other delimiters in it
            if (!candidateKey?.includes(')') &&
                !candidateKey?.includes('[') &&
                !candidateKey?.includes(']')) {
                return candidateKey;
            }
            return null
        }
    }

    private async createNewMarkdownDataJournal(data: dj.DataJournal, filepath: string, aliasKeys: AliasKeyes = {}) {
        let newFileContents = '';
        if (Object.keys(aliasKeys).length > 0) {
            newFileContents = MarkdownTranslator.makeBlockOfKeyAliases(aliasKeys);
        }
        if (data.defs.length > 0) {
            newFileContents = MarkdownTranslator.makeBlocksOfDefs(data.defs, aliasKeys);
        }
        if (data.entries.length > 0) {
            newFileContents = MarkdownTranslator.makeBlocksOfEntries(data.entries, aliasKeys);
        }
        fs.writeFileSync(filepath, newFileContents);
    }

    static makeBlockOfKeyAliases(aliasKeys: AliasKeyes): string {
        const aliases = Object.keys(aliasKeys);
        let returnStr = '- #keyAlias\n';
        aliases.forEach(alias => {
            returnStr += '\t- [' + alias + '::' + aliasKeys[alias] + ']\n';
        })
        return returnStr
    }
    static makeBlocksOfDefs(defs: dj.Def[], aliasKeys: AliasKeyes): string {
        const keyAliases = AliasKeyer.flipToKeyAlias(aliasKeys);
        let returnStr = ''
        defs.forEach(def => {
            returnStr += '- #def\n';
            const rawKeys = Object.keys(def);
            rawKeys.forEach(rawKey => {
                let aliasedKey = rawKey;
                if (keyAliases[rawKey] !== undefined) aliasedKey = keyAliases[rawKey];
                returnStr += '\t- [' + aliasedKey + '::' + def[rawKey] + ']\n';
            })
        })
        return returnStr
    }
    static makeBlocksOfEntries(entries: dj.Entry[], aliasKeys: AliasKeyes): string {
        let returnStr = ''
        entries.forEach(entry => {
            returnStr += '- #entry\n';
            const rawKeys = Object.keys(entry);
            rawKeys.forEach(rawKey => {
                let aliasedKey = rawKey;
                if (aliasKeys[rawKey] !== undefined) aliasedKey = aliasKeys[rawKey];
                returnStr += '\t- [' + aliasedKey + '::' + entry[rawKey] + ']\n';
            })
        })
        return returnStr;
    }

    static blockIsEntry(block: Block): boolean {
        const firstLine = block.text.split('\n')[0];
        return firstLine.toUpperCase().includes('#ENTRY');
    }
    static blockIsDef(block: Block): boolean {
        const firstLine = block.text.split('\n')[0];
        return firstLine.toUpperCase().includes('#DEF');
    }
    static blockIsAliasKey(block: Block): boolean {
        const firstLine = block.text.split('\n')[0];
        return firstLine.toUpperCase().includes('#KEYALIAS');
    }

    async toDataJournal(filepath: string): Promise<dj.DataJournal> {
        //using code I already wrote, probably less efficient in terms of runtime,
        //but WAY more efficient in terms of getting this done.
        return this.updateMarkdownDataJournal({defs:[],entries:[]},filepath,{},true);
    }
}

function inferFileType(path: string): "excel" | "json" | "csv" | "yaml" | "markdown" | "unknown" {
    if (path.slice(-5).toUpperCase() === ".XLSX") return 'excel'
    if (path.slice(-5).toUpperCase() === ".JSON") return 'json'
    if (path.slice(-4).toUpperCase() === ".CSV") return 'csv'
    if (path.slice(-4).toUpperCase() === ".MD") return 'markdown'
    if (path.slice(-5).toUpperCase() === ".YAML" || path.slice(-4).toUpperCase() === ".YML") return 'yaml'
    return "unknown"
}
//#endregion

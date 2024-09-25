import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as YAML from 'yaml';
import * as dj from '../DJ.js';
import { Translator } from '../pdw.js';
import { AliasKeyer, AliasKeyes } from '../AliasKeyer.js';

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
    static overViewShtName = '!Overview';
    static defShtName = '!Defs';
    static tagShtName = '!Tags';
    static pointShtName = '!DefPoints';

    getServiceName(): string {
        return 'Excel Translator'
    }

    fromDataJournal(data: dj.DataJournal, filename: string, useFs = true) {
        if (useFs) XLSX.set_fs(fs);
        const wb = XLSX.utils.book_new();

        if (data.overview !== undefined) {
            let aoa = [];
            aoa.push(['Store Name:', data.overview.storeName]);
            aoa.push(['Last updated:', pdw.parseTemporalFromEpochStr(data.overview.lastUpdated).toLocaleString()]);
            aoa.push(['Element Type', 'Count Active', 'Count Deleted']);
            if (data.defs !== undefined) aoa.push(['defs', data.overview.defs.current, data.overview.defs.deleted]);
            if (data.entries !== undefined) aoa.push(['entries', data.overview.entries.current, data.overview.entries.deleted]);
            let overviewSht = XLSX.utils.aoa_to_sheet(aoa);
            XLSX.utils.book_append_sheet(wb, overviewSht, ExcelTranslator.overViewShtName);
        }

        if (data.defs !== undefined && data.defs.length > 0) {
            let defBaseArr = data.defs.map(def => ExcelTranslator.makeExcelDefRow(def));
            defBaseArr.unshift(tabularHeaders.def);

            let pointDefArr: any[] = [];
            pointDefArr.unshift(tabularHeaders.pointDef);
            data.defs.forEach(def => {
                def._pts?.forEach(point => {
                    pointDefArr.push(ExcelTranslator.makeExcelPointDefRow(point, def));
                })
            })

            let defSht = XLSX.utils.aoa_to_sheet(defBaseArr);
            XLSX.utils.book_append_sheet(wb, defSht, ExcelTranslator.defShtName);
            let pdSht = XLSX.utils.aoa_to_sheet(pointDefArr);
            XLSX.utils.book_append_sheet(wb, pdSht, ExcelTranslator.pointShtName);
        }

        //create one sheet per definition
        if (data.entries !== undefined && data.defs !== undefined && data.defs.length > 0) {
            data.defs.forEach(def => {
                if (def._deleted) return; //don't make tabs for deleted defs
                let entries = data.entries!.filter(entry => entry._did === def._did);
                if (entries.length > 0) ExcelTranslator.createEntryTabFor(entries, def, wb);
            })
        }

        XLSX.writeFile(wb, filename);
    }

    /**
     * Returns an array of the values of the def
     * in accordance with the positions of the
     * {@link tabularDefHeaders} positioning. 
     * Ying & Yang with {@link parseExcelDefRow}
     */
    static makeExcelDefRow(def: pdw.DefLike) {
        return [
            ...ExcelTranslator.makeExcelFirstFourColumns(def),
            def._did,
            def._lbl,
            def._emoji,
            def._desc,
            def._scope!.toString(),
            JSON.stringify(def._tags)
        ]
    }

    static makeExcelPointDefRow(pd: pdw.PointDefLike, def: pdw.DefLike) {
        return [
            ...ExcelTranslator.makeExcelFirstFourColumns(def),
            def._did,
            pd._pid,
            pd._lbl,
            pd._emoji,
            pd._desc,
            pd._type?.toString(),
            pd._rollup?.toString(),
            Object.hasOwn(pd, '_opts') ? Object.values(pd._opts!).join('|||') : ''
            // JSON.stringify(pd._opts, null, 2)
        ]
    }

    static createEntryTabFor(entryData: pdw.EntryLike[], def: pdw.DefLike, wb: XLSX.WorkBook) {
        let headers = [...tabularHeaders.entry];
        let lbls: string[] = [];
        let pids: string[] = [];
        def._pts?.forEach(pd => {
            lbls.push(pd._lbl!)
            pids.push(pd._pid!)
        })
        headers.push(...lbls);

        let entryArr = [headers];
        entryData.forEach((entry: pdw.EntryLike) => {
            let arr = this.makeExcelEntryRow(entry);
            let vals = pids.map(pid => {
                if (entry[pid] !== undefined) return entry[pid];
                return '';
            })
            entryArr.push([...arr, ...vals]);
        })

        let entrySht = XLSX.utils.aoa_to_sheet(entryArr);
        XLSX.utils.book_append_sheet(wb, entrySht, def._lbl);
    }

    static makeExcelEntryRow(entryData: pdw.EntryLike) {
        return [
            ...ExcelTranslator.makeExcelFirstFourColumns(entryData),
            entryData._did,
            entryData._eid,
            entryData._period,
            entryData._note,
            entryData._source
        ]
    }

    static makeExcelFirstFourColumns(elementData: pdw.ElementLike) {
        return [
            elementData._uid,
            pdw.parseTemporalFromEpochStr(elementData._created!).toPlainDateTime().toLocaleString(),
            pdw.parseTemporalFromEpochStr(elementData._updated!).toPlainDateTime().toLocaleString(),
            // elementData._created,
            // elementData._updated,
            elementData._deleted ? "TRUE" : "FALSE",
        ]
    }

    async toDataJournal(filepath: string, useFs = true): Promise<dj.DataJournal> {
        /**
         * Note to self: ran into an issue with XLSX.JS wherein it doesn't like opening
         * files with the .xlsx file type here on Mac. You could fight it later, perhaps.
         */
        console.log('loading...');
        let returnData: dj.DataJournal = {
            defs: [],
            entries: []
        }
        if (useFs) XLSX.set_fs(fs);
        let loadedWb = XLSX.readFile(filepath);
        const shts = loadedWb.SheetNames;

        //again this turned out to just be easier
        let tempPDW = await pdw.PDW.newPDW([])

        if (!shts.some(name => name === ExcelTranslator.pointShtName)) {
            console.warn('No PointDefs sheet found, skipping Defs import');
        } else {
            const defSht = loadedWb.Sheets[ExcelTranslator.defShtName];
            let defBaseRawArr = XLSX.utils.sheet_to_json(defSht, { raw: false }) as pdw.DefLike[];
            const pdSht = loadedWb.Sheets[ExcelTranslator.pointShtName];
            let pdRawArr = XLSX.utils.sheet_to_json(pdSht, { raw: false }) as pdw.DefLike[];
            returnData.defs = [];

            defBaseRawArr.forEach(rawDef => {
                const points = pdRawArr.filter(row => row["def._uid"] === rawDef._uid);
                const parsedDef = ExcelTranslator.parseExcelDef(rawDef, points);
                returnData.defs.push(parsedDef as pdw.DefData);
            });
            await tempPDW.setDefs(returnData.defs);
        }

        shts.forEach(name => {
            if (name === ExcelTranslator.pointShtName) return; //skip
            if (name === ExcelTranslator.overViewShtName) return; //skip
            if (name === ExcelTranslator.defShtName) return; //skip
            const assDef = tempPDW.manifest.find(def => def.lbl === name)!;
            const entrySht = loadedWb.Sheets[name];
            const entryRawArr = XLSX.utils.sheet_to_json(entrySht, { raw: false }) as pdw.EntryLike[];
            const entries = entryRawArr.map(rawEntry => parseRawEntry(rawEntry, assDef));
            returnData.entries.push(...entries);
        });
        await tempPDW.setEntries(returnData.entries);

        returnData = await tempPDW.getAll({ includeDeleted: 'yes' });
        return returnData;

        function parseRawEntry(entryRow: any, def: pdw.Def): pdw.EntryData {
            let entryData: pdw.EntryData = {
                _eid: entryRow._eid,
                _note: entryRow._note,
                _period: entryRow._period,
                _did: entryRow._did,
                _source: entryRow._source,
                _uid: entryRow._uid,
                _deleted: entryRow._deleted,
                _created: '',
                _updated: ''
            }

            if (typeof entryData._deleted === 'string') entryData._deleted = (<string>entryData._deleted).toUpperCase() === "TRUE";
            entryData._created = ExcelTranslator.makeEpochStrFromExcelDate(entryRow._created);
            entryData._updated = ExcelTranslator.makeEpochStrFromExcelDate(entryRow._updated);

            Object.keys(entryRow).forEach(key => {
                if (key.substring(0, 1) === "_") return
                const assPd = def.getPoint(key);
                entryData[assPd!.pid] = entryRow[key];
            })

            if (!pdw.Entry.isEntryData(entryData)) throw new Error("Error in parsing an entry row");
            return entryData
        }
    }

    /**
     * Parses a row from Excel into a DefLike structure.
     * @param defRow row created by an Excel export 
     * Ying & Yang with {@link makeExcelDefRow}
     * @returns 
     */
    static parseExcelDef(defRow: any, points: any): pdw.DefLike {
        //check structure
        if (defRow._deleted == undefined || defRow._did == undefined) throw new Error('Cannot parseExcelDefRow for ', defRow);
        const defData: pdw.DefData = {
            _did: defRow._did.toString(), //in case I got unlucky with an all-numeric SmallID
            _lbl: defRow._lbl,
            _desc: defRow._desc,
            _emoji: defRow._emoji,
            _tags: JSON.parse(defRow._tags),
            _scope: defRow._scope,
            _pts: points.map((point: any) => this.parseExcelPointDefRow(point)),
            _uid: defRow._uid,
            _deleted: defRow._deleted, //checked for type later
            _created: '',
            _updated: ''
        }

        if (typeof defRow._deleted === 'string') defData._deleted = defRow._deleted.toUpperCase() === "TRUE";
        defData._created = ExcelTranslator.makeEpochStrFromExcelDate(defRow._created);
        defData._updated = ExcelTranslator.makeEpochStrFromExcelDate(defRow._updated);

        if (!pdw.Def.isDefData(defData)) throw new Error('Failed to correctly parseExcelDefRow for ', defRow);

        return defData
    }

    /**
     * Here's where I'm tryign to handle some variability in dates.
     * Some of this functionality is baked-into pdw.Element's constructor now,
     * but not THIS interpretation of number-types, so I'm just keeping all of it
     * @param _updated value in a date cell
     */
    static makeEpochStrFromExcelDate(dateCellVal: any): any {
        if (typeof dateCellVal === 'string') {
            if (pdw.isValidEpochStr(dateCellVal)) return pdw.parseTemporalFromEpochStr(dateCellVal);
            return pdw.makeEpochStrFrom(Temporal.Instant.fromEpochMilliseconds(new Date(dateCellVal).getTime()).toZonedDateTimeISO(Temporal.Now.timeZone()));
        }
        if (typeof dateCellVal === 'number') {
            return pdw.makeEpochStrFrom(Temporal.Instant.fromEpochMilliseconds((dateCellVal - (25567 + 1)) * 86400 * 1000).toZonedDateTimeISO(Temporal.Now.timeZone()));
        }
    }

    /**
     * Parses a row from Excel into a PointDefLike structure.
     * @param pointDefRow row created by an Excel export 
     * Yin & Yang with {@link makeExcelDefRow}
     * @returns 
     */
    static parseExcelPointDefRow(pointDefRow: any): pdw.PointDefLike {
        let pointDef = {
            _pid: pointDefRow._pid,
            _lbl: pointDefRow._lbl,
            _desc: pointDefRow._desc,
            _emoji: pointDefRow._emoji,
            _type: pointDefRow._type.toUpperCase(),
            _rollup: pointDefRow._rollup.toUpperCase(),
            _opts: undefined
        };
        if (pointDefRow._opts !== undefined) pointDef._opts = pointDefRow._opts.split('|||')
        pointDefRow._pid = pointDefRow._pid.toString(); //in case I got unlucky with an all-numeric SmallID

        if (!pdw.PointDef.isPointDefData(pointDef)) throw new Error('Failed to correctly parseExcelDefRow for ', pointDefRow);

        return pointDef
    }

    static parseExcelEntryRow(entryRow: any): pdw.EntryLike {
        //check structure
        if (entryRow._deleted == undefined
            || entryRow._did == undefined)
            throw new Error('Cannot parseExcelEntryRow for ', entryRow);

        // entryRow = AsyncExcelTabular.parseExcelFirstFourColumns(entryRow);

        entryRow._did = entryRow._did.toString(); //in case I got unlucky with an all-numeric SmallID
        if (entryRow._note === undefined) entryRow._note = '';
        if (entryRow._source === undefined) entryRow._source = 'Excel Import Circa ' + pdw.makeEpochStr();


        if (!pdw.Entry.isEntryData(entryRow)) throw new Error('Failed to correctly parseExcelEntryRow for ', entryRow);

        return entryRow
    }
}

/**
 * Let's party.
 */
// export class AsyncExcelNatural implements pdw.ImporterExporter {
//     static entryShtName = 'Entries';
//     static elementsShtName = 'Elements';

//     importFrom(filepath: string): pdw.CompleteDataset {
//         console.log('loading...');
//         let returnData: pdw.CompleteDataset = {}
//         XLSX.set_fs(fs);
//         let loadedWb = XLSX.readFile(filepath, { dense: true });
//         const shts = loadedWb.SheetNames;
//         const pdwRef = pdw.PDW.getInstance();
//         if (!shts.some(name => name === AsyncExcelNatural.elementsShtName)) {
//             console.warn('No Defs sheet found in ' + filepath);
//         } else {
//             const defSht = loadedWb.Sheets[AsyncExcelNatural.elementsShtName];
//             let defBaseRawArr = XLSX.utils.sheet_to_json(defSht, { header: 1 }) as pdw.DefLike[];
//             returnData.defs = defBaseRawArr.map(rawDef => AsyncExcelNatural.parseExcelDefRow(rawDef))
//             pdwRef.setDefs(returnData.defs);
//         }

//         if (!shts.some(name => name === AsyncExcelNatural.entryShtName)) {
//             console.warn('No Entry sheet found in ' + filepath);
//         } else {
//             const entrySht = loadedWb.Sheets[AsyncExcelNatural.entryShtName];
//             let entryRawArr = XLSX.utils.sheet_to_json(entrySht, { header: 1 }) as any[][];
//             let entriesAndEntryPoints: { entries: pdw.EntryLike[], entryPoints: pdw.EntryPointLike[] } = {
//                 entries: [],
//                 entryPoints: [],
//             }
//             entriesAndEntryPoints = this.parseEntrySht(entryRawArr);
//             pdwRef.setEntries(entriesAndEntryPoints.entries);
//             pdwRef.setEntryPoints(entriesAndEntryPoints.entryPoints);
//             // returnData.entryPoints = this.convertEntryShtToEntryPoints(entryRawArr, columns);
//             // pdwRef.setEntryPoints(returnData.entryPoints);
//         }

//         returnData = pdw.PDW.addOverviewToCompleteDataset(returnData, filepath);

//         return returnData;
//     }

//     private parseEntrySht(rawRows: any[][]): { entries: pdw.EntryLike[], entryPoints: pdw.EntryPointLike[] } {
//         let returnData: { entries: pdw.EntryLike[], entryPoints: pdw.EntryPointLike[] } = {
//             entries: [],
//             entryPoints: []
//         }
//         // if(entryRawArr[0].length !== columns.length - 1) throw new Error('Schema sheet should have exactly one more column than the Entries sheet')
//         return returnData
//     }

//     static parseExcelDefRow(rawDef: pdw.DefLike): pdw.DefLike {
//         let parsedDef: pdw.MinimumDef = {
//             _lbl: rawDef._lbl
//         }
//         parsedDef._did = rawDef._did === undefined ? pdw.makeSmallID() : rawDef._did;
//         parsedDef._created = rawDef._created === undefined ? pdw.makeEpochStr() : AsyncExcelTabular.makeEpochStrFromExcelDate(rawDef._created);
//         parsedDef._updated = rawDef._updated === undefined ? pdw.makeEpochStr() : AsyncExcelTabular.makeEpochStrFromExcelDate(rawDef._updated);
//         parsedDef._deleted = rawDef._deleted === undefined ? false : rawDef._deleted.toString().toUpperCase() === 'TRUE';
//         parsedDef._emoji = rawDef._emoji === undefined ? '🆕' : rawDef._emoji;
//         parsedDef._desc = rawDef._desc === undefined ? '' : rawDef._desc;
//         parsedDef._scope = rawDef._scope === undefined ? pdw.Scope.SECOND : rawDef._scope;
//         parsedDef._uid = rawDef._uid === undefined ? pdw.makeUID() : rawDef._uid;

//         return parsedDef as pdw.DefLike
//     }

//     exportTo(data: pdw.CompleteDataset, filename: string) {
//         throw new Error('Method not implemented.');

//         /*
//         XLSX.set_fs(fs);
//         const wb = XLSX.utils.book_new();

//         if (data.overview !== undefined) {
//             let aoa = [];
//             aoa.push(['Store Name:', data.overview.storeName]);
//             aoa.push(['Last updated:', pdw.parseTemporalFromEpochStr(data.overview.lastUpdated).toLocaleString()]);
//             aoa.push(['Element Type', 'Count Active', 'Count Deleted']);
//             if (data.defs !== undefined) aoa.push(['defs', data.overview.defs.current, data.overview.defs.deleted]);
//             if (data.pointDefs !== undefined) aoa.push(['pointDefs', data.overview.pointDefs.current, data.overview.pointDefs.deleted]);
//             if (data.entries !== undefined) aoa.push(['entries', data.overview.entries.current, data.overview.entries.deleted]);
//             if (data.entryPoints !== undefined) aoa.push(['entryPoints', data.overview.entryPoints.current, data.overview.entryPoints.deleted]);
//             if (data.tagDefs !== undefined) aoa.push(['tagDefs', data.overview.tagDefs.current, data.overview.tagDefs.deleted]);
//             if (data.tags !== undefined) aoa.push(['tags', data.overview.tags.current, data.overview.tags.deleted]);
//             let overviewSht = XLSX.utils.aoa_to_sheet(aoa);
//             XLSX.utils.book_append_sheet(wb, overviewSht, ExcelTabularImportExport.overViewShtName);
//         }

//         if (data.defs !== undefined && data.defs.length > 0) {
//             let defBaseArr = data.defs.map(def => ExcelTabularImportExport.makeExcelDefRow(def));
//             defBaseArr.unshift(tabularHeaders.def);

//             let defSht = XLSX.utils.aoa_to_sheet(defBaseArr);
//             XLSX.utils.book_append_sheet(wb, defSht, ExcelTabularImportExport.defShtName);
//         }

//         if (data.pointDefs !== undefined && data.pointDefs.length > 0) {
//             let pointDefArr = data.pointDefs.map(pd => ExcelTabularImportExport.makeExcelPointDefRow(pd));
//             pointDefArr.unshift(tabularHeaders.pointDef);

//             let pointDefSht = XLSX.utils.aoa_to_sheet(pointDefArr);
//             XLSX.utils.book_append_sheet(wb, pointDefSht, ExcelTabularImportExport.pointDefShtName);
//         }

//         if (data.entries !== undefined) {
//             let entryArr = data.entries.map(entry => ExcelTabularImportExport.makeExcelEntryRow(entry));
//             entryArr.unshift(tabularHeaders.entry);

//             let entryBaseSht = XLSX.utils.aoa_to_sheet(entryArr);
//             XLSX.utils.book_append_sheet(wb, entryBaseSht, ExcelTabularImportExport.entryShtName);
//         }

//         if (data.entryPoints !== undefined) {
//             let entryPointArr = data.entryPoints.map(entryPoint => ExcelTabularImportExport.makeExcelEntryPointRow(entryPoint));
//             entryPointArr.unshift(tabularHeaders.entryPoint);

//             let entryPointSht = XLSX.utils.aoa_to_sheet(entryPointArr);
//             XLSX.utils.book_append_sheet(wb, entryPointSht, ExcelTabularImportExport.entryPointShtName);
//         }

//         if (data.tagDefs !== undefined) {
//             let tagDefArr = data.tagDefs.map(tagDef => ExcelTabularImportExport.makeExcelTagDefRow(tagDef))
//             tagDefArr.unshift(tabularHeaders.tagDef);

//             let tagDefSht = XLSX.utils.aoa_to_sheet(tagDefArr);
//             XLSX.utils.book_append_sheet(wb, tagDefSht, ExcelTabularImportExport.tagDefShtName);
//         }

//         if (data.tags !== undefined) {
//             let tagArr = data.tags.map(tag => ExcelTabularImportExport.makeExcelTagRow(tag))
//             tagArr.unshift(tabularHeaders.tag);

//             let tagSht = XLSX.utils.aoa_to_sheet(tagArr);
//             XLSX.utils.book_append_sheet(wb, tagSht, ExcelTabularImportExport.tagShtName);
//         }

//         XLSX.writeFile(wb, filename);
//         */
//     }

// }

//#endregion


export class MarkdownTranslator implements Translator {
    async fromDataJournal(data: dj.DataJournal, filepath: string) {
        throw new Error("Method not implemented")
        // // data = pdw.PDW.flattenCompleteDataset(data); //remove circular references and stuff
        // let json = JSON.stringify(data);
        // fs.writeFileSync(filepath, json, 'utf8');
    }

    async toDataJournal(filepath: string): Promise<dj.DJ> {
        throw new Error("Method not implemented")
        // const file = JSON.parse(fs.readFileSync(filepath).toString());
        // const returnData: dj.DataJournal = {
        //     defs: file.defs,
        //     entries: file.entries
        // }
        // return dj.DJ.addOverview(returnData);
    }

    /**
    * Update the .md files, look for entries, for found entries update them with current values
    * //#THINK This a good idea? Maybe not.  
    */
    async updateInPlace(data: dj.DataJournal, filepath: string) {

        throw new Error("Method not implemented")
    }
}


//#region ### SHARED  ###
export const tabularHeaders = {
    def: ['_uid', '_created', '_updated', '_deleted', '_did', '_lbl', '_emoji', '_desc', '_scope', '_tags'],
    pointDef: ['def._uid', 'def._created', 'def._updated', 'def._deleted', 'def._did', '_pid', '_lbl', '_emoji', '_desc', '_type', '_rollup', '_opts'],
    entry: ['_uid', '_created', '_updated', '_deleted', '_did', '_eid', '_period', '_note', '_source']
}

export const combinedTabularHeaders = [
    '_uid',     //entry, tag, def
    '_created', //entry, tag, def
    '_updated', //entry, tag, def
    '_deleted', //entry, tag, def
    '_did',     //entry,    , def, pointDef
    '_lbl',     //     , tag, def, pointDef
    '_emoji',   //     ,    , def, pointDef
    '_desc',    //     ,    , def, pointDef
    '_scope',   //     ,    , def
    '_tags',   //     ,    , def
    '_pid',     //     ,    ,    , pointDef
    '_type',    //     ,    ,    , pointDef
    '_rollup',  //     ,    ,    , pointDef
    '_opts',    //     ,    ,    , pointDef
    '_eid',     //entry
    '_period',  //entry
    '_note',    //entry
    '_source',  //entry
    '_vals',    //entry
]

function inferFileType(path: string): "excel" | "json" | "csv" | "yaml" | "markdown" | "unknown" {
    if (path.slice(-5).toUpperCase() === ".XLSX") return 'excel'
    if (path.slice(-5).toUpperCase() === ".JSON") return 'json'
    if (path.slice(-4).toUpperCase() === ".CSV") return 'csv'
    if (path.slice(-4).toUpperCase() === ".MD") return 'markdown'
    if (path.slice(-5).toUpperCase() === ".YAML" || path.slice(-4).toUpperCase() === ".YML") return 'yaml'
    return "unknown"
}
//#endregion

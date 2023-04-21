import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as pdw from '../pdw.js';
import { Temporal } from 'temporal-polyfill';

//#region ### EXPORTED FUNCTIONS ###
export function exportToFile(filepath: string, data: pdw.CompleteDataset) {
    const fileType = inferFileType(filepath)
    if (fileType === 'excel') return ExcelTabularImportExport.exportToExcel(filepath, data);
    if (fileType === 'json') return JsonImportExport.exportToJson(filepath, data);
    throw new Error('Unimplemented export type: ' + fileType)
}

export function importFromFile(filepath: string) {
    const fileType = inferFileType(filepath)
    if (fileType === 'excel') return ExcelTabularImportExport.importFromExcel(filepath);
    if (fileType === 'json') return JsonImportExport.importFromJson(filepath);
    throw new Error('Unimplemented import type: ' + fileType)
}

//#endregion

/**
 * Static Utilities for Importing and Exporting to 
 * TABULAR Excel. These stack all types on one-another
 * and are **not** the "natural" way of working within Excel
 */
export class ExcelTabularImportExport {
    static overViewShtName = 'Overview';
    static defShtName = 'Defs';
    static pointDefShtName = 'Point Defs';
    static entryShtName = "Entry Base";
    static entryPointShtName = "Entry Points";
    static tagDefShtName = "Tag Defs";
    static tagShtName = "Tags"

    static exportToExcel(filename: string, data: pdw.CompleteDataset) {
        XLSX.set_fs(fs);
        const wb = XLSX.utils.book_new();

        //#TODO - overview sheet

        // let overviewSht = XLSX.utils.aoa_to_sheet([['to','do'],['over'],['view']]);
        // XLSX.utils.book_append_sheet(wb, overviewSht, overViewShtName);

        //###DEFS
        if (data.defs !== undefined && data.defs.length > 0) {
            let defBaseArr = data.defs.map(def => ExcelTabularImportExport.makeExcelDefRow(def));
            defBaseArr.unshift(tabularHeaders.def);

            let defSht = XLSX.utils.aoa_to_sheet(defBaseArr);
            XLSX.utils.book_append_sheet(wb, defSht, ExcelTabularImportExport.defShtName);
        }

        if (data.pointDefs !== undefined && data.pointDefs.length > 0) {
            let pointDefArr = data.pointDefs.map(pd => ExcelTabularImportExport.makeExcelPointDefRow(pd));
            pointDefArr.unshift(tabularHeaders.pointDef);

            let pointDefSht = XLSX.utils.aoa_to_sheet(pointDefArr);
            XLSX.utils.book_append_sheet(wb, pointDefSht, ExcelTabularImportExport.pointDefShtName);
        }

        let entryBaseSht = XLSX.utils.aoa_to_sheet([tabularHeaders.entry]);
        XLSX.utils.book_append_sheet(wb, entryBaseSht, ExcelTabularImportExport.entryShtName);

        let entryPointSht = XLSX.utils.aoa_to_sheet([tabularHeaders.entryPoint]);
        XLSX.utils.book_append_sheet(wb, entryPointSht, ExcelTabularImportExport.entryPointShtName);

        let tagDefSht = XLSX.utils.aoa_to_sheet([tabularHeaders.tagDef]);
        XLSX.utils.book_append_sheet(wb, tagDefSht, ExcelTabularImportExport.tagDefShtName);

        let tagSht = XLSX.utils.aoa_to_sheet([tabularHeaders.tag]);
        XLSX.utils.book_append_sheet(wb, tagSht, ExcelTabularImportExport.tagShtName);

        XLSX.writeFile(wb, filename);
    }

    static importFromExcel(filepath: string) {
        console.log('loading...');
        XLSX.set_fs(fs);
        let loadedWb = XLSX.readFile(filepath);
        const shts = loadedWb.SheetNames;
        if (!shts.some(name => name === ExcelTabularImportExport.defShtName)) {
            console.warn('No Defs sheet found in ' + filepath);
        } else {
            const defSht = loadedWb.Sheets[ExcelTabularImportExport.defShtName];
            let defBaseRawArr = XLSX.utils.sheet_to_json(defSht) as pdw.DefLike[];
            let parsedDefs = defBaseRawArr.map(rawDef => ExcelTabularImportExport.parseExcelDefRow(rawDef))
            pdw.PDW.getInstance().setDefs(parsedDefs);
        }

        if (!shts.some(name => name === ExcelTabularImportExport.pointDefShtName)) {
            console.warn('No Point Defs sheet found in ' + filepath);
        } else {
            const pointDefSht = loadedWb.Sheets[ExcelTabularImportExport.pointDefShtName];
            let pointDefRawArr = XLSX.utils.sheet_to_json(pointDefSht) as pdw.PointDefLike[];
            let parsedPointDefs = pointDefRawArr.map(rawPointDef => ExcelTabularImportExport.parseExcelPointDefRow(rawPointDef))
            pdw.PDW.getInstance().setPointDefs(parsedPointDefs);
        }
    }

    /**
     * Returns an array of the values of the def
     * in accordance with the positions of the
     * {@link tabularDefHeaders} positioning. 
     * Ying & Yang with {@link parseExcelDefRow}
     */
    static makeExcelDefRow(def: pdw.DefLike) {
        return [
            def._uid,
            def._created.toString(),
            def._updated,
            def._deleted ? "TRUE" : "FALSE",
            def._did,
            def._lbl,
            def._emoji,
            def._desc,
            def._scope.toString()
        ]
    }

    /**
     * Parses a row from Excel into a DefLike structure.
     * @param defRow row created by an Excel export 
     * Ying & Yang with {@link makeExcelDefRow}
     * @returns 
     */
    static parseExcelDefRow(defRow: any): pdw.DefLike {
        //check structure
        if (defRow._created == undefined
            || defRow._deleted == undefined
            || defRow._did == undefined)
            throw new Error('Cannot parseExcelDefRow for ', defRow);

        defRow._created = Temporal.PlainDateTime.from(defRow._created);
        defRow._deleted = defRow._deleted.toUpperCase() == 'TRUE';
        defRow._did = defRow._did.toString(); //in case I got unlucky with an all-numeric SmallID

        if (!pdw.Def.isDefLike(defRow)) throw new Error('Failed to correctly parseExcelDefRow for ', defRow);

        return defRow
    }

    /**
     * Returns an array of arrays with the values of the
     * def's points in accordance with the positions of the
     * {@link tabularPointDefHeaders} positioning
     */
    static makeExcelPointDefRow(pointDef: pdw.PointDefLike) {

        return [
            pointDef._uid,
            pointDef._created.toString(),
            pointDef._updated,
            pointDef._deleted,
            pointDef._did,
            pointDef._pid,
            pointDef._lbl,
            pointDef._emoji,
            pointDef._desc,
            pointDef._type,
            pointDef._rollup,
            pointDef._format
        ]
    }

    /**
     * Parses a row from Excel into a PointDefLike structure.
     * @param pointDefRow row created by an Excel export 
     * Ying & Yang with {@link makeExcelDefRow}
     * @returns 
     */
    static parseExcelPointDefRow(pointDefRow: any): pdw.PointDefLike {
        //check structure
        if (pointDefRow._created == undefined
            || pointDefRow._deleted == undefined
            || pointDefRow._did == undefined
            || pointDefRow._pid == undefined)
            throw new Error('Cannot parseExcelDefRow for ', pointDefRow);

        pointDefRow._created = Temporal.PlainDateTime.from(pointDefRow._created);
        if (typeof pointDefRow._deleted === 'boolean') {
            pointDefRow._deleted = pointDefRow._deleted;
        } else {
            pointDefRow._deleted = pointDefRow._deleted.toUpperCase() == 'TRUE';
        }
        pointDefRow._did = pointDefRow._did.toString(); //in case I got unlucky with an all-numeric SmallID
        pointDefRow._pid = pointDefRow._pid.toString(); //in case I got unlucky with an all-numeric SmallID

        if (!pdw.PointDef.isPointDefLike(pointDefRow)) throw new Error('Failed to correctly parseExcelDefRow for ', pointDefRow);

        return pointDefRow
    }

}

export class JsonImportExport {

    static exportToJson(filename: string, data: pdw.CompleteDataset) {
        let callback = () => {
            console.log('Wrote successfully?');
        }
        let json = JSON.stringify(data);
        fs.writeFile(filename, json, 'utf8', callback);
    }

    static importFromJson(filepath: string) {
        const file = JSON.parse(fs.readFileSync(filepath).toString());
        const pdwRef = pdw.PDW.getInstance();
        if (file.defs !== undefined) pdwRef.setDefs(file.defs);
        if (file.pointDefs !== undefined) pdwRef.setPointDefs(file.pointDefs);
    }

}

//#region ### SHARED  ###
export const tabularHeaders = {
    def: ['_uid', '_created', '_updated', '_deleted', '_did', '_lbl', '_emoji', '_desc', '_scope'],
    pointDef: ['_uid', '_created', '_updated', '_deleted', '_did', '_pid', '_lbl', '_emoji', '_desc', '_type', '_rollup', '_format'],
    entry: ['_uid', '_created', '_updated', '_deleted', '_did', '_eid', '_period', '_note'],
    entryPoint: ['_uid', '_created', '_updated', '_deleted', '_did', '_pid', '_eid', '_val'],
    tagDef: ['_uid', '_created', '_updated', '_deleted', '_tid', '_lbl', '_emoji', '_desc'],
    tag: ['_uid', '_created', '_updated', '_deleted', '_did', '_pid', 'tid']
}

function inferFileType(path: string): "excel" | "json" | "csv" | "yaml" | "unknown" {
    if (path.slice(-5) === ".xlsx") return 'excel'
    if (path.slice(-5) === ".json") return 'json'
    if (path.slice(-4) === ".csv") return 'csv'
    if (path.slice(-5) === ".yaml") return 'yaml'
    return "unknown"
}
//#endregion
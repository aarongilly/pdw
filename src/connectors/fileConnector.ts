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

        if (data.entries !== undefined) {
            let entryArr = data.entries.map(entry => ExcelTabularImportExport.makeExcelEntryRow(entry));
            entryArr.unshift(tabularHeaders.entry);

            let entryBaseSht = XLSX.utils.aoa_to_sheet(entryArr);
            XLSX.utils.book_append_sheet(wb, entryBaseSht, ExcelTabularImportExport.entryShtName);
        }

        if (data.entryPoints !== undefined) {
            let entryPointArr = data.entryPoints.map(entryPoint => ExcelTabularImportExport.makeExcelEntryPointRow(entryPoint));
            entryPointArr.unshift(tabularHeaders.entryPoint);

            let entryPointSht = XLSX.utils.aoa_to_sheet(entryPointArr);
            XLSX.utils.book_append_sheet(wb, entryPointSht, ExcelTabularImportExport.entryPointShtName);
        }

        if (data.tagDefs !== undefined) {
            let tagDefArr = data.tagDefs.map(tagDef => ExcelTabularImportExport.makeExcelTagDefRow(tagDef))
            tagDefArr.unshift(tabularHeaders.tagDef);

            let tagDefSht = XLSX.utils.aoa_to_sheet(tagDefArr);
            XLSX.utils.book_append_sheet(wb, tagDefSht, ExcelTabularImportExport.tagDefShtName);
        }

        if (data.tags !== undefined) {
            let tagArr = data.tags.map(tag => ExcelTabularImportExport.makeExcelTagRow(tag))
            tagArr.unshift(tabularHeaders.tag);

            let tagSht = XLSX.utils.aoa_to_sheet(tagArr);
            XLSX.utils.book_append_sheet(wb, tagSht, ExcelTabularImportExport.tagShtName);
        }

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

        if (!shts.some(name => name === ExcelTabularImportExport.entryShtName)) {
            console.warn('No Entry sheet found in ' + filepath);
        } else {
            const entrySht = loadedWb.Sheets[ExcelTabularImportExport.entryShtName];
            let entryRawArr = XLSX.utils.sheet_to_json(entrySht) as pdw.EntryLike[];
            let parsedEntries = entryRawArr.map(rawEntry => ExcelTabularImportExport.parseExcelEntryRow(rawEntry))
            pdw.PDW.getInstance().setEntries(parsedEntries);
        }

        if (!shts.some(name => name === ExcelTabularImportExport.entryPointShtName)) {
            console.warn('No Entry sheet found in ' + filepath);
        } else {
            const entrySht = loadedWb.Sheets[ExcelTabularImportExport.entryPointShtName];
            let entryPointRawArr = XLSX.utils.sheet_to_json(entrySht) as pdw.EntryPointLike[];
            let parsedEntryPoints = entryPointRawArr.map(rawEntryPoint => ExcelTabularImportExport.parseExcelEntryPointRow(rawEntryPoint))
            pdw.PDW.getInstance().setEntryPoints(parsedEntryPoints);
        }

        if (!shts.some(name => name === ExcelTabularImportExport.tagDefShtName)) {
            console.warn('No Entry sheet found in ' + filepath);
        } else {
            const entrySht = loadedWb.Sheets[ExcelTabularImportExport.tagDefShtName];
            let tagDefRawArr = XLSX.utils.sheet_to_json(entrySht) as pdw.TagDefLike[];
            let parsedTagDefs = tagDefRawArr.map(rawTagDef => ExcelTabularImportExport.parseExcelTagDefRow(rawTagDef))
            pdw.PDW.getInstance().setTagDefs(parsedTagDefs);
        }

        if (!shts.some(name => name === ExcelTabularImportExport.tagShtName)) {
            console.warn('No Entry sheet found in ' + filepath);
        } else {
            const entrySht = loadedWb.Sheets[ExcelTabularImportExport.tagShtName];
            let tagRawArr = XLSX.utils.sheet_to_json(entrySht) as pdw.TagLike[];
            let parsedTags = tagRawArr.map(rawTag => ExcelTabularImportExport.parseExcelTagRow(rawTag))
            pdw.PDW.getInstance().setTags(parsedTags);
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
        if (defRow._deleted == undefined
            || defRow._did == undefined)
            throw new Error('Cannot parseExcelDefRow for ', defRow);

        if (typeof defRow._deleted === 'boolean') {
            defRow._deleted = defRow._deleted;
        } else {
            defRow._deleted = defRow._deleted.toUpperCase() == 'TRUE';
        }
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
            pointDef._created,
            pointDef._updated,
            pointDef._deleted,
            pointDef._did,
            pointDef._pid,
            pointDef._lbl,
            pointDef._emoji,
            pointDef._desc,
            pointDef._type,
            pointDef._rollup,
        ]
    }


    static makeExcelEntryRow(entryData: pdw.EntryLike) {
        return [
            entryData._uid,
            entryData._created,
            entryData._updated,
            entryData._deleted,
            entryData._did,
            entryData._eid,
            entryData._period,
            entryData._note
        ]
    }

    static makeExcelEntryPointRow(entryPointData: pdw.EntryPointLike) {
        return [
            entryPointData._uid,
            entryPointData._created,
            entryPointData._updated,
            entryPointData._deleted,
            entryPointData._did,
            entryPointData._pid,
            entryPointData._eid,
            entryPointData._val.toString() //I think I want this
        ]
    }

    static makeExcelTagDefRow(tagDefData: pdw.TagDefLike) {
        return [
            tagDefData._uid,
            tagDefData._created,
            tagDefData._updated,
            tagDefData._deleted,
            tagDefData._tid,
            tagDefData._lbl
        ]
    }

    static makeExcelTagRow(tagData: pdw.TagLike) {
        return [
            tagData._uid,
            tagData._created,
            tagData._updated,
            tagData._deleted,
            tagData._did,
            tagData._pid,
            tagData._tid,
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

    static parseExcelEntryRow(entryRow: any): pdw.EntryLike {
        //check structure
        if (entryRow._deleted == undefined
            || entryRow._did == undefined)
            throw new Error('Cannot parseExcelEntryRow for ', entryRow);

        if (typeof entryRow._deleted === 'boolean') {
            entryRow._deleted = entryRow._deleted;
        } else {
            entryRow._deleted = entryRow._deleted.toUpperCase() == 'TRUE';
        }
        entryRow._did = entryRow._did.toString(); //in case I got unlucky with an all-numeric SmallID

        if (!pdw.Entry.isEntryLike(entryRow)) throw new Error('Failed to correctly parseExcelEntryRow for ', entryRow);

        return entryRow
    }

    static parseExcelEntryPointRow(entryPointRow: any): pdw.EntryPointLike {
        //check structure
        if (entryPointRow._deleted == undefined
            || entryPointRow._did == undefined
            || entryPointRow._pid == undefined)
            throw new Error('Cannot parseExcelEntryPointRow for ', entryPointRow);

        if (typeof entryPointRow._deleted === 'boolean') {
            entryPointRow._deleted = entryPointRow._deleted;
        } else {
            entryPointRow._deleted = entryPointRow._deleted.toUpperCase() == 'TRUE';
        }
        entryPointRow._did = entryPointRow._did.toString(); //in case I got unlucky with an all-numeric SmallID
        entryPointRow._did = entryPointRow._pid.toString(); //in case I got unlucky with an all-numeric SmallID

        if (!pdw.EntryPoint.isEntryPointLike(entryPointRow)) throw new Error('Failed to correctly parseExcelEntryPointRow for ', entryPointRow);

        return entryPointRow
    }

    static parseExcelTagDefRow(tagDefRow: any): pdw.TagDefLike {
        //check structure
        if (tagDefRow._deleted == undefined
            || tagDefRow._tid == undefined)
            throw new Error('Cannot parseExcelTagDefRow for ', tagDefRow);

        if (typeof tagDefRow._deleted === 'boolean') {
            tagDefRow._deleted = tagDefRow._deleted;
        } else {
            tagDefRow._deleted = tagDefRow._deleted.toUpperCase() == 'TRUE';
        }
        tagDefRow._did = tagDefRow._tid.toString(); //in case I got unlucky with an all-numeric SmallID

        if (!pdw.TagDef.isTagDefLike(tagDefRow)) throw new Error('Failed to correctly parseExcelTagDefRow for ', tagDefRow);

        return tagDefRow
    }

    static parseExcelTagRow(tagRow: any): pdw.TagLike {
        //check structure
        if (tagRow._deleted == undefined
            || tagRow._tid == undefined
            || tagRow._did == undefined)
            throw new Error('Cannot parseExcelTagRow for ', tagRow);

        if (typeof tagRow._deleted === 'boolean') {
            tagRow._deleted = tagRow._deleted;
        } else {
            tagRow._deleted = tagRow._deleted.toUpperCase() == 'TRUE';
        }
        tagRow._did = tagRow._tid.toString(); //in case I got unlucky with an all-numeric SmallID
        tagRow._did = tagRow._did.toString(); //in case I got unlucky with an all-numeric SmallID

        if (!pdw.Tag.isTagLike(tagRow)) throw new Error('Failed to correctly parseExcelTagRow for ', tagRow);

        return tagRow
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
        if (file.entries !== undefined) pdwRef.setEntries(file.entries);
        if (file.entryPoints !== undefined) pdwRef.setEntryPoints(file.entryPoints);
        if (file.tagDefs !== undefined) pdwRef.setTagDefs(file.tagDefs);
        if (file.tags !== undefined) pdwRef.setTags(file.tags);
    }

}

//#region ### SHARED  ###
export const tabularHeaders = {
    def: ['_uid', '_created', '_updated', '_deleted', '_did', '_lbl', '_emoji', '_desc', '_scope'],
    pointDef: ['_uid', '_created', '_updated', '_deleted', '_did', '_pid', '_lbl', '_emoji', '_desc', '_type', '_rollup'],
    entry: ['_uid', '_created', '_updated', '_deleted', '_did', '_eid', '_period', '_note'],
    entryPoint: ['_uid', '_created', '_updated', '_deleted', '_did', '_pid', '_eid', '_val'],
    tagDef: ['_uid', '_created', '_updated', '_deleted', '_tid', '_lbl'],
    tag: ['_uid', '_created', '_updated', '_deleted', '_did', '_pid', '_tid']
}

function inferFileType(path: string): "excel" | "json" | "csv" | "yaml" | "unknown" {
    if (path.slice(-5) === ".xlsx") return 'excel'
    if (path.slice(-5) === ".json") return 'json'
    if (path.slice(-4) === ".csv") return 'csv'
    if (path.slice(-5) === ".yaml") return 'yaml'
    return "unknown"
}
//#endregion
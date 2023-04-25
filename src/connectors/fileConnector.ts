import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as pdw from '../pdw.js';
import * as YAML from 'yaml';
import { Temporal } from 'temporal-polyfill';

//#region ### EXPORTED FUNCTIONS ###
export function exportToFile(filepath: string, data: pdw.CompleteDataset) {
    const fileType = inferFileType(filepath)
    if (fileType === 'excel') return new ExcelTabularImportExport().exportTo(data, filepath);
    if (fileType === 'json') return new JsonImportExport().exportTo(data, filepath);
    if (fileType === 'yaml') return new YamlImportExport().exportTo(data, filepath);
    throw new Error('Unimplemented export type: ' + fileType)
}

export function importFromFile(filepath: string) {
    const fileType = inferFileType(filepath)
    if (fileType === 'excel') return new ExcelTabularImportExport().importFrom(filepath);
    if (fileType === 'json') return new JsonImportExport().importFrom(filepath);
    if (fileType === 'yaml') return new YamlImportExport().importFrom(filepath);
    throw new Error('Unimplemented import type: ' + fileType)
}

//#endregion

/**
 * Static Utilities for Importing and Exporting to 
 * TABULAR Excel. These stack all types on one-another
 * and are **not** the "natural" way of working within Excel
 */
export class ExcelTabularImportExport implements pdw.AsyncDataStore {
    static overViewShtName = 'Overview';
    static defShtName = 'Defs';
    static pointDefShtName = 'Point Defs';
    static entryShtName = "Entry";
    static entryPointShtName = "Entry Points";
    static tagDefShtName = "Tag Defs";
    static tagShtName = "Tags"

    exportTo(data: pdw.CompleteDataset, filename: string) {
        XLSX.set_fs(fs);
        const wb = XLSX.utils.book_new();

        if (data.overview !== undefined) {
            let aoa = [];
            aoa.push(['Store Name:', data.overview.storeName]);
            aoa.push(['Last updated:', pdw.parseTemporalFromEpochStr(data.overview.lastUpdated).toLocaleString()]);
            aoa.push(['Element Type', 'Count Active', 'Count Deleted']);
            if (data.defs !== undefined) aoa.push(['defs', data.overview.defs.current, data.overview.defs.deleted]);
            if (data.pointDefs !== undefined) aoa.push(['pointDefs', data.overview.pointDefs.current, data.overview.pointDefs.deleted]);
            if (data.entries !== undefined) aoa.push(['entries', data.overview.entries.current, data.overview.entries.deleted]);
            if (data.entryPoints !== undefined) aoa.push(['entryPoints', data.overview.entryPoints.current, data.overview.entryPoints.deleted]);
            if (data.tagDefs !== undefined) aoa.push(['tagDefs', data.overview.tagDefs.current, data.overview.tagDefs.deleted]);
            if (data.tags !== undefined) aoa.push(['tags', data.overview.tags.current, data.overview.tags.deleted]);
            let overviewSht = XLSX.utils.aoa_to_sheet(aoa);
            XLSX.utils.book_append_sheet(wb, overviewSht, ExcelTabularImportExport.overViewShtName);
        }

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

    importFrom(filepath: string): pdw.CompleteDataset {
        console.log('loading...');
        let returnData: pdw.CompleteDataset = {}
        XLSX.set_fs(fs);
        let loadedWb = XLSX.readFile(filepath);
        const shts = loadedWb.SheetNames;
        const pdwRef = pdw.PDW.getInstance();
        if (!shts.some(name => name === ExcelTabularImportExport.defShtName)) {
            console.warn('No Defs sheet found in ' + filepath);
        } else {
            const defSht = loadedWb.Sheets[ExcelTabularImportExport.defShtName];
            let defBaseRawArr = XLSX.utils.sheet_to_json(defSht) as pdw.DefLike[];
            returnData.defs = defBaseRawArr.map(rawDef => ExcelTabularImportExport.parseExcelDefRow(rawDef))
            pdwRef.setDefs(returnData.defs);
        }

        if (!shts.some(name => name === ExcelTabularImportExport.pointDefShtName)) {
            console.warn('No Point Defs sheet found in ' + filepath);
        } else {
            const pointDefSht = loadedWb.Sheets[ExcelTabularImportExport.pointDefShtName];
            let pointDefRawArr = XLSX.utils.sheet_to_json(pointDefSht) as pdw.PointDefLike[];
            returnData.pointDefs = pointDefRawArr.map(rawPointDef => ExcelTabularImportExport.parseExcelPointDefRow(rawPointDef))
            pdwRef.setPointDefs(returnData.pointDefs);
        }

        if (!shts.some(name => name === ExcelTabularImportExport.entryShtName)) {
            console.warn('No Entry sheet found in ' + filepath);
        } else {
            const entrySht = loadedWb.Sheets[ExcelTabularImportExport.entryShtName];
            let entryRawArr = XLSX.utils.sheet_to_json(entrySht) as pdw.EntryLike[];
            returnData.entries = entryRawArr.map(rawEntry => ExcelTabularImportExport.parseExcelEntryRow(rawEntry))
            pdwRef.setEntries(returnData.entries);
        }

        if (!shts.some(name => name === ExcelTabularImportExport.entryPointShtName)) {
            console.warn('No Entry sheet found in ' + filepath);
        } else {
            const entrySht = loadedWb.Sheets[ExcelTabularImportExport.entryPointShtName];
            let entryPointRawArr = XLSX.utils.sheet_to_json(entrySht) as pdw.EntryPointLike[];
            returnData.entryPoints = entryPointRawArr.map(rawEntryPoint => ExcelTabularImportExport.parseExcelEntryPointRow(rawEntryPoint))
            pdwRef.setEntryPoints(returnData.entryPoints);
        }

        if (!shts.some(name => name === ExcelTabularImportExport.tagDefShtName)) {
            console.warn('No Entry sheet found in ' + filepath);
        } else {
            const entrySht = loadedWb.Sheets[ExcelTabularImportExport.tagDefShtName];
            let tagDefRawArr = XLSX.utils.sheet_to_json(entrySht) as pdw.TagDefLike[];
            returnData.tagDefs = tagDefRawArr.map(rawTagDef => ExcelTabularImportExport.parseExcelTagDefRow(rawTagDef))
            pdwRef.setTagDefs(returnData.tagDefs);
        }

        if (!shts.some(name => name === ExcelTabularImportExport.tagShtName)) {
            console.warn('No Entry sheet found in ' + filepath);
        } else {
            const entrySht = loadedWb.Sheets[ExcelTabularImportExport.tagShtName];
            let tagRawArr = XLSX.utils.sheet_to_json(entrySht) as pdw.TagLike[];
            returnData.tags = tagRawArr.map(rawTag => ExcelTabularImportExport.parseExcelTagRow(rawTag))
            pdwRef.setTags(returnData.tags);
        }

        returnData = pdw.PDW.addOverviewToCompleteDataset(returnData, filepath);

        return returnData;
    }

    /**
     * Returns an array of the values of the def
     * in accordance with the positions of the
     * {@link tabularDefHeaders} positioning. 
     * Ying & Yang with {@link parseExcelDefRow}
     */
    static makeExcelDefRow(def: pdw.DefLike) {
        return [
            ...ExcelTabularImportExport.makeExcelFirstFourColumns(def),
            def._did,
            def._lbl,
            def._emoji,
            def._desc,
            def._scope.toString()
        ]
    }

    /**
     * Returns an array of arrays with the values of the
     * def's points in accordance with the positions of the
     * {@link tabularPointDefHeaders} positioning
     */
    static makeExcelPointDefRow(pointDef: pdw.PointDefLike) {
        return [
            ...ExcelTabularImportExport.makeExcelFirstFourColumns(pointDef),
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
            ...ExcelTabularImportExport.makeExcelFirstFourColumns(entryData),
            entryData._did,
            entryData._eid,
            entryData._period,
            entryData._note
        ]
    }

    static makeExcelEntryPointRow(entryPointData: pdw.EntryPointLike) {
        return [
            ...ExcelTabularImportExport.makeExcelFirstFourColumns(entryPointData),
            entryPointData._did,
            entryPointData._pid,
            entryPointData._eid,
            entryPointData._val.toString() //I think I want this
        ]
    }

    static makeExcelTagDefRow(tagDefData: pdw.TagDefLike) {
        return [
            ...ExcelTabularImportExport.makeExcelFirstFourColumns(tagDefData),
            tagDefData._tid,
            tagDefData._lbl
        ]
    }

    static makeExcelTagRow(tagData: pdw.TagLike) {
        return [
            ...ExcelTabularImportExport.makeExcelFirstFourColumns(tagData),
            tagData._did,
            tagData._pid,
            tagData._tid,
        ]
    }

    static makeExcelFirstFourColumns(elementData: pdw.ElementLike) {
        return [
            elementData._uid,
            //#TODO - try fixing the parser and going back to this
            // pdw.parseTemporalFromEpochStr(elementData._created).toPlainDateTime().toLocaleString(),
            // pdw.parseTemporalFromEpochStr(elementData._updated).toPlainDateTime().toLocaleString(),
            elementData._created,
            elementData._updated,
            elementData._deleted ? "TRUE" : "FALSE",
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

        defRow = ExcelTabularImportExport.parseExcelFirstFourColumns(defRow);

        defRow._did = defRow._did.toString(); //in case I got unlucky with an all-numeric SmallID

        if (!pdw.Def.isDefLike(defRow)) throw new Error('Failed to correctly parseExcelDefRow for ', defRow);

        return defRow
    }

    static parseExcelFirstFourColumns(elementRowData: any): any {
        if (typeof elementRowData._deleted === 'boolean') {
            elementRowData._deleted = elementRowData._deleted;
        } else {
            elementRowData._deleted = elementRowData._deleted.toUpperCase() == 'TRUE';
        }

        //#TODO - try the Excel natural date thing again
        // elementRowData._created = ExcelTabularImportExport.makeEpochStrFromExcelDate(elementRowData._created)
        // elementRowData._updated = ExcelTabularImportExport.makeEpochStrFromExcelDate(elementRowData._updated)
    }

    /**
     * Here's where I'm tryign to handle some variability in dates
     * @param _updated value in a date cell
     */
    static makeEpochStrFromExcelDate(dateCellVal: any): any {
        if (typeof dateCellVal === 'string') {
            try {
                pdw.parseTemporalFromEpochStr(dateCellVal);
                return dateCellVal
            } catch (e) {
                try {
                    let temp = Temporal.ZonedDateTime.from(dateCellVal);
                    return pdw.makeEpochStrFromTemporal(temp);
                } catch (etwo) {
                    console.error('Failed to make this into an EpochStr:', dateCellVal);
                    throw new Error('Could not parse Excel date');
                }
            }
        }
        if (typeof dateCellVal === 'number') {
            return Temporal.Instant.fromEpochMilliseconds((dateCellVal - (25567 + 1)) * 86400 * 1000).toZonedDateTimeISO(Temporal.Now.timeZone());
        }
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

        pointDefRow = ExcelTabularImportExport.parseExcelFirstFourColumns(pointDefRow);

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

        entryRow = ExcelTabularImportExport.parseExcelFirstFourColumns(entryRow);

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

        entryPointRow = ExcelTabularImportExport.parseExcelFirstFourColumns(entryPointRow);

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

        tagDefRow = ExcelTabularImportExport.parseExcelFirstFourColumns(tagDefRow);

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

        tagRow = ExcelTabularImportExport.parseExcelFirstFourColumns(tagRow);

        tagRow._did = tagRow._tid.toString(); //in case I got unlucky with an all-numeric SmallID
        tagRow._did = tagRow._did.toString(); //in case I got unlucky with an all-numeric SmallID

        if (!pdw.Tag.isTagLike(tagRow)) throw new Error('Failed to correctly parseExcelTagRow for ', tagRow);

        return tagRow
    }

}

export class JsonImportExport implements pdw.AsyncDataStore {

    exportTo(data: pdw.CompleteDataset, filepath: string) {
        let json = JSON.stringify(data);
        fs.writeFile(filepath, json, 'utf8', () => { });
    }

    importFrom(filepath: string): pdw.CompleteDataset {
        const file = JSON.parse(fs.readFileSync(filepath).toString());
        const returnData: pdw.CompleteDataset = {
            defs: file.defs,
            pointDefs: file.pointDefs,
            entries: file.entries,
            entryPoints: file.entryPoints,
            tagDefs: file.tagDefs,
            tags: file.tags
        }
        const pdwRef = pdw.PDW.getInstance();
        if (returnData.defs !== undefined) pdwRef.setDefs(returnData.defs);
        if (returnData.pointDefs !== undefined) pdwRef.setPointDefs(returnData.pointDefs);
        if (returnData.entries !== undefined) pdwRef.setEntries(returnData.entries);
        if (returnData.entryPoints !== undefined) pdwRef.setEntryPoints(returnData.entryPoints);
        if (returnData.tagDefs !== undefined) pdwRef.setTagDefs(returnData.tagDefs);
        if (returnData.tags !== undefined) pdwRef.setTags(returnData.tags);

        returnData.overview = {
            storeName: filepath,
            defs: {
                current: returnData.defs?.filter(element => element._deleted === false).length,
                deleted: returnData.defs?.filter(element => element._deleted).length
            },
            pointDefs: {
                current: returnData.pointDefs?.filter(element => element._deleted === false).length,
                deleted: returnData.pointDefs?.filter(element => element._deleted).length
            },
            entries: {
                current: returnData.entries?.filter(element => element._deleted === false).length,
                deleted: returnData.entries?.filter(element => element._deleted).length
            },
            entryPoints: {
                current: returnData.entryPoints?.filter(element => element._deleted === false).length,
                deleted: returnData.entryPoints?.filter(element => element._deleted).length
            },
            tagDefs: {
                current: returnData.tagDefs?.filter(element => element._deleted === false).length,
                deleted: returnData.tagDefs?.filter(element => element._deleted).length
            },
            tags: {
                current: returnData.tags?.filter(element => element._deleted === false).length,
                deleted: returnData.tags?.filter(element => element._deleted).length
            },
            lastUpdated: pdw.PDW.getDatasetLastUpdate(returnData)
        }

        return returnData;
    }
}

/**
 * This was crazy easy.
 */
export class YamlImportExport implements pdw.AsyncDataStore {

    exportTo(data: pdw.CompleteDataset, filepath: string) {
        //crazy simple implementation
        const yaml = YAML.stringify(data);
        fs.writeFile(filepath, yaml, 'utf8', () => { });
    }

    importFrom(filepath: string): pdw.CompleteDataset {
        const file = YAML.parse(fs.readFileSync(filepath).toString());
        const returnData: pdw.CompleteDataset = {
            defs: file.defs,
            pointDefs: file.pointDefs,
            entries: file.entries,
            entryPoints: file.entryPoints,
            tagDefs: file.tagDefs,
            tags: file.tags
        }
        const pdwRef = pdw.PDW.getInstance();
        if (returnData.defs !== undefined) pdwRef.setDefs(returnData.defs);
        if (returnData.pointDefs !== undefined) pdwRef.setPointDefs(returnData.pointDefs);
        if (returnData.entries !== undefined) pdwRef.setEntries(returnData.entries);
        if (returnData.entryPoints !== undefined) pdwRef.setEntryPoints(returnData.entryPoints);
        if (returnData.tagDefs !== undefined) pdwRef.setTagDefs(returnData.tagDefs);
        if (returnData.tags !== undefined) pdwRef.setTags(returnData.tags);

        returnData.overview = {
            storeName: filepath,
            defs: {
                current: returnData.defs?.filter(element => element._deleted === false).length,
                deleted: returnData.defs?.filter(element => element._deleted).length
            },
            pointDefs: {
                current: returnData.pointDefs?.filter(element => element._deleted === false).length,
                deleted: returnData.pointDefs?.filter(element => element._deleted).length
            },
            entries: {
                current: returnData.entries?.filter(element => element._deleted === false).length,
                deleted: returnData.entries?.filter(element => element._deleted).length
            },
            entryPoints: {
                current: returnData.entryPoints?.filter(element => element._deleted === false).length,
                deleted: returnData.entryPoints?.filter(element => element._deleted).length
            },
            tagDefs: {
                current: returnData.tagDefs?.filter(element => element._deleted === false).length,
                deleted: returnData.tagDefs?.filter(element => element._deleted).length
            },
            tags: {
                current: returnData.tags?.filter(element => element._deleted === false).length,
                deleted: returnData.tags?.filter(element => element._deleted).length
            },
            lastUpdated: pdw.PDW.getDatasetLastUpdate(returnData)
        }

        return returnData;
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
    if (path.slice(-5).toUpperCase() === ".XLSX") return 'excel'
    if (path.slice(-5).toUpperCase() === ".JSON") return 'json'
    if (path.slice(-4).toUpperCase() === ".CSV") return 'csv'
    if (path.slice(-5).toUpperCase() === ".YAML" || path.slice(-4).toUpperCase() === ".YML") return 'yaml'
    return "unknown"
}
//#endregion
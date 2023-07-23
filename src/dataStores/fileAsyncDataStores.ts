import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as pdw from '../pdw.js';
import * as YAML from 'yaml';
import { Temporal } from 'temporal-polyfill';

//#region ### EXPORTED FUNCTIONS ###
export function exportToFile(filepath: string, data: pdw.CompleteDataset) {
    const fileType = inferFileType(filepath)
    if (fileType === 'excel') return new AsyncExcelTabular().exportTo(data, filepath);
    if (fileType === 'json') return new AsyncJson().exportTo(data, filepath);
    if (fileType === 'yaml') return new AsyncYaml().exportTo(data, filepath);
    if (fileType === 'csv') return new AsyncCSV().exportTo(data, filepath);
    throw new Error('Unimplemented export type: ' + fileType)
}

export function importFromFile(filepath: string) {
    const fileType = inferFileType(filepath)
    if (fileType === 'excel') return new AsyncExcelTabular().importFrom(filepath);
    if (fileType === 'json') return new AsyncJson().importFrom(filepath);
    if (fileType === 'yaml') return new AsyncYaml().importFrom(filepath);
    if (fileType === 'csv') return new AsyncCSV().importFrom(filepath);
    throw new Error('Unimplemented import type: ' + fileType)
}

export function altTempImport(filepath: string) {
    const fileType = inferFileType(filepath);
    if (fileType !== 'yaml') throw new Error('only YAML is supported right now');
    return new AsyncNestedYaml().importFrom(filepath);
}

export function altTempExport(data: pdw.CompleteDataset, filepath: string) {
    return new AsyncNestedYaml().exportTo(data, filepath);
}

//#endregion

export class AsyncCSV implements pdw.AsyncDataStore {
    importFrom(filepath: string): pdw.CompleteDataset {
        console.log('loading...');
        let returnData: pdw.CompleteDataset = {}
        XLSX.set_fs(fs);
        let loadedWb = XLSX.readFile(filepath);
        const shts = loadedWb.SheetNames;
        const pdwRef = pdw.PDW.getInstance();
        const sht = loadedWb.Sheets[shts[0]];
        let elements = XLSX.utils.sheet_to_json(sht) as pdw.DefLike[];

        let defs: any = [];
        let pointDefs: any = [];
        let entries: any = [];
        let entryPoints: any = [];
        let tagDefs: any = [];
        let tags: any = [];

        elements.forEach((element: any) => {
            if (element['Row Type'] === 'Def') defs.push(buildElement(element));
            if (element['Row Type'] === 'PointDef') pointDefs.push(buildElement(element));
            if (element['Row Type'] === 'Entry') entries.push(buildElement(element));
            if (element['Row Type'] === 'EntryPoint') entryPoints.push(buildElement(element));
            if (element['Row Type'] === 'TagDef') tagDefs.push(buildElement(element));
            if (element['Row Type'] === 'Tag') tags.push(buildElement(element));
        })

        pdwRef.setDefs((<pdw.DefLike[]>defs))
        pdwRef.setEntries((<pdw.EntryLike[]>entries))
        pdwRef.setTags((<pdw.TagLike[]>tags))

        return {
            defs: defs,
            entries: entries,
            tagDefs: tagDefs,
            tags: tags
        }

        function buildElement(elementData: any) {
            let returnObj: any = {
                _uid: elementData._uid,
                _created: elementData._created,
                _updated: elementData._updated,
            };
            if (typeof elementData._deleted === 'boolean') {
                returnObj._deleted = elementData._deleted
            } else {
                returnObj._deleted = elementData._deleted === 'TRUE' ? true : false
            }
            if (elementData._did !== undefined) returnObj._did = elementData._did;
            if (elementData._pid !== undefined) returnObj._pid = elementData._pid;
            if (elementData._eid !== undefined) returnObj._eid = elementData._eid;
            if (elementData._tid !== undefined) returnObj._tid = elementData._tid;
            if (elementData._lbl !== undefined) returnObj._lbl = elementData._lbl;
            if (elementData._emoji !== undefined) returnObj._emoji = elementData._emoji;
            if (elementData._desc !== undefined) returnObj._desc = elementData._desc;
            if (elementData._scope !== undefined) returnObj._scope = elementData._scope;
            if (elementData._type !== undefined) returnObj._type = elementData._type;
            if (elementData._rollup !== undefined) returnObj._rollup = elementData._rollup;
            if (elementData._period !== undefined) returnObj._period = parsePeriod(elementData._period);
            if (elementData._note !== undefined) returnObj._note = elementData._note;
            if (elementData._source !== undefined) returnObj._source = elementData._source;
            if (elementData._val !== undefined) returnObj._val = elementData._val;

            return returnObj;
        }

        function parsePeriod(period: any): string {
            if (typeof period === 'string') return period
            if (typeof period === 'number') {
                period = Math.round(period * 10000) / 10000
                try {
                    return Temporal.Instant.fromEpochMilliseconds((period - (25567 + 1)) * 86400 * 1000).toZonedDateTimeISO(Temporal.Now.timeZone()).toPlainDate().toString();
                } catch (e) {
                    console.log('shit');

                }
            }
            throw new Error('Unhandled period val...')
        }
    }

    exportTo(allData: pdw.CompleteDataset, filename: string) {
        XLSX.set_fs(fs);
        const wb = XLSX.utils.book_new();
        const data: string[][] = []
        data.push(['Row Type', ...pdw.canonicalHeaders])

        if (allData.defs !== undefined) allData.defs.forEach(def => data.push(makeRowFromElement(def)))
        if (allData.pointDefs !== undefined) allData.pointDefs.forEach(element => data.push(makeRowFromElement(element)))
        if (allData.entries !== undefined) allData.entries.forEach(element => data.push(makeRowFromElement(element)))
        if (allData.entryPoints !== undefined) allData.entryPoints.forEach(element => data.push(makeRowFromElement(element)))
        if (allData.tagDefs !== undefined) allData.tagDefs.forEach(element => data.push(makeRowFromElement(element)))
        if (allData.tags !== undefined) allData.tags.forEach(element => data.push(makeRowFromElement(element)))

        let exportSht = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, exportSht, 'PDW Export');

        XLSX.writeFile(wb, filename);

        return

        function makeRowFromElement(data: any) {//pdw.Def | pdw.Entry | pdw.Tag | pdw.TagDef | pdw.PointDef | pdw.EntryPoint): string[]{
            return [
                pdw.getElementType(data).slice(0, -4),
                data._uid,
                data._created,
                data._updated,
                data._deleted.toString().toUpperCase(),
                data._did === undefined ? '' : data._did!,
                data._pid === undefined ? '' : data._pid!,
                data._eid === undefined ? '' : data._eid!,
                data._tid === undefined ? '' : data._tid!,
                data._lbl === undefined ? '' : data._lbl!,
                data._emoji === undefined ? '' : data._emoji!,
                data._desc === undefined ? '' : data._desc,
                data._scope === undefined ? '' : data._scope!,
                data._type === undefined ? '' : data._type!,
                data._rollup === undefined ? '' : data._rollup!,
                data._period === undefined ? '' : data._period.toString()!,
                data._note === undefined ? '' : data._note!,
                data._source === undefined ? '' : data._source!,
                data._val === undefined ? '' : data._val.toString()!,
            ]
        }
    }

}

/**
 * Static Utilities for Importing and Exporting to 
 * TABULAR Excel. These stack all types on one-another
 * and are **not** the "natural" way of working within Excel
 */
export class AsyncExcelTabular implements pdw.AsyncDataStore {
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
            XLSX.utils.book_append_sheet(wb, overviewSht, AsyncExcelTabular.overViewShtName);
        }

        if (data.defs !== undefined && data.defs.length > 0) {
            let defBaseArr = data.defs.map(def => AsyncExcelTabular.makeExcelDefRow(def));
            defBaseArr.unshift(tabularHeaders.def);

            let defSht = XLSX.utils.aoa_to_sheet(defBaseArr);
            XLSX.utils.book_append_sheet(wb, defSht, AsyncExcelTabular.defShtName);
        }

        if (data.pointDefs !== undefined && data.pointDefs.length > 0) {
            let pointDefArr = data.pointDefs.map(pd => AsyncExcelTabular.makeExcelPointDefRow(pd));
            pointDefArr.unshift(tabularHeaders.pointDef);

            let pointDefSht = XLSX.utils.aoa_to_sheet(pointDefArr);
            XLSX.utils.book_append_sheet(wb, pointDefSht, AsyncExcelTabular.pointDefShtName);
        }

        if (data.entries !== undefined) {
            let entryArr = data.entries.map(entry => AsyncExcelTabular.makeExcelEntryRow(entry));
            entryArr.unshift(tabularHeaders.entry);

            let entryBaseSht = XLSX.utils.aoa_to_sheet(entryArr);
            XLSX.utils.book_append_sheet(wb, entryBaseSht, AsyncExcelTabular.entryShtName);
        }

        if (data.entryPoints !== undefined) {
            let entryPointArr = data.entryPoints.map(entryPoint => AsyncExcelTabular.makeExcelEntryPointRow(entryPoint));
            entryPointArr.unshift(tabularHeaders.entryPoint);

            let entryPointSht = XLSX.utils.aoa_to_sheet(entryPointArr);
            XLSX.utils.book_append_sheet(wb, entryPointSht, AsyncExcelTabular.entryPointShtName);
        }

        if (data.tagDefs !== undefined) {
            let tagDefArr = data.tagDefs.map(tagDef => AsyncExcelTabular.makeExcelTagDefRow(tagDef))
            tagDefArr.unshift(tabularHeaders.tagDef);

            let tagDefSht = XLSX.utils.aoa_to_sheet(tagDefArr);
            XLSX.utils.book_append_sheet(wb, tagDefSht, AsyncExcelTabular.tagDefShtName);
        }

        if (data.tags !== undefined) {
            let tagArr = data.tags.map(tag => AsyncExcelTabular.makeExcelTagRow(tag))
            tagArr.unshift(tabularHeaders.tag);

            let tagSht = XLSX.utils.aoa_to_sheet(tagArr);
            XLSX.utils.book_append_sheet(wb, tagSht, AsyncExcelTabular.tagShtName);
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
        if (!shts.some(name => name === AsyncExcelTabular.defShtName)) {
            console.warn('No Defs sheet found in ' + filepath);
        } else {
            const defSht = loadedWb.Sheets[AsyncExcelTabular.defShtName];
            let defBaseRawArr = XLSX.utils.sheet_to_json(defSht) as pdw.DefLike[];
            returnData.defs = defBaseRawArr.map(rawDef => AsyncExcelTabular.parseExcelDefRow(rawDef))
            pdwRef.setDefs(returnData.defs);
        }

        if (!shts.some(name => name === AsyncExcelTabular.pointDefShtName)) {
            console.warn('No Point Defs sheet found in ' + filepath);
        } else {
            const pointDefSht = loadedWb.Sheets[AsyncExcelTabular.pointDefShtName];
            let pointDefRawArr = XLSX.utils.sheet_to_json(pointDefSht) as pdw.PointDefLike[];
            returnData.pointDefs = pointDefRawArr.map(rawPointDef => AsyncExcelTabular.parseExcelPointDefRow(rawPointDef))
            pdwRef.setPointDefs(returnData.pointDefs);
        }

        if (!shts.some(name => name === AsyncExcelTabular.entryShtName)) {
            console.warn('No Entry sheet found in ' + filepath);
        } else {
            const entrySht = loadedWb.Sheets[AsyncExcelTabular.entryShtName];
            let entryRawArr = XLSX.utils.sheet_to_json(entrySht) as pdw.EntryLike[];
            returnData.entries = entryRawArr.map(rawEntry => AsyncExcelTabular.parseExcelEntryRow(rawEntry))
            pdwRef.setEntries(returnData.entries);
        }

        if (!shts.some(name => name === AsyncExcelTabular.entryPointShtName)) {
            console.warn('No Entry sheet found in ' + filepath);
        } else {
            const entrySht = loadedWb.Sheets[AsyncExcelTabular.entryPointShtName];
            let entryPointRawArr = XLSX.utils.sheet_to_json(entrySht) as pdw.EntryPointLike[];
            returnData.entryPoints = entryPointRawArr.map(rawEntryPoint => AsyncExcelTabular.parseExcelEntryPointRow(rawEntryPoint))
            pdwRef.setEntryPoints(returnData.entryPoints);

        }

        if (!shts.some(name => name === AsyncExcelTabular.tagDefShtName)) {
            console.warn('No Entry sheet found in ' + filepath);
        } else {
            const entrySht = loadedWb.Sheets[AsyncExcelTabular.tagDefShtName];
            let tagDefRawArr = XLSX.utils.sheet_to_json(entrySht) as pdw.TagDefLike[];
            returnData.tagDefs = tagDefRawArr.map(rawTagDef => AsyncExcelTabular.parseExcelTagDefRow(rawTagDef))
            pdwRef.setTagDefs(returnData.tagDefs);
        }

        if (!shts.some(name => name === AsyncExcelTabular.tagShtName)) {
            console.warn('No Entry sheet found in ' + filepath);
        } else {
            const entrySht = loadedWb.Sheets[AsyncExcelTabular.tagShtName];
            let tagRawArr = XLSX.utils.sheet_to_json(entrySht) as pdw.TagLike[];
            returnData.tags = tagRawArr.map(rawTag => AsyncExcelTabular.parseExcelTagRow(rawTag))
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
            ...AsyncExcelTabular.makeExcelFirstFourColumns(def),
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
            ...AsyncExcelTabular.makeExcelFirstFourColumns(pointDef),
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
            ...AsyncExcelTabular.makeExcelFirstFourColumns(entryData),
            entryData._did,
            entryData._eid,
            entryData._period,
            entryData._note,
            entryData._source
        ]
    }

    static makeExcelEntryPointRow(entryPointData: pdw.EntryPointLike) {
        return [
            ...AsyncExcelTabular.makeExcelFirstFourColumns(entryPointData),
            entryPointData._did,
            entryPointData._pid,
            entryPointData._eid,
            entryPointData._val.toString() //I think I want this
        ]
    }

    static makeExcelTagDefRow(tagDefData: pdw.TagDefLike) {
        return [
            ...AsyncExcelTabular.makeExcelFirstFourColumns(tagDefData),
            tagDefData._tid,
            tagDefData._lbl
        ]
    }

    static makeExcelTagRow(tagData: pdw.TagLike) {
        return [
            ...AsyncExcelTabular.makeExcelFirstFourColumns(tagData),
            tagData._did,
            tagData._pid,
            tagData._tid,
        ]
    }

    static makeExcelFirstFourColumns(elementData: pdw.ElementLike) {
        return [
            elementData._uid,
            pdw.parseTemporalFromEpochStr(elementData._created).toPlainDateTime().toLocaleString(),
            pdw.parseTemporalFromEpochStr(elementData._updated).toPlainDateTime().toLocaleString(),
            // elementData._created,
            // elementData._updated,
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

        defRow = AsyncExcelTabular.parseExcelFirstFourColumns(defRow);

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

        elementRowData._created = AsyncExcelTabular.makeEpochStrFromExcelDate(elementRowData._created)
        elementRowData._updated = AsyncExcelTabular.makeEpochStrFromExcelDate(elementRowData._updated)

        return elementRowData;
    }

    /**
     * Here's where I'm tryign to handle some variability in dates.
     * Some of this functionality is baked-into pdw.Element's constructor now,
     * but not THIS interpretation of number-types, so I'm just keeping all of it
     * @param _updated value in a date cell
     */
    static makeEpochStrFromExcelDate(dateCellVal: any): any {
        if (typeof dateCellVal === 'string') {
            try {
                pdw.parseTemporalFromEpochStr(dateCellVal);
                return dateCellVal
            } catch (e) {
                try {
                    let temp = Temporal.Instant.fromEpochMilliseconds(new Date(dateCellVal).getTime()).toZonedDateTimeISO(Temporal.Now.timeZone());
                    return pdw.makeEpochStrFromTemporal(temp);
                } catch (etwo) {
                    console.error('Failed to make this into an EpochStr:', dateCellVal);
                    throw new Error('Could not parse Excel date');
                }
            }
        }
        if (typeof dateCellVal === 'number') {
            return pdw.makeEpochStrFromTemporal(Temporal.Instant.fromEpochMilliseconds((dateCellVal - (25567 + 1)) * 86400 * 1000).toZonedDateTimeISO(Temporal.Now.timeZone()));
        }
    }

    /**
     * Parses a row from Excel into a PointDefLike structure.
     * @param pointDefRow row created by an Excel export 
     * Yin & Yang with {@link makeExcelDefRow}
     * @returns 
     */
    static parseExcelPointDefRow(pointDefRow: any): pdw.PointDefLike {
        //check structure
        if (pointDefRow._created == undefined
            || pointDefRow._deleted == undefined
            || pointDefRow._did == undefined
            || pointDefRow._pid == undefined)
            throw new Error('Cannot parseExcelDefRow for ', pointDefRow);

        pointDefRow = AsyncExcelTabular.parseExcelFirstFourColumns(pointDefRow);

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

        entryRow = AsyncExcelTabular.parseExcelFirstFourColumns(entryRow);

        entryRow._did = entryRow._did.toString(); //in case I got unlucky with an all-numeric SmallID
        if (entryRow._note === undefined) entryRow._note = '';
        if (entryRow._source === undefined) entryRow._source = 'Excel Import Circa ' + pdw.makeEpochStr();


        if (!pdw.Entry.isEntryLike(entryRow)) throw new Error('Failed to correctly parseExcelEntryRow for ', entryRow);

        return entryRow
    }

    static parseExcelEntryPointRow(entryPointRow: any): pdw.EntryPointLike {
        //check structure
        if (entryPointRow._deleted == undefined
            || entryPointRow._did == undefined
            || entryPointRow._pid == undefined)
            throw new Error('Cannot parseExcelEntryPointRow for ', entryPointRow);

        entryPointRow = AsyncExcelTabular.parseExcelFirstFourColumns(entryPointRow);

        entryPointRow._did = entryPointRow._did.toString(); //in case I got unlucky with an all-numeric SmallID
        entryPointRow._pid = entryPointRow._pid.toString(); //in case I got unlucky with an all-numeric SmallID

        if (!pdw.EntryPoint.isEntryPointLike(entryPointRow)) throw new Error('Failed to correctly parseExcelEntryPointRow for ', entryPointRow);

        return entryPointRow
    }

    static parseExcelTagDefRow(tagDefRow: any): pdw.TagDefLike {
        //check structure
        if (tagDefRow._deleted == undefined
            || tagDefRow._tid == undefined)
            throw new Error('Cannot parseExcelTagDefRow for ', tagDefRow);

        tagDefRow = AsyncExcelTabular.parseExcelFirstFourColumns(tagDefRow);

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

        tagRow = AsyncExcelTabular.parseExcelFirstFourColumns(tagRow);

        tagRow._did = tagRow._tid.toString(); //in case I got unlucky with an all-numeric SmallID
        tagRow._did = tagRow._did.toString(); //in case I got unlucky with an all-numeric SmallID

        if (!pdw.Tag.isTagLike(tagRow)) throw new Error('Failed to correctly parseExcelTagRow for ', tagRow);

        return tagRow
    }

}

export class AsyncJson implements pdw.AsyncDataStore {

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
 * I made it harder just to prove that I could simultaneusly read
 * & write from different datafiles with different source formats.
 * json -> dates stored as EpochStr
 * yaml -> dates stored as ISO Strings (native YAML dates)
 * excel -> dates stored as Local Strings AND native Excel dates! 
 */
export class AsyncYaml implements pdw.AsyncDataStore {

    exportTo(data: pdw.CompleteDataset, filepath: string) {
        //crazy simple implementation
        data = this.translateToYamlFormat(data);
        const yaml = YAML.stringify(data);
        fs.writeFile(filepath, yaml, 'utf8', () => { });
    }

    importFrom(filepath: string): pdw.CompleteDataset {
        const file = YAML.parse(fs.readFileSync(filepath).toString());
        let returnData: pdw.CompleteDataset = {
            defs: file.defs,
            entries: file.entries,
            tags: file.tags
        }
        this.translateFromYamlFormat(returnData);
        const pdwRef = pdw.PDW.getInstance();
        if (returnData.defs !== undefined) pdwRef.setDefs(returnData.defs);
        if (returnData.entries !== undefined) pdwRef.setEntries(returnData.entries);
        if (returnData.tags !== undefined) pdwRef.setTags(returnData.tags);

        returnData = pdw.PDW.addOverviewToCompleteDataset(returnData, filepath);

        return returnData;
    }

    translateFromYamlFormat(data: pdw.CompleteDataset) {
        if (data.overview !== undefined) {
            let temporal = this.makeEpochStrFromISO(data.overview.lastUpdated);
            data.overview.lastUpdated = temporal.toString().split('[')[0]
        }
        if (data.defs !== undefined) {
            data.defs = data.defs.map(def => this.translateElementFromYaml(def)) as unknown as pdw.DefLike[];
        }
        if (data.entries !== undefined) {
            data.entries = data.entries.map(element => this.translateElementFromYaml(element)) as unknown as pdw.EntryLike[];
        }
        if (data.tags !== undefined) {
            data.tags = data.tags.map(element => this.translateElementFromYaml(element)) as unknown as pdw.TagLike[];
        }
        return data;
    }

    translateElementFromYaml(element: pdw.ElementLike): pdw.ElementLike {
        let returnObj: pdw.ElementLike = {
            _uid: element.uid,
            _created: this.makeEpochStrFromISO(element.cre),
            _updated: this.makeEpochStrFromISO(element.upd),
            _deleted: element.del,
        }
        if (element.dsc !== undefined) returnObj._desc = element.dsc
        if (element.did !== undefined) returnObj._did = element.did
        if (element.eid !== undefined) returnObj._eid = element.eid
        if (element.pid !== undefined) returnObj._pid = element.pid
        if (element.lbl !== undefined) returnObj._lbl = element.lbl
        if (element.tid !== undefined) returnObj._tid = element.tid
        if (element.emo !== undefined) returnObj._emoji = element.emo
        if (element.scp !== undefined) returnObj._scope = element.scp
        if (element.typ !== undefined) returnObj._type = element.typ
        if (element.rlp !== undefined) returnObj._rollup = element.rlp
        if (element.per !== undefined) returnObj._period = element.per
        if (element.nte !== undefined) returnObj._note = element.nte
        if (element.dids !== undefined) returnObj._dids = element.dids
        if (element.pts !== undefined) returnObj._pts = element.pts.map((pt: any) => translatePointDefFromYaml(pt))
        if (element.ep !== undefined) {        
            Object.keys(element.ep).forEach(key => {
                returnObj[key] = element.ep[key];
            })
        }


        function translatePointDefFromYaml(pd: any): any {
            let returnObj: any = {};
            if (pd.dsc !== undefined) returnObj._desc = pd.dsc
            if (pd.pid !== undefined) returnObj._pid = pd.pid
            if (pd.lbl !== undefined) returnObj._lbl = pd.lbl
            if (pd.emo !== undefined) returnObj._emoji = pd.emo
            if (pd.typ !== undefined) returnObj._type = pd.typ;
            if (pd.rlp !== undefined) returnObj._rollup = pd.rlp
            if (pd.act !== undefined) returnObj._active = pd.act
            if (pd.opts !== undefined) returnObj._opts = pd.opts
            return returnObj;
        }

        return returnObj
    }

    makeEpochStrFromISO(ISOString: string): pdw.EpochStr {
        let temp = Temporal.Instant.fromEpochMilliseconds(new Date(ISOString).getTime()).toZonedDateTimeISO(Temporal.Now.timeZone());
        return pdw.makeEpochStrFromTemporal(temp);
    }

    translateToYamlFormat(data: pdw.CompleteDataset) {
        if (data.overview !== undefined) {
            let temporal = pdw.parseTemporalFromEpochStr(data.overview.lastUpdated);
            data.overview.lastUpdated = temporal.toString().split('[')[0]
        }
        if (data.defs !== undefined) {
            data.defs = data.defs.map(def => this.translateElementToYaml(def)) as unknown as pdw.DefLike[];
        }
        if (data.entries !== undefined) {
            data.entries = data.entries.map(entry => this.translateElementToYaml(entry)) as unknown as pdw.EntryLike[];
        }
        if (data.tags !== undefined) {
            data.tags = data.tags.map(tag => this.translateElementToYaml(tag)) as unknown as pdw.TagLike[];
        }
        return data;
    }

    /**
     * Translates any kind of Element into a Yaml-approved format.
     * @param element tag, def, or entry
     * @returns an object with Yaml-expeted formatting
     */
    translateElementToYaml(element: any): any {
        if (element._tempCreated !== undefined) delete element._tempCreated
        if (element._tempUpdated !== undefined) delete element._tempUpdated
        let returnObj: any = {
            uid: element._uid,
            cre: pdw.parseTemporalFromEpochStr(element._created).toString().split('[')[0],
            upd: pdw.parseTemporalFromEpochStr(element._updated).toString().split('[')[0],
            del: element._deleted,
        }
        if (element._desc !== undefined) returnObj.dsc = element._desc
        if (element._did !== undefined) returnObj.did = element._did
        if (element._pid !== undefined) returnObj.pid = element._pid
        if (element._lbl !== undefined) returnObj.lbl = element._lbl
        if (element._emoji !== undefined) returnObj.emo = element._emoji
        if (element._scope !== undefined) returnObj.scp = element._scope
        if (element._pts !== undefined) returnObj.pts = element._pts.map((pt: any) => translatePointDefToYaml(pt));
        if (element._eid !== undefined) returnObj.eid = element._eid
        if (element._period !== undefined) returnObj.per = element._period
        if (element._source !== undefined) returnObj.src = element._source
        if (element._note !== undefined) returnObj.nte = element._note
        if (element._tid !== undefined) returnObj.tid = element._tid;
        if (element._dids !== undefined) returnObj.dids = element._dids;

        let entryPoints: any = Object.keys(element).filter(key => key.substring(0, 1) !== '_')
        if (entryPoints.length > 0) {
            returnObj.ep = {};
            entryPoints.forEach((key: any) => {
                returnObj.ep[key] = element[key];
            })
        }

        return returnObj

        function translatePointDefToYaml(pd: pdw.PointDefLike): any {
            if (pd.__def !== undefined) delete pd.__def
            let returnObj: any = {};
            if (pd._desc !== undefined) returnObj.dsc = pd._desc
            if (pd._pid !== undefined) returnObj.pid = pd._pid
            if (pd._lbl !== undefined) returnObj.lbl = pd._lbl
            if (pd._emoji !== undefined) returnObj.emo = pd._emoji
            if (pd._type !== undefined) returnObj.typ = pd._type;
            if (pd._rollup !== undefined) returnObj.rlp = pd._rollup
            if (pd._active !== undefined) returnObj.act = pd._active
            if (pd._opts !== undefined) returnObj.opts = pd._opts
            return returnObj;
        }
    }
}

/**
 * Trying a compactified version
 */
export class AsyncNestedYaml implements pdw.AsyncDataStore {
    exportTo(data: pdw.CompleteDataset, filepath: string) {
        if (data.defs === undefined ||
            data.entries === undefined ||
            data.entryPoints === undefined ||
            data.pointDefs === undefined ||
            data.tagDefs === undefined ||
            data.tags === undefined) {
            throw new Error("Data supplied must have an arrays for defs, pointDefs, tags, tagDefs, entries, and entryPoints'");
        }

        let activeByDef: any = {};
        let deleted: pdw.ElementLike[] = [];

        data.defs.forEach((def: any) => {
            if (def._deleted) {
                deleted.push(def);
                return;
            }
            let defMember: any = {};
            if (def._did === undefined) throw new Error("Def data didn't have a _did");
            //deleted ... assume nothing is deleted?
            if (def._created !== undefined) defMember.cre = pdw.parseTemporalFromEpochStr(def._created).toString().split('[')[0];
            if (def._updated !== undefined) defMember.upd = pdw.parseTemporalFromEpochStr(def._updated).toString().split('[')[0];
            if (def._uid !== undefined) defMember.uid = def._uid;
            if (def._desc !== undefined) defMember.dsc = def._desc;
            if (def._lbl !== undefined) defMember.lbl = def._lbl;
            if (def._scope !== undefined) defMember.scp = def._scope;
            if (def._emoji !== undefined) defMember.emo = def._emoji;
            //make room for PointDefs
            defMember.points = {};
            //make room for Entries
            defMember.entries = [];
            //make room for Tags & TagDefs
            defMember.tags = {};
            //add to outer object;
            activeByDef[def._did] = defMember;
        })

        data.pointDefs.forEach(pd => {
            if (pd._deleted) {
                deleted.push(pd);
                return;
            }
            if (pd._did === undefined) throw new Error("pointDef has no _did, yo");
            let assDef = activeByDef[pd._did];
            if (assDef === undefined) throw new Error('Could not find Def associated with PointDef with _did = ' + pd._did);

            let pdMember: any = {};

            // if (pd._created !== undefined) pdMember.cre = pd._created; //not in nested form
            // if (pd._updated !== undefined) pdMember.upd = pd._updated;
            if (pd._uid !== undefined) pdMember.uid = pd._uid;
            if (pd._desc !== undefined) pdMember.dsc = pd._desc;
            if (pd._lbl !== undefined) pdMember.lbl = pd._lbl;
            if (pd._type !== undefined) pdMember.typ = pd._type;
            if (pd._rollup !== undefined) pdMember.rlp = pd._rollup;
            if (pd._emoji !== undefined) pdMember.emo = pd._emoji;
            //for selects and multiselects, make enumeration "opts" key
            if (pd._type === pdw.PointType.SELECT || pd._type === pdw.PointType.MULTISELECT) pdMember.opts = {};

            assDef.points[pd._pid] = pdMember;
        })

        data.entries.forEach(entry => {
            if (entry._deleted) {
                deleted.push(entry);
                return;
            }
            if (entry._did === undefined) throw new Error("entry has no _did, yo");
            let assDef = activeByDef[entry._did];
            if (assDef === undefined) throw new Error('Could not find Def associated with Entry with _did = ' + entry._did);

            let entMember: any = {};

            if (entry._created !== undefined) entMember.cre = pdw.parseTemporalFromEpochStr(entry._created).toString().split('[')[0];
            if (entry._updated !== undefined) entMember.upd = pdw.parseTemporalFromEpochStr(entry._updated).toString().split('[')[0];
            if (entry._uid !== undefined) entMember.uid = entry._uid;
            if (entry._eid !== undefined) entMember.eid = entry._eid;
            if (entry._period !== undefined) entMember.per = entry._period;
            if (entry._note !== undefined) entMember.nte = entry._note;
            //make room for PointDefs
            entMember.points = {};
            assDef.entries.push(entMember);
        })

        data.entryPoints.forEach(ep => {
            if (ep._deleted) {
                deleted.push(ep);
                return;
            }
            if (ep._did === undefined) throw new Error("entryPoint has no _did, yo");
            if (ep._eid === undefined) throw new Error("entryPoint has no _eid, yo");
            let assDef = activeByDef[ep._did];
            if (assDef === undefined) throw new Error('Could not find Def associated with EntryPoint with _did = ' + ep._did);
            let assEntry = assDef.entries.find((ent: any) => ent.eid == ep._eid)
            if (assEntry === undefined) throw new Error("Couldn't find an Entry for the EntryPoint with _eid = " + ep._eid);

            assEntry[ep._pid] = ep._val;
        })

        data.tags.forEach(tag => {
            if (tag._deleted) {
                deleted.push(tag);
                return;
            }
            if (tag._did === undefined) throw new Error("tag has no _did, yo");
            let assDef = activeByDef[tag._did];
            if (assDef === undefined) throw new Error('Could not find Def associated with Tag with _did = ' + tag._did);
            let assPointDef = data.tagDefs?.find(tagDef => tagDef._tid === tag._tid && tagDef._deleted === false);
            if (assPointDef === undefined) throw new Error("Couldn't find associated TagDef for tag with _tid " + tag._tid);

            let tagMember: any = {};
            if (tag._created !== undefined) tagMember.cre = pdw.parseTemporalFromEpochStr(tag._created).toString().split('[')[0];
            if (tag._updated !== undefined) tagMember.upd = pdw.parseTemporalFromEpochStr(tag._updated).toString().split('[')[0];
            if (tag._uid !== undefined) tagMember.uid = tag._uid;
            if (tag._lbl !== undefined) tagMember.lbl = tag._lbl;

            assDef.tags[tag._tid] = tagMember;
        })

        let yamlObj: any = { active: activeByDef, deleted: deleted }
        const yaml = YAML.stringify(yamlObj);
        fs.writeFile(filepath, yaml, 'utf8', () => { });

    }

    importFrom(filepath: string): pdw.CompleteDataset {
        const file = YAML.parse(fs.readFileSync(filepath).toString());
        let returnData: pdw.CompleteDataset = {
            defs: [],
            pointDefs: [],
            entries: [],
            entryPoints: [],
            tagDefs: [],
            tags: []
        }
        this.translateFromNestedYamlFormat(file);
        const pdwRef = pdw.PDW.getInstance();
        if (returnData.defs !== undefined) pdwRef.setDefs(returnData.defs);
        if (returnData.pointDefs !== undefined) pdwRef.setPointDefs(returnData.pointDefs);
        if (returnData.entries !== undefined) pdwRef.setEntries(returnData.entries);
        if (returnData.entryPoints !== undefined) pdwRef.setEntryPoints(returnData.entryPoints);
        if (returnData.tagDefs !== undefined) pdwRef.setTagDefs(returnData.tagDefs);
        if (returnData.tags !== undefined) pdwRef.setTags(returnData.tags);

        returnData = pdw.PDW.addOverviewToCompleteDataset(returnData, filepath);

        return returnData;
    }

    translateFromNestedYamlFormat(data: any) {
        if (data.defs === undefined) throw new Error('Expect to have a top-level "defs" key');
        data.defs.forEach((def: any) => {
            console.log(def);
            const defData: pdw.MinimumDef = {}
            if (def.did === undefined) throw new Error('no did found');
            defData._did = def.did;

        })
        return data;
    }

    translateElementFromYaml(element: pdw.ElementLike): pdw.ElementLike {
        let returnObj: pdw.ElementLike = {
            _uid: element.uid,
            _created: this.makeEpochStrFromISO(element.cre),
            _updated: this.makeEpochStrFromISO(element.upd),
            _deleted: element.del,
        }
        if (element.dsc !== undefined) returnObj._desc = element.dsc
        if (element.did !== undefined) returnObj._did = element.did
        if (element.eid !== undefined) returnObj._eid = element.eid
        if (element.pid !== undefined) returnObj._pid = element.pid
        if (element.lbl !== undefined) returnObj._lbl = element.lbl
        if (element.tid !== undefined) returnObj._tid = element.tid
        if (element.emo !== undefined) returnObj._emoji = element.emo
        if (element.scp !== undefined) returnObj._scope = element.scp
        if (element.typ !== undefined) returnObj._type = element.typ
        if (element.rlp !== undefined) returnObj._rollup = element.rlp
        if (element.per !== undefined) returnObj._period = element.per
        if (element.nte !== undefined) returnObj._note = element.nte
        if (element.val !== undefined) returnObj._val = element.val
        return returnObj
    }

    makeEpochStrFromISO(ISOString: string): pdw.EpochStr {
        let temp = Temporal.Instant.fromEpochMilliseconds(new Date(ISOString).getTime()).toZonedDateTimeISO(Temporal.Now.timeZone());
        return pdw.makeEpochStrFromTemporal(temp);
    }

    translateToYamlFormat(data: pdw.CompleteDataset) {
        if (data.overview !== undefined) {
            let temporal = pdw.parseTemporalFromEpochStr(data.overview.lastUpdated);
            data.overview.lastUpdated = temporal.toString().split('[')[0]
        }
        if (data.defs !== undefined) {
            data.defs = data.defs.map(def => this.translateElementToYaml(def)) as unknown as pdw.DefLike[];
        }
        if (data.pointDefs !== undefined) {
            data.pointDefs = data.pointDefs.map(element => this.translateElementToYaml(element)) as unknown as pdw.PointDefLike[];
        }
        if (data.entries !== undefined) {
            data.entries = data.entries.map(element => this.translateElementToYaml(element)) as unknown as pdw.EntryLike[];
        }
        if (data.entryPoints !== undefined) {
            data.entryPoints = data.entryPoints.map(element => this.translateElementToYaml(element)) as unknown as pdw.EntryPointLike[];
        }
        if (data.tagDefs !== undefined) {
            data.tagDefs = data.tagDefs.map(element => this.translateElementToYaml(element)) as unknown as pdw.TagDefLike[];
        }
        if (data.tags !== undefined) {
            data.tags = data.tags.map(element => this.translateElementToYaml(element)) as unknown as pdw.TagLike[];
        }
        return data;
    }

    translateElementToYaml(element: any): any {
        if (element._tempCreated !== undefined) delete element._tempCreated
        if (element._tempUpdated !== undefined) delete element._tempUpdated
        let returnObj: any = {
            uid: element._uid,
            cre: pdw.parseTemporalFromEpochStr(element._created).toString().split('[')[0],
            upd: pdw.parseTemporalFromEpochStr(element._updated).toString().split('[')[0],
            del: element._deleted,
        }
        if (element._desc !== undefined) returnObj.dsc = element._desc
        if (element._did !== undefined) returnObj.did = element._did
        if (element._eid !== undefined) returnObj.eid = element._eid
        if (element._pid !== undefined) returnObj.pid = element._pid
        if (element._lbl !== undefined) returnObj.lbl = element._lbl
        if (element._tid !== undefined) returnObj.tid = element._tid
        if (element._emoji !== undefined) returnObj.emo = element._emoji
        if (element._scope !== undefined) returnObj.scp = element._scope
        if (element._type !== undefined) returnObj.typ = element._type
        if (element._rollup !== undefined) returnObj.rlp = element._rollup
        if (element._period !== undefined) returnObj.per = element._period
        if (element._note !== undefined) returnObj.nte = element._note
        if (element._val !== undefined) returnObj.val = element._val
        return returnObj
    }
}


/**
 * Let's party.
 */
export class AsyncExcelNatural implements pdw.AsyncDataStore {
    static entryShtName = 'Entries';
    static elementsShtName = 'Elements';

    importFrom(filepath: string): pdw.CompleteDataset {
        console.log('loading...');
        let returnData: pdw.CompleteDataset = {}
        XLSX.set_fs(fs);
        let loadedWb = XLSX.readFile(filepath, { dense: true });
        const shts = loadedWb.SheetNames;
        const pdwRef = pdw.PDW.getInstance();
        if (!shts.some(name => name === AsyncExcelNatural.elementsShtName)) {
            console.warn('No Defs sheet found in ' + filepath);
        } else {
            const defSht = loadedWb.Sheets[AsyncExcelNatural.elementsShtName];
            let defBaseRawArr = XLSX.utils.sheet_to_json(defSht, { header: 1 }) as pdw.DefLike[];
            returnData.defs = defBaseRawArr.map(rawDef => AsyncExcelNatural.parseExcelDefRow(rawDef))
            pdwRef.setDefs(returnData.defs);
        }

        if (!shts.some(name => name === AsyncExcelNatural.entryShtName)) {
            console.warn('No Entry sheet found in ' + filepath);
        } else {
            const entrySht = loadedWb.Sheets[AsyncExcelNatural.entryShtName];
            let entryRawArr = XLSX.utils.sheet_to_json(entrySht, { header: 1 }) as any[][];
            let entriesAndEntryPoints: { entries: pdw.EntryLike[], entryPoints: pdw.EntryPointLike[] } = {
                entries: [],
                entryPoints: [],
            }
            entriesAndEntryPoints = this.parseEntrySht(entryRawArr);
            pdwRef.setEntries(entriesAndEntryPoints.entries);
            pdwRef.setEntryPoints(entriesAndEntryPoints.entryPoints);
            // returnData.entryPoints = this.convertEntryShtToEntryPoints(entryRawArr, columns);
            // pdwRef.setEntryPoints(returnData.entryPoints);
        }

        returnData = pdw.PDW.addOverviewToCompleteDataset(returnData, filepath);

        return returnData;
    }

    private parseEntrySht(rawRows: any[][]): { entries: pdw.EntryLike[], entryPoints: pdw.EntryPointLike[] } {
        let returnData: { entries: pdw.EntryLike[], entryPoints: pdw.EntryPointLike[] } = {
            entries: [],
            entryPoints: []
        }
        // if(entryRawArr[0].length !== columns.length - 1) throw new Error('Schema sheet should have exactly one more column than the Entries sheet')
        return returnData
    }

    static parseExcelDefRow(rawDef: pdw.DefLike): pdw.DefLike {
        let parsedDef: pdw.MinimumDef = {
            _lbl: rawDef._lbl
        }
        //#TODO - handle checks & variability
        parsedDef._did = rawDef._did === undefined ? pdw.makeSmallID() : rawDef._did;
        parsedDef._created = rawDef._created === undefined ? pdw.makeEpochStr() : AsyncExcelTabular.makeEpochStrFromExcelDate(rawDef._created);
        parsedDef._updated = rawDef._updated === undefined ? pdw.makeEpochStr() : AsyncExcelTabular.makeEpochStrFromExcelDate(rawDef._updated);
        parsedDef._deleted = rawDef._deleted === undefined ? false : rawDef._deleted.toString().toUpperCase() === 'TRUE';
        parsedDef._emoji = rawDef._emoji === undefined ? '🆕' : rawDef._emoji;
        parsedDef._desc = rawDef._desc === undefined ? '' : rawDef._desc;
        parsedDef._scope = rawDef._scope === undefined ? pdw.Scope.SECOND : rawDef._scope;
        parsedDef._uid = rawDef._uid === undefined ? pdw.makeUID() : rawDef._uid;

        return parsedDef as pdw.DefLike
    }

    exportTo(data: pdw.CompleteDataset, filename: string) {
        throw new Error('Method not implemented.');

        /*
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
        */
    }

}

//#region ### SHARED  ###
export const tabularHeaders = {
    def: ['_uid', '_created', '_updated', '_deleted', '_did', '_lbl', '_emoji', '_desc', '_scope'],
    pointDef: ['_uid', '_created', '_updated', '_deleted', '_did', '_pid', '_lbl', '_emoji', '_desc', '_type', '_rollup'],
    entry: ['_uid', '_created', '_updated', '_deleted', '_did', '_eid', '_period', '_note', '_source'],
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
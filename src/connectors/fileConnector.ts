import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as pdw from '../pdw.js';
import { Temporal } from 'temporal-polyfill';
// import { Temporal } from 'temporal-polyfill';

//#region ### EXPORTED FUNCTIONS ###
//#THINK - can/should you make this into a DataStore?

export function exportToFile(filepath: string, data: pdw.CompleteDataset) {
    const fileType = inferFileType(filepath)
    if (fileType === 'excel') return exportToExcel(filepath, data);
    if (fileType === 'json') return exportToJson(filepath, data);
    throw new Error('Unimplementd write type: ' + fileType)
}

export function importFromFile(filepath: string) {
    const fileType = inferFileType(filepath)
    if (fileType === 'excel') return importFromExcel(filepath);
    if (fileType === 'json') return importFromJson(filepath);
    throw new Error('Unimplementd write type: ' + fileType)
}

//#endregion

//#region ### EXCEL -- TABULAR ### //#TODO - Excel 'Natural'

const overViewShtName = 'Overview';
const defShtName = 'Defs';
const pointDefShtName = 'Point Defs';
const entryShtName = "Entry Base";
const entryPointShtName = "Entry Points";
const tagDefShtName = "Tag Defs";
const tagShtName = "Tags"

function exportToExcel(filename: string, data: pdw.CompleteDataset) {
    XLSX.set_fs(fs);
    const wb = XLSX.utils.book_new();

    //#TODO - overview sheet
    
    // let overviewSht = XLSX.utils.aoa_to_sheet([['to','do'],['over'],['view']]);
    // XLSX.utils.book_append_sheet(wb, overviewSht, overViewShtName);

    //###DEFS
    if (data.defs !== undefined && data.defs.length > 0) {
        let defBaseArr = data.defs.map(def => makeExcelDefRow(def));
        defBaseArr.unshift(tabularDefHeaders);

        let defSht = XLSX.utils.aoa_to_sheet(defBaseArr);
        XLSX.utils.book_append_sheet(wb, defSht, defShtName);
    }
    
    if (data.pointDefs !== undefined && data.pointDefs.length > 0) {
        let pointDefArr = data.pointDefs.map(pd => makeExcelPointDefRow(pd));
        pointDefArr.unshift(tabularPointDefHeaders);

        let pointDefSht = XLSX.utils.aoa_to_sheet(pointDefArr);
        XLSX.utils.book_append_sheet(wb, pointDefSht, pointDefShtName);
    }

    let entryBaseSht = XLSX.utils.aoa_to_sheet([tabularEntryHeaders]);
    XLSX.utils.book_append_sheet(wb, entryBaseSht, entryShtName);

    let entryPointSht = XLSX.utils.aoa_to_sheet([tabularEntryPointHeaders]);
    XLSX.utils.book_append_sheet(wb, entryPointSht, entryPointShtName);

    let tagDefSht = XLSX.utils.aoa_to_sheet([tabularTagDefHeaders]);
    XLSX.utils.book_append_sheet(wb, tagDefSht, tagDefShtName);

    let tagSht = XLSX.utils.aoa_to_sheet([tabularTagHeaders]);
    XLSX.utils.book_append_sheet(wb, tagSht, tagShtName);

    XLSX.writeFile(wb, filename);
}

function importFromExcel(filepath: string) {
    console.log('loading...');
    XLSX.set_fs(fs);
    let loadedWb = XLSX.readFile(filepath);
    const shts = loadedWb.SheetNames;
    if (!shts.some(name => name === defShtName)) {
        console.warn('No Defs sheet found in ' + filepath);
    } else {
        const defSht = loadedWb.Sheets[defShtName];
        let defBaseRawArr = XLSX.utils.sheet_to_json(defSht) as pdw.DefLike[];
        let parsedDefs = defBaseRawArr.map(rawDef=>parseExcelDefRow(rawDef))
        pdw.PDW.getInstance().setDefs(parsedDefs);
    }

    if (!shts.some(name => name === pointDefShtName)) {
        console.warn('No Point Defs sheet found in ' + filepath);
    } else {
        const pointDefSht = loadedWb.Sheets[pointDefShtName];
        let pointDefRawArr = XLSX.utils.sheet_to_json(pointDefSht) as pdw.PointDefLike[];
        let parsedPointDefs = pointDefRawArr.map(rawPointDef=>parseExcelPointDefRow(rawPointDef))
        pdw.PDW.getInstance().setPointDefs(parsedPointDefs);
    }
}

/**
 * Returns an array of the values of the def
 * in accordance with the positions of the
 * {@link tabularDefHeaders} positioning. 
 * Ying & Yang with {@link parseExcelDefRow}
 */
function makeExcelDefRow(def: pdw.DefLike) {
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
function parseExcelDefRow(defRow: any): pdw.DefLike {
    //check structure
    if(!pdw.hasDefLikeProps(defRow)) throw new Error('Cannot parseExcelDefRow for ', defRow);

    defRow._created = Temporal.PlainDateTime.from(defRow._created);
    defRow._deleted = defRow._deleted.toUpperCase() == 'TRUE',
    defRow._did = defRow._did.toString(); //in case I got unlucky with an all-numeric SmallID
 
    if(!pdw.isDefLike(defRow)) throw new Error('Failed to correctly parseExcelDefRow for ', defRow);

    return defRow
}

/**
 * Returns an array of arrays with the values of the
 * def's points in accordance with the positions of the
 * {@link tabularPointDefHeaders} positioning
 */
function makeExcelPointDefRow(pointDef: pdw.PointDefLike) {

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

//#endregion

//#region ### JSON ###

function exportToJson(filename: string, data: pdw.CompleteDataset) {
    let callback = () => {
        console.log('Wrote successfully?');
    }
    let json = JSON.stringify(data);
    fs.writeFile(filename, json, 'utf8', callback);
}

function importFromJson(filepath: string) {
    const file = JSON.parse(fs.readFileSync(filepath).toString());
    console.log(file, pdw.PDW.getInstance()); //#TODO
}

//#endregion

//#region ### SHARED CONSTANTS ###
export const tabularDefHeaders = ['_uid', '_created', '_updated', '_deleted', '_did', '_lbl', '_emoji', '_desc', '_scope'];
export const tabularPointDefHeaders = ['_uid', '_created', '_updated', '_deleted', '_did', '_pid', '_lbl', '_emoji', '_desc', '_type', '_rollup', '_format'];
export const tabularEntryHeaders = ['_uid', '_created', '_updated', '_deleted', '_did', '_eid', '_period', '_note'];
export const tabularEntryPointHeaders = ['_uid', '_created', '_updated', '_deleted', '_did', '_pid', '_eid', '_val'];
export const tabularTagDefHeaders = ['_uid', '_created', '_updated', '_deleted', '_tid', '_lbl', '_emoji', '_desc'];
export const tabularTagHeaders = ['_uid', '_created', '_updated', '_deleted', '_did', '_pid', 'tid'];

//#region ### HELPERS ###
function inferFileType(path: string): "excel" | "json" | "csv" | "yaml" | "unknown" {
    if (path.slice(-5) === ".xlsx") return 'excel'
    if (path.slice(-5) === ".json") return 'json'
    if (path.slice(-4) === ".csv") return 'csv'
    if (path.slice(-5) === ".yaml") return 'yaml'
    return "unknown"
}

// function mergeElements(newElements: pdw.ElementLike[]) {
//     newElements.forEach(newElement => {
//         mergeElement(newElement)
//     })
// }

// function mergeElement(newElementData: pdw.ElementLike) {
//     const type = pdw.getElementType(newElementData);
//     if (type === 'DefLike') {
//         let existingDef = this.defs.find(def => def._did == (<pdw.DefLike>newElementData)._did && def._deleted === false)
//         if (existingDef === undefined) {
//             this.defs.push(new pdw.Def((<pdw.DefLike>newElementData)));
//             return
//         }
//         if (existingDef.shouldBeReplacedWith(newElementData)) {
//             existingDef.markDeleted();
//             this.defs.push(new pdw.Def((<pdw.DefLike>newElementData)));
//         }
//         return
//     }

//     if (type === 'PointDefLike') {
//         let existingPointDef = this.pointDefs.find(pd => pd._did == (<pdw.PointDefLike>newElementData)._did && pd._pid == (<pdw.PointDefLike>newElementData)._pid && pd._deleted === false)
//         if (existingPointDef === undefined) {
//             this.pointDefs.push(new pdw.PointDef((<pdw.PointDefLike>newElementData)));
//             return
//         }
//         if (existingPointDef.shouldBeReplacedWith(newElementData)) {
//             existingPointDef.markDeleted();
//             this.pointDefs.push(new pdw.PointDef((<pdw.PointDefLike>newElementData)));
//         }
//         return
//     }
//     throw new Error('I saw type ' + type)
//     return undefined
// }

/**
 * Converts a map of strings into a map of properly-typed values, 
 * based on the observed key.
 * @param obj object containing properties to convert
*/
// function destringifyElement(obj: pdw.DefLike | pdw.PointDefLike | pdw.EntryLike | pdw.TagDefLike): any {
//     let returnObj = { ...obj }; //shallow copy deemed okay by Aaron circa 2023-03-12, get mad at him
//     if (returnObj._created !== undefined) {
//         //TODO - check for and handle native Excel dates
//         returnObj._created = Temporal.PlainDateTime.from(returnObj._created);
//     }
//     if (returnObj._updated !== undefined) returnObj._updated = pdw.makeEpochStr();
//     if (returnObj._deleted !== undefined) returnObj._deleted = returnObj._deleted.toString().toUpperCase() === 'TRUE';
//     if (returnObj.hasOwnProperty('_scope')) {
//         (<pdw.DefLike>returnObj)._scope = (<pdw.DefLike>returnObj)._scope.toString().toUpperCase() as pdw.Scope;
//     }

//     //...others?
//     return returnObj
// }




//#endregion
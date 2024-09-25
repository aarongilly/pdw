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

        const aliasedDJ = AliasKeyer.applyAliases(data,YamlTranslator.aliasKeys);
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
        const returnDJ = AliasKeyer.unapplyAliases(translated,YamlTranslator.aliasKeys);
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

export class CsvTranslator implements Translator {
    //#TODO - all of this.
    getServiceName(): string {
        return 'CSV Translator'
    }

    async fromDataJournal(allData: dj.DataJournal, filename: string, useFs = true) {
        if (useFs) XLSX.set_fs(fs);
        const wb = XLSX.utils.book_new();
        const data: string[][] = []
        data.push(['Row Type', ...combinedTabularHeaders])
        //@ts-ignore - i'm being lazy here
        if (allData.defs !== undefined) allData.defs.forEach(def => makeDefAndPointDefsRows(def))
        //@ts-ignore - not worth the effort
        if (allData.entries !== undefined) allData.entries.forEach(entry => makeEntryRow(entry))
        //@ts-ignore - unless you read this again and get mad at yourself
        if (allData.tags !== undefined) allData.tags.forEach(tag => makeTagRow(tag))

        let exportSht = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, exportSht, 'PDW Export');

        XLSX.writeFile(wb, filename);

        return

        function makeDefAndPointDefsRows(def: pdw.DefData) {
            // console.log(data);
            data.push([
                'Def',
                def._uid, //'_uid',     //entry, tag, def
                def._created, //'_created', //entry, tag, def
                def._updated, //'_updated', //entry, tag, def
                def._deleted.toString().toUpperCase(), //'_deleted', //entry, tag, def
                def._did, //'_did',     //entry,    , def, pointDef
                def._lbl, //'_lbl',     //     , tag, def, pointDef
                def._emoji, //'_emoji',   //     ,    , def, pointDef
                def._desc, //'_desc',    //     ,    , def, pointDef
                def._scope, //'_scope',   //     ,    , def
                JSON.stringify(def._tags),//def._tags, //'_scope',   //     ,    , def
                '',//'_pid',     //     ,    ,    , pointDef
                '',//'_type',    //     ,    ,    , pointDef
                '',//'_rollup',  //     ,    ,    , pointDef
                '',//'_opts',    //     ,    ,    , pointDef
                '',//'_eid',     //entry
                '',//'_period',  //entry
                '',//'_note',    //entry
                '',//'_source',  //entry
                '',//'_vals',    //entry
            ])
            def._pts.forEach(pd => {
                data.push([
                    'PointDef',
                    def._uid, //'_uid',     //entry, tag, def
                    '', //def._created, //'_created', //entry, tag, def
                    '', //def._updated, //'_updated', //entry, tag, def
                    '', //def._deleted.toString().toUpperCase(), //'_deleted', //entry, tag, def
                    def._did, //'_did',     //entry,    , def, pointDef
                    pd._lbl, //'_lbl',     //     , tag, def, pointDef
                    pd._emoji, //'_emoji',   //     ,    , def, pointDef
                    pd._desc, //'_desc',    //     ,    , def, pointDef
                    '', //pd._scope, //'_scope',   //     ,    , def
                    '',//def._tags, //'_scope',   //     ,    , def
                    pd._pid,//'_pid',     //     ,    ,    , pointDef
                    pd._type, //'',//'_type',    //     ,    ,    , pointDef
                    pd._rollup, //'',//'_rollup',  //     ,    ,    , pointDef

                    JSON.stringify(pd._opts, null, 2),//.replaceAll('"','""') + '"',//'_opts',    //     ,    ,    , pointDef

                    '',//'_eid',     //entryß
                    '',//'_period',  //entry
                    '',//'_note',    //entry
                    '',//'_source',  //entry
                    // '',//'_vals',    //entry
                ])
            })
        }

        function makeEntryRow(entry: pdw.EntryData) {
            let vals: any = {};
            Object.keys(entry).forEach(key => {
                if (key.substring(0, 1) === '_') return;
                let val = entry[key];
                if (typeof val === 'boolean') return vals[key] = val.toString().toUpperCase();
                if (typeof val === 'number') return vals[key] = val;
                if (typeof val === 'string') return vals[key] = val;
                vals[key] = JSON.stringify(val, null, 2);
                return vals[key]
            })
            data.push([
                'Entry',
                entry._uid, //'_uid',     //entry, tag, def
                entry._created, //'_created', //entry, tag, def
                entry._updated, //'_updated', //entry, tag, def
                entry._deleted.toString().toUpperCase(), //'_deleted', //entry, tag, def
                entry._did, //'_did',     //entry,    , def, pointDef
                '',//def._lbl, //'_lbl',     //     , tag, def, pointDef
                '',//def._emoji, //'_emoji',   //     ,    , def, pointDef
                '',//def._desc, //'_desc',    //     ,    , def, pointDef
                '',//def._scope, //'_scope',   //     ,    , def
                '',//def._tags, //'_scope',   //     ,    , def
                '',//'_pid',     //     ,    ,    , pointDef
                '',//'_type',    //     ,    ,    , pointDef
                '',//'_rollup',  //     ,    ,    , pointDef
                '',//_opts
                entry._eid,//'_eid',     //entry
                entry._period,//'',//'_period',  //entry
                entry._note, //'',//'_note',    //entry
                entry._source, //'',//'_source',  //entry
                JSON.stringify(vals, null, 2), //'',//'_vals',    //entry
            ])
        }
    }

    async toDataJournal(filepath: string, useFs = true): Promise<dj.DataJournal> {
        console.log('loading...');
        if (useFs) XLSX.set_fs(fs);
        let loadedWb = XLSX.readFile(filepath);
        const shts = loadedWb.SheetNames;
        const sht = loadedWb.Sheets[shts[0]];
        let elements = XLSX.utils.sheet_to_json(sht, { raw: false }) as any;

        let rawDefs: pdw.DefData[] = elements.filter((e: any) => e['Row Type'] === 'Def') as pdw.DefData[];
        let rawPointDefs: pdw.PointDefData[] = elements.filter((e: any) => e['Row Type'] === 'PointDef') as pdw.PointDefData[];
        let rawEntries: pdw.EntryData[] = elements.filter((e: any) => e['Row Type'] === 'Entry') as pdw.EntryData[];

        let defs = rawDefs.map(rd => makeDef(rd));
        let entries = rawEntries.map(re => makeEntry(re));
        rawPointDefs.forEach((rpd: pdw.PointDefData) => {
            delete rpd['Row Type'];
            //@ts-expect-error
            let def = defs.find(d => d._uid === rpd._uid);
            //@ts-expect-error
            rpd._opts = rpd._opts === undefined ? undefined : JSON.parse(rpd._opts)
            def!._pts.push(rpd);
        })

        /* Trying to clean up some of the junk xlsx adds on there easily */
        const tempPDW = await pdw.PDW.newPDW([]);
        await tempPDW.setDefs([], (<pdw.DefData[]>defs));
        await tempPDW.setEntries([], (<pdw.EntryData[]>entries));
        let returnData = await tempPDW.getAll({ includeDeleted: 'yes' });
        //turned out that ⬆️ was the easiest way, huh.
        return returnData

        function makeDef(data: pdw.DefData): pdw.DefData {
            delete data['Row Type'];
            //@ts-expect-error
            data._deleted = data._deleted === "TRUE";
            data._tags = JSON.parse(data._tags.toString());
            data._pts = [];
            return data
        }
        function makeEntry(data: pdw.EntryData): pdw.EntryData {
            delete data['Row Type']
            //@ts-expect-error
            data._deleted = data._deleted === "TRUE";
            data._period = parsePeriod(data._period);
            data = addVals(data);
            return data
        }
        function addVals(data: any): any {
            let parsed = JSON.parse(data._vals);
            //cool object merging syntax
            return {
                ...data,
                ...parsed
            }
        }

        function parsePeriod(period: any): string {
            if (typeof period === 'string') return period
            if (typeof period === 'number') {
                period = Math.round(period * 10000) / 10000
                try {
                    return Temporal.Instant.fromEpochMilliseconds(Math.round((period - (25567 + 1)) * 86400 * 1000)).toZonedDateTimeISO(Temporal.Now.timeZone()).toPlainDate().toString();
                } catch (e) {
                    console.log('did not work');

                }
            }
            throw new Error('Unhandled period val...')
        }
    }

    async fromEntries(entries: dj.Entry[], filename: string, useFs = true) {
        
    }

    async toEntries(filepath: string, useFs = true) {

    }

    async loadAliasKeysFromCSV(filepath: string, useFs = true): Promise<AliasKeyes> {

    }

    loadAliasKeys(aliasKeys: AliasKeyes) {
        
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
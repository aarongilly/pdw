import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as pdw from './pdw.js';
import { Temporal } from 'temporal-polyfill';


export function importFirestore(filepath: string): pdw.CompleteDataset {
    function xlateDate(oldDate: string): pdw.EpochStr {
        if (typeof oldDate !== 'string') {
            return pdw.makeEpochStr()
        }
        oldDate = oldDate.substring(0, 19) + '+00:00[UTC]'
        let temp = Temporal.ZonedDateTime.from(oldDate).withTimeZone('America/Chicago');
        const epoch = pdw.makeEpochStrFromTemporal(temp);
        return epoch
    }

    function xlateScope(oldScope: string): pdw.Scope {
        if (oldScope === 'Time') return pdw.Scope.SECOND
        if (oldScope === 'Day') return pdw.Scope.DAY
        throw new Error('I guess this did happen?')
    }

    /**
     * This function is for firestore, so I declared it in here.
     * I should do this more.
     */
    function parseDef(dataIn: any): pdw.DefLike {
        let returnDef: pdw.DefLike = {
            _did: dataIn._did,
            _lbl: dataIn._lbl,
            _desc: dataIn._desc,
            _emoji: dataIn._emoji,
            _scope: xlateScope(dataIn._scope),
            _uid: pdw.makeUID(),
            _deleted: dataIn._deleted,
            _created: xlateDate(dataIn._created),
            _updated: xlateDate(dataIn._updated),
        }

        return returnDef
    }

    function parsePointDef(dataIn: any, defIn: any): pdw.PointDefLike {
        let pointDef: pdw.PointDefLike = {
            _did: dataIn._did,
            _lbl: dataIn._lbl,
            _desc: dataIn._desc,
            _emoji: dataIn._emoji,
            _uid: pdw.makeUID(),
            _deleted: dataIn._deleted,
            _created: xlateDate(defIn._created),
            _updated: xlateDate(defIn._updated),
            _pid: dataIn._pid,
            _type: parseType(dataIn._type),
            _rollup: pdw.Rollup.COUNT
        }

        return pointDef

        function parseType(inData: string): pdw.PointType {
            if (inData === 'String') return pdw.PointType.TEXT
            if (inData === 'Boolean') return pdw.PointType.BOOL
            if (inData === 'Array') return pdw.PointType.SELECT
            if (inData === 'Enum') return pdw.PointType.SELECT
            if (inData === 'Number') return pdw.PointType.NUMBER
            throw new Error('I guess tehre are more')
        }
    }

    function parseEntry(dataIn: any): pdw.EntryLike {
        //want to update the eid to something for points to reference later
        dataIn._eid = pdw.makeUID()
        let entry: pdw.EntryLike = {
            _eid: dataIn._eid,
            _note: dataIn._note,
            _period: parsePeriod(dataIn._period),
            _did: dataIn._did,
            _source: dataIn._source,
            _uid: pdw.makeUID(),
            _deleted: dataIn._deleted,
            _created: xlateDate(dataIn._created),
            _updated: xlateDate(dataIn._updated),
        }

        return entry

        function parsePeriod(text: string): pdw.PeriodStr {
            if (text.length > 11) {
                text = text.substring(0, 19) + '+00:00[UTC]'
                let temp = Temporal.ZonedDateTime.from(text).withTimeZone('America/Chicago');
                return temp.toPlainDateTime().toString();
            }
            if (text.length == 10) return text
            console.log(text);
            throw new Error('whatever')

        }
    }

    function parseEntryPoint(point: any, entry: any): pdw.EntryPointLike {
        let returnPoint: pdw.EntryPointLike = {
            _eid: entry._eid,
            _did: entry._did,
            _pid: point._pid,
            _val: point._val,
            _uid: pdw.makeUID(),
            _deleted: entry._deleted,
            _created: xlateDate(entry._created),
            _updated: xlateDate(entry._updated),
        }
        return returnPoint
    }

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

    let parsedDefs = file.definitions.map((defData: any) => parseDef(defData));
    let parsedPointDefs: pdw.PointDefLike[] = [];

    file.definitions.forEach((defData: any) => {
        let pointDefs: pdw.PointDefLike[] = defData._points.map((pd: any) => parsePointDef(pd, defData))
        parsedPointDefs.push(...pointDefs)
    });

    let parsedEntries = file.entries.map((entryData: any) => parseEntry(entryData));
    //don't import deleted stuff, it's the only spot they exist
    parsedEntries = parsedEntries.filter((e: pdw.EntryLike) => e._deleted === false);

    let parsedEntryPoints: pdw.EntryPointLike[] = [];
    file.entries.forEach((entry: any) => {
        if (entry._points === undefined) return
        let points = entry._points.map((point: any) => parseEntryPoint(point, entry));
        parsedEntryPoints.push(...points);
    })

    parsedEntryPoints = parsedEntryPoints.filter((e: pdw.EntryPointLike) => e._deleted === false);

    returnData.defs = parsedDefs;
    returnData.pointDefs = parsedPointDefs;
    returnData.entries = parsedEntries;
    returnData.entryPoints = parsedEntryPoints;

    if (returnData.defs !== undefined) pdwRef.setDefs(parsedDefs);
    if (returnData.pointDefs !== undefined) pdwRef.setPointDefs(parsedPointDefs);
    if (returnData.entries !== undefined) pdwRef.setEntries(parsedEntries);
    if (returnData.entryPoints !== undefined) pdwRef.setEntryPoints(parsedEntryPoints);
    //just not going to worry about importing tags.
    if (returnData.tagDefs !== undefined) pdwRef.setTagDefs([]);
    if (returnData.tags !== undefined) pdwRef.setTags([]);

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

export function importMongo(filepath: string): pdw.CompleteDataset {
    function xlateDate(oldDate: string): pdw.EpochStr {
        if (typeof oldDate !== 'string') {
            return pdw.makeEpochStr()
        }
        oldDate = oldDate.substring(0, 19) + '+00:00[UTC]'
        let temp = Temporal.ZonedDateTime.from(oldDate).withTimeZone('America/Chicago');
        const epoch = pdw.makeEpochStrFromTemporal(temp);
        return epoch
    }

    function xlateScope(oldScope: string): pdw.Scope {
        if (oldScope === 'time') return pdw.Scope.SECOND
        if (oldScope === 'day') return pdw.Scope.DAY
        throw new Error('I guess this did happen?')
    }

    /**
     * This function is for firestore, so I declared it in here.
     * I should do this more.
     */
    function parseDef(dataIn: any): pdw.DefLike {
        dataIn._did = pdw.makeSmallID();//tag for later use
        let returnDef: pdw.DefLike = {
            _did: dataIn._did,
            _lbl: dataIn.label,
            _desc: dataIn.desc,
            _emoji: dataIn.emoji,
            _scope: xlateScope(dataIn.scope),
            _uid: pdw.makeUID(),
            _deleted: false,
            _created: xlateDate(dataIn.first),
            _updated: xlateDate(dataIn.latest),
        }

        return returnDef
    }

    function parsePointDef(dataIn: any, defIn: any): pdw.PointDefLike {
        dataIn._pid = pdw.makeSmallID(); //tag fr later again
        let pointDef: pdw.PointDefLike = {
            _did: defIn._did,
            _lbl: dataIn.label,
            _desc: dataIn.desc,
            _emoji: dataIn.emoji,
            _uid: pdw.makeUID(),
            _deleted: false,
            _created: xlateDate(defIn.first),
            _updated: xlateDate(defIn.latest),
            _pid: dataIn._pid,
            _type: parseType(dataIn.type),
            _rollup: parseRollup(dataIn.rollup)
        }

        return pointDef

        function parseType(inData: string): pdw.PointType {
            if (inData === 'text') return pdw.PointType.TEXT
            if (inData === 'number') return pdw.PointType.NUMBER
            if (inData === 'list') return pdw.PointType.SELECT
            if (inData === 'json') return pdw.PointType.JSON
            if (inData === 'yes/no') return pdw.PointType.BOOL
            if (inData === 'Enum') return pdw.PointType.SELECT
            throw new Error('I guess tehre are more')
        }

        function parseRollup(rollup: string) {
            if (rollup === 'count') return pdw.Rollup.COUNT
            if (rollup === 'count yes/no') return pdw.Rollup.COUNTOFEACH
            if (rollup === 'average') return pdw.Rollup.AVERAGE
            if (rollup === 'count distinct') return pdw.Rollup.COUNTUNIQUE
            if (rollup === 'sum') return pdw.Rollup.SUM
            throw new Error('more here')
        }
    }

    function parseEntry(dataIn: any, defIn: any): pdw.EntryLike {
        //want to update the eid to something for points to reference later
        dataIn._eid = pdw.makeUID()
        let entry: pdw.EntryLike = {
            _eid: pdw.makeUID(),
            _note: dataIn.note,
            _period: parsePeriod(dataIn.period),
            _did: defIn._did,
            _source: dataIn.source,
            _uid: pdw.makeUID(),
            _deleted: dataIn.deleted,
            _created: xlateDate(dataIn.created),
            _updated: xlateDate(dataIn.updated),
        }

        return entry

        function parsePeriod(text: string): pdw.PeriodStr {
            if (text.length > 11) {
                text = text.substring(0, 19) + '+00:00[UTC]'
                let temp = Temporal.ZonedDateTime.from(text).withTimeZone('America/Chicago');
                return temp.toPlainDateTime().toString();
            }
            if (text.length == 10) return text
            const parts = text.split('/');
            return parts[2] + '-' + parts[0].padStart(2, '0') + '-' + parts[1].padStart(2, '0');
            throw new Error('whatever')

        }
    }

    function parseEntryPoint(val: any, entry: any, pointNum: any, defIn: any): pdw.EntryPointLike {
        const _pid = defIn.points[Number.parseInt(pointNum) - 1]._pid
        let returnPoint: pdw.EntryPointLike = {
            _eid: entry._eid,
            _did: defIn._did,
            _pid: _pid,
            _val: val,
            _uid: pdw.makeUID(),
            _deleted: entry.deleted,
            _created: xlateDate(entry.created),
            _updated: xlateDate(entry.updated),
        }
        return returnPoint
    }

    const file = JSON.parse(fs.readFileSync(filepath).toString());
    const returnData: pdw.CompleteDataset = {
        defs: [],
        pointDefs: [],
        entries: [],
        entryPoints: []
    }
    const pdwRef = pdw.PDW.getInstance();

    let count = 0;

    file.data.forEach((def: any) => {
        //parse def main
        returnData.defs?.push(parseDef(def))
        if (def.points === undefined) throw new Error('this hppened')
        def.points.forEach((pd: any) => {
            //parse pointDef
            returnData.pointDefs?.push(parsePointDef(pd, def))
        })

        if (def.entries === undefined) throw new Error('tat hppened')
        def.entries.forEach((ent: any) => {
            //parse entry
            returnData.entries?.push(parseEntry(ent, def))

            if (ent.points === undefined) {
                count = count + 1
                console.warn(ent.mid)
            } else {
                Object.keys(ent.points).forEach((ep: any) => {
                    //parse entry points
                    returnData.entryPoints?.push(parseEntryPoint(ent.points[ep], ent, ep, def))
                })
            }
        })
    })

    if (returnData.defs !== undefined) pdwRef.setDefs(returnData.defs);
    if (returnData.pointDefs !== undefined) pdwRef.setPointDefs(returnData.pointDefs);
    if (returnData.entries !== undefined) pdwRef.setEntries(returnData.entries);
    if (returnData.entryPoints !== undefined) pdwRef.setEntryPoints(returnData.entryPoints);

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

export function importOldest(filepath: string) {
    console.log('loading...');
    let returnData: pdw.CompleteDataset = {}
    XLSX.set_fs(fs);
    let loadedWb = XLSX.readFile(filepath, { dense: true });
    const shts = loadedWb.SheetNames;
    const pdwRef = pdw.PDW.getInstance();
    const rows: any[][] = loadedWb.Sheets[shts[0]]['!data']!;

    const perRow: { defs: pdw.Def[], pointValMap: { [pid: string]: number, pd: any }[] } = {
        defs: [],
        pointValMap: []
    };

    let periodCol: any, noteCol: any, sourceCol: any;

    rows[0].forEach((cell, i) => {
        // if (cell.c === undefined) return
        const commentText = cell.v//.t
        // const commentBits = commentText.split(":")
        // if (commentBits.length == 1) {
        //     console.error('Comment found:', cell.c.t)
        //     throw new Error('only one line of text in comment')
        // }
        const columnSignifier = commentText//commentBits[1].slice(1);
        if (columnSignifier === '_period') {
            if (periodCol !== undefined) throw new Error('two periods');
            periodCol = i;
            return
        }
        if (columnSignifier === '_note') {
            if (noteCol !== undefined) throw new Error('two notes');
            noteCol = i;
            return
        }
        if (columnSignifier === '_source') {
            if (sourceCol !== undefined) throw new Error('two sources');
            sourceCol = i;
            return
        }
        console.log('Finding PointDef for:', columnSignifier);
        const pd: pdw.PointDef = pdwRef.getPointDefs({ includeDeleted: 'no', pid: [columnSignifier] })[0]
        const def = pdwRef.getDefs({ includeDeleted: 'no', did: [pd._did] })[0]
        console.log(pd);
        if (!perRow.defs.some((e: any) => e._did === def._did)) {
            perRow.defs.push(def);
        }
        //@ts-expect-error
        perRow.pointValMap.push({ loc: i, ['pd']: pd });
    })

    let entriesMade = 0;
    let entryPointsMade = 0;

    rows.forEach((row, i) => {
        if (i === 0) return
        let rowEntries: any = {}
        perRow.pointValMap.forEach(pointValMap => {
            // console.log(pointValMap);
            if (row[pointValMap.loc] !== undefined) {
                if (rowEntries[pointValMap.pd._did] === undefined) {
                    // console.log(i);
                    
                    const newEntry = pdwRef.createNewEntry({
                        _did: pointValMap.pd._did,
                        _period: parsePeriod(row[periodCol].v),
                        _note: noteCol === undefined ? '' : row[noteCol],
                        _source: sourceCol === undefined ? '' : row[sourceCol],
                    })
                    entriesMade = entriesMade + 1
                    const eid = newEntry._eid;
                    // console.log(newEntry);
                    rowEntries[newEntry._did] = newEntry._eid
                }
                pdwRef.createNewEntryPoint({
                    _did: pointValMap.pd._did,
                    _pid: pointValMap.pd._pid,
                    _eid: rowEntries[pointValMap.pd._did],
                    _val: row[pointValMap.loc].v
                })
                entryPointsMade = entryPointsMade + 1;
            }
        })
    })

    console.log('Made ' + entriesMade + ' entries, with ' + entryPointsMade + ' entryPoints');

    function parsePeriod(period: any): string {
        if (typeof period === 'string') return period
        if (typeof period === 'number') {
            return Temporal.Instant.fromEpochMilliseconds((period - (25567 + 1)) * 86400 * 1000).toZonedDateTimeISO(Temporal.Now.timeZone()).toPlainDate().toString();
        }
        throw new Error('Unhandled period val...')
    }
}
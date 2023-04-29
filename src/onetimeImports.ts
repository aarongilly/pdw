import * as fs from 'fs';
import * as pdw from './pdw.js';
import { Temporal } from 'temporal-polyfill';


export function importFirestore(filepath: string): pdw.CompleteDataset {
    function xlateDate(oldDate: string): pdw.EpochStr{
        if(typeof oldDate!=='string'){
            return pdw.makeEpochStr()
        }
        oldDate = oldDate.substring(0,19)+'+00:00[UTC]'
        let temp = Temporal.ZonedDateTime.from(oldDate).withTimeZone('America/Chicago');
        const epoch = pdw.makeEpochStrFromTemporal(temp);
        return epoch
    }

    function xlateScope(oldScope: string): pdw.Scope{
        if(oldScope === 'Time') return pdw.Scope.SECOND
        if(oldScope === 'Day') return pdw.Scope.DAY
        throw new Error('I guess this did happen?')
    }

    /**
     * This function is for firestore, so I declared it in here.
     * I should do this more.
     */
    function parseDef(dataIn: any): pdw.DefLike{
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

    function parsePointDef(dataIn: any, defIn: any): pdw.PointDefLike{
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

        function parseType(inData: string): pdw.PointType{
            if(inData === 'String') return pdw.PointType.TEXT
            if(inData === 'Boolean') return pdw.PointType.BOOL
            if(inData === 'Array') return pdw.PointType.SELECT
            if(inData === 'Enum') return pdw.PointType.SELECT
            if(inData === 'Number') return pdw.PointType.NUMBER
            throw new Error('I guess tehre are more')
        }
    }

    function parseEntry(dataIn:any): pdw.EntryLike{
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

        function parsePeriod(text: string): pdw.PeriodStr{
            if(text.length > 11){
                text = text.substring(0,19)+'+00:00[UTC]'
                let temp = Temporal.ZonedDateTime.from(text).withTimeZone('America/Chicago');
                return temp.toPlainDateTime().toString();
            }
            if(text.length == 10) return text
            console.log(text);
            throw new Error('whatever')
            
        }
    }

    function parseEntryPoint(point: any, entry: any): pdw.EntryPointLike{
        let returnPoint: pdw.EntryPointLike ={
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

    let parsedDefs = file.definitions.map((defData:any)=>parseDef(defData));
    let parsedPointDefs: pdw.PointDefLike[] = [];

    file.definitions.forEach((defData:any)=>{
        let pointDefs: pdw.PointDefLike[] = defData._points.map((pd:any)=> parsePointDef(pd,defData))
        parsedPointDefs.push(...pointDefs)
    });

    let parsedEntries = file.entries.map((entryData:any)=>parseEntry(entryData));
    //don't import deleted stuff, it's the only spot they exist
    parsedEntries = parsedEntries.filter((e:pdw.EntryLike)=>e._deleted === false);
    
    let parsedEntryPoints: pdw.EntryPointLike[] = [];
    file.entries.forEach((entry:any)=>{
        if(entry._points === undefined) return
        let points = entry._points.map((point:any)=> parseEntryPoint(point, entry));
        parsedEntryPoints.push(...points);
    }) 

    parsedEntryPoints = parsedEntryPoints.filter((e:pdw.EntryPointLike)=>e._deleted === false);

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
import { DataJournal, DJ} from "./DataJournal.js";

export interface OverviewedDataJournal extends DataJournal {
    overview: Overview
}

/**
* Not typically operated on, but used moreso
* for sanity checking things when merging and whatnot.
*/
export interface Overview {
    updated?: {
        localeStr?: string,
        isoStr?: string,
        epochStr?: string,
    },
    counts?: {
        defs?: number,
        activeEntries?: number,
        deletedEntries?: number
    },
    index?: {
        /**
         * Position of every definition in the corresponding DataJournal.defs.
         * Could be used like DataJournal.defs[index[defId]]
         */
        defMap: { [defId: string]: number }
        /**
         * Position of every entry in the corresponding DataJournal.entries.
         * Could be used like DataJournal.entries[index[entryId]]
         */
        entryMap: { [entryId: string]: number }
        /**
         * Object containing:
         * key = def._lbl
         * value = def._id
         * 
         * Could be used like DataJournal.defs[index[defLblToIdMap[defId]]]
         */
        defLblToIdMap: { [defLbl: string]: string }
    },
    // aliases?: {
    //     [alias: string]: string
    // },
    // filename?: string
    [x: string]: any
}

export class Overviewer {
    static makeOverviewFor(dataJournal: DataJournal){
        if (!DJ.isValidDataJournal(dataJournal)) throw new Error("Invalid dataset found at fFWPIhaA");

        let deletedEntryCount = 0;
        let lastUpdated = '0'; //should be the Epoch itself

        let indexObj = {
            defMap: {},
            entryMap: {},
            defLblToIdMap: {}
        }

        /**
         * Loop over entries once, capture what's necessary
         */
        dataJournal.entries.forEach((entry, index) => {
            if (entry._deleted) deletedEntryCount += 1;
            if (entry._updated > lastUpdated) lastUpdated = entry._updated;

            const standardizedKey = DJ.standardizeKey(entry._id);
            indexObj.entryMap[standardizedKey] = index;
        })

        /**
         * Loop over defs once, capture what's necessary
         */
        dataJournal.defs.forEach((def, index) => {
            if (def._updated > lastUpdated) lastUpdated = def._updated;

            const standardizedKey = DJ.standardizeKey(def._id);
            indexObj.defMap[standardizedKey] = index;
            indexObj.defLblToIdMap[def._lbl ?? def._id] = def._id;
        })

        const lastUpdatedDate = DJ.parseDateFromEpochStr(lastUpdated);

        const overview: Overview = {
            updated: {
                localeStr: lastUpdatedDate.toLocaleString(),
                isoStr: lastUpdatedDate.toISOString(),
                epochStr: lastUpdated,
            },
            counts: {
                defs: dataJournal.defs.length,
                activeEntries: dataJournal.entries.length - deletedEntryCount,
                deletedEntries: deletedEntryCount
            },
            index: indexObj
        }
        return overview;
    }

    static addOverviewTo(dataJournal: DataJournal): DataJournal {
        //make static
        const newDataJournal = JSON.parse(JSON.stringify(dataJournal));
        newDataJournal.overview = Overviewer.makeOverviewFor(newDataJournal);
        return newDataJournal
    }
}
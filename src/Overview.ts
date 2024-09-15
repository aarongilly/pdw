import { DataJournal, DJ } from "./DataJournal";

/**
 * Is just a {@link DataJournal} with an optional {@link Overview}
 */
export interface OverviewedDataJournal extends DataJournal{
    overview?: Overview | null,
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
    }
    [x: string]: any
}

export class Overview{

    static addOverview(dataJournal: DataJournal): OverviewedDataJournal {
        //make static
        const newDataJournal = JSON.parse(JSON.stringify(dataJournal));
        newDataJournal.overview = Overview.makeOverview(newDataJournal);
        return newDataJournal
    }
    
    static qualityCheck(dataJournal: OverviewedDataJournal, panicLevel: "logs only" | "some errors thrown" | "all errors thrown" = 'some errors thrown'): void {
        //pass through to the DJ as well
        DJ.qualityCheck(dataJournal, panicLevel);

        //overview check
        if(dataJournal.overview && dataJournal.overview.counts){
            //Def Count bad
            if(dataJournal.overview.counts.defs !== dataJournal.defs.length)
                logOrThrow(`Overview Def count is wrong! \n Overview says: ${dataJournal.overview.counts.defs} & should be ${dataJournal.defs.length}`);
            //Entry Count bad
            //@ts-expect-error - ignoring this for now
            const overViewEntryCount = dataJournal.overview.counts.activeEntries + dataJournal.overview.counts.deletedEntries;
            if(overViewEntryCount !== dataJournal.entries.length)
                logOrThrow(`Overview Entry count is wrong! \n Overview says: ${overViewEntryCount} & should be ${dataJournal.entries.length}`);
        }
        /**
         * local helper
         * @param errMessage message to write
         * @param isImportant if true, throws error for "some errors throw" case, otherwise just logs warning
         * @returns void
         */
        function logOrThrow(errMessage: string, isImportant = false){
            if(panicLevel === 'all errors thrown') throw new Error(errMessage);
            if(panicLevel === 'logs only') return console.warn(errMessage);
            if(isImportant) throw new Error(errMessage);
            console.warn(errMessage);
        }
    }

    //#region --- private methods 
    /**
     * Creates a Data Journal Overview object - but does NOT append it to anything.
     * To append to a copy of a Data Journal, used {@link addOverview}.
     */
    private static makeOverview(dataJournal: DataJournal): Overview {
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
            //@ts-expect-error - accessing a private member
            const standardizedKey = DJ.standardizeKey(entry._id);
            indexObj.entryMap[standardizedKey] = index;
        })
        
        /**
         * Loop over defs once, capture what's necessary
        */
       dataJournal.defs.forEach((def, index) => {
           if (def._updated > lastUpdated) lastUpdated = def._updated;
           
           //@ts-expect-error - accessing a private member
            const standardizedKey = DJ.standardizeKey(def._id);
            indexObj.defMap[standardizedKey] = index;
            indexObj.defLblToIdMap[def._lbl] = def._id;
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

}
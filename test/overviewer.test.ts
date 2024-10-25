
import { DJ} from "../src/DataJournal";
import { describe, test, expect } from "vitest";
import * as testData from './test_datasets';
import { Overviewer } from "../src/Overviewer";

describe('Data Journal Overviewing & Indexing', () => {
    test("DataJournal Overview Creation & Use", () => {
      let dataJournalWithOverview = Overviewer.addOverviewTo(testData.biggerJournal);
      expect(dataJournalWithOverview.overview).toEqual(testData.expectedOverview);
      //example of designed use:
      const A = Overviewer.addOverviewTo(testData.smallJournalA);
      const B = Overviewer.addOverviewTo(testData.smallJournalB);
      const AB = Overviewer.addOverviewTo(DJ.merge([A, B]));
      //get some glancable results from the merge
      expect(AB.overview?.updated).not.toEqual(A.overview?.updated); //A was older
      expect(AB.overview?.updated).toEqual(B.overview?.updated); //AB is now up-to-date with B
      expect(AB.overview!.counts?.defs! - A.overview!.counts!.defs!).toBe(1); //one def was added
      expect(AB.overview!.counts?.activeEntries! - A.overview!.counts!.activeEntries!).toBe(1); //one entry was added
    });
  
    test("DataJournal Index Creation & Use", () => {
      let dataJournalWithOverview = Overviewer.addOverviewTo(testData.biggerJournal);
      const index = dataJournalWithOverview.overview!.index!;
      expect(index).toEqual(testData.expectedOverview.index);
  
      //example of designed use:
      const anExistingEntry = { //thie is the same as testData.lifted
        _id: "m0ogdggg_ca3t",
        _period: "2024-09-05T11:05:00",
        _created: "m0ogdggg",
        _updated: "m0ogdggg",
        _deleted: false,
        _note: "Got so swole",
        _source: "Test data",
        WORKOUT_TYPE: 'STRENGTH',
        WORKOUT_NAME: 'Starting Strength A'
      }
      //don't need to loop over the entry list
      expect(dataJournalWithOverview.entries[index.entryMap[DJ.standardizeKey(anExistingEntry._id)]]).toEqual(anExistingEntry);
      const aNewEntry = {
        _id: '12345',
        _note: 'would be new to to the set',
        _updated: 'm0fepazz'
      }
      expect(dataJournalWithOverview.entries[index.entryMap[DJ.standardizeKey(aNewEntry._id)]]).toBeUndefined();
    });
  })
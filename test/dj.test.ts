import { DataJournal, DJ, Entry, Def } from "../src/DataJournal";
import { describe, test, expect } from "vitest";
import * as testData from './test_datasets';
import { Temporal } from "temporal-polyfill";

describe("Data Journal basics.", () => {

  test("Data Journal Validation.", () => {
    //@ts-expect-error - forcing into the private constructor
    expect(new DJ()).toBeTruthy(); //useless test for "full coverage"
    const badDataset = {};
    const trickierBadDataset = {
      defs: [],
      entries: {} //not an array, should fail
    }
    const emptySetWithOverview: DataJournal = {
      defs: [],
      entries: [],
      overview: {}
    }
    //@ts-expect-error
    expect(DJ.isValidDataJournal(badDataset)).toBe(false);
    //@ts-expect-error
    expect(DJ.isValidDataJournal(trickierBadDataset)).toBe(false);
    expect(DJ.isValidDataJournal(testData.emptySet)).toBe(true);
    expect(DJ.isValidDataJournal(emptySetWithOverview)).toBe(true);
  });

  test("Data Journal Utility Functions", () => {
    /**
     * EpochStr Creation.
     */
    expect(DJ.makeEpochStr().length).toBe(8); // until 2059
    expect(DJ.makeEpochStrFrom(new Date())?.length).toBe(8);
    const temporal = Temporal.Instant.from('2024-09-04T17:25:44.756-05:00[America/Chicago]');
    expect(DJ.makeEpochStrFrom(new Date(temporal.epochMilliseconds))).toBe('m0ofg4dw');

    const epochStr = 'm0ofg4dw';
    expect(DJ.parseDateFromEpochStr(epochStr).toISOString()).toBe('2024-09-04T22:25:44.756Z');

    const eid = DJ.makeID(); //will look something like 'm0ofg4dw_fp83'
    expect(eid.split('_').length).toBe(2);
    expect(eid.length).toBe(13);

    expect(DJ.makeRandomString(6).length).toBe(6);
    expect(() => DJ.makeRandomString(13)).toThrowError(); //too long, my cheap logic doesn't allow it
  })
});

describe('Data Journal Entry & Def Adding', () => {
  test('Adding Defs', () => {
    let localDataJournal = DJ.newBlankDataJournal();
    //Because Data Journal never mutates, calling up any DJ.whatever methods will
    //inevitably create copies of stuff and loop-to-merge, even if you *know* it's new.
    //Thus the fastest approach for adding new Defs and Entries is to make them then
    //directly mutate the Data Journal object itself.
    const newMinimumDef: Partial<Def> = { } //Defs **can** be empty, but shouldn't usually be
    const newFullDef = DJ.makeDef(newMinimumDef);
    localDataJournal.defs.push(newFullDef);
    //There's a big-ol' footgun here, though. Doing this will *not* update any attached
    //Overview (or index contained therein) - so you have to also null out the overview.
    expect(localDataJournal.overview?.counts?.defs).toEqual(0); //doesn't reflect added def
    expect(localDataJournal.overview).not.toEqual(DJ.addOverview(localDataJournal));
    //best practice would be to manually nullify the overview property:
    localDataJournal.overview = null;
    //or just recreate a new overview
    localDataJournal = DJ.addOverview(localDataJournal);
    //but since dataJournals are just object shapes there's no way to enforce this
    expect(localDataJournal.overview?.counts?.defs).toEqual(1); //now reflects the change

    //all that can be handled by just using the build in "addDefs" function.
    localDataJournal = DJ.addDefs(localDataJournal, [testData.bookDef]);
    expect(localDataJournal.overview?.counts?.defs).toBe(2); //was added
    //...however if you forget to use the assigment bit, there's still a footgun.
    //** INTENTIONALLY BAD CODE DON'T DO THIS **
    DJ.addDefs(localDataJournal, [testData.movieDef]);
    expect(localDataJournal.overview?.counts?.defs).toBe(2); //movieDef NOT present
  })

  test('Adding Entries', () => {
    let localDataJournal = DJ.newBlankDataJournal([testData.bookDef]);
    //Because Data Journal never mutates, calling up any DJ.whatever methods will
    //inevitably create copies of stuff and loop-to-merge, even if you *know* it's new.
    //Thus the fastest approach for adding new Defs and Entries is to make them then
    //directly mutate the Data Journal object itself.
    const newMinimumEntry: Partial<Entry> = {
      _id: '86753090_plmn',
      _period: '2024-09-07T20:58:22',
    }
    const newFullEntry = DJ.makeEntry(newMinimumEntry);
    localDataJournal.entries.push(newFullEntry);
    //There's a big-ol' footgun here, though. Doing this will *not* update any attached
    //Overview (or index contained therein) - so you have to also null out the overview.
    expect(localDataJournal.overview?.counts?.activeEntries).toEqual(0); //doesn't reflect added entry
    expect(localDataJournal.overview).not.toEqual(DJ.addOverview(localDataJournal));
    //best practice would be to manually nullify the overview property:
    localDataJournal.overview = null;
    //or just recreate a new overview
    localDataJournal = DJ.addOverview(localDataJournal);
    //but since dataJournals are just object shapes there's no way to enforce this
    expect(localDataJournal.overview?.counts?.activeEntries).toEqual(1); //now reflects the change

    //all that can be handled by just using the build in "addDefs" function.
    localDataJournal = DJ.addEntries(localDataJournal, [testData.readEntry]);
    expect(localDataJournal.overview?.counts?.activeEntries).toBe(2); //was added
    //...however if you forget to use the assigment bit, there's still a footgun.
    //** INTENTIONALLY BAD CODE DON'T DO THIS **
    DJ.addEntries(localDataJournal, [testData.readAndWorkedOutEntry]);
    expect(localDataJournal.overview?.counts?.activeEntries).toBe(2); //movieDef NOT present 
  })
})

describe('Data Journal Overviewing & Indexing', () => {
  test("DataJournal Overview Creation & Use", () => {
    let dataJournalWithOverview = DJ.addOverview(testData.journalToOverviewAndIndex);
    expect(dataJournalWithOverview.overview).toEqual(testData.expectedOverview);
    //example of designed use:
    const A = DJ.addOverview(testData.smallJournalA);
    const B = DJ.addOverview(testData.smallJournalB);
    const AB = DJ.addOverview(DJ.merge([A, B]));
    //get some glancable results from the merge
    expect(AB.overview?.updated).not.toEqual(A.overview?.updated); //A was older
    expect(AB.overview?.updated).toEqual(B.overview?.updated); //AB is now up-to-date with B
    expect(AB.overview!.counts?.defs! - A.overview!.counts!.defs!).toBe(1); //one def was added
    expect(AB.overview!.counts?.activeEntries! - A.overview!.counts!.activeEntries!).toBe(1); //one entry was added
  });

  test("DataJournal Index Creation & Use", () => {
    let dataJournalWithOverview = DJ.addOverview(testData.journalToOverviewAndIndex);
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
    //@ts-expect-error - purposefully hacking into un-exposed member
    expect(dataJournalWithOverview.entries[index.entryMap[DJ.standardizeKey(anExistingEntry._id)]]).toEqual(anExistingEntry);
    const aNewEntry = {
      _id: '12345',
      _note: 'would be new to to the set',
      _updated: 'm0fepazz'
    }
    //@ts-expect-error - purposefully hacking into un-exposed member
    expect(dataJournalWithOverview.entries[index.entryMap[DJ.standardizeKey(aNewEntry._id)]]).toBeUndefined();
  });
})

describe('Data Journal merge behaviors.', () => {
  test("Data Journal Def Merging", () => {
    //making a copy to test later on
    let staticDefsA = JSON.parse(JSON.stringify(testData.defsOnlyA.defs));
    let staticDefsB = JSON.parse(JSON.stringify(testData.defsOnlyB.defs));

    //merging with yourself produces no extra stuff
    const selfMerge = DJ.mergeDefs([testData.defsOnlyA.defs, testData.defsOnlyA.defs]);
    expect(selfMerge).toEqual(testData.defsOnlyA.defs);

    //merging 2 produces the expected combined result
    //note: the sort is only for testing, merging doesn't gaurantee array position
    const ABMerge = DJ.mergeDefs([testData.defsOnlyA.defs, testData.defsOnlyB.defs]);
    ABMerge.sort((a: any, b: any) => a._id > b._id ? 1 : -1) // sort for comparison sake
    expect(ABMerge).toEqual(testData.defsOnlyAB.defs.sort((a, b) => a._id > b._id ? 1 : -1));
    //order of arguments doesn't matter
    const BAMerge = DJ.mergeDefs([testData.defsOnlyB.defs, testData.defsOnlyA.defs]);
    BAMerge.sort((a: any, b: any) => a._id > b._id ? 1 : -1) // sort for comparison sake
    expect(BAMerge).toEqual(testData.defsOnlyAB.defs.sort((a, b) => a._id > b._id ? 1 : -1));

    //merging 3
    const ABCMerge = DJ.mergeDefs([testData.defsOnlyA.defs, testData.defsOnlyB.defs, testData.defsOnlyC.defs]);
    ABCMerge.sort((a: any, b: any) => a._id > b._id ? 1 : -1) // sort for comparison sake
    expect(ABCMerge).toEqual(testData.defsOnlyABC.defs.sort((a, b) => a._id > b._id ? 1 : -1));

    //these tests just illustrate for you the person reading this that merges don't create duplicates
    expect(testData.defsOnlyA.defs.length).toBe(4);
    expect(testData.defsOnlyB.defs.length).toBe(3);
    expect(testData.defsOnlyC.defs.length).toBe(3);
    //the duplicates are ignored & the updated one replaced the older one
    expect(ABCMerge.length).toBe(8); // 8 is less than 10, those 2 were duplicates & updates

    //through all that the original object is retained & unmodified
    expect(testData.defsOnlyA.defs).toEqual(staticDefsA);
    expect(testData.defsOnlyB.defs).toEqual(staticDefsB);
  })

  test("Data Journal Entry Merging", () => {
    //making a copy to test later on
    let staticEntriesA = JSON.parse(JSON.stringify(testData.smallJournalA.entries));
    let staticEntriesB = JSON.parse(JSON.stringify(testData.smallJournalB.entries));

    //merging with yourself produces no extra stuff
    const selfMerge = DJ.mergeEntries([testData.smallJournalA.entries, testData.smallJournalA.entries]);
    expect(selfMerge).toEqual(testData.smallJournalA.entries);

    // merging 2 produces the expected combined result
    //note: the sort is only for testing, merging doesn't gaurantee array position
    const ABMerge = DJ.mergeEntries([testData.smallJournalA.entries, testData.smallJournalB.entries]);
    ABMerge.sort((a: any, b: any) => a._id > b._id ? 1 : -1) // sort for comparison sake
    expect(ABMerge).toEqual(testData.smallJournalAB.entries.sort((a, b) => a._id > b._id ? 1 : -1));
    //order of arguments doesn't matter
    const BAMerge = DJ.mergeEntries([testData.smallJournalB.entries, testData.smallJournalA.entries]);
    BAMerge.sort((a: any, b: any) => a._id > b._id ? 1 : -1) // sort for comparison sake
    expect(BAMerge).toEqual(testData.smallJournalAB.entries.sort((a, b) => a._id > b._id ? 1 : -1));

    //merging 3
    const ABCMerge = DJ.mergeEntries([testData.smallJournalA.entries, testData.smallJournalB.entries, testData.smallJournalC.entries]);
    ABCMerge.sort((a: any, b: any) => a._id > b._id ? 1 : -1) // sort for comparison sake
    expect(ABCMerge).toEqual(testData.smallJournalABC.entries.sort((a, b) => a._id > b._id ? 1 : -1));

    //these tests just illustrate for you the person reading this that merges don't create duplicates
    expect(testData.smallJournalA.entries.length).toBe(1);
    expect(testData.smallJournalB.entries.length).toBe(1);
    expect(testData.smallJournalC.entries.length).toBe(2);
    //the duplicates are ignored & the updated one replaced the older one
    expect(ABCMerge.length).toBe(3); // 4 is less than 3 because of duplicates & updates

    //through all that the original object is retained & unmodified
    expect(testData.smallJournalA.entries).toEqual(staticEntriesA);
    expect(testData.smallJournalB.entries).toEqual(staticEntriesB);
  })

  test("Whole Data Journal merging", () => {

    //making a copy to test later on
    let staticA = JSON.parse(JSON.stringify(testData.smallJournalA));
    let staticB = JSON.parse(JSON.stringify(testData.smallJournalB));

    //merging with yourself produces no extra stuff
    const selfMerge = DJ.merge([testData.smallJournalA, testData.smallJournalA], false);
    expect(selfMerge).toEqual(testData.smallJournalA);

    // merging 2 produces the expected combined result
    //note: the sort is only for testing, merging doesn't gaurantee array position
    const ABMerge = DJ.merge([testData.smallJournalA, testData.smallJournalB], false);
    ABMerge.defs.sort((a: any, b: any) => a._id > b._id ? 1 : -1) // sort for comparison sake
    ABMerge.entries.sort((a: any, b: any) => a._id > b._id ? 1 : -1) // sort for comparison sake
    const sortedABMergeTarget = testData.smallJournalAB;
    sortedABMergeTarget.entries.sort((a, b) => a._id > b._id ? 1 : -1)
    sortedABMergeTarget.defs.sort((a, b) => a._id > b._id ? 1 : -1)
    expect(ABMerge).toEqual(sortedABMergeTarget);
    //order of arguments doesn't matter
    const BAMerge = DJ.merge([testData.smallJournalB, testData.smallJournalA], false);
    BAMerge.defs.sort((a: any, b: any) => a._id > b._id ? 1 : -1) // sort for comparison sake
    BAMerge.entries.sort((a: any, b: any) => a._id > b._id ? 1 : -1) // sort for comparison sake
    expect(BAMerge).toEqual(sortedABMergeTarget);

    //merging 3
    const ABCMerge = DJ.merge([testData.smallJournalA, testData.smallJournalB, testData.smallJournalC], false);
    ABCMerge.entries.sort((a: any, b: any) => a._id > b._id ? 1 : -1) // sort for comparison sake
    ABCMerge.defs.sort((a: any, b: any) => a._id > b._id ? 1 : -1) // sort for comparison sake
    const sortedABCMergeTarget = testData.smallJournalABC;
    sortedABCMergeTarget.entries.sort((a, b) => a._id > b._id ? 1 : -1)
    sortedABCMergeTarget.defs.sort((a, b) => a._id > b._id ? 1 : -1)

    expect(ABCMerge).toEqual(sortedABCMergeTarget);

    //these tests just illustrate for you the person reading this that merges don't create duplicates
    expect(testData.smallJournalA.entries.length).toBe(1);
    expect(testData.smallJournalB.entries.length).toBe(1);
    expect(testData.smallJournalC.entries.length).toBe(2);
    //the duplicates are ignored & the updated one replaced the older one
    expect(ABCMerge.entries.length).toBe(3); // 4 is less than 3 because of duplicates & updates

    //through all that the original object is retained & unmodified
    expect(testData.smallJournalA).toEqual(staticA);
    expect(testData.smallJournalB).toEqual(staticB);
  })

})

describe('Data Journal Grouping with groupBy', () => {
  test('Group By Source', () => {
    const dataJournalToGroup = testData.smallJournalABC;
    expect(DJ.groupBy('source', dataJournalToGroup)).toEqual(testData.expectedGroupingBySource);
  })

  test('Group By Deleted', () => {
    const dataJournalToGroup = testData.journalToOverviewAndIndex;
    expect(DJ.groupBy('deleted', dataJournalToGroup)).toEqual(testData.expectedGroupingByDeleted);
  })

  test('Group By Defs', () => {
    const dataJournalToGroup = testData.smallJournalABC;
    expect(DJ.groupByDefs(dataJournalToGroup)).toEqual(testData.expectedGroupingByDefs);
  })
})

describe('Data Journal Filtering', () => {
  test('Basic Filters', () => {
    const dataJournal = testData.journalToOverviewAndIndex;
    //baseline
    expect(dataJournal.entries.length).toBe(4);
    //remove the deleted entry
    expect(DJ.filterTo({deleted: false}, dataJournal).entries.length).toBe(3);
    //removes two before that second
    expect(DJ.filterTo({from: "2024-09-05T11:09:00"}, dataJournal).entries.length).toBe(2);
    //includes the two from before that second AND the one that took place during that second
    expect(DJ.filterTo({to: "2024-09-05T11:09:00"}, dataJournal).entries.length).toBe(3);
    //includes only the earliest
    expect(DJ.filterTo({updatedBefore: "m0ofgfiz"}, dataJournal).entries.length).toBe(1);
    //includes the other 3, but not the earliest
    //note this is the exact updated string from the one that is filtered OUT
    //whereas "from" and "to" are "or equal to" relationships, 
    //the updated ones are strictly "before" and "after" relationships
    expect(DJ.filterTo({updatedAfter: "m0ofgfio"}, dataJournal).entries.length).toBe(3);
    //grabbing two entries by id yeilds those two entries
    expect(DJ.filterTo({entryIds: ['m0ofgfio_gjlp','m0ogdggg_ca3t']}, dataJournal).entries.length).toBe(2);
    //grabbing two entries by id yeilds those two entries
    expect(DJ.filterTo({entryIds: ['m0ofgfio_gjlp','m0ogdggg_ca3t']}, dataJournal).entries.length).toBe(2);
    //small test dataset, so here's a couple of illustrations of defs filtering
    expect(DJ.filterTo({defs: ['BOOK_NAME']}, dataJournal).entries.length).toBe(2);
    expect(DJ.filterTo({defs: ['WORKOUT_TYPE']}, dataJournal).entries.length).toBe(2);
    //one has one, one has the other, one has both, one has neither, so 3 of the 4 show up here
    expect(DJ.filterTo({defs: ['WORKOUT_TYPE', 'BOOK_NAME']}, dataJournal).entries.length).toBe(3); 
    //not sure how useful this will be, but here it is working.
    expect(DJ.filterTo({limit: 3}, dataJournal).entries.length).toBe(3); 

    //you can also filter by entries, which will return only entries, but otherwise works the same
    const justTheEntries = dataJournal.entries;
    expect(DJ.filterTo({from: "2024-09-05T11:09:00"}, dataJournal).entries).toEqual(DJ.filterTo({from: "2024-09-05T11:09:00"}, justTheEntries));
  })

  test('Combining Filters', () => {
    const dataJournal = testData.journalToOverviewAndIndex;
    const filters = {
      from: '2024-09-05T00:00:00',
      to: '2024-09-05T23:59:59'
    }
    //selects only that day
    expect(DJ.filterTo(filters, dataJournal).entries.length).toBe(2);
    const moreFilters = {
      from: '2024-09-05T00:00:00',
      to: '2024-09-05T23:59:59',
      defs: ['BOOK_NAME']
    }
    //selects only the entry with books that day
    expect(DJ.filterTo(moreFilters, dataJournal).entries.length).toBe(1);
  })
})

describe('Data Journal Quality Checks', () => {
  test('Absence of error on good data', () => {
    const properDataJournal = testData.journalToOverviewAndIndex;
    expect(() => {DJ.qualityCheck(properDataJournal)}).not.toThrowError();
    //empty data journals are high quality!
    expect(() => {DJ.qualityCheck({defs:[], entries: []})}).not.toThrowError();
  })

  test('Overview checks', () => {
    let faultyDataJournal: DataJournal = {
      defs: [],
      entries: [],
      overview: {
        counts: {
          defs: 1, //wrong
        }
      }
    }
    //overview errors are not high priority, a warning is loged & nothing more
    expect(() => {DJ.qualityCheck(faultyDataJournal)}).not.toThrowError()
    expect(() => {DJ.qualityCheck(faultyDataJournal, 'all errors thrown')}).toThrowError();
    faultyDataJournal= {
      defs: [],
      entries: [],
      overview: {
        counts: {
          defs: 0, //right
          activeEntries: 0, //right
          deletedEntries: 1, //wrong
        }
      }
    }
    //overview errors are not high priority, a warning is loged & nothing more
    expect(() => {DJ.qualityCheck(faultyDataJournal)}).not.toThrowError()
    expect(() => {DJ.qualityCheck(faultyDataJournal, 'all errors thrown')}).toThrowError()
  })

  test('Def checks', () => {
    let badDef: any = {} //no id
    let faultyDataJournal: DataJournal = {
      defs: [badDef],
      entries: [],
    }
    //def missing ID is a high-priority error
    expect(() => {DJ.qualityCheck(faultyDataJournal)}).toThrowError()
    //but COULD be silence for some reason
    expect(() => {DJ.qualityCheck(faultyDataJournal, 'logs only')}).not.toThrowError()
    
    //mutating the def embedded in the test data journal
    badDef._id = 'now has an id, albeit a weird one'
    //an id is present, the def is now considered ok
    expect(() => {DJ.qualityCheck(faultyDataJournal)}).not.toThrowError()
    badDef._updated = 'this is invalid epochstr'
    //bad _updated values are low-priority issues
    expect(() => {DJ.qualityCheck(faultyDataJournal)}).not.toThrowError()
    //...but will be errors for all-error conditions
    expect(() => {DJ.qualityCheck(faultyDataJournal, 'all errors thrown')}).toThrowError()
    //an epochstr way in the future is also an error
    badDef._updated = DJ.makeEpochStrFrom('2111-11-11T11:11:11')
    expect(() => {DJ.qualityCheck(faultyDataJournal, 'all errors thrown')}).toThrowError();
    //as are ones way in the past
    badDef._updated = DJ.makeEpochStrFrom('1111-11-11T11:11:11')
    expect(() => {DJ.qualityCheck(faultyDataJournal, 'all errors thrown')}).toThrowError();
    //fixing the epochstr value
    badDef._updated = DJ.makeEpochStr();
    //now we're good
    expect(() => {DJ.qualityCheck(faultyDataJournal, 'all errors thrown')}).not.toThrowError();
    
    //and extra props will behave like bad _updated values
    badDef.weirdPropThatShouldNotBeThere = "is a low-priority error"
    expect(() => {DJ.qualityCheck(faultyDataJournal)}).not.toThrowError();
    expect(() => {DJ.qualityCheck(faultyDataJournal, 'all errors thrown')}).toThrowError();
  })

  test('Entry checks', () => {
    let badEntry: any = {_period: '2024-09-10T20:42:20'}; //no id
    let faultyDataJournal: DataJournal = {
      defs: [],
      entries: [badEntry],
    }
    //entry missing ID is a high-priority error
    expect(() => {DJ.qualityCheck(faultyDataJournal)}).toThrowError()
    //entry missing period is a high-priority error
    delete badEntry._period;
    badEntry._id = 'now has an id but no period'
    expect(() => {DJ.qualityCheck(faultyDataJournal)}).toThrowError()
    //but just an _id and a _period is good enough
    badEntry._period ='2024-09-10T20:42:20'
    expect(() => {DJ.qualityCheck(faultyDataJournal)}).not.toThrowError()
    //but if a period is mal-formed, that's error-worthy
    badEntry._period ='20240910204220'
    expect(() => {DJ.qualityCheck(faultyDataJournal)}).toThrowError()
    //fixed for future tests
    badEntry._period ='2024-09-10T20:42:20'
    //same epoch logic is called as for Defs (tested in 'Def checks' above)
    badEntry._updated = 'this is invalid epochstr'
    //bad _updated values are low-priority issues
    expect(() => {DJ.qualityCheck(faultyDataJournal, 'all errors thrown')}).toThrowError()
    badEntry._updated = DJ.makeEpochStr();
    badEntry.entryPointSansDef = 'There is no Def specifying what this key should be.'
    //and even if you fix that, there's no associated def for the entry,
    //which is a low-priority error
    expect(() => {DJ.qualityCheck(faultyDataJournal)}).not.toThrowError()
    expect(() => {DJ.qualityCheck(faultyDataJournal, 'all errors thrown')}).toThrowError()
    
  })
})
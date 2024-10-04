import { DataJournal, DJ, Entry, Def, DefType, Scope } from "../src/DataJournal";
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

describe('Data Journal Modification', () => {
  test('Making Defs and Entries', () => {
    //making this to point out it's actually not *needed*.
    let localDataJournal = DJ.newBlankDataJournal();

    //the Data Journal above never gets used below, for show.
    let momentBefore = DJ.makeEpochStr();
    const minimumDef = { _id: 'abc' }; //the only *required* property. Everything else will default
    let momentAfter = DJ.makeEpochStr();
    const defMadeFromMinimum = DJ.makeDef(minimumDef);
    expect(defMadeFromMinimum._id).toEqual(minimumDef._id); //obviously
    expect(defMadeFromMinimum._lbl).toEqual(minimumDef._id); //lbl from ID
    //updated detaults to now
    expect(parseInt(defMadeFromMinimum._updated, 36)).toBeGreaterThanOrEqual(parseInt(momentBefore, 36) - 1);
    expect(parseInt(defMadeFromMinimum._updated, 36)).toBeLessThanOrEqual(parseInt(momentAfter, 36) + 1);
    //DEFAULT GAUNTLET
    expect(defMadeFromMinimum._type).toEqual(DefType.TEXT); //default
    expect(defMadeFromMinimum._desc).toEqual('Add Description'); //default
    expect(defMadeFromMinimum._emoji).toEqual('🆕'); //default
    expect(defMadeFromMinimum._range).toEqual([]); //default
    expect(defMadeFromMinimum._tags).toEqual([]); //default

    const fullySpecifiedDef = {
      _id: "MOVIE_WATCH_NAME",
      _lbl: "Movie",
      _emoji: "🎬",
      _desc: "The name of the movie you watched.",
      _updated: "m0ofg4dw",
      _scope: Scope.MINUTE,
      _type: DefType.TEXT,
      _tags: ['media'],
      _range: []
    }
    const defMadeFromFullySpecifiedDef = DJ.makeDef(fullySpecifiedDef);
    expect(defMadeFromFullySpecifiedDef).toEqual(fullySpecifiedDef);

    momentBefore = DJ.makeEpochStr();
    const minimumEntry = { _id: 'bcd', _period: '2024-08-18T19:09:38' }; //the only *required* properties. Everything else will default
    momentAfter = DJ.makeEpochStr();
    const entryFromMinimum = DJ.makeEntry(minimumEntry);
    //assigments are taken
    expect(entryFromMinimum._id).toEqual(minimumEntry._id);
    expect(entryFromMinimum._period).toEqual(minimumEntry._period);
    //updated defaults to now
    expect(parseInt(entryFromMinimum._updated, 36)).toBeGreaterThanOrEqual(parseInt(momentBefore, 36));
    expect(parseInt(entryFromMinimum._updated, 36)).toBeLessThanOrEqual(parseInt(momentAfter, 36));
    //created defaults to updated
    expect(entryFromMinimum._created).toEqual(entryFromMinimum._updated);
    //deleted defaults to false
    expect(entryFromMinimum._deleted).toEqual(false);
    //everything else is blank
    expect(entryFromMinimum._note).toEqual('')
    expect(entryFromMinimum._source).toEqual('')

    const fullySpecifiedEntry = {
      _id: "m0ofgfio_gjlp",
      _period: "2024-09-04T18:39:00",
      _created: "m0ofgfio",
      _updated: "m0ofgfio",
      _deleted: false,
      _note: "A very typical entry",
      _source: "Test data",
      BOOK_NAME: "Atomic Habits"
    }
    const entryMadeFromFullySpecified = DJ.makeEntry(fullySpecifiedEntry);
    expect(entryMadeFromFullySpecified).toEqual(fullySpecifiedEntry);
  })

  test('Simple addDefs and addEntries', () => {
    let localDataJournal = DJ.newBlankDataJournal();
    //Because Data Journal never mutates, calling up any DJ.whatever methods will
    //inevitably create copies of stuff and loop-to-merge, even if you *know* it's new.
    //Thus the fastest approach for adding new Defs and Entries is to make them then
    //directly mutate the Data Journal object itself.
    const newMinimumDef: Partial<Def> = { _id: 'def1' } //Defs only NEED an "_id"
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

    //same as above, but for entries.
    localDataJournal = DJ.newBlankDataJournal([testData.bookDef]);
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

  test('Full Transaction Handling', () => {
    let localDataJournal = DJ.newBlankDataJournal();
    //create
    let newDataJournal = DJ.commit(localDataJournal, testData.createOnlyTransaction);
    expect(newDataJournal.defs.length).toBe(1);
    expect(newDataJournal.defs[0]._id).toBe('defOne'); //all fields were set
    expect(newDataJournal.defs[0]._type).toBe(DefType.TEXT);
    expect(newDataJournal.defs[0]._updated).toBe('m0a3fajl');
    expect(newDataJournal.defs[0]._emoji).toBe('🧰');
    expect(newDataJournal.entries.length).toBe(1);
    expect(newDataJournal.entries[0]._id).toBe('m0a3faoe_oapl'); //all fields were set
    expect(newDataJournal.entries[0]._period).toBe('2024-09-21T00:15:21'); //all fields were set
    expect(newDataJournal.entries[0]._updated).toBe('m0a3faoe'); //all fields were set
    expect(newDataJournal.entries[0].OTHERKEYS).toBe('Not a problem'); //all fields were set
    //modify
    newDataJournal = DJ.commit(newDataJournal, testData.modifyOnlyTransaction);
    expect(newDataJournal.defs.length).toBe(1);
    expect(newDataJournal.defs[0]._lbl).toBe('Modification added label')
    expect(newDataJournal.defs[0]._emoji).toBe('🧰'); //but didn't remove existing key
    expect(newDataJournal.entries.length).toBe(1);
    expect(newDataJournal.entries[0]._note).toBe('Modification added note')
    expect(newDataJournal.entries[0].OTHERKEYS).toBe('Not a problem'); //but didn't remove existing key
    //replace
    newDataJournal = DJ.commit(newDataJournal, testData.replaceOnlyTransaction);
    expect(newDataJournal.defs.length).toBe(1);
    expect(newDataJournal.defs[0]._desc).toBe('Replacement adding this description also removed label'); //added propery
    expect(newDataJournal.defs[0]._lbl).toBeUndefined(); //DID remove existing key
    expect(newDataJournal.entries.length).toBe(1);
    expect(newDataJournal.entries[0]._source).toBe('Replacement added source & removed note'); //added property
    expect(newDataJournal.entries[0]._note).toBeUndefined(); //DID remove existing key
    //delete
    newDataJournal = DJ.commit(newDataJournal, testData.deleteOnlyTransaction);
    expect(newDataJournal.defs.length).toBe(0); //def is deleted for real
    expect(newDataJournal.entries.length).toBe(1); //entry is marked deleted
    expect(newDataJournal.entries[0]._deleted).toBe(true);
    expect(newDataJournal.entries[0]._updated).not.toBe('m0a3haoe'); //_update reflects time of delete

    //the original localDataJournal wasn't changed
    expect(localDataJournal.defs.length).toBe(0)
    expect(localDataJournal.entries.length).toBe(0)

    //combo transaction, probably a common occurence
    let starterDJ = testData.biggerJournal;
    const staticCopyToProveNoSideEffects = JSON.parse(JSON.stringify(starterDJ));
    newDataJournal = DJ.commit(starterDJ, testData.biggerJournalTransaction);
    //lot of things happened there.
    expect(starterDJ).toEqual(staticCopyToProveNoSideEffects);

    const defs = newDataJournal.defs;
    const entries = newDataJournal.entries;

    expect(defs.length).toBe(5); //3 original - 1 removed + 3 added
    expect(entries.length).toBe(7); //4 original + 3 added, 1 MARKED deleted,

    const modifiedDef = defs.find(def => def._id == 'WORKOUT_NAME')!;
    expect(modifiedDef._lbl).toBe("Updated lbl, no more emoji");
    expect(modifiedDef._emoji).toBeUndefined(); //was removed my replacement

    const replacedDef = defs.find(def => def._id == 'WORKOUT_TYPE')!;
    expect(replacedDef._desc).toBe('Modified Description!'); //changed
    expect(replacedDef._lbl).not.toBeUndefined(); //not deleted implicitly
    expect(defs.find(def => def._id === 'BOOK_NAME')).toBeUndefined(); //was deleted via delete

    const modifiedEntry = entries.find(entry => entry._id === "m0ofacho_poax");
    expect(modifiedEntry?._note).toBe("Undeleted via modification, should retain '_source'");
    expect(modifiedEntry?._deleted).toBe(false); //another modification I made
    expect(modifiedEntry?._source).toBe('Test daaata') //existing property retained

    const replacedEntry = entries.find(entry => entry._id === "m0ogacof_3fjk");
    expect(replacedEntry?._note).toBe("Replaced - with no more book BOOK prop");
    expect(replacedEntry?.BOOK_NAME).toBeUndefined(); // was deleted by replacement

    const deletedEntry = entries.find(entry => entry._id === 'm0ofgfio_gjlp');
    expect(deletedEntry?._deleted).toBe(true); //was MARKED as deleted
    expect(deletedEntry?._updated).not.toBe('m0ofgfio'); //will now reflect time of deletion
  })
})

describe('Data Journal Overviewing & Indexing', () => {
  test("DataJournal Overview Creation & Use", () => {
    let dataJournalWithOverview = DJ.addOverview(testData.biggerJournal);
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
    let dataJournalWithOverview = DJ.addOverview(testData.biggerJournal);
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
    const dataJournalToGroup = testData.biggerJournal;
    expect(DJ.groupBy('deleted', dataJournalToGroup)).toEqual(testData.expectedGroupingByDeleted);
  })

  test('Group By Defs', () => {
    const dataJournalToGroup = testData.smallJournalABC;
    expect(DJ.groupByDefs(dataJournalToGroup)).toEqual(testData.expectedGroupingByDefs);
  })

  test('Group By Period', () => {
    const dataJournalToGroup = testData.biggerJournal;
    expect(DJ.groupByPeriod(dataJournalToGroup,Scope.DAY)).toEqual(testData.expectedGroupingByDays);
    expect(DJ.groupByPeriod(dataJournalToGroup,Scope.WEEK)).toEqual(testData.expectedGroupingByWeek);
    const smallLocalEntrySet: Entry[] = [
      {
        _id: "one",
        _period: "2024-09-20T10:30:29",
        _updated: "m0a3fajl",
        _note: 'Week 38'
      },
      {
        _id: "two",
        _period: "2024-09-27T10:30:29",
        _updated: "m0a3fajl",
        _note: 'Week 39'
      },{
        _id: "three",
        _period: "2024-10-11T10:30:29",
        _updated: "m0a3fajl",
        _note: 'Week 41'
      }
    ]
    let expectedResult = {
      "2024-W38": [
        {
          _id: "one",
          _period: "2024-09-20T10:30:29",
          _updated: "m0a3fajl",
          _note: "",
        },
      ],
      "2024-W39": [
        {
          _id: "two",
          _period: "2024-09-27T10:30:29",
          _updated: "m0a3fajl",
          _note: "",
        },
      ],
      "2024-W40": [],
      "2024-W41": [
        {
          _id: "three",
          _period: "2024-10-11T10:30:29",
          _updated: "m0a3fajl",
          _note: "",
        },
      ],
    }
    expect(DJ.groupByPeriod(smallLocalEntrySet,Scope.WEEK)).toEqual(expectedResult);
    // passing in "false" for the 3rd param will not include empty periods
    //@ts-expect-error
    delete expectedResult["2024-W40"]
    expect(DJ.groupByPeriod(smallLocalEntrySet,Scope.WEEK,false)).toEqual(expectedResult);

  })
})

describe('Data Journal Filtering', () => {
  test('Basic Filters', () => {
    const dataJournal = testData.biggerJournal;
    //baseline
    expect(dataJournal.entries.length).toBe(4);
    //remove the deleted entry
    expect(DJ.filterTo({ deleted: false }, dataJournal).entries.length).toBe(3);
    //removes two before that second
    expect(DJ.filterTo({ from: "2024-09-05T11:09:00" }, dataJournal).entries.length).toBe(2);
    //includes the two from before that second AND the one that took place during that second
    expect(DJ.filterTo({ to: "2024-09-05T11:09:00" }, dataJournal).entries.length).toBe(3);
    //includes only the earliest
    expect(DJ.filterTo({ updatedBefore: "m0ofgfiz" }, dataJournal).entries.length).toBe(1);
    //includes the other 3, but not the earliest
    //note this is the exact updated string from the one that is filtered OUT
    //whereas "from" and "to" are "or equal to" relationships, 
    //the updated ones are strictly "before" and "after" relationships
    expect(DJ.filterTo({ updatedAfter: "m0ofgfio" }, dataJournal).entries.length).toBe(3);
    //grabbing two entries by id yeilds those two entries
    expect(DJ.filterTo({ entryIds: ['m0ofgfio_gjlp', 'm0ogdggg_ca3t'] }, dataJournal).entries.length).toBe(2);
    //grabbing two entries by id yeilds those two entries
    expect(DJ.filterTo({ entryIds: ['m0ofgfio_gjlp', 'm0ogdggg_ca3t'] }, dataJournal).entries.length).toBe(2);
    //small test dataset, so here's a couple of illustrations of defs filtering
    expect(DJ.filterTo({ defs: ['BOOK_NAME'] }, dataJournal).entries.length).toBe(2);
    expect(DJ.filterTo({ defs: ['WORKOUT_TYPE'] }, dataJournal).entries.length).toBe(2);
    //one has one, one has the other, one has both, one has neither, so 3 of the 4 show up here
    expect(DJ.filterTo({ defs: ['WORKOUT_TYPE', 'BOOK_NAME'] }, dataJournal).entries.length).toBe(3);
    //not sure how useful this will be, but here it is working.
    expect(DJ.filterTo({ limit: 3 }, dataJournal).entries.length).toBe(3);

    //you can also filter by entries, which will return only entries, but otherwise works the same
    const justTheEntries = dataJournal.entries;
    expect(DJ.filterTo({ from: "2024-09-05T11:09:00" }, dataJournal).entries).toEqual(DJ.filterTo({ from: "2024-09-05T11:09:00" }, justTheEntries));
  })

  test('Combining Filters', () => {
    const dataJournal = testData.biggerJournal;
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

describe('Data Journal & Entry Sorting', () => {
  test('Sort Entries', () => {
    const entriesAsc = DJ.sortBy('_period', testData.biggerJournal.entries, 'asc') as Entry[];
    const entriesDesc = DJ.sortBy('_period', testData.biggerJournal.entries, 'desc') as Entry[];
    expect(entriesAsc.map(entry => entry._period)).toEqual([
      '2024-09-04T18:39:00',
      '2024-09-05T11:05:00',
      '2024-09-05T11:09:00',
      '2024-09-06T10:38:00',
    ]);
    expect(entriesDesc.map(entry => entry._period)).toEqual([
      '2024-09-06T10:38:00',
      '2024-09-05T11:09:00',
      '2024-09-05T11:05:00',
      '2024-09-04T18:39:00',
    ])
  })
  test('Sort Entries by Journal', () => {
    const sortedDJ = DJ.sortBy('_id', testData.biggerJournal, 'asc') as DataJournal;
    expect(sortedDJ.entries.map(entry => entry._id)).toEqual([
      "m0ofacho_poax",
      "m0ofgfio_gjlp",
      "m0ogacof_3fjk",
      "m0ogdggg_ca3t",
    ])
  })
})

describe('Data Journal Quality Checks', () => {
  test('Absence of error on good data', () => {
    const properDataJournal = testData.biggerJournal;
    expect(() => { DJ.qualityCheck(properDataJournal) }).not.toThrowError();
    //empty data journals are high quality!
    expect(() => { DJ.qualityCheck({ defs: [], entries: [] }) }).not.toThrowError();
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
    expect(() => { DJ.qualityCheck(faultyDataJournal) }).not.toThrowError()
    expect(() => { DJ.qualityCheck(faultyDataJournal, 'all errors thrown') }).toThrowError();
    faultyDataJournal = {
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
    expect(() => { DJ.qualityCheck(faultyDataJournal) }).not.toThrowError()
    expect(() => { DJ.qualityCheck(faultyDataJournal, 'all errors thrown') }).toThrowError()
  })

  test('Def checks', () => {
    let badDef: any = {} //no id
    let faultyDataJournal: DataJournal = {
      defs: [badDef],
      entries: [],
    }
    //def missing ID is a high-priority error
    expect(() => { DJ.qualityCheck(faultyDataJournal) }).toThrowError()
    //but COULD be silence for some reason
    expect(() => { DJ.qualityCheck(faultyDataJournal, 'logs only') }).not.toThrowError()

    //mutating the def embedded in the test data journal
    badDef._id = 'now has an id, albeit a weird one'
    //an id is present, the def is now considered ok
    expect(() => { DJ.qualityCheck(faultyDataJournal) }).not.toThrowError()
    badDef._updated = 'this is invalid epochstr'
    //bad _updated values are low-priority issues
    expect(() => { DJ.qualityCheck(faultyDataJournal) }).not.toThrowError()
    //...but will be errors for all-error conditions
    expect(() => { DJ.qualityCheck(faultyDataJournal, 'all errors thrown') }).toThrowError()
    //an epochstr way in the future is also an error
    badDef._updated = DJ.makeEpochStrFrom('2111-11-11T11:11:11')
    expect(() => { DJ.qualityCheck(faultyDataJournal, 'all errors thrown') }).toThrowError();
    //as are ones way in the past
    badDef._updated = DJ.makeEpochStrFrom('1111-11-11T11:11:11')
    expect(() => { DJ.qualityCheck(faultyDataJournal, 'all errors thrown') }).toThrowError();
    //fixing the epochstr value
    badDef._updated = DJ.makeEpochStr();
    //now we're good
    expect(() => { DJ.qualityCheck(faultyDataJournal, 'all errors thrown') }).not.toThrowError();

    //and extra props will behave like bad _updated values
    badDef.weirdPropThatShouldNotBeThere = "is a low-priority error"
    expect(() => { DJ.qualityCheck(faultyDataJournal) }).not.toThrowError();
    expect(() => { DJ.qualityCheck(faultyDataJournal, 'all errors thrown') }).toThrowError();
  })

  test('Entry checks', () => {
    let badEntry: any = { _period: '2024-09-10T20:42:20' }; //no id
    let faultyDataJournal: DataJournal = {
      defs: [],
      entries: [badEntry],
    }
    //entry missing ID is a high-priority error
    expect(() => { DJ.qualityCheck(faultyDataJournal) }).toThrowError()
    //entry missing period is a high-priority error
    delete badEntry._period;
    badEntry._id = 'now has an id but no period'
    expect(() => { DJ.qualityCheck(faultyDataJournal) }).toThrowError()
    //but just an _id and a _period is good enough
    badEntry._period = '2024-09-10T20:42:20'
    expect(() => { DJ.qualityCheck(faultyDataJournal) }).not.toThrowError()
    //but if a period is mal-formed, that's error-worthy
    badEntry._period = '20240910204220'
    expect(() => { DJ.qualityCheck(faultyDataJournal) }).toThrowError()
    //fixed for future tests
    badEntry._period = '2024-09-10T20:42:20'
    //same epoch logic is called as for Defs (tested in 'Def checks' above)
    badEntry._updated = 'this is invalid epochstr'
    //bad _updated values are low-priority issues
    expect(() => { DJ.qualityCheck(faultyDataJournal, 'all errors thrown') }).toThrowError()
    badEntry._updated = DJ.makeEpochStr();
    badEntry.entryPointSansDef = 'There is no Def specifying what this key should be.'
    //and even if you fix that, there's no associated def for the entry,
    //which is a low-priority error
    expect(() => { DJ.qualityCheck(faultyDataJournal) }).not.toThrowError()
    expect(() => { DJ.qualityCheck(faultyDataJournal, 'all errors thrown') }).toThrowError()

  })
})

describe('Data Journal Diff Reporting', () => {
  const beforeDJ = testData.biggerJournal;
  const afterDJ = DJ.commit(beforeDJ, testData.biggerJournalTransaction);

  test('No Differences', () => {
    const diffs = DJ.diffReport(beforeDJ, beforeDJ);
    expect(diffs.createdDefs).toBe(0);
    expect(diffs.updatedDefs).toBe(0);
    expect(diffs.deleteDefs).toBe(0);
    expect(diffs.createdEntries).toBe(0);
    expect(diffs.updatedEntries).toBe(0);
    expect(diffs.deleteEntries).toBe(0);
    expect(diffs.sameDefs).toBe(3);
    expect(diffs.sameEntries).toBe(4);
    expect(diffs.defDiffs).toEqual([]);
    expect(diffs.entryDiffs).toEqual([]);
  })

  test('Difference Reporting', () => {
    const diffs = DJ.diffReport(beforeDJ, afterDJ);
    expect(diffs.createdDefs).toBe(3);
    expect(diffs.updatedDefs).toBe(2);
    expect(diffs.deleteDefs).toBe(1);
    expect(diffs.createdEntries).toBe(3);
    expect(diffs.updatedEntries).toBe(2);
    expect(diffs.deleteEntries).toBe(1);
    expect(diffs.sameDefs).toBe(0);
    expect(diffs.sameEntries).toBe(1);
    expect(diffs.defDiffs).toEqual(testData.expectedDefDifferences);
    expect(diffs.entryDiffs).toEqual(testData.expectedEntryDifferences);
  })
})

describe('Data Journal Utility Methods', () => {
  test('Epoch String Validator', () => {
    const epochStr = DJ.makeEpochStr();
    //@ts-expect-error - hacking to private method
    expect(DJ.isValidEpochStr(epochStr)).toBe(true);
    //@ts-expect-error - hacking to private method
    expect(DJ.isValidEpochStr('invalid one')).toBe(false);
    //@ts-expect-error - hacking to private method
    expect(DJ.isValidEpochStr('2024-09-20')).toBe(false);
    //@ts-expect-error - hacking to private method
    expect(DJ.isValidEpochStr('2024-09-20T10:30:40')).toBe(false);
    //@ts-expect-error - hacking to private method
    expect(DJ.isValidEpochStr('')).toBe(false);
    //@ts-expect-error - hacking to private method
    expect(DJ.isValidEpochStr('abadluck')).toBe(true); //technically valid
    //@ts-expect-error - hacking to private method
    expect(DJ.isValidEpochStr('m0a3!!!!')).toBe(false);
    
  })

  test('Standardized String Methods', () => {
    let myString = '  This is NON-standard  ';
    expect(DJ.standardizeKey(myString)).toBe('THIS_IS_NON-STANDARD');
    expect(DJ.stringsAreEqualStandardized(myString, 'THIS_IS_NON-STANDARD')).toBe(true);
    const myUnstandardArray = ["one ", "tWO", "   three items    "];
    expect(DJ.strInArrayStandardized('one', myUnstandardArray)).toBe(true);
    expect(DJ.strInArrayStandardized('ONE', myUnstandardArray)).toBe(true);
    expect(DJ.strInArrayStandardized('  ONE   ', myUnstandardArray)).toBe(true);
    expect(DJ.strInArrayStandardized('three items', myUnstandardArray)).toBe(true);
    expect(DJ.strInArrayStandardized('three_items', myUnstandardArray)).toBe(true);
    expect(DJ.strInArrayStandardized(' THREE_items ', myUnstandardArray)).toBe(true);
    //does NOT contain an element that completely matches "three"
    expect(DJ.strInArrayStandardized('three', myUnstandardArray)).toBe(false);
    expect(DJ.strInArrayStandardized('not in it', myUnstandardArray)).toBe(false);

    const arrayWithOverlap = [' One', 'other','elements']; //matches "one" after standardization
    expect(DJ.strArrayShareElementStandardized(myUnstandardArray,arrayWithOverlap)).toBe(true);
    
    const arrayWithNoOverlap = ['no','matches','here'];
    expect(DJ.strArrayShareElementStandardized(myUnstandardArray,arrayWithNoOverlap)).toBe(false);
  })
})
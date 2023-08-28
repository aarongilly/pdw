import * as pdw from './pdw.js'
import { Query, Scope } from './pdw.js'
// import { exportToFile, importFromFile } from './dataStores/fileAsyncDataStores.js';
import { Temporal, toTemporalInstant } from 'temporal-polyfill';
import { importFirestore, importMongo, importOldV9, importOldest, importPreviousCSV } from './onetimeImports.js'
import { FireDataStore } from './dataStores/firestoreDataStore.js';


const pdwRef = pdw.PDW.getInstance();


let origUid = pdw.makeUID();

let def = pdwRef.newDef({
    _uid: origUid,
    _did: 'aaaa',
    _lbl: 'Def 1',
    _desc: 'Def Desc',
    _pts: [
        {
            _pid: 'a111',
            _lbl: 'Def 1 point 1',
            _desc: 'Point Desc'
        },
        {
            _pid: 'a222',
            _lbl: 'Def 1 point 2',
            _desc: 'Numero Dos'
        }
    ]
});

/**
 * Not modified to begin with.
 */
//(def.isSaved()).toBe(true);

/**
 * Element.delete
*/
//modify Def
//(def.deleted).toBe(false);
def.deleted = true;
//(def.deleted).toBe(true);
//(def.isSaved()).toBe(false);
//its counterpart in the DataStore isn't changed yet
let defFromStores = pdwRef.getDefs({ did: 'aaaa' });
//(defFromStores.length).toBe(1);
let defFromStore = defFromStores[0];
//(defFromStore.deleted).toBe(false);
//(pdwRef.getDefs({ includeDeleted: 'no' }).length).toBe(1);
//(pdwRef.getDefs({ includeDeleted: 'only' }).length).toBe(0);
//save it to the datastore
def.save();
//(def.isSaved()).toBe(true);
//DataStore now has the deletion, but didnt' spawn any additional elements
//(pdwRef.getDefs({ includeDeleted: 'no' }).length).toBe(0);
//(pdwRef.getDefs({ includeDeleted: 'only' }).length).toBe(1);
//undelete the def in memory
def.deleted = false;
//(def.isSaved()).toBe(false);
//data store didn't change
//(pdwRef.getDefs({ includeDeleted: 'no' }).length).toBe(0);
//(pdwRef.getDefs({ includeDeleted: 'only' }).length).toBe(1);
//write undelete back to datastore
def.save();
//(def.isSaved()).toBe(true);
//DataStore now has the deletion, but didnt' spawn any additional elements
//(pdwRef.getDefs({ includeDeleted: 'no' }).length).toBe(1);
//(pdwRef.getDefs({ includeDeleted: 'only' }).length).toBe(0);

/**
 * Do other types of modifications.
 */
def.lbl = "Def 1 with new Label";
//(def.isSaved()).toBe(false);
//no change yet
//(pdwRef.getDefs({ includeDeleted: 'no' })[0].lbl).toBe('Def 1');
//(pdwRef.getDefs({ includeDeleted: 'only' }).length).toBe(0);
//write change to the data store
def.save();
let notDeletedFromStore = pdwRef.getDefs({ includeDeleted: 'no' })
let deletedFromStore = pdwRef.getDefs({ includeDeleted: 'only' })
//(notDeletedFromStore.length).toBe(1);
//(notDeletedFromStore[0].lbl).toBe('Def 1 with new Label');
//(deletedFromStore.length).toBe(1);
//(deletedFromStore[0].lbl).toBe('Def 1');

def.created = pdw.makeEpochStr();
def.lbl = 'Def ONE';
def.emoji = '🤿';
def.desc = 'Modify *then* verify';
def.hide = true;
def.save()

deletedFromStore = pdwRef.getDefs({ includeDeleted: 'only' })
//(deletedFromStore.length).toBe(2);
notDeletedFromStore = pdwRef.getDefs({ includeDeleted: 'no' });
//(notDeletedFromStore[0].lbl).toBe('Def ONE');
//(notDeletedFromStore[0].emoji).toBe('🤿');
//(notDeletedFromStore[0].desc).toBe('Modify *then* verify');
//(notDeletedFromStore[0].hide).toBe(true);

/**
 * Other base Def properties cannot be set due to lack of setter.
 * Cannot change _uid, _did, or _scope
 */

/**
 * saving without any changes no props doesn't change datastore
 */
//(pdwRef.getDefs({ includeDeleted: 'yes' }).length).toBe(3);
def.save();
//(pdwRef.getDefs({ includeDeleted: 'yes' }).length).toBe(3);

/**
 * Data validation for Emoji
 */
def.emoji = 'Something that is not an emoji';
//(def.emoji).toBe('🤿')

/**
 * Data validation for _updated & _created
 */
let stringDate = '2023-07-22T15:55:27'; //plaindatetime string
def.created = stringDate
//(def.created).toBe('lkehoqoo') //lkehoqoo is right
//console.log(pdw.parseTemporalFromEpochStr('lkehoqoo').toPlainDateTime().toString());
let date = new Date();
//firstDef.setProps({_created: date}); //also works, but difficult to prove again and again

//#### Updating PointDef stuff ####
/**
 * Def.addPoint
 */
def.addPoint({
    _pid: 'a333',
    _lbl: 'Added',
    _type: pdw.PointType.SELECT
});
//(def.getPoint('a111').pid).toBe('a111');
//(def.getPoint('a222').pid).toBe('a222');
//(def.getPoint('a333').pid).toBe('a333');

/**
 * PointDef modification
 */
let point = def.getPoint('Added');
//(point.pid).toBe('a333');
point.desc = "Added dynamically";
//(point.desc).toBe('Added dynamically');
//added point hasn't effected the store yet
notDeletedFromStore = pdwRef.getDefs({ includeDeleted: 'no' });
//(notDeletedFromStore.length).toBe(1);
//(notDeletedFromStore[0].pts.length).toBe(2); 
point.save();
notDeletedFromStore = pdwRef.getDefs({ includeDeleted: 'no' });
//(notDeletedFromStore.length).toBe(1);
//(notDeletedFromStore[0].pts.length).toBe(3); 
//(notDeletedFromStore[0].getPoint('a333').desc).toBe('Added dynamically'); 

/**
 * Data Validation on PointDef.setProps on emoji, rollup, and type
 */
//(point.emoji).toBe('🆕');
point.emoji =  'Invalid emoji';
//(point.emoji).toBe('🆕'); //no change
//(point.rollup).toBe(pdw.Rollup.COUNT);
//@ts-expect-error - typescript warning, nice
point.rollup = 'Invalid rollup';
//(point.rollup).toBe(pdw.Rollup.COUNT); //no change

/**
 * Def.hidePoint()
 */
//(def.pts.map(p=>p.hide)).toEqual([false,false,false]);
def.hidePoint('a222');
//(def.pts.length).toBe(3); //still got 3
//(def.pts.filter(p => p.hide===false).length).toBe(2); //but only 2 are active

/**
 * Def.reactivatePoint()
 */
def.unhidePoint('a222');
//(def.pts.map(p=>p.hide)).toEqual([false,false,false]);

/**
 * Opts
 */
point = def.getPoint('a333');
//(point.shouldHaveOpts()).toBe(true);
point.addOpt('Option 1', 'o111'); //specified _oid
//(Object.keys(point.opts).length).toBe(1);
point.addOpt('Option 2'); //unspecified _oid => one is made for it

//(Object.keys(point.opts).length).toBe(2);
point.addOpt('Option 3', 'o333'); //needed for later
point.setOpt('o111', 'New Title');
//(point.getOptLbl('o111')).toBe('New Title'); //get by opt._oid
//(point.getOptOid('New Title')).toBe('o111'); //get by opt._lbl
point.removeOpt('Option 2');
//(Object.keys(point.opts).length).toBe(2); //literally removes the option from the array
point.setOpt('o333', 'New Option 2'); //a common real world use case, I imagine
//(Object.keys(point.opts).length).toBe(2);
//(point.getOptLbl('o333')).toBe('New Option 2');

/**
 * Entries
 */
let entry = pdwRef.newEntry({ //minimal entry input using newEntry on PDW
    _did: def.did,
    'Added': 'o111', //addressed using point.lbl
    'a222': 'Point value' //addressed using point.pid
});

/**
 * Base entry props updating
 */
//(entry.note).toBe('');
//(entry.getPointVal('a222')).toBe('Point value');
//(entry.isSaved()).toBe(true);
entry.note = "Added note";
//(entry.isSaved()).toBe(false);
//(entry.note).toBe('Added note');
entry.source = 'Test procedure';
//(entry.source).toBe('Test procedure');

entry.period = '2023-07-21T14:04:33';
//(entry.period.toString()).toBe('2023-07-21T14:04:33');
let fromStore: any = pdwRef.getEntries()[0];
//(fromStore.note).toBe(''); //store not updated yet
entry.save(); //update stored entry
fromStore = pdwRef.getEntries({ includeDeleted: 'no' })[0];
//(fromStore.note).toBe('Added note'); //store updated with new entry
//(fromStore.getPointVal('a222')).toBe('Point value'); //point is retained
let original = pdwRef.getEntries({ includeDeleted: 'only' })[0];
//(original.note).toBe(''); //original entry retained unchanged
//(original.uid !== fromStore.uid).toBe(true); //uid is different
//(original.eid === fromStore.eid).toBe(true); //eid is the same

/**
 * Entry Point Values
 */
entry.setPointVals([
    { 'a333': 'o333' },
    { 'a222': 'Other point new value!' }
]);
//(entry.getPoint('a222')!.val).toBe('Other point new value!');
//(entry.getPoint('a333')!.val).toBe('o333');
//or set one at a time:
entry.setPointVal('a333', 'o111');
//(entry.getPoint('a333')!.val).toBe('o111');

/**
 * Multiselect Opts
 */
def.addPoint({
    _pid: 'a444',
    _lbl: 'Multiselect Test',
    _type: pdw.PointType.MULTISELECT,
    _opts: {
        'aaaa': 'A',
        'bbbb': 'B'
    }
}).save(); //must save to make the new point available to new entries
entry = def.newEntry({
    'a444': []
});
//(entry.getPoint('Multiselect Test')!.val).toEqual([]);
entry.setPointVal('a444', ['aaaa', 'bbbb']); //change multiselect selections
//(entry.getPoint('Multiselect Test')!.val).toEqual(['aaaa', 'bbbb']); //works
entry.setPointVal('a444', 'aaaa, bbbb, cccc'); //can also just have comma-delimited string
//(entry.getPoint('Multiselect Test')!.val).toEqual(['aaaa', 'bbbb', 'cccc']); //works, doesn't care about the non-existant 'cccc' opt
entry.setPointVal('a444', 'aaaa,bbbb'); //spacing on a comma-delimited string is ignored
//(entry.getPoint('Multiselect Test')!.val).toEqual(['aaaa', 'bbbb']); //works
entry.setPointVal('a444', 'aaaa'); //and a single string value is converted to an array
//(entry.getPoint('Multiselect Test')!.val).toEqual(['aaaa']); //works

/**
 * Entry Period scope protection
 */
entry.period = '2023-07-21';
//(entry.period.toString()).toBe('2023-07-21T00:00:00');

/**
 * Tags
 */
let tag = pdwRef.newTag({
    _tid: 'taga',
    _lbl: 'My tag',
    _dids: []
});
//(tag.dids).toEqual([]);
tag.dids = [def.did];
//(tag.dids).toEqual([def.did]);
fromStore = pdwRef.getTags()[0];
//(fromStore.dids).toEqual([]); //stores not updated yet.
tag.save();
fromStore = pdwRef.getTags()[0];
//(fromStore.dids).toEqual([def.did]); //now it is

let tagTwo = pdwRef.newTag({
    _tid: 'tagb',
    _lbl: 'Other tag'
})
/**
 * Adding and removing defs
 */
tagTwo.addDef(def); //by def ref
//(tagTwo.dids).toEqual([def.did]);
tagTwo.removeDef(def); //by def ref
//(tagTwo.dids).toEqual([]);
tagTwo.addDef(def.did); //by _did
//(tagTwo.dids).toEqual([def.did]);
tagTwo.addDef(def.did); //adding the same did doesn't create a duplicate entry
//(tagTwo.dids).toEqual([def.did]);
tagTwo.removeDef(def.did); //by _did
//(tagTwo.dids).toEqual([]);

/**
 * Tagging Def *from the Def*
 */
def.addTag(tagTwo); //by tag ref
//(tagTwo.getDefs()[0].lbl).toBe(def.lbl);
def.removeTag(tagTwo); //by tag ref
//(tagTwo.getDefs().length).toBe(0);

def.addTag(tagTwo.tid); //by tid
tagTwo = pdwRef.getTags({ tid: 'tagb' })[0]; //updated tag object is in stores
//(tagTwo.getDefs()[0].lbl).toBe(def.lbl);

def.removeTag(tagTwo.tid); //by tid
tagTwo = pdwRef.getTags({ tid: 'tagb' })[0];
//(tagTwo.getDefs().length).toBe(0);

// tagTwo.save();
// def.save();

def.addTag(tagTwo.lbl); //by tag label
//tagTwo in-memory object cannot be updated this way, it's updated via stores, gotta reload
tagTwo = pdwRef.getTags({tid:'tagb'})[0]; //this took me forever to realize
console.log(tagTwo.getDefs()[0].lbl);
tagTwo = pdwRef.getTags({ tid: 'tagb' })[0];

def.removeTag(tagTwo.lbl); //by tag label
tagTwo = pdwRef.getTags({ tid: 'tagb' })[0];
//(tagTwo.getDefs().length).toBe(0);


createTestDataSet();

// let all = new pdw.Query().inPeriod(new pdw.Period('2023-07-21').zoomOut()).run().entries;

// let summary = new pdw.Summary(all, pdw.Scope.WEEK);

// console.log(summary);




// pdwRef.dataStores = [];

// pdwRef.registerConnection(new FireDataStore(pdwRef));

// pdwRef.newDef({
//     _did: 'Test Def'
// })



// temp();
// createTestDataSet();
// console.log(pdwRef.getDefs({}).length);
// importFromFile('data-files/wholly_excel.xlsx');
// console.log(pdwRef.getDefs({}).length);
// let all = pdwRef.getAll({includeDeleted:'yes'});
// console.log(all);
// exportToFile('data-files/test.csv', all);
// exportToFile('data-files/test.json', all);
// exportToFile('data-files/test.yaml', all);
// exportToFile('data-files/test.xlsx', all);

// importPreviousCSV('real-data/pre-de-flattening/consolidated.csv')

/** -- Multi DataStore experimentation */
// pdwRef.newDef({_lbl: 'Pre joining'})
// let inMemoryDataStoreTwo = new DefaultDataStore(pdwRef);
// pdwRef.dataStores.push(inMemoryDataStoreTwo);
// pdwRef.newDef({_lbl: 'post join'});
// let defs = pdwRef.getDefs();
// console.log(defs);
// let def = pdwRef.getDefs({defLbl: 'Pre joining'})[0];
// def.setProp('_lbl', 'Updated!').save();
// defs = pdwRef.getDefs();
// console.log(defs);

function createTestDataSet() {
    const nightly = pdwRef.newDef({
        _created: '2023-07-10T20:02:30-05:00',
        _did: 'aaaa',
        _lbl: 'Nightly Review',
        _scope: pdw.Scope.DAY,
        _emoji: '👀',
        _pts: [
            {
                _emoji: '👀',
                _lbl: 'Review',
                _desc: 'Your nightly review',
                _pid: 'aaa1',
                _rollup: pdw.Rollup.COUNT,
                _type: pdw.PointType.MARKDOWN
            },
            {
                _emoji: '👔',
                _lbl: 'Work Status',
                _desc: 'Did you go in, if so where?',
                _pid: 'aaa2',
                _rollup: pdw.Rollup.COUNTOFEACH,
                _type: pdw.PointType.SELECT,
                _opts: {
                    'opt1': 'Weekend/Holiday',
                    'opt2': 'North',
                    'opt3': 'WFH',
                    'opt4': 'Vacation',
                    'opt5': 'sickday',
                }
            },
            {
                _emoji: '1️⃣',
                _desc: '10 perfect 1 horrid',
                _lbl: 'Satisfaction',
                _pid: 'aaa3',
                _rollup: pdw.Rollup.AVERAGE,
                _type: pdw.PointType.NUMBER
            },
            {
                _emoji: '😥',
                _desc: '10 perfect 1 horrid',
                _lbl: 'Physical Health',
                _pid: 'aaa4',
                _rollup: pdw.Rollup.AVERAGE,
                _type: pdw.PointType.NUMBER
            }
        ]
    });
    const quotes = pdwRef.newDef({
        _did: 'bbbb',
        _lbl: 'Quotes',
        _desc: 'Funny or good sayings',
        _scope: pdw.Scope.SECOND,
        _emoji: "💬",
        'bbb1': {
            _emoji: "💬",
            _lbl: "Quote",
            _desc: 'what was said',
            _type: pdw.PointType.TEXT
        },
        'bbb2': {
            _emoji: "🙊",
            _lbl: "Quoter",
            _desc: 'who said it',
            _type: pdw.PointType.TEXT
        },
    })
    const movies = pdwRef.newDef({
        _did: 'cccc',
        _lbl: 'Movie',
        _emoji: "🎬",
        _scope: pdw.Scope.SECOND,
        'ccc1': {
            _lbl: 'Name',
            _emoji: "🎬",
        },
        'ccc2': {
            _lbl: 'First Watch?',
            _emoji: '🆕',
            _type: pdw.PointType.BOOL
        }
    })
    const book = pdwRef.newDef({
        _did: 'dddd',
        _lbl: 'Book',
        _emoji: "📖",
        _scope: pdw.Scope.SECOND,
        'ddd1': {
            _lbl: 'Name',
            _emoji: "📖",
        },
    })
    /**
     * A tag
     */
    const mediaTag = pdwRef.newTag({
        _lbl: 'media',
        _dids: ['dddd', 'cccc'],
        _tid: 'tag1'
    });
    /**
     * Several entries
     */
    let quote = quotes.newEntry({
        _eid: 'lkfkuxon-f9ys',
        _period: '2023-07-21T14:02:13',
        _created: '2023-07-22T20:02:13Z',
        _updated: '2023-07-22T20:02:13Z',
        _note: 'Testing updates',
        'bbb1': 'You miss 100% of the shots you do not take',
        'bbb2': 'Michael Jordan' //updated later
    });
    nightly.newEntry({
        _uid: 'lkfk3sge-3s3s',
        _eid: 'lkfk3sge-bfbh',
        _period: '2023-07-20',
        _created: '2023-07-23T01:02:03Z',
        _updated: '2023-07-23T01:02:03Z',
        _deleted: false,
        _source: 'Test data',
        _note: 'Original entry',
        'aaa1': "Nice little off",
        'aaa2': 'opt1',
        'aaa3': 7,
        'aaa4': 10
    });
    nightly.newEntry({
        _uid: 'lkfkuxo8-9ysw',
        _eid: 'lkfkuxol-mnhe',
        _period: '2023-07-22',
        _created: '2023-07-22T01:02:03Z',
        _updated: '2023-07-22T01:02:03Z',
        _deleted: false,
        _source: 'Test data',
        _note: 'Original entry',
        'aaa1': "Today I didn't do **anything**.",
        'aaa2': 'opt1',
        'aaa3': 9,
        'aaa4': 10
    });
    nightly.newEntry({
        _uid: 'lkfkuxob-0av3',
        _period: '2023-07-23',
        _source: 'Test data',
        'aaa1': "Today I wrote this line of code!",
        'aaa2': 'opt3',
        'aaa3': 5,
        'aaa4': 9
    });
    nightly.newEntry({
        _period: '2023-07-21',
        _created: '2023-07-20T22:02:03Z',
        _updated: '2023-07-20T22:02:03Z',
        _note: 'pretending I felt bad',
        _source: 'Test data',
        'aaa1': "This was a Friday. I did some stuff.",
        'aaa2': 'opt2',
        'aaa3': 6,
        'aaa4': 5
    });
    book.newEntry({
        'ddd1': "Oh the places you'll go!",
        _period: '2023-07-21T18:34:38'
    })
    book.newEntry({
        _period: '2025-01-02T15:21:49',
        'ddd1': "The Time Traveller"
    })
    book.newEntry({
        _period: '2022-10-04T18:43:22',
        'ddd1': "The Time Traveller 2"
    });
    movies.newEntry({
        _period: '2023-07-24T13:15:00',
        'Name': 'Barbie',
        'First Watch?': true
    });
    movies.newEntry({
        _period: '2023-07-24T18:45:00',
        'ccc1': 'Oppenheimer',
        'ccc2': true
    });

    quote.setPointVal('bbb2', 'Michael SCOTT').save();
}

// //(entry.__tempCreated.epochMilliseconds).toBeGreaterThan(Number.parseInt(Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString()) - 5000) //created not long ago...
// //(entry.__tempCreated.epochMilliseconds).toBeLessThan(Number.parseInt(Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString())) //...but not in the future
// //(entry._period).toBe(sameSecond); //technically could fail every 1000 or so runs
// //(entry._pts.length).toBe(0); //points weren't supplied, they aren't generated
// //(entry._note).toBe(''); //default
// //(entry._source).toBe(''); //default

// importFromFile('data-files/OutJSON.json');
// altTempImport('data-files/SmallNested.yaml');

// createTestFilesDataElements();

// const defOne = pdwRef.getDefs({ did: '0m7w' })[0]
// const defTwo = pdwRef.getDefs({ did: '05a8' })[0]

// defOne.newEntry({
//     '8esq': 'Entry value'
// })
// let all = pdwRef.getAll({includeDeleted: 'yes'});

// console.log(def);
// console.log(def.getType());

// altTempExport(all, 'data-files/TestNest.yaml')

//Write to file before any updates
// let outFileOneame = 'data-files/newYaml.yaml';
// exportToFile(outFileOneame, pdwRef.getAll({ includeDeleted: 'yes' }));

/* old stuff
//the firestore/mongo big merge
// importFromFile('real-data/out-fromfirestore.csv');
// importFromFile('real-data/out-frommongo-xlated.csv');
// exportToFile('real-data/merged.csv', pdw.getAll({includeDeleted:'yes'}))

// if(false){

// importFromFile('real-data/workouts.csv');
// importFromFile('real-data/partial-old-more.csv')
// importFromFile('real-data/nearly-complete.csv')
// importFromFile('data-files/newYaml.yaml')
// importOldV9('real-data/V9-massaged.xlsx')
// exportToFile('real-data/final.yaml', pdw.getAll({}))
// const allData = pdw.getAll({});
// console.log(allData);

// importOldest('real-data/final-import.xlsx')

// importFromFile('real-data/merged-firestore-mongo.csv')
// importFromFile('real-data/partial-old-more.csv')

// const data = pdw.getAll({includeDeleted: 'yes'});
// exportToFile('real-data/partial-old-dataset.csv',data)
// exportToFile('real-data/partial-old-dataset.yaml',data)

//create all current file types from firestore & mongo data
// importFromFile('real-data/merged-firestore-mongo.csv')
// const allData = pdw.getAll({includeDeleted:'yes', did:['hovt']})
// const entries = pdw.getAll({'includeDeleted': 'yes'})
// console.log(allData);
// exportToFile('real-data/combotest.csv', entries)
// exportToFile('real-data/combotest.xlsx', entries)
// exportToFile('real-data/combotest.json', entries)
// exportToFile('real-data/combotest.yaml', entries)
// }

// exportToFile('real-data/merged.json', allData)
// exportToFile('real-data/merged.yaml', allData)
// exportToFile('real-data/merged.xlsx', allData)

// importFromFile('real-data/out-fromfirestore.csv')
// console.log('yo');
// exportToFile('real-data/deleteme.csv',pdw.getAll({}))

// createTestFiles();

// this worked. Old data, updated, import of new data merge behaved as //ed
// importFromFile('data-files/OutExcel1.xlsx');
// pdw.newEntry({
//     _did: '0m7w',
//     '8esq': '0vvb'
// })
// importFromFile('data-files/OutExcel2.xlsx');
// exportToFile('data-files/OutExcel4.xlsx', pdw.getAll({includeDeleted: 'yes'}))

// exportToFile('real-data/out-frommongo.csv', pdw.getAll({includeDeleted:'yes'}))
// importFromFile('data-files/outCSV.csv');
// console.log('yo');

// exportToFile('data-files/out-',pdw.getAll({}))

// createTestFiles();

// importFromFile('data-files/OutJSON.json');
// importFromFile('data-files/OutExcel2.xlsx');
// let xl = new AsyncExcelNatural().importFrom('data-files/Excel_Test.xlsx')

// const endOfJan = new Period('2023-01-30')
// const januaryDateButFirstWeekOfFeb = new Period(endOfJan.zoomOut());
// const toMonth = januaryDateButFirstWeekOfFeb.zoomOut()
// console.log(januaryDateButFirstWeekOfFeb);

// let mydef = pdw.getDefs({
//     updatedBefore: 'lgvn3a11',
//     includeDeleted: 'yes'
// })

// importFromFile('data-files/OutYaml.yaml');

// console.log(pdw.allDataSince());
*/

function temp(){
    let a = {
        "defs": [
            {
                "_uid": "lkljr430-u0fy",
                "_deleted": false,
                "_updated": "lkljr432",
                "_created": "lkljr432",
                "_did": "aaaa",
                "_lbl": "Nightly Review",
                "_desc": "Set a description",
                "_emoji": "👀",
                "_scope": "DAY",
                "_pts": [
                    {
                        "_lbl": "Review",
                        "_desc": "Your nightly review",
                        "_emoji": "👀",
                        "_type": "MARKDOWN",
                        "_rollup": "COUNT",
                        "_active": true,
                        "_pid": "aaa1"
                    },
                    {
                        "_lbl": "Work Status",
                        "_desc": "Did you go in, if so where?",
                        "_emoji": "👔",
                        "_type": "SELECT",
                        "_rollup": "COUNTOFEACH",
                        "_active": true,
                        "_opts": {
                            "opt1": "Weekend/Holiday",
                            "opt2": "North",
                            "opt3": "WFH",
                            "opt4": "Vacation",
                            "opt5": "sickday"
                        },
                        "_pid": "aaa2"
                    },
                    {
                        "_lbl": "Satisfaction",
                        "_desc": "10 perfect 1 horrid",
                        "_emoji": "1️⃣",
                        "_type": "NUMBER",
                        "_rollup": "SUM",
                        "_active": true,
                        "_pid": "aaa3"
                    },
                    {
                        "_lbl": "Physical Health",
                        "_desc": "10 perfect 1 horrid",
                        "_emoji": "😥",
                        "_type": "AVERAGE",
                        "_rollup": "COUNT",
                        "_active": true,
                        "_pid": "aaa4"
                    }
                ]
            },
            {
                "_uid": "lkljr434-o59g",
                "_deleted": false,
                "_updated": "lkljr434",
                "_created": "lkljr434",
                "_did": "bbbb",
                "_lbl": "Quotes",
                "_desc": "Funny or good sayings",
                "_emoji": "💬",
                "_scope": "SECOND",
                "_pts": [
                    {
                        "_lbl": "Quote",
                        "_desc": "what was said",
                        "_emoji": "💬",
                        "_type": "TEXT",
                        "_rollup": "COUNT",
                        "_active": true,
                        "_pid": "bbb1"
                    },
                    {
                        "_lbl": "Quoter",
                        "_desc": "who said it",
                        "_emoji": "🙊",
                        "_type": "TEXT",
                        "_rollup": "COUNT",
                        "_active": true,
                        "_pid": "bbb2"
                    }
                ]
            },
            {
                "_uid": "lkljr435-phsn",
                "_deleted": false,
                "_updated": "lkljr435",
                "_created": "lkljr435",
                "_did": "cccc",
                "_lbl": "Movie",
                "_desc": "Set a description",
                "_emoji": "🎬",
                "_scope": "SECOND",
                "_pts": [
                    {
                        "_lbl": "Name",
                        "_desc": "Set a description",
                        "_emoji": "🎬",
                        "_type": "TEXT",
                        "_rollup": "COUNT",
                        "_active": true,
                        "_pid": "ccc1"
                    },
                    {
                        "_lbl": "First Watch?",
                        "_desc": "Set a description",
                        "_emoji": "🆕",
                        "_type": "BOOL",
                        "_rollup": "COUNT",
                        "_active": true,
                        "_pid": "ccc2"
                    }
                ]
            },
            {
                "_uid": "lkljr436-0tyq",
                "_deleted": false,
                "_updated": "lkljr436",
                "_created": "lkljr436",
                "_did": "dddd",
                "_lbl": "Book",
                "_desc": "Set a description",
                "_emoji": "📖",
                "_scope": "SECOND",
                "_pts": [
                    {
                        "_lbl": "Name",
                        "_desc": "Set a description",
                        "_emoji": "📖",
                        "_type": "TEXT",
                        "_rollup": "COUNT",
                        "_active": true,
                        "_pid": "ddd1"
                    }
                ]
            }
        ],
        "entries": [
            {
                "_uid": "lkljr437-vqba",
                "_deleted": true,
                "_updated": "lkljr4sn",
                "_created": "lkefsa6g",
                "_eid": "lkfkuxon-f9ys",
                "_note": "Testing updates",
                "_did": "bbbb",
                "_period": "2023-07-21T14:02:13",
                "_source": "",
                "bbb1": "You miss 100% of the shots you do not take",
                "bbb2": "Michael Jordan"
            },
            {
                "_uid": "lkfkuxo8-9ysw",
                "_deleted": false,
                "_updated": "lkdb20oo",
                "_created": "lkdb20oo",
                "_eid": "lkfkuxol-mnhe",
                "_note": "Original entry",
                "_did": "aaaa",
                "_period": "2023-07-22",
                "_source": "",
                "aaa1": "Today I didn't do **anything**.",
                "aaa2": "opt1",
                "aaa3": 9,
                "aaa4": 10
            },
            {
                "_uid": "lkfkuxob-0av3",
                "_deleted": false,
                "_updated": "lkljr4s6",
                "_created": "lkljr4s6",
                "_eid": "lkljr4s7-0vtg",
                "_note": "",
                "_did": "aaaa",
                "_period": "2023-07-23",
                "_source": "",
                "aaa1": "Today I wrote this line of code!",
                "aaa2": "opt3",
                "aaa3": 5,
                "aaa4": 9
            },
            {
                "_uid": "lkljr4s7-00jo",
                "_deleted": false,
                "_updated": "lkbp6ooo",
                "_created": "lkbp6ooo",
                "_eid": "lkljr4s8-5rjq",
                "_note": "pretending I felt bad",
                "_did": "aaaa",
                "_period": "2023-07-21",
                "_source": "",
                "aaa1": "This was a Friday. I did some stuff.",
                "aaa2": "opt2",
                "aaa3": 6,
                "aaa4": 5
            },
            {
                "_uid": "lkljr4s9-lttb",
                "_deleted": false,
                "_updated": "lkljr4sa",
                "_created": "lkljr4s9",
                "_eid": "lkljr4sc-0cai",
                "_note": "",
                "_did": "dddd",
                "_period": "2023-07-27T14:27:41",
                "_source": "",
                "ddd1": "Oh the places you'll go!"
            },
            {
                "_uid": "lkljr4sd-a117",
                "_deleted": false,
                "_updated": "lkljr4se",
                "_created": "lkljr4sd",
                "_eid": "lkljr4se-thsr",
                "_note": "",
                "_did": "dddd",
                "_period": "2025-01-02T15:21:49",
                "_source": "",
                "ddd1": "The Time Traveller"
            },
            {
                "_uid": "lkljr4sf-0dix",
                "_deleted": false,
                "_updated": "lkljr4sf",
                "_created": "lkljr4sf",
                "_eid": "lkljr4sg-010g",
                "_note": "",
                "_did": "dddd",
                "_period": "2022-10-04T18:43:22",
                "_source": "",
                "ddd1": "The Time Traveller 2"
            },
            {
                "_uid": "lkljr4sg-aayg",
                "_deleted": false,
                "_updated": "lkljr4si",
                "_created": "lkljr4sh",
                "_eid": "lkljr4sj-bulk",
                "_note": "",
                "_did": "cccc",
                "_period": "2023-07-24T13:15:00",
                "_source": "",
                "ccc1": "Barbie",
                "ccc2": true
            },
            {
                "_uid": "lkljr4sj-grd4",
                "_deleted": false,
                "_updated": "lkljr4sk",
                "_created": "lkljr4sk",
                "_eid": "lkljr4sk-526e",
                "_note": "",
                "_did": "cccc",
                "_period": "2023-07-24T18:45:00",
                "_source": "",
                "ccc1": "Oppenheimer",
                "ccc2": true
            },
            {
                "_uid": "lkljr4sl-aojw",
                "_deleted": false,
                "_updated": "lkljr4sl",
                "_created": "lkefsa6g",
                "_eid": "lkfkuxon-f9ys",
                "_note": "Testing updates",
                "_did": "bbbb",
                "_period": "2023-07-21T14:02:13",
                "_source": "",
                "bbb1": "You miss 100% of the shots you do not take",
                "bbb2": "Michael SCOTT"
            }
        ],
        "tags": [
            {
                "_uid": "lkljr437-8ff7",
                "_deleted": false,
                "_updated": "lkljr437",
                "_created": "lkljr437",
                "_tid": "tag1",
                "_lbl": "media",
                "_dids": [
                    "dddd",
                    "cccc"
                ]
            }
        ]
    }

    let b = {
        "defs": [
            {
                "_uid": "lkljr430-u0fy",
                "_deleted": false,
                "_updated": "lkljr432",
                "_created": "lkljr432",
                "_did": "aaaa",
                "_lbl": "Nightly Review",
                "_desc": "Set a description",
                "_emoji": "👀",
                "_scope": "DAY",
                "_pts": [
                    {
                        "_lbl": "Review",
                        "_desc": "Your nightly review",
                        "_emoji": "👀",
                        "_type": "MARKDOWN",
                        "_rollup": "COUNT",
                        "_active": true,
                        "_pid": "aaa1"
                    },
                    {
                        "_lbl": "Work Status",
                        "_desc": "Did you go in, if so where?",
                        "_emoji": "👔",
                        "_type": "SELECT",
                        "_rollup": "COUNT",
                        "_active": true,
                        "_opts": {
                            "opt1": "Weekend/Holiday",
                            "opt2": "North",
                            "opt3": "WFH",
                            "opt4": "Vacation",
                            "opt5": "sickday"
                        },
                        "_pid": "aaa2"
                    },
                    {
                        "_lbl": "Satisfaction",
                        "_desc": "10 perfect 1 horrid",
                        "_emoji": "1️⃣",
                        "_type": "NUMBER",
                        "_rollup": "COUNT",
                        "_active": true,
                        "_pid": "aaa3"
                    },
                    {
                        "_lbl": "Physical Health",
                        "_desc": "10 perfect 1 horrid",
                        "_emoji": "😥",
                        "_type": "NUMBER",
                        "_rollup": "COUNT",
                        "_active": true,
                        "_pid": "aaa4"
                    }
                ]
            },
            {
                "_uid": "lkljr434-o59g",
                "_deleted": false,
                "_updated": "lkljr434",
                "_created": "lkljr434",
                "_did": "bbbb",
                "_lbl": "Quotes",
                "_desc": "Funny or good sayings",
                "_emoji": "💬",
                "_scope": "SECOND",
                "_pts": [
                    {
                        "_lbl": "Quote",
                        "_desc": "what was said",
                        "_emoji": "💬",
                        "_type": "TEXT",
                        "_rollup": "COUNT",
                        "_active": true,
                        "_pid": "bbb1"
                    },
                    {
                        "_lbl": "Quoter",
                        "_desc": "who said it",
                        "_emoji": "🙊",
                        "_type": "TEXT",
                        "_rollup": "COUNT",
                        "_active": true,
                        "_pid": "bbb2"
                    }
                ]
            },
            {
                "_uid": "lkljr435-phsn",
                "_deleted": false,
                "_updated": "lkljr435",
                "_created": "lkljr435",
                "_did": "cccc",
                "_lbl": "Movie",
                "_desc": "Set a description",
                "_emoji": "🎬",
                "_scope": "SECOND",
                "_pts": [
                    {
                        "_lbl": "Name",
                        "_desc": "Set a description",
                        "_emoji": "🎬",
                        "_type": "TEXT",
                        "_rollup": "COUNT",
                        "_active": true,
                        "_pid": "ccc1"
                    },
                    {
                        "_lbl": "First Watch?",
                        "_desc": "Set a description",
                        "_emoji": "🆕",
                        "_type": "BOOL",
                        "_rollup": "COUNT",
                        "_active": true,
                        "_pid": "ccc2"
                    }
                ]
            },
            {
                "_uid": "lkljr436-0tyq",
                "_deleted": false,
                "_updated": "lkljr436",
                "_created": "lkljr436",
                "_did": "dddd",
                "_lbl": "Book",
                "_desc": "Set a description",
                "_emoji": "📖",
                "_scope": "SECOND",
                "_pts": [
                    {
                        "_lbl": "Name",
                        "_desc": "Set a description",
                        "_emoji": "📖",
                        "_type": "TEXT",
                        "_rollup": "COUNT",
                        "_active": true,
                        "_pid": "ddd1"
                    }
                ]
            }
        ],
        "entries": [
            {
                "_uid": "lkljr437-vqba",
                "_deleted": true,
                "_updated": "lkljr4sn",
                "_created": "lkefsa6g",
                "_eid": "lkfkuxon-f9ys",
                "_note": "Testing updates",
                "_did": "bbbb",
                "_period": "2023-07-21T14:02:13",
                "_source": "",
                "bbb1": "You miss 100% of the shots you do not take",
                "bbb2": "Michael Jordan"
            },
            {
                "_uid": "lkfkuxo8-9ysw",
                "_deleted": false,
                "_updated": "lkdb20oo",
                "_created": "lkdb20oo",
                "_eid": "lkfkuxol-mnhe",
                "_note": "Original entry",
                "_did": "aaaa",
                "_period": "2023-07-22",
                "_source": "",
                "aaa1": "Today I didn't do **anything**.",
                "aaa2": "opt1",
                "aaa3": 9,
                "aaa4": 10
            },
            {
                "_uid": "lkfkuxob-0av3",
                "_deleted": false,
                "_updated": "lkljr4s6",
                "_created": "lkljr4s6",
                "_eid": "lkljr4s7-0vtg",
                "_note": "",
                "_did": "aaaa",
                "_period": "2023-07-23",
                "_source": "",
                "aaa1": "Today I wrote this line of code!",
                "aaa2": "opt3",
                "aaa3": 5,
                "aaa4": 9
            },
            {
                "_uid": "lkljr4s7-00jo",
                "_deleted": false,
                "_updated": "lkbp6ooo",
                "_created": "lkbp6ooo",
                "_eid": "lkljr4s8-5rjq",
                "_note": "pretending I felt bad",
                "_did": "aaaa",
                "_period": "2023-07-21",
                "_source": "",
                "aaa1": "This was a Friday. I did some stuff.",
                "aaa2": "opt2",
                "aaa3": 6,
                "aaa4": 5
            },
            {
                "_uid": "lkljr4s9-lttb",
                "_deleted": false,
                "_updated": "lkljr4sa",
                "_created": "lkljr4s9",
                "_eid": "lkljr4sc-0cai",
                "_note": "",
                "_did": "dddd",
                "_period": "2023-07-27T14:27:41",
                "_source": "",
                "ddd1": "Oh the places you'll go!"
            },
            {
                "_uid": "lkljr4sd-a117",
                "_deleted": false,
                "_updated": "lkljr4se",
                "_created": "lkljr4sd",
                "_eid": "lkljr4se-thsr",
                "_note": "",
                "_did": "dddd",
                "_period": "2025-01-02T15:21:49",
                "_source": "",
                "ddd1": "The Time Traveller"
            },
            {
                "_uid": "lkljr4sf-0dix",
                "_deleted": false,
                "_updated": "lkljr4sf",
                "_created": "lkljr4sf",
                "_eid": "lkljr4sg-010g",
                "_note": "",
                "_did": "dddd",
                "_period": "2022-10-04T18:43:22",
                "_source": "",
                "ddd1": "The Time Traveller 2"
            },
            {
                "_uid": "lkljr4sg-aayg",
                "_deleted": false,
                "_updated": "lkljr4si",
                "_created": "lkljr4sh",
                "_eid": "lkljr4sj-bulk",
                "_note": "",
                "_did": "cccc",
                "_period": "2023-07-24T13:15:00",
                "_source": "",
                "ccc1": "Barbie",
                "ccc2": true
            },
            {
                "_uid": "lkljr4sj-grd4",
                "_deleted": false,
                "_updated": "lkljr4sk",
                "_created": "lkljr4sk",
                "_eid": "lkljr4sk-526e",
                "_note": "",
                "_did": "cccc",
                "_period": "2023-07-24T18:45:00",
                "_source": "",
                "ccc1": "Oppenheimer",
                "ccc2": true
            },
            {
                "_uid": "lkljr4sl-aojw",
                "_deleted": false,
                "_updated": "lkljr4sl",
                "_created": "lkefsa6g",
                "_eid": "lkfkuxon-f9ys",
                "_note": "Testing updates",
                "_did": "bbbb",
                "_period": "2023-07-21T14:02:13",
                "_source": "",
                "bbb1": "You miss 100% of the shots you do not take",
                "bbb2": "Michael SCOTT"
            }
        ],
        "tags": [
            {
                "_uid": "lkljr437-8ff7",
                "_deleted": false,
                "_updated": "lkljr437",
                "_created": "lkljr437",
                "_tid": "tag1",
                "_lbl": "Unlabeled Tag with _tid = tag1",
                "_dids": [
                    "dddd",
                    "cccc"
                ]
            }
        ]
    }

    console.log(JSON.stringify(a) === JSON.stringify(b));
}
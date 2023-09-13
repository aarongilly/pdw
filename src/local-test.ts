import * as pdw from './pdw.js'
import { Query, Scope } from './pdw.js'
// import { exportToFile, importFromFile } from './dataStores/fileAsyncDataStores.js';
import { Temporal, toTemporalInstant } from 'temporal-polyfill';
import { importFirestore, importMongo, importOldV9, importOldest, importPreviousCSV } from './onetimeImports.js'
// import * as test from '../../pdw-firestore-plugin/'

const pdwRef = pdw.PDW.getInstance();

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

async function createTestDataSet() {
    const nightly = await pdwRef.newDef({
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
    const quotes = await pdwRef.newDef({
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
    const movies = await pdwRef.newDef({
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
    const book = await pdwRef.newDef({
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
    pdwRef.newTag({
        _lbl: 'media',
        _dids: ['dddd', 'cccc'],
        _tid: 'tag1'
    });
    /**
     * Several entries
     */
    let quote = await quotes.newEntry({
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


async function createSummaryDataSet(){
    const nap = await pdwRef.newDef({
        _lbl: "Nap",
        _scope: pdw.Scope.SECOND,
        _pts: [
            {
                _pid: "b111",
                _lbl: "Duration",
                _emoji: "🕰️",
                _rollup: pdw.Rollup.SUM,
                _type: pdw.PointType.DURATION
            },
            {
                _pid: "b222",
                _lbl: "Felt Rested",
                _emoji: "😀",
                _rollup: pdw.Rollup.COUNTOFEACH,
                _type: pdw.PointType.BOOL
            },
            {
                _pid: "b333",
                _lbl: "Start time",
                _rollup: pdw.Rollup.AVERAGE,
                _type: pdw.PointType.TIME
            }
        ]
    });
    nap.newEntry({
        _period: "2023-08-23T16:30:29",
        'b111': "PT25M",
        "b222": true,
        'b333': "23:30:29"
    })
    nap.newEntry({
        _period: "2023-08-21T12:42:26",
        'b111': "PT25M",
        "b222": false,
        'b333': '02:28:29'
    })
    nap.newEntry({
        _period: "2023-08-21T17:42:26",
        'b111': "PT2H11M",
        "b222": true,
        'b333': '17:42:26'
    })
    nap.newEntry({
        _period: "2023-08-22T16:30:29",
        'b111': "PT1H5M",
        "b222": true,
        'b333': '16:30:29'
    })
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
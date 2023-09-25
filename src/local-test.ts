import * as pdw from './pdw.js'
// import { Query, Scope } from './pdw.js'
// import { exportToFile, importFromFile } from './dataStores/fileAsyncDataStores.js';
// import { Temporal, toTemporalInstant } from 'temporal-polyfill';
// import { importFirestore, importMongo, importOldV9, importOldest, importPreviousCSV } from './onetimeImports.js'
// import * as test from '../../pdw-firestore-plugin/'

const pdwRef = pdw.PDW.getInstance();

const def = await pdwRef.newDef({
    _did: 'aaaa',
    _lbl: 'Default Scope test',
    'yyyy': {
        _lbl: 'Point A',
        _desc: 'Test point desc'
    },
    'zzzz': {
        _lbl: 'Point B',
        _type: pdw.PointType.BOOL
    }
});

const entry = await def.newEntry({
    _pts: {
        'yyyy': 'Butthole',
        'zzzz': false
    }
})

console.log(entry);
console.log(pdwRef.dataStore);
await def.save();
console.log(pdwRef.dataStore);


await createTestDataSet();

// let q = new pdw.Query();
// q.tags('tag1');
// const origResult = await q.run();
// console.log(origResult);



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
                _type: pdw.PointType.MARKDOWN
            },
            {
                _emoji: '👔',
                _lbl: 'Work Status',
                _desc: 'Did you go in, if so where?',
                _pid: 'aaa2',
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
                _type: pdw.PointType.NUMBER
            },
            {
                _emoji: '😥',
                _desc: '10 perfect 1 horrid',
                _lbl: 'Physical Health',
                _pid: 'aaa4',
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
        _tags: ['tag1'],
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
        _tags: ['tag1'],
        _scope: pdw.Scope.SECOND,
        'ddd1': {
            _lbl: 'Name',
            _emoji: "📖",
        },
    })
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
        'ddd1': "Oh the places you'll go!"
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

    await quote.setPointVal('bbb2', 'Michael SCOTT').save();
}
import * as pdw from './pdw.js'
// import { Query, Scope } from './pdw.js'
// import { exportToFile, importFromFile } from './dataStores/fileAsyncDataStores.js';
// import { Temporal, toTemporalInstant } from 'temporal-polyfill';
// import { importFirestore, importMongo, importOldV9, importOldest, importPreviousCSV } from './onetimeImports.js'
// import * as test from '../../pdw-firestore-plugin/'

const pdwRef = pdw.PDW.getInstance();

let defs = allDefs();

//@ts-expect-error
await pdwRef.setDefs(defs);

let def = pdwRef.getFromManifest('zzfh');
console.log(new Date().toString());

let entry = await def.newEntry({
    _period: '2023-09-29T17:01:23-05:00'
})

console.log(pdwRef);


// await createSummaryDataSet();
// console.log(typeof createTestDataSet);//stopping errors


// await pdwRef.query({includeDeleted: 'yes', allOnPurpose: true}).run();


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

async function createSummaryDataSet() {
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
    })
    const event = await pdwRef.newDef({
        _lbl: "Event",
        _scope: pdw.Scope.HOUR,
        _pts: [
            {
                _pid: 'aaaa',
                _type: pdw.PointType.TEXT
            },
            {
                _pid: 'bbbb',
                _type: pdw.PointType.NUMBER,
                _rollup: pdw.Rollup.COUNTUNIQUE
            }
        ]

    })
    const daily = await pdwRef.newDef({
        _did: 'dddd',
        _lbl: "Journal",
        _scope: pdw.Scope.DAY,
        _pts: [
            {
                _pid: 'ddd1',
                _lbl: 'Nightly Review',
                _type: pdw.PointType.MARKDOWN
            }
        ]
    })

    event.newEntry({
        _period: '2023-08-23T01',
        'aaaa': 'Whatever',
        'bbbb': 1,
    });
    event.newEntry({
        _period: '2023-08-23T02',
        'aaaa': 'Something else',
        'bbbb': 2,
    });
    event.newEntry({
        _period: '2023-08-23T03',
        'aaaa': 'A third time, but only a second new number',
        'bbbb': 2,
    });

    daily.newEntry({
        _period: '2023-08-23',
        'ddd1': "Today I did *a lot*"
    })
    
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

function allDefs(){
    return [
        {
            "_uid": "ln3x15fk-hd8e",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "n59t",
            "_lbl": "Book Reading",
            "_desc": "Spent some time reading a book (or listening to a book, whatever)",
            "_emoji": "📚",
            "_scope": "SECOND",
            "_tags": [
                "media"
            ],
            "_pts": [
                {
                    "_pid": "zr0q",
                    "_lbl": "Book",
                    "_type": "TEXT",
                    "_desc": "The name of the book being read",
                    "_emoji": "📖",
                    "_rollup": "COUNTUNIQUE",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15f8-0klp",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "00x9",
            "_lbl": "Dates",
            "_desc": "Outings for the benefit of the relationship.",
            "_emoji": "💑",
            "_scope": "SECOND",
            "_tags": [],
            "_pts": [
                {
                    "_pid": "001e",
                    "_lbl": "What You Did",
                    "_type": "TEXT",
                    "_desc": "What we did for the date. Hopefully something good!",
                    "_emoji": "😍",
                    "_rollup": "COUNT",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15fj-nhnn",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "qcoz",
            "_lbl": "Drinks",
            "_desc": "A non-water, non-black coffee beverage.",
            "_emoji": "🥤",
            "_scope": "SECOND",
            "_tags": [
                "health"
            ],
            "_pts": [
                {
                    "_pid": "l5xm",
                    "_lbl": "Drank",
                    "_type": "SELECT",
                    "_desc": "The type of drink I had",
                    "_emoji": "🧃",
                    "_rollup": "COUNTOFEACH",
                    "_hide": false,
                    "_opts": {
                        "Hard Seltzer": "Hard Seltzer",
                        "Beer": "Beer",
                        "Mixed Drink": "Mixed Drink",
                        "Energy Drink": "Energy Drink",
                        "Soda": "Soda",
                        "Wine": "Wine",
                        "Liquor": "Liquor"
                    }
                }
            ]
        },
        {
            "_uid": "ln3x15fb-hodl",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "0q3m",
            "_lbl": "Eating Out",
            "_desc": "Eating food you bought ready to eat from a restaurant or convenience store.",
            "_emoji": "🍔",
            "_scope": "SECOND",
            "_tags": [
                "health",
                "money"
            ],
            "_pts": [
                {
                    "_pid": "129ue",
                    "_lbl": "Where",
                    "_type": "TEXT",
                    "_desc": "The name of the place you got the food.",
                    "_emoji": "🍴",
                    "_rollup": "COUNT",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15fh-73kf",
            "_deleted": false,
            "_created": "ln4wznyk",
            "_updated": "ln4wznyl",
            "_did": "zzfh",
            "_lbl": "Events",
            "_desc": "Generic note about something that happened, tagged with a contextualizing tag.",
            "_emoji": "📝",
            "_scope": "SECOND",
            "_tags": [],
            "_pts": [
                {
                    "_pid": "btz9",
                    "_lbl": "What Happened",
                    "_type": "TEXT",
                    "_desc": "Generic description of a thing that happened. As long or short as you want.",
                    "_emoji": "📝",
                    "_rollup": "COUNT",
                    "_hide": false,
                    "_opts": {}
                },
                {
                    "_pid": "7qhv",
                    "_lbl": "Tag",
                    "_type": "SELECT",
                    "_desc": "A contextualizing tag. Now with memory! Now accessible online!",
                    "_emoji": "🔖",
                    "_rollup": "COUNTOFEACH",
                    "_hide": false,
                    "_opts": {
                        "Meta": "Meta",
                        "Memory": "Memory",
                        "Family": "Family",
                        "Medical": "Medical",
                        "Work": "Work",
                        "Possession": "Possession",
                        "Project": "Project",
                        "Health": "Health"
                    }
                }
            ]
        },
        {
            "_uid": "ln3x15fe-1tqc",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "80qg",
            "_lbl": "Injured",
            "_desc": "For tracking when you acquired a new acute injury. Likely to be paired alongside a Pain entry.",
            "_emoji": "🤕",
            "_scope": "SECOND",
            "_tags": [
                "health"
            ],
            "_pts": [
                {
                    "_pid": "0vma",
                    "_lbl": "What Happened",
                    "_type": "TEXT",
                    "_desc": "What caused the injury",
                    "_emoji": "❓",
                    "_rollup": "COUNT",
                    "_hide": false,
                    "_opts": {}
                },
                {
                    "_pid": "fr4u",
                    "_lbl": "What Got Hurt",
                    "_type": "MULTISELECT",
                    "_desc": "What thing(s) got injured",
                    "_emoji": "🦵",
                    "_rollup": "COUNTOFEACH",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15f9-0moh",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "0kf9",
            "_lbl": "Lawrence Places",
            "_desc": "Places visited around Lawrence. Tracking to be more of a towny.",
            "_emoji": "🏘",
            "_scope": "SECOND",
            "_tags": [],
            "_pts": [
                {
                    "_pid": "03ta",
                    "_lbl": "Where",
                    "_type": "TEXT",
                    "_desc": "The place you went.",
                    "_emoji": "🏘",
                    "_rollup": "COUNTUNIQUE",
                    "_hide": false,
                    "_opts": {}
                },
                {
                    "_pid": "zpt9",
                    "_lbl": "First Time",
                    "_type": "BOOL",
                    "_desc": "Is this your first time at the place?",
                    "_emoji": "🆕",
                    "_rollup": "COUNTOFEACH",
                    "_hide": true,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15fb-b41a",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "ukqi",
            "_lbl": "Learning",
            "_desc": "Furthered education through intentional study or challenging projects.",
            "_emoji": "🎓",
            "_scope": "SECOND",
            "_tags": [],
            "_pts": [
                {
                    "_pid": "lpy4",
                    "_lbl": "Subject",
                    "_type": "TEXT",
                    "_desc": "The thing I learned about.",
                    "_emoji": "🎒",
                    "_rollup": "COUNT",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15fn-d048",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "0kp4",
            "_lbl": "Movies",
            "_desc": "Watched a movie (and finished it, generally). Tracked once if split up over two days of watching it.",
            "_emoji": "🎬",
            "_scope": "SECOND",
            "_tags": [
                "media"
            ],
            "_pts": [
                {
                    "_pid": "yo6c",
                    "_lbl": "Name",
                    "_type": "TEXT",
                    "_desc": "Name of the movie.",
                    "_emoji": "🎬",
                    "_rollup": "COUNTUNIQUE",
                    "_hide": false,
                    "_opts": {}
                },
                {
                    "_pid": "0d6i",
                    "_lbl": "First Time?",
                    "_type": "BOOL",
                    "_desc": "Is this the first time you've ever seen the movie?",
                    "_emoji": "🆕",
                    "_rollup": "COUNTOFEACH",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15f9-x67h",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "k788",
            "_lbl": "Naps",
            "_desc": "Naps & midday sleeps",
            "_emoji": "😴",
            "_scope": "SECOND",
            "_tags": [
                "health",
                "sleep"
            ],
            "_pts": [
                {
                    "_pid": "k61i",
                    "_lbl": "Duration",
                    "_type": "NUMBER",
                    "_desc": "Time spent sleeping, in minutes.",
                    "_emoji": "⌚",
                    "_rollup": "AVERAGE",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15f1-angd",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "hz44",
            "_lbl": "New Experiences",
            "_desc": "New experiences. Exploration. Memories. The spice of life.",
            "_emoji": "🆕",
            "_scope": "SECOND",
            "_tags": [],
            "_pts": [
                {
                    "_pid": "4eiv",
                    "_lbl": "Thing",
                    "_type": "TEXT",
                    "_desc": "The thing you did or saw that was new.",
                    "_emoji": "🆕",
                    "_rollup": "COUNT",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15fm-05wl",
            "_deleted": false,
            "_created": "ln3xy05d",
            "_updated": "ln3xy05e",
            "_did": "ipkr",
            "_lbl": "Nightly Review",
            "_desc": "A nightly reflection on the day.",
            "_emoji": "👀",
            "_scope": "DAY",
            "_tags": [],
            "_pts": [
                {
                    "_pid": "msrj",
                    "_lbl": "Summary",
                    "_type": "MARKDOWN",
                    "_desc": "Description of the day.",
                    "_emoji": "📓",
                    "_rollup": "COUNT",
                    "_hide": false,
                    "_opts": {}
                },
                {
                    "_pid": "pygk",
                    "_lbl": "Health Status",
                    "_type": "NUMBER",
                    "_desc": "1 - Bedridden, 10 - Perfectly Health",
                    "_emoji": "🌡",
                    "_rollup": "AVERAGE",
                    "_hide": false,
                    "_opts": {}
                },
                {
                    "_pid": "h9kl",
                    "_lbl": "Satisfaction",
                    "_type": "NUMBER",
                    "_desc": "1 - Horrible Day, 10 - Perfect Day",
                    "_emoji": "😀",
                    "_rollup": "AVERAGE",
                    "_hide": false,
                    "_opts": {}
                },
                {
                    "_pid": "0ggj",
                    "_lbl": "Challenge",
                    "_type": "TEXT",
                    "_desc": "How did you adhere to your current 30 Day Challenge. Was marked deleted but I think marking it undeleted will make my future life easier. ",
                    "_emoji": "🎯",
                    "_rollup": "COUNT",
                    "_hide": true,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15fl-i1sg",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "05ts",
            "_lbl": "Outing with Kids",
            "_desc": "Outings for the benefit (mostly) of the boys. Fun games or whatever you made for them.",
            "_emoji": "👨‍👩‍👦‍👦",
            "_scope": "SECOND",
            "_tags": [],
            "_pts": [
                {
                    "_pid": "kwib",
                    "_lbl": "What",
                    "_type": "TEXT",
                    "_desc": "Where you went/what you did.",
                    "_emoji": "🛝",
                    "_rollup": "COUNT",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15fg-xcsd",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "w4g5",
            "_lbl": "Pains",
            "_desc": "Injuries, illnesses, general complaints, and the treatments I used for them.",
            "_emoji": "😟",
            "_scope": "SECOND",
            "_tags": [
                "health"
            ],
            "_pts": [
                {
                    "_pid": "h4ph",
                    "_lbl": "Pains",
                    "_type": "MULTISELECT",
                    "_desc": "What hurts.",
                    "_emoji": "🤕",
                    "_rollup": "COUNTOFEACH",
                    "_hide": false,
                    "_opts": {}
                },
                {
                    "_pid": "e3zk",
                    "_lbl": "Treatment",
                    "_type": "MULTISELECT",
                    "_desc": "What I did to help.",
                    "_emoji": "💊",
                    "_rollup": "COUNTOFEACH",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15fj-0vyg",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "crmn",
            "_lbl": "Power Hour",
            "_desc": "Daily Quadrant 2 Work",
            "_emoji": "⚡",
            "_scope": "SECOND",
            "_tags": [],
            "_pts": [
                {
                    "_pid": "pgmt",
                    "_lbl": "Usage",
                    "_type": "TEXT",
                    "_desc": "How I used that time.",
                    "_emoji": "⚡",
                    "_rollup": "COUNT",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15fc-0ohg",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "nesj",
            "_lbl": "Quotes",
            "_desc": "Good quotes.",
            "_emoji": "💬",
            "_scope": "SECOND",
            "_tags": [],
            "_pts": [
                {
                    "_pid": "7jkt",
                    "_lbl": "Quote",
                    "_type": "TEXT",
                    "_desc": "What was said",
                    "_emoji": "💬",
                    "_rollup": "COUNT",
                    "_hide": false,
                    "_opts": {}
                },
                {
                    "_pid": "0lqf",
                    "_lbl": "Quoter",
                    "_type": "TEXT",
                    "_desc": "Who said it",
                    "_emoji": "🙊",
                    "_rollup": "COUNTOFEACH",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15fh-07sa",
            "_deleted": false,
            "_created": "ln42sar5",
            "_updated": "ln42sar6",
            "_did": "pee6",
            "_lbl": "Runs",
            "_desc": "Runs tracked through the Apple Fitness App via the Apple Watch",
            "_emoji": "🏃‍♂️",
            "_scope": "SECOND",
            "_tags": [
                "health",
                "automatic"
            ],
            "_pts": [
                {
                    "_pid": "0v1a",
                    "_lbl": "Distance",
                    "_type": "NUMBER",
                    "_desc": "Run distance, in miles",
                    "_emoji": "📏",
                    "_rollup": "SUM",
                    "_hide": false,
                    "_opts": {}
                },
                {
                    "_pid": "gz9o",
                    "_lbl": "Duration",
                    "_type": "DURATION",
                    "_desc": "Run duration",
                    "_emoji": "⏲",
                    "_rollup": "SUM",
                    "_hide": false,
                    "_opts": {}
                },
                {
                    "_pid": "0gck",
                    "_lbl": "Pace",
                    "_type": "DURATION",
                    "_desc": "Average run pace, in minutes per mile",
                    "_emoji": "💨",
                    "_rollup": "AVERAGE",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15fd-001p",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "06sz",
            "_lbl": "Saw Family",
            "_desc": "Saw family members. Either side. Including extended family.",
            "_emoji": "👴",
            "_scope": "SECOND",
            "_tags": [
                "social"
            ],
            "_pts": [
                {
                    "_pid": "3fr4",
                    "_lbl": "Who",
                    "_type": "SELECT",
                    "_desc": "Who we saw.",
                    "_emoji": "👨‍👨‍👦‍👦",
                    "_rollup": "COUNT",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15f6-4pec",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "8mkn",
            "_lbl": "Saw Friends",
            "_desc": "Social experiences with friends.",
            "_emoji": "👯‍♂️",
            "_scope": "SECOND",
            "_tags": [
                "fun"
            ],
            "_pts": [
                {
                    "_pid": "lay9",
                    "_lbl": "Who",
                    "_type": "MULTISELECT",
                    "_desc": "Who you hung out with",
                    "_emoji": "🤼‍♂️",
                    "_rollup": "COUNTOFEACH",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15fa-r11r",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "rhyw",
            "_lbl": "Sleep Location",
            "_desc": "As a proxy for travel, where you slept. Auto-tracked by Siri.",
            "_emoji": "🗺",
            "_scope": "DAY",
            "_tags": [],
            "_pts": [
                {
                    "_pid": "ok7g",
                    "_lbl": "Location",
                    "_type": "TEXT",
                    "_desc": "The city in which you slept.",
                    "_emoji": "🗺",
                    "_rollup": "COUNTOFEACH",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15fd-hovt",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "0nlm",
            "_lbl": "Started Driving",
            "_desc": "Your phone connected to your car's bluetooth.",
            "_emoji": "🚗",
            "_scope": "SECOND",
            "_tags": [
                "automatic",
                "location"
            ],
            "_pts": [
                {
                    "_pid": "mv1f",
                    "_lbl": "City",
                    "_type": "TEXT",
                    "_desc": "Where the car was when your phone connected",
                    "_emoji": "🗺",
                    "_rollup": "COUNT",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15fk-tm49",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "4w7l",
            "_lbl": "Television",
            "_desc": "Shows watched.",
            "_emoji": "📺",
            "_scope": "SECOND",
            "_tags": [
                "media"
            ],
            "_pts": [
                {
                    "_pid": "0zr4",
                    "_lbl": "Show",
                    "_type": "TEXT",
                    "_desc": "The name of the show.",
                    "_emoji": "📺",
                    "_rollup": "COUNTOFEACH",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15fk-w83j",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "o1qq",
            "_lbl": "Videogame",
            "_desc": "Had a session of time playing a videogame.",
            "_emoji": "🎮",
            "_scope": "SECOND",
            "_tags": [
                "media"
            ],
            "_pts": [
                {
                    "_pid": "0sxw",
                    "_lbl": "Game",
                    "_type": "SELECT",
                    "_desc": "The name of the game being played.",
                    "_emoji": "🕹",
                    "_rollup": "COUNT",
                    "_hide": false,
                    "_opts": {
                        "Inside": "Inside",
                        "I Expect You to Die 2": "I Expect You to Die 2",
                        "Beat Saber": "Beat Saber",
                        "Walkabout Mini Golf": "Walkabout Mini Golf",
                        "Metroid: Dread": "Metroid: Dread",
                        "Tears of the Kingdom": "Tears of the Kingdom",
                        "Jackbox": "Jackbox",
                        "ElecHead": "ElecHead"
                    }
                }
            ]
        },
        {
            "_uid": "ln3x15fi-iqx8",
            "_deleted": false,
            "_created": "ln3xultb",
            "_updated": "ln3xultb",
            "_did": "0gn7",
            "_lbl": "Walks",
            "_desc": "Apple Health \"Outdoor Walk\" workouts.",
            "_emoji": "🚶‍♂️",
            "_scope": "SECOND",
            "_tags": [
                "health",
                "automated"
            ],
            "_pts": [
                {
                    "_pid": "btin",
                    "_lbl": "Distance",
                    "_type": "NUMBER",
                    "_desc": "Distance Walked, in Miles.",
                    "_emoji": "📏",
                    "_rollup": "SUM",
                    "_hide": false,
                    "_opts": {}
                },
                {
                    "_pid": "vixu",
                    "_lbl": "Duration",
                    "_type": "DURATION",
                    "_desc": "Time walked.",
                    "_emoji": "⌛",
                    "_rollup": "SUM",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15fm-rlnb",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "x6rd",
            "_lbl": "Whole30 Diary",
            "_desc": "Checking in on Whole30 progress.",
            "_emoji": "🥦",
            "_scope": "DAY",
            "_tags": [
                "health",
                "diet"
            ],
            "_pts": [
                {
                    "_pid": "as3rq",
                    "_lbl": "Diary",
                    "_type": "TEXT",
                    "_desc": "How are you feeling? How is Whole30 going?",
                    "_emoji": "✏️",
                    "_rollup": "COUNT",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15fl-fjwe",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "4hpk",
            "_lbl": "Work Status",
            "_desc": "Where you worked, if you worked. ",
            "_emoji": "👔",
            "_scope": "DAY",
            "_tags": [],
            "_pts": [
                {
                    "_pid": "zgfo",
                    "_lbl": "Work Location",
                    "_type": "SELECT",
                    "_desc": "Where you worked if you worked. Or vacation. Day off. Holiday. Sick day.",
                    "_emoji": "📍",
                    "_rollup": "COUNT",
                    "_hide": false,
                    "_opts": {}
                }
            ]
        },
        {
            "_uid": "ln3x15f7-ob43",
            "_deleted": false,
            "_created": "ln3vgjr3",
            "_updated": "ln3vgjr3",
            "_did": "0lj1",
            "_lbl": "Workouts",
            "_desc": "Intentional workouts. Walking not included.",
            "_emoji": "🏋️‍♂️",
            "_scope": "SECOND",
            "_tags": [
                "health"
            ],
            "_pts": [
                {
                    "_pid": "2rwh",
                    "_lbl": "Name",
                    "_type": "TEXT",
                    "_desc": "Name of the workout, or a short description.",
                    "_emoji": "🗃",
                    "_rollup": "COUNT",
                    "_hide": false,
                    "_opts": {}
                },
                {
                    "_pid": "0iwi",
                    "_lbl": "Type",
                    "_type": "SELECT",
                    "_desc": "Cardio, Strength, or Mobility",
                    "_emoji": "🔖",
                    "_rollup": "COUNTOFEACH",
                    "_hide": false,
                    "_opts": {
                        "Strength": "Strength",
                        "Cardio": "Cardio",
                        "Mobility": "Mobility"
                    }
                }
            ]
        }
    ]
}

// function oneTimeDefImport(){
    
//     let oldDefs = {
//         "definitons": [
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "hz44",
//                 "_deleted": false,
//                 "_desc": "New experiences. Exploration. Memories. The spice of life.",
//                 "_emoji": "🆕",
//                 "_hide": false,
//                 "_lbl": "New Experiences",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_emoji": "🆕",
//                         "_rollup": "Count",
//                         "_lbl": "Thing",
//                         "_deleted": false,
//                         "_format": "@",
//                         "_type": "String",
//                         "_pid": "4eiv",
//                         "_hide": false,
//                         "_desc": "The thing you did or saw that was new.",
//                         "_did": "hz44"
//                     }
//                 ],
//                 "_tags": [],
//                 "_rev": 0
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "8mkn",
//                 "_deleted": false,
//                 "_desc": "Social experiences with friends.",
//                 "_emoji": "👯‍♂️",
//                 "_hide": false,
//                 "_lbl": "Saw Friends",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_pid": "lay9",
//                         "_did": "8mkn",
//                         "_format": "Array",
//                         "_desc": "Who you hung out with",
//                         "_type": "Array",
//                         "_emoji": "🤼‍♂️",
//                         "_hide": false,
//                         "_lbl": "Who",
//                         "_rollup": "Count Each",
//                         "_deleted": false
//                     }
//                 ],
//                 "_tags": [
//                     "fun"
//                 ],
//                 "_rev": 0
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "0lj1",
//                 "_deleted": false,
//                 "_desc": "Intentional workouts. Walking not included.",
//                 "_emoji": "🏋️‍♂️",
//                 "_hide": false,
//                 "_lbl": "Workouts",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_lbl": "Name",
//                         "_pid": "2rwh",
//                         "_rollup": "Count",
//                         "_type": "String",
//                         "_desc": "Name of the workout, or a short description.",
//                         "_did": "0lj1",
//                         "_format": "@",
//                         "_deleted": false,
//                         "_emoji": "🗃",
//                         "_hide": false
//                     },
//                     {
//                         "_pid": "0iwi",
//                         "_type": "Enum",
//                         "_format": "@",
//                         "_hide": false,
//                         "_enum": [
//                             "Strength",
//                             "Cardio",
//                             "Mobility"
//                         ],
//                         "_emoji": "🔖",
//                         "_rollup": "Count Each",
//                         "_deleted": false,
//                         "_did": "0lj1",
//                         "_lbl": "Type",
//                         "_desc": "Cardio, Strength, or Mobility"
//                     }
//                 ],
//                 "_tags": [
//                     "health"
//                 ],
//                 "_rev": 0
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "00x9",
//                 "_deleted": false,
//                 "_desc": "Outings for the benefit of the relationship.",
//                 "_emoji": "💑",
//                 "_hide": false,
//                 "_lbl": "Dates",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_emoji": "😍",
//                         "_hide": false,
//                         "_format": "@",
//                         "_deleted": false,
//                         "_rollup": "Count",
//                         "_did": "00x9",
//                         "_type": "String",
//                         "_desc": "What we did for the date. Hopefully something good!",
//                         "_pid": "001e",
//                         "_lbl": "What You Did"
//                     }
//                 ],
//                 "_tags": [],
//                 "_rev": 0
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "k788",
//                 "_deleted": false,
//                 "_desc": "Naps & midday sleeps",
//                 "_emoji": "😴",
//                 "_hide": false,
//                 "_lbl": "Naps",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_lbl": "Duration",
//                         "_did": "k788",
//                         "_emoji": "⌚",
//                         "_type": "Number",
//                         "_desc": "Time spent sleeping, in minutes.",
//                         "_pid": "k61i",
//                         "_hide": false,
//                         "_rollup": "Average",
//                         "_deleted": false,
//                         "_format": "#"
//                     }
//                 ],
//                 "_tags": [
//                     "health",
//                     "sleep"
//                 ],
//                 "_rev": 0
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "0kf9",
//                 "_deleted": false,
//                 "_desc": "Places visited around Lawrence. Tracking to be more of a towny.",
//                 "_emoji": "🏘",
//                 "_hide": false,
//                 "_lbl": "Lawrence Places",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_desc": "The place you went.",
//                         "_emoji": "🏘",
//                         "_pid": "03ta",
//                         "_type": "String",
//                         "_did": "0kf9",
//                         "_format": "@",
//                         "_deleted": false,
//                         "_rollup": "Count Distinct",
//                         "_hide": false,
//                         "_lbl": "Where"
//                     },
//                     {
//                         "_emoji": "🆕",
//                         "_did": "0kf9",
//                         "_hide": true,
//                         "_pid": "zpt9",
//                         "_deleted": false,
//                         "_rollup": "Count Each",
//                         "_desc": "Is this your first time at the place?",
//                         "_type": "Boolean",
//                         "_lbl": "First Time",
//                         "_format": "Bool"
//                     }
//                 ],
//                 "_tags": [],
//                 "_rev": 0
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "rhyw",
//                 "_deleted": false,
//                 "_desc": "As a proxy for travel, where you slept. Auto-tracked by Siri.",
//                 "_emoji": "🗺",
//                 "_hide": false,
//                 "_lbl": "Sleep Location",
//                 "_scope": "Day",
//                 "_points": [
//                     {
//                         "_rollup": "Count Each",
//                         "_pid": "ok7g",
//                         "_deleted": false,
//                         "_desc": "The city in which you slept.",
//                         "_format": "@",
//                         "_emoji": "🗺",
//                         "_did": "rhyw",
//                         "_hide": false,
//                         "_type": "String",
//                         "_lbl": "Location"
//                     }
//                 ],
//                 "_tags": [],
//                 "_rev": 0
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "ukqi",
//                 "_deleted": false,
//                 "_desc": "Furthered education through intentional study or challenging projects.",
//                 "_emoji": "🎓",
//                 "_hide": false,
//                 "_lbl": "Learning",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_rollup": "Count",
//                         "_desc": "The thing I learned about.",
//                         "_emoji": "🎒",
//                         "_hide": false,
//                         "_type": "String",
//                         "_did": "ukqi",
//                         "_deleted": false,
//                         "_pid": "lpy4",
//                         "_format": "@",
//                         "_lbl": "Subject"
//                     }
//                 ],
//                 "_tags": [],
//                 "_rev": 0
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "0q3m",
//                 "_deleted": false,
//                 "_desc": "Eating food you bought ready to eat from a restaurant or convenience store.",
//                 "_emoji": "🍔",
//                 "_hide": false,
//                 "_lbl": "Eating Out",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_hide": false,
//                         "_lbl": "Where",
//                         "_emoji": "🍴",
//                         "_type": "String",
//                         "_pid": "129ue",
//                         "_deleted": false,
//                         "_rollup": "Count",
//                         "_desc": "The name of the place you got the food.",
//                         "_format": "@",
//                         "_did": "0q3m"
//                     }
//                 ],
//                 "_tags": [
//                     "health",
//                     "money"
//                 ],
//                 "_rev": 0
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "nesj",
//                 "_deleted": false,
//                 "_desc": "Good quotes.",
//                 "_emoji": "💬",
//                 "_hide": false,
//                 "_lbl": "Quotes",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_hide": false,
//                         "_emoji": "💬",
//                         "_format": "@",
//                         "_desc": "What was said",
//                         "_deleted": false,
//                         "_pid": "7jkt",
//                         "_did": "nesj",
//                         "_lbl": "Quote",
//                         "_rollup": "Count",
//                         "_type": "String"
//                     },
//                     {
//                         "_format": "@",
//                         "_deleted": false,
//                         "_rollup": "Count Each",
//                         "_did": "nesj",
//                         "_type": "String",
//                         "_emoji": "🙊",
//                         "_desc": "Who said it",
//                         "_hide": false,
//                         "_lbl": "Quoter",
//                         "_pid": "0lqf"
//                     }
//                 ],
//                 "_tags": [],
//                 "_rev": 0
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "06sz",
//                 "_deleted": false,
//                 "_desc": "Saw family members. Either side. Including extended family.",
//                 "_emoji": "👴",
//                 "_hide": false,
//                 "_lbl": "Saw Family",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_format": "@",
//                         "_updated": "2022-09-11T15:03:14.477Z",
//                         "_lbl": "Who",
//                         "_emoji": "👨‍👨‍👦‍👦",
//                         "_deleted": false,
//                         "_created": {
//                             "nanoseconds": 340000000,
//                             "seconds": 1662772029
//                         },
//                         "_hide": false,
//                         "_did": "06sz",
//                         "_type": "Enum",
//                         "_enum": [
//                             "Hill Family",
//                             "Gillespie Parents",
//                             "Gillespie Family",
//                             "",
//                             "Hill Parents"
//                         ],
//                         "_pid": "3fr4",
//                         "_rollup": "Count",
//                         "_desc": "Who we saw."
//                     }
//                 ],
//                 "_tags": [
//                     "social"
//                 ],
//                 "_rev": 0
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "0nlm",
//                 "_deleted": false,
//                 "_desc": "Your phone connected to your car's bluetooth.",
//                 "_emoji": "🚗",
//                 "_hide": true,
//                 "_lbl": "Started Driving",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_desc": "Where the car was when your phone connected",
//                         "_format": "@",
//                         "_created": "2022-09-13T18:15:11.879Z",
//                         "_hide": false,
//                         "_emoji": "🗺",
//                         "_updated": "2022-09-13T18:15:20.297Z",
//                         "_rollup": "Count",
//                         "_did": "0nlm",
//                         "_type": "String",
//                         "_deleted": false,
//                         "_pid": "mv1f",
//                         "_lbl": "City"
//                     }
//                 ],
//                 "_tags": [
//                     "automatic",
//                     "location"
//                 ],
//                 "_rev": 0
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "80qg",
//                 "_deleted": false,
//                 "_desc": "For tracking when you acquired a new acute injury. Likely to be paired alongside a Pain entry.",
//                 "_emoji": "🤕",
//                 "_hide": false,
//                 "_lbl": "Injured",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_pid": "0vma",
//                         "_hide": false,
//                         "_created": "2022-09-22T01:00:15.323Z",
//                         "_rollup": "Count",
//                         "_deleted": false,
//                         "_type": "String",
//                         "_desc": "What caused the injury",
//                         "_emoji": "❓",
//                         "_updated": "2022-09-22T01:01:48.365Z",
//                         "_did": "80qg",
//                         "_format": "@",
//                         "_lbl": "What Happened"
//                     },
//                     {
//                         "_deleted": false,
//                         "_emoji": "🦵",
//                         "_type": "Array",
//                         "_created": "2022-09-22T01:00:39.900Z",
//                         "_lbl": "What Got Hurt",
//                         "_format": "Array",
//                         "_desc": "What thing(s) got injured",
//                         "_hide": false,
//                         "_updated": "2022-09-22T01:01:48.365Z",
//                         "_pid": "fr4u",
//                         "_rollup": "Count Each",
//                         "_did": "80qg"
//                     }
//                 ],
//                 "_tags": [
//                     "health"
//                 ],
//                 "_rev": 0
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "w4g5",
//                 "_deleted": false,
//                 "_desc": "Injuries, illnesses, general complaints, and the treatments I used for them.",
//                 "_emoji": "😟",
//                 "_hide": false,
//                 "_lbl": "Pains",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_did": "w4g5",
//                         "_deleted": false,
//                         "_updated": "2022-09-22T01:04:21.211Z",
//                         "_hide": false,
//                         "_desc": "What hurts.",
//                         "_rollup": "Count Each",
//                         "_pid": "h4ph",
//                         "_format": "Array",
//                         "_emoji": "🤕",
//                         "_type": "Array",
//                         "_lbl": "Pains",
//                         "_created": "2022-09-11T15:00:08.918Z"
//                     },
//                     {
//                         "_created": "2022-09-11T15:00:08.919Z",
//                         "_format": "Array",
//                         "_hide": false,
//                         "_deleted": false,
//                         "_emoji": "💊",
//                         "_desc": "What I did to help.",
//                         "_updated": "2022-09-22T01:04:21.211Z",
//                         "_did": "w4g5",
//                         "_pid": "e3zk",
//                         "_type": "Array",
//                         "_lbl": "Treatment",
//                         "_rollup": "Count Each"
//                     }
//                 ],
//                 "_tags": [
//                     "health"
//                 ],
//                 "_rev": 0
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "zzfh",
//                 "_deleted": false,
//                 "_desc": "Generic note about something that happened, tagged with a contextualizing tag.",
//                 "_emoji": "📝",
//                 "_hide": false,
//                 "_lbl": "Events",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_did": "zzfh",
//                         "_updated": "2022-09-25T13:40:33.555Z",
//                         "_emoji": "📝",
//                         "_type": "String",
//                         "_deleted": false,
//                         "_format": "@",
//                         "_lbl": "What Happened",
//                         "_rollup": "Count",
//                         "_desc": "Generic description of a thing that happened. As long or short as you want.",
//                         "_created": {
//                             "nanoseconds": 83000000,
//                             "seconds": 1662086675
//                         },
//                         "_hide": false,
//                         "_pid": "btz9"
//                     },
//                     {
//                         "_format": "@",
//                         "_lbl": "Tag",
//                         "_hide": true,
//                         "_type": "Enum",
//                         "_pid": "7qhv",
//                         "_rollup": "Count Each",
//                         "_deleted": false,
//                         "_enum": [
//                             "Meta",
//                             "Family",
//                             "Project",
//                             "Health",
//                             "Possessions",
//                             "Work",
//                             "Possession ",
//                             "Medical",
//                             "Memory"
//                         ],
//                         "_created": {
//                             "seconds": 1662086675,
//                             "nanoseconds": 84000000
//                         },
//                         "_desc": "A contextualizing tag. Now with memory! Now accessible online!",
//                         "_updated": "2022-09-25T13:40:33.555Z",
//                         "_did": "zzfh",
//                         "_emoji": "🔖"
//                     }
//                 ],
//                 "_tags": [],
//                 "_rev": 1
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "pee6",
//                 "_deleted": false,
//                 "_desc": "Runs tracked through the Apple Fitness App via the Apple Watch",
//                 "_emoji": "🏃‍♂️",
//                 "_hide": false,
//                 "_lbl": "Runs",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_updated": "2022-09-25T17:57:39.057Z",
//                         "_did": "pee6",
//                         "_lbl": "Distance",
//                         "_created": "2022-09-22T13:43:21.248Z",
//                         "_type": "Number",
//                         "_rollup": "Sum",
//                         "_pid": "0v1a",
//                         "_hide": false,
//                         "_desc": "Run distance, in miles",
//                         "_deleted": false,
//                         "_format": "#.#",
//                         "_emoji": "📏"
//                     },
//                     {
//                         "_lbl": "Duration",
//                         "_format": "#.#",
//                         "_updated": "2022-09-25T17:57:39.057Z",
//                         "_desc": "Run duration, in minutes",
//                         "_pid": "gz9o",
//                         "_hide": false,
//                         "_deleted": false,
//                         "_type": "Number",
//                         "_rollup": "Sum",
//                         "_did": "pee6",
//                         "_emoji": "⏲",
//                         "_created": "2022-09-22T13:43:40.496Z"
//                     },
//                     {
//                         "_pid": "0gck",
//                         "_deleted": false,
//                         "_did": "pee6",
//                         "_desc": "Average run pace, in minutes per mile",
//                         "_hide": false,
//                         "_type": "Number",
//                         "_format": "#.#",
//                         "_rollup": "Average",
//                         "_updated": "2022-09-25T17:57:39.057Z",
//                         "_lbl": "Pace",
//                         "_created": "2022-09-22T13:44:05.689Z",
//                         "_emoji": "💨"
//                     }
//                 ],
//                 "_tags": [
//                     "health",
//                     "automatic"
//                 ],
//                 "_rev": 1
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "0gn7",
//                 "_deleted": false,
//                 "_desc": "Apple Health \"Outdoor Walk\" workouts.",
//                 "_emoji": "🚶‍♂️",
//                 "_hide": false,
//                 "_lbl": "Walks",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_desc": "Distance Walked, in Miles.",
//                         "_did": "0gn7",
//                         "_format": "#.#",
//                         "_hide": false,
//                         "_updated": "2022-09-25T17:57:52.424Z",
//                         "_created": "2022-09-22T13:22:03.436Z",
//                         "_type": "Number",
//                         "_deleted": false,
//                         "_lbl": "Distance",
//                         "_rollup": "Sum",
//                         "_pid": "btin",
//                         "_emoji": "📏"
//                     },
//                     {
//                         "_updated": "2022-09-25T17:57:52.424Z",
//                         "_lbl": "Duration",
//                         "_format": "#.#",
//                         "_pid": "vixu",
//                         "_type": "Number",
//                         "_rollup": "Sum",
//                         "_created": "2022-09-22T13:22:06.517Z",
//                         "_deleted": false,
//                         "_emoji": "⌛",
//                         "_desc": "Time walked, in minutes.",
//                         "_did": "0gn7",
//                         "_hide": false
//                     }
//                 ],
//                 "_tags": [
//                     "health",
//                     "automated"
//                 ],
//                 "_rev": 1
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "qcoz",
//                 "_deleted": false,
//                 "_desc": "A non-water, non-black coffee beverage.",
//                 "_emoji": "🥤",
//                 "_hide": false,
//                 "_lbl": "Drinks",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_pid": "l5xm",
//                         "_desc": "The type of drink I had",
//                         "_created": "2022-09-28T18:04:56.500Z",
//                         "_did": "qcoz",
//                         "_hide": false,
//                         "_enum": [
//                             "Beer",
//                             "Energy Drink",
//                             "Liquor",
//                             "Energy drink",
//                             "Soda",
//                             "Hard Seltzer",
//                             "Mixed Drink",
//                             "Wine",
//                             "Mixed drink"
//                         ],
//                         "_type": "Enum",
//                         "_format": "@",
//                         "_updated": "2022-09-28T18:05:17.159Z",
//                         "_rollup": "Count Each",
//                         "_deleted": false,
//                         "_emoji": "🧃",
//                         "_lbl": "Drank"
//                     }
//                 ],
//                 "_tags": [
//                     "health"
//                 ],
//                 "_rev": 1
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "crmn",
//                 "_deleted": false,
//                 "_desc": "Daily Quadrant 2 Work",
//                 "_emoji": "⚡",
//                 "_hide": true,
//                 "_lbl": "Power Hour",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_hide": false,
//                         "_did": "crmn",
//                         "_type": "String",
//                         "_emoji": "⚡",
//                         "_rollup": "Count",
//                         "_created": "2022-09-30T03:55:57.426Z",
//                         "_deleted": false,
//                         "_updated": "2022-09-30T03:56:07.994Z",
//                         "_pid": "pgmt",
//                         "_format": "@",
//                         "_desc": "How I used that time.",
//                         "_lbl": "Usage"
//                     }
//                 ],
//                 "_tags": [],
//                 "_rev": 1
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "o1qq",
//                 "_deleted": false,
//                 "_desc": "Had a session of time playing a videogame.",
//                 "_emoji": "🎮",
//                 "_hide": false,
//                 "_lbl": "Videogame",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_updated": "2022-10-11T03:27:52.982Z",
//                         "_deleted": false,
//                         "_enum": [
//                             "I Expect You to Die 2",
//                             "Metroid: Dread",
//                             "Inside",
//                             "Beat Saber",
//                             "ElecHead",
//                             "Jackbox",
//                             "Walkabout Mini Golf",
//                             "Tears of the Kingdom"
//                         ],
//                         "_lbl": "Game",
//                         "_type": "Enum",
//                         "_hide": false,
//                         "_pid": "0sxw",
//                         "_desc": "The name of the game being played.",
//                         "_rollup": "Count",
//                         "_created": "2022-09-22T02:33:09.508Z",
//                         "_format": "@",
//                         "_emoji": "🕹",
//                         "_did": "o1qq"
//                     }
//                 ],
//                 "_tags": [
//                     "media"
//                 ],
//                 "_rev": 1
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "4w7l",
//                 "_deleted": false,
//                 "_desc": "Shows watched.",
//                 "_emoji": "📺",
//                 "_hide": false,
//                 "_lbl": "Television",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_hide": false,
//                         "_pid": "0zr4",
//                         "_rollup": "Count Each",
//                         "_desc": "The name of the show.",
//                         "_type": "Enum",
//                         "_updated": "2022-10-14T03:30:54.619Z",
//                         "_did": "4w7l",
//                         "_enum": [
//                             "She-Hulk",
//                             "Foundation",
//                             "Chief's Game",
//                             "House of the Dragon",
//                             "Rick and Morty",
//                             "Bluey",
//                             "The Boys",
//                             "Severance ",
//                             "Succession",
//                             "The Last of Us",
//                             "Secret Invasion"
//                         ],
//                         "_lbl": "Show",
//                         "_emoji": "📺",
//                         "_created": "2022-10-14T03:30:46.410Z",
//                         "_format": "@",
//                         "_deleted": false
//                     }
//                 ],
//                 "_tags": [
//                     "media"
//                 ],
//                 "_rev": 1
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "n59t",
//                 "_deleted": false,
//                 "_desc": "Spent some time reading a book (or listening to a book, whatever)",
//                 "_emoji": "📚",
//                 "_hide": false,
//                 "_lbl": "Book Reading",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_did": "n59t",
//                         "_rollup": "Count Distinct",
//                         "_updated": {
//                             "seconds": 1666757333,
//                             "nanoseconds": 887000000
//                         },
//                         "_pid": "zr0q",
//                         "_hide": false,
//                         "_emoji": "📖",
//                         "_type": "String",
//                         "_format": "@",
//                         "_lbl": "Book",
//                         "_desc": "The name of the book being read",
//                         "_created": "2022-09-22T02:30:02.406Z",
//                         "_deleted": false
//                     }
//                 ],
//                 "_tags": [
//                     "media"
//                 ],
//                 "_rev": 2
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "05ts",
//                 "_deleted": false,
//                 "_desc": "Outings for the benefit (mostly) of the boys. Fun games or whatever you made for them.",
//                 "_emoji": "👨‍👩‍👦‍👦",
//                 "_hide": false,
//                 "_lbl": "Outing with Kids",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_format": "@",
//                         "_desc": "Where you went/what you did.",
//                         "_rollup": "Count",
//                         "_lbl": "What",
//                         "_did": "05ts",
//                         "_deleted": false,
//                         "_pid": "kwib",
//                         "_updated": {
//                             "seconds": 1680063133,
//                             "nanoseconds": 286000000
//                         },
//                         "_hide": false,
//                         "_emoji": "🛝",
//                         "_type": "String",
//                         "_created": {
//                             "seconds": 1680063092,
//                             "nanoseconds": 683000000
//                         }
//                     }
//                 ],
//                 "_tags": [],
//                 "_rev": 1
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "4hpk",
//                 "_deleted": false,
//                 "_desc": "Where you worked, if you worked. ",
//                 "_emoji": "👔",
//                 "_hide": false,
//                 "_lbl": "Work Status",
//                 "_scope": "Day",
//                 "_points": [
//                     {
//                         "_pid": "zgfo",
//                         "_created": {
//                             "seconds": 1680270961,
//                             "nanoseconds": 565000000
//                         },
//                         "_did": "4hpk",
//                         "_emoji": "📍",
//                         "_hide": false,
//                         "_format": "@",
//                         "_lbl": "Work Location",
//                         "_desc": "Where you worked if you worked. Or vacation. Day off. Holiday. Sick day.",
//                         "_updated": {
//                             "seconds": 1680793863,
//                             "nanoseconds": 445000000
//                         },
//                         "_deleted": false,
//                         "_type": "Enum",
//                         "_rollup": "Count"
//                     }
//                 ],
//                 "_tags": [],
//                 "_rev": 1
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "x6rd",
//                 "_deleted": false,
//                 "_desc": "Checking in on Whole30 progress.",
//                 "_emoji": "🥦",
//                 "_hide": true,
//                 "_lbl": "Whole30 Diary",
//                 "_scope": "Day",
//                 "_points": [
//                     {
//                         "_rollup": "Count",
//                         "_pid": "as3rq",
//                         "_deleted": false,
//                         "_format": "@",
//                         "_updated": {
//                             "seconds": 1682094194,
//                             "nanoseconds": 222000000
//                         },
//                         "_type": "String",
//                         "_emoji": "✏️",
//                         "_did": "x6rd",
//                         "_hide": false,
//                         "_desc": "How are you feeling? How is Whole30 going?",
//                         "_lbl": "Diary",
//                         "_created": {
//                             "seconds": 1679271837,
//                             "nanoseconds": 177000000
//                         }
//                     }
//                 ],
//                 "_tags": [
//                     "health",
//                     "diet"
//                 ],
//                 "_rev": 1
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "ipkr",
//                 "_deleted": false,
//                 "_desc": "A nightly reflection on the day.",
//                 "_emoji": "👀",
//                 "_hide": false,
//                 "_lbl": "Nightly Review",
//                 "_scope": "Day",
//                 "_points": [
//                     {
//                         "_did": "ipkr",
//                         "_rollup": "Count",
//                         "_lbl": "Summary",
//                         "_updated": {
//                             "seconds": 1682786281,
//                             "nanoseconds": 933000000
//                         },
//                         "_created": {
//                             "seconds": 1672723971,
//                             "nanoseconds": 360000000
//                         },
//                         "_deleted": false,
//                         "_pid": "msrj",
//                         "_hide": false,
//                         "_type": "String",
//                         "_desc": "Description of the day.",
//                         "_format": "@",
//                         "_emoji": "📓"
//                     },
//                     {
//                         "_format": "#",
//                         "_did": "ipkr",
//                         "_pid": "pygk",
//                         "_updated": {
//                             "seconds": 1682786281,
//                             "nanoseconds": 933000000
//                         },
//                         "_created": {
//                             "seconds": 1672723971,
//                             "nanoseconds": 362000000
//                         },
//                         "_type": "Number",
//                         "_desc": "1 - Bedridden, 10 - Perfectly Health",
//                         "_emoji": "🌡",
//                         "_rollup": "Average",
//                         "_deleted": false,
//                         "_lbl": "Health Status",
//                         "_hide": false
//                     },
//                     {
//                         "_format": "#",
//                         "_lbl": "Satisfaction",
//                         "_deleted": false,
//                         "_pid": "h9kl",
//                         "_created": {
//                             "seconds": 1672723971,
//                             "nanoseconds": 363000000
//                         },
//                         "_did": "ipkr",
//                         "_updated": {
//                             "seconds": 1682786281,
//                             "nanoseconds": 933000000
//                         },
//                         "_rollup": "Average",
//                         "_type": "Number",
//                         "_desc": "1 - Horrible Day, 10 - Perfect Day",
//                         "_emoji": "😀",
//                         "_hide": false
//                     },
//                     {
//                         "_type": "String",
//                         "_lbl": "Challenge",
//                         "_created": {
//                             "seconds": 1672723971,
//                             "nanoseconds": 364000000
//                         },
//                         "_emoji": "🎯",
//                         "_deleted": false,
//                         "_did": "ipkr",
//                         "_pid": "0ggj",
//                         "_format": "@",
//                         "_updated": {
//                             "seconds": 1682786281,
//                             "nanoseconds": 933000000
//                         },
//                         "_rollup": "Count",
//                         "_desc": "How did you adhere to your current 30 Day Challenge. Was marked deleted but I think marking it undeleted will make my future life easier. ",
//                         "_hide": true
//                     }
//                 ],
//                 "_tags": [],
//                 "_rev": 2
//             },
//             {
//                 "_created": "2023-09-29T00:34:38.463Z",
//                 "_updated": "2023-09-29T00:34:38.463Z",
//                 "_did": "0kp4",
//                 "_deleted": false,
//                 "_desc": "Watched a movie (and finished it, generally). Tracked once if split up over two days of watching it.",
//                 "_emoji": "🎬",
//                 "_hide": false,
//                 "_lbl": "Movies",
//                 "_scope": "Time",
//                 "_points": [
//                     {
//                         "_did": "0kp4",
//                         "_created": {
//                             "seconds": 1685810422,
//                             "nanoseconds": 58000000
//                         },
//                         "_format": "@",
//                         "_emoji": "🎬",
//                         "_updated": {
//                             "seconds": 1685810427,
//                             "nanoseconds": 735000000
//                         },
//                         "_deleted": false,
//                         "_type": "String",
//                         "_hide": false,
//                         "_pid": "yo6c",
//                         "_desc": "Name of the movie.",
//                         "_rollup": "Count Distinct",
//                         "_lbl": "Name"
//                     },
//                     {
//                         "_type": "Boolean",
//                         "_pid": "0d6i",
//                         "_hide": false,
//                         "_created": {
//                             "seconds": 1685810422,
//                             "nanoseconds": 59000000
//                         },
//                         "_desc": "Is this the first time you've ever seen the movie?",
//                         "_lbl": "First Time?",
//                         "_did": "0kp4",
//                         "_format": "Bool",
//                         "_updated": {
//                             "seconds": 1685810427,
//                             "nanoseconds": 735000000
//                         },
//                         "_rollup": "Count Each",
//                         "_deleted": false,
//                         "_emoji": "🆕"
//                     }
//                 ],
//                 "_tags": [
//                     "media"
//                 ],
//                 "_rev": 1
//             }
//         ]
//     }

//     let massagedDefs = oldDefs.definitons.map(oldDef=>{
//         if(oldDef._scope==='Time') oldDef._scope = 'SECOND';
//         oldDef._scope = oldDef._scope.toUpperCase();
//         oldDef._pts = oldDef._points;
//         oldDef._pts.forEach(pt=>{
//             pt._rollup=pt._rollup.toUpperCase();
//             pt._type=pt._type.toUpperCase();
//             if(pt._type === 'STRING') pt._type = "TEXT";
//             if(pt._type === 'ARRAY') pt._type = "MULTISELECT";
//             if(pt._type === 'ENUM') pt._type = "SELECT";
//             if(pt._type === 'BOOLEAN') pt._type = "BOOL";
//             if(pt._rollup === 'COUNT EACH') pt._rollup = "COUNTOFEACH";
//             if(pt._rollup === 'COUNT DISTINCT') pt._rollup = "COUNTUNIQUE";
//             delete pt._deleted;
//             delete pt._format;
//             delete pt._points;
//         })
//         return oldDef
//     })

//     return massagedDefs
    
// }
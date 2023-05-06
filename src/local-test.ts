//// @ts-nocheck
import { EntryPoint, PDW, Period, PointType, Rollup, makeEpochStr, makeSmallID, parseTemporalFromEpochStr, parseTemporalFromUid } from './pdw.js'
import { Scope } from './pdw.js'
import { AsyncExcelNatural, exportToFile } from './dataStores/fileAsyncDataStores.js';
import { importFromFile } from './dataStores/fileAsyncDataStores.js';
import { Temporal, toTemporalInstant } from 'temporal-polyfill';
import { importFirestore, importMongo, importOldest } from './onetimeImports.js'

const pdw = PDW.getInstance();

//the firestore/mongo big merge
// importFromFile('real-data/out-fromfirestore.csv');
// importFromFile('real-data/out-frommongo-xlated.csv');
// exportToFile('real-data/merged.csv', pdw.getAll({includeDeleted:'yes'}))

// if(false){

    
    // importFromFile('real-data/defs_pointdefs.csv');
    // importFromFile('real-data/partial-old-more.csv')
    importFromFile('real-data/nearly-complete.csv')
    
    // pdw.createNewPointDef({
    //     _did: '0lj1',
    //     _pid: '63o2',
    //     _lbl: 'Started',
    //     _type: PointType.TIME
    // })

    // pdw.createNewPointDef({
    //     _did: '0lj1',
    //     _pid: '0fso',
    //     _lbl: 'Duration',
    //     _type: PointType.DURATION
    // })

    // pdw.createNewPointDef({
    //     _did: 'k788',
    //     _pid: 'gryw',
    //     _lbl: 'Nap Start',
    //     _type: PointType.TIME
    // })

    // pdw.createNewDef({
    //     _did: 'ul32',
    //     _lbl: '#BackTags',
    //     _desc: 'Tags stuff about my back',
    //     _emoji: '🏷️',
    // }).setPointDefs([{
    //     _pid: '63sy',
    //     _lbl: '#BackTags',
    //     _desc: 'Tags stuff about my back',
    //     _emoji: '🏷️',
    //     _type: PointType.TEXT
    // }])

    // pdw.createNewDef({
    //     _did: 'slxo',
    //     _lbl: 'Pedometer',
    // }).setPointDefs([{
    //     _pid: 'f39s',
    //     _lbl: 'Steps',
    //     _type: PointType.NUMBER
    // }])

    // pdw.createNewDef({
    //     _did: 'piea',
    //     _lbl: 'Sleep',
    // }).setPointDefs([{
    //     _pid: 'oher',
    //     _lbl: 'Bedtime',
    //     _type: PointType.TIME
    // },{
    //     _pid: 't2t3',
    //     _lbl: 'Waketime',
    //     _type: PointType.TIME
    // },{
    //     _pid: 'shg5',
    //     _lbl: 'Sleep Durtion',
    //     _type: PointType.DURATION
    // }])

    // pdw.createNewDef({
    //     _did: 'goal',
    //     _lbl: 'Daily Goals',
    // }).setPointDefs([{
    //     _pid: 'ldew',
    //     _lbl: 'Total',
    //     _type: PointType.NUMBER
    // },{
    //     _pid: 'ftho',
    //     _lbl: 'Body',
    //     _type: PointType.NUMBER
    // },{
    //     _pid: 'dvjd',
    //     _lbl: 'Mind',
    //     _type: PointType.NUMBER
    // },{
    //     _pid: 'nckc',
    //     _lbl: 'Manage',
    //     _type: PointType.NUMBER
    // },{
    //     _pid: 'jucs',
    //     _lbl: 'Work',
    //     _type: PointType.NUMBER
    // },{
    //     _pid: 'ndws',
    //     _lbl: 'social',
    //     _type: PointType.NUMBER
    // },{
    //     _pid: 'jsoj',
    //     _lbl: 'Slept 7.5',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'yhni',
    //     _lbl: 'Exercised',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'fshr',
    //     _lbl: 'Ate Well',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'spkc',
    //     _lbl: 'Drank Water',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'wghl',
    //     _lbl: 'Groomed Well',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'djcs',
    //     _lbl: 'Worked on a Project',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'legg',
    //     _lbl: 'Out of Comfort Zone',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'tvok',
    //     _lbl: 'Read',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'uafd',
    //     _lbl: 'Learned Something',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'yurj',
    //     _lbl: 'Stayed Positive',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'lyeq',
    //     _lbl: 'Budgeted',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'ybte',
    //     _lbl: 'Stayed on Appointments',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'gqrq',
    //     _lbl: 'Kept Place Clean',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'tguw',
    //     _lbl: 'Used Time Well',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'hhjd',
    //     _lbl: 'Worked Towards Goals',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'ufix',
    //     _lbl: 'Took Breaks',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'gohw',
    //     _lbl: 'Communicated Well',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'etym',
    //     _lbl: 'Kept Organized',
    //     _type: PointType.BOOL
    // }
    // ,{
    //     _pid: 'wryh',
    //     _lbl: 'Meetings Engaged',
    //     _type: PointType.BOOL
    // },
    // {
    //     _pid: 'yytd',
    //     _lbl: 'Took Steps to Further Career',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'jcek',
    //     _lbl: 'Took Care of Relationship',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'otlq',
    //     _lbl: 'Talked with Family',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'xxdw',
    //     _lbl: 'Saw a Friend',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'tkfr',
    //     _lbl: 'Did Something Nice for Someone',
    //     _type: PointType.BOOL
    // },{
    //     _pid: 'gudh',
    //     _lbl: 'Focused Less on Yourself',
    //     _type: PointType.BOOL
    // }])


    // importOldest('real-data/final-import.xlsx')

    // importFromFile('real-data/merged-firestore-mongo.csv')
    // importFromFile('real-data/partial-old-more.csv')
    
    // const data = pdw.getAll({includeDeleted: 'yes'});
    // exportToFile('real-data/partial-old-dataset.csv',data)
    // exportToFile('real-data/partial-old-dataset.yaml',data)
    
    //create all current file types from firestore & mongo data
    // importFromFile('real-data/merged-firestore-mongo.csv')
    // const allData = pdw.getAll({includeDeleted:'yes', did:['hovt']})
    const entries = pdw.getAll({'includeDeleted': 'yes'})
    // console.log(allData);
    exportToFile('real-data/combotest.csv', entries)
    exportToFile('real-data/combotest.xlsx', entries)
    exportToFile('real-data/combotest.json', entries)
    exportToFile('real-data/combotest.yaml', entries)
// }

// exportToFile('real-data/merged.json', allData)
// exportToFile('real-data/merged.yaml', allData)
// exportToFile('real-data/merged.xlsx', allData)

// importFromFile('real-data/out-fromfirestore.csv')
// console.log('yo');
// exportToFile('real-data/deleteme.csv',pdw.getAll({}))

// createTestFiles();

// this worked. Old data, updated, import of new data merge behaved as expected
// importFromFile('data-files/OutExcel1.xlsx');
// pdw.createNewEntry({
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

function createTestFiles() {
    //Testing createNewDef && Def.setPointDefs
    pdw.createNewDef({
        _did: '0m7w',
        _lbl: 'defOne',
        _emoji: '1️⃣',
        _scope: Scope.SECOND,
        _desc: 'This is now inerited'
    }).setPointDefs([{
        _lbl: 'Select Test',
        _type: PointType.SELECT,
        _emoji: '⛏️',
        _desc: 'For testing selects',
        _pid: '8esq',
        _rollup: Rollup.COUNTOFEACH
    }])
    pdw.createNewDef({
        _did: 'ay7l',
        _lbl: 'TWO',
        _emoji: '2️⃣',
        _scope: Scope.HOUR,
        _desc: 'Scoped at an **hour**, cause why not have that option?'
    })
    pdw.createNewDef({
        _did: '05a8',
        _lbl: 'FREE',
        _emoji: '3️⃣',
        _scope: Scope.DAY,
        _created: 'lgvm3a11'
    })
    pdw.createNewPointDef({
        _did: '05a8',
        _type: PointType.TEXT,
        _lbl: 'Free Item',
        _emoji: '🆓'
    })
    pdw.createNewPointDef({
        _did: 'ay7l',
        _pid: '0pc6',
        _type: PointType.NUMBER,
        _lbl: 'Numeric Thing',
        _emoji: '#️⃣',
        _rollup: Rollup.AVERAGE
    })
    pdw.createNewPointDef({
        _did: 'ay7l',
        _pid: '0tb7',
        _type: PointType.BOOL,
        _lbl: 'Boolean Thing',
        _emoji: '👍',
        _desc: 'Orig desc'
    })
    pdw.createNewEntry({
        _eid: 'lgricx7k-08al',
        _did: 'ay7l',
        _note: 'Orig note',
        _period: '2023-04-22T06',
        'Boolean Thing': false, //key by _lbl
        '0pc6': 5 //key by _pid
    })
    pdw.createNewEntry({
        _did: '0m7w',
    })
    pdw.createNewTagDef({
        _lbl: 'My Tag!',
    })
    pdw.createNewTagDef({
        _lbl: 'Orig Tag Label',
        _tid: 'vvct'
    })
    pdw.createNewTagDef({
        _lbl: 'Select Option To Delete',
        _tid: '0vvi'
    })
    pdw.createNewTagDef({
        _lbl: 'Select Option 1',
        _tid: '0vva'
    })
    pdw.createNewTagDef({
        _lbl: 'Select Option 2',
        _tid: '0vvb'
    })
    pdw.createNewTag({
        _did: 'ay7l',
        _tid: 'vvct'
    })
    pdw.createNewTag({
        _did: '0m7w',
        _tid: '0vvi',
        _pid: '8esq'
    })
    pdw.createNewTag({
        _did: '0m7w',
        _tid: '0vva',
        _pid: '8esq'
    })
    pdw.createNewTag({
        _did: '0m7w',
        _tid: '0vvb',
        _pid: '8esq'
    })

    //Write to file before any updates
    let outFileOneame = 'data-files/OutExcel1.xlsx';
    exportToFile(outFileOneame, pdw.getAll({ includeDeleted: 'yes' }));

    setTimeout(() => {

        //update def (and pointdef)
        pdw.setDefs([{
            _did: 'ay7l',
            _lbl: 'Two Relabeled',
            '0pc6': {
                _lbl: 'Test Relabel'
            }
        }]);
        //update a pointdef
        pdw.setPointDefs([{
            _did: 'ay7l',
            _pid: '0tb7',
            _emoji: '👎',
        }])
        //update an entry (and entrypoint)
        pdw.setEntries([{
            _eid: 'lgricx7k-08al',
            _note: 'Updated noted',
            '0tb7': true
        }])
        //update an entrypoint explicitly
        pdw.setEntryPoints([{
            _eid: 'lgricx7k-08al',
            _pid: '0pc6',
            _val: 6
        }])
        //update a tagDef
        pdw.setTagDefs([{
            _tid: 'vvct',
            _lbl: 'New Label'
        }])
        pdw.setTags([{
            _tid: '0vvi',
            _pid: '8esq',
            _did: '0m7w',
            _deleted: true
        }])
        //update a tag
        pdw.setTags([{
            _did: 'ay7l',
            _tid: 'vvct',
            _deleted: true
        }])

        //Write to updated files
        let data = pdw.getAll({ includeDeleted: 'yes' });
        let outFileTwoName = 'data-files/OutExcel2.xlsx';
        exportToFile(outFileTwoName, data);
        let outJsonName = 'data-files/OutJSON.json';
        exportToFile(outJsonName, data);
        let outYamlName = 'data-files/OutYaml.yaml';
        exportToFile(outYamlName, data);
        let outCSVName = 'data-files/OutCSV.csv';
        exportToFile(outCSVName, data);
    }, 1500)
}
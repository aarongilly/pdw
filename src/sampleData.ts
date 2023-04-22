import { Temporal } from "temporal-polyfill"

export const samplePointDefs = [
    {
        _did: 'doae',
        _uid: 'lep65ghw.rghw',
        _created: undefined,
        _updated:  'lep62vrw',
        _deleted: false,
        _pid: 'apox',
        _lbl: 'Event',
        _desc: 'The main text for the event',
        _emoji: '🏷️',
        _type: "TEXT",
        _rollup: "COUNT",
        _format: "MARKDOWN",
    },            
    {
        _did: 'seae',
        _uid: 'lep65gcy.rghw',
        _created: '2023-03-12T22:10:00Z',
        _updated: 'lep62vrw',
        _deleted: false,
        _pid: 'oese',
        _lbl: 'Title',
        _desc: 'The name of hte movie',
        _emoji: '🎬',
        _type: "TEXT",
        _rollup: "COUNTUNIQUE",
        _format: "TEXT",
    },
    {
        _did: 'seae',
        _uid: 'lep65g3sq.fipe',
        _created: '2023-03-12T22:10:00Z',
        _updated: 'lep62vrw',
        _deleted: false,
        _pid: 'momm',
        _lbl: 'First time?',
        _desc: 'Have you seen this before?',
        _emoji: '🎍',
        _type: "BOOL",
        _rollup: "COUNTOFEACH",
        _format: "YESNO",
    }

]

export const sampleDefinitions = [
    {
        _uid: 'lep62vrw.hfvm',
        _created: '2023-02-28T22:10:00Z',
        _updated: 'lep62vrw',
        _deleted: false,
        _desc: 'A test definition, for plain events',
        _did: 'doae',
        _emoji: '🧪',
        _lbl: 'Event',
        _scope: "SECOND",
    },
    {
        _uid: 'lep62vpsx.doqd',
        _created: '2023-03-12T22:10:00Z',
        _updated: 'lep62vrw',
        _deleted: false,
        _desc: 'A 2nd definition, with two points',
        _did: 'seae',
        _emoji: '2️⃣',
        _lbl: 'Movie',
        _scope: "SECOND",
    }
]

export const sampleTags = [
    {
        _uid: 'lep6353w.hnkp',
        _created: '2023-03-12T22:10:00Z',
        _updated: 'lep62vrw',
        _deleted: false,
        _lbl: 'Media',
        _tid: 'pwpa'
    }
]

export const sampleEntries = [
    {
        _created: '2023-03-12T22:10:00Z',
        _updated: 'lep62vrw',
        _deleted: false,
        _uid: 'lep65g89q.awea',
        _eid: 'lep65g89q.awea',
        _did: 'seae',
        _note: 'A test note on a sample entry',
        _period: '2023-03-12T22:10:00Z'
    }
]

export const sampleEntryPoints = [
    {
        _created: '2023-03-12T22:10:00Z',
        _updated: 'lep62vrw',
        _deleted: false,
        _uid: 'lep65g89q.apis',
        _eid: 'lep65g89q.awea',
        _pid: 'oese',
        _val: 'Inception'
    },
    {
        _created: '2023-03-12T22:10:00Z',
        _updated: 'lep62vrw',
        _deleted: false,
        _uid: 'lep65g89q.wewq',
        _eid: 'lep65g89q.awea',
        _pid: 'momm',
        _val: true
    }
]
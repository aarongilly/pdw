import { Temporal } from "temporal-polyfill"
import { DefLike, EntryLike, EntryPointLike, Format, PointDefLike, PointType, Rollup, Scope, TagLike } from "./pdw"

export const samplePointDefs: PointDefLike[] = [
    {
        _did: 'doae',
        _uid: 'lep65ghw.rghw',
        _created: Temporal.PlainDateTime.from('2023-02-28T22:10:00'),
        _updated: Temporal.PlainDateTime.from('2023-02-28T22:10:00'),
        _deleted: false,
        _pid: 'apox',
        _lbl: 'Event',
        _desc: 'The main text for the event',
        _emoji: '🏷️',
        _type: PointType.TEXT,
        _rollup: Rollup.COUNT,
        _format: Format.MARKDOWN,
    },            
    {
        _did: 'seae',
        _uid: 'lep65gcy.rghw',
        _created: Temporal.PlainDateTime.from('2023-03-12T22:10:00'),
        _updated: Temporal.PlainDateTime.from('2023-03-12T22:10:00'),
        _deleted: false,
        _pid: 'oese',
        _lbl: 'Title',
        _desc: 'The name of hte movie',
        _emoji: '🎬',
        _type: PointType.TEXT,
        _rollup: Rollup.COUNTUNIQUE,
        _format: Format.TEXT,
    },
    {
        _did: 'seae',
        _uid: 'lep65g3sq.fipe',
        _created: Temporal.PlainDateTime.from('2023-03-12T22:10:00'),
        _updated: Temporal.PlainDateTime.from('2023-03-12T22:10:00'),
        _deleted: false,
        _pid: 'momm',
        _lbl: 'First time?',
        _desc: 'Have you seen this before?',
        _emoji: '🎍',
        _type: PointType.BOOL,
        _rollup: Rollup.COUNTOFEACH,
        _format: Format.YESNO,
    }

]

export const sampleDefinitions: DefLike[] = [
    {
        _uid: 'lep62vrw.hfvm',
        _created: Temporal.PlainDateTime.from('2023-02-28T22:10:00'),
        _updated: Temporal.PlainDateTime.from('2023-02-28T22:10:00'),
        _deleted: false,
        _desc: 'A test definition, for plain events',
        _did: 'doae',
        _emoji: '🧪',
        _lbl: 'Event',
        _scope: Scope.SECOND,
    },
    {
        _uid: 'lep62vpsx.doqd',
        _created: Temporal.PlainDateTime.from('2023-03-12T22:10:00'),
        _updated: Temporal.PlainDateTime.from('2023-03-12T22:10:00'),
        _deleted: false,
        _desc: 'A 2nd definition, with two points',
        _did: 'seae',
        _emoji: '2️⃣',
        _lbl: 'Movie',
        _scope: Scope.SECOND,
    }
]

export const sampleTags: TagLike[] = [
    {
        _uid: 'lep6353w.hnkp',
        _created: Temporal.PlainDateTime.from('2023-03-12T22:10:00'),
        _updated: Temporal.PlainDateTime.from('2023-03-12T22:10:00'),
        _deleted: false,
        _lbl: 'Media',
        _tid: 'pwpa'
    }
]

export const sampleEntries: EntryLike[] = [
    {
        _created: Temporal.PlainDateTime.from('2023-03-12T22:10:00'),
        _updated: Temporal.PlainDateTime.from('2023-03-12T22:10:00'),
        _deleted: false,
        _uid: 'lep65g89q.awea',
        _eid: 'lep65g89q.awea',
        _did: 'seae',
        _note: 'A test note on a sample entry',
        _period: '2023-03-12T22:10:00'
    }
]

export const sampleEntryPoints: EntryPointLike[] = [
    {
        _created: Temporal.PlainDateTime.from('2023-03-12T22:10:00'),
        _updated: Temporal.PlainDateTime.from('2023-03-12T22:10:00'),
        _deleted: false,
        _uid: 'lep65g89q.apis',
        _eid: 'lep65g89q.awea',
        _pid: 'oese',
        _val: 'Inception'
    },
    {
        _created: Temporal.PlainDateTime.from('2023-03-12T22:10:00'),
        _updated: Temporal.PlainDateTime.from('2023-03-12T22:10:00'),
        _deleted: false,
        _uid: 'lep65g89q.wewq',
        _eid: 'lep65g89q.awea',
        _pid: 'momm',
        _val: true
    }
]
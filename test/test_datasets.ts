import * as dj from "../src/DJ.js"

//#region --- DEFS
export const bookDef: dj.Def = {
    _id: "BOOK_READ_NAME",
    _lbl: "Book",
    _emoji: "📖",
    _desc: "The name of the book you read.",
    _updated: "m0ofg4dw",
    _scope: dj.DefScope.MINUTE,
    _rollup: dj.Rollup.COUNTDISTINCT,
    _type: dj.DefType.TEXT,
    _tags: ['media'],
    _range: []
}

export const movieDef: dj.Def = {
    _id: "MOVIE_WATCH_NAME",
    _lbl: "Movie",
    _emoji: "🎬",
    _desc: "The name of the movie you watched.",
    _updated: "m0ofg4dw",
    _scope: dj.DefScope.MINUTE,
    _type: dj.DefType.TEXT,
    _tags: ['media'],
    _range: []
}

const newMovieDef: dj.Def = {
    _id: "MOVIE_WATCH_IS_FIRST",
    _lbl: "First Watch?",
    _emoji: "🎞️",
    _desc: "Is this the first time you've seen this movie?",
    _updated: "m0ofg4dw",
    _scope: dj.DefScope.MINUTE,
    _type: dj.DefType.BOOL,
    _tags: ['media'],
    _range: []
}

const sleepDef: dj.Def = {
    _id: "SLEEP_DURATION",
    _lbl: "Sleep Duration",
    _emoji: "🛌",
    _desc: "How long your ring says you slept.",
    _updated: "m0ofg4dw",
    _scope: dj.DefScope.DAY,
    _type: dj.DefType.DURATION,
    _tags: ['health'],
    _range: []
}

const runDef: dj.Def = {
    _id: "RUN_MILES",
    _lbl: "Run",
    _emoji: "🏃‍♂️‍➡️",
    _desc: "How far you jogged.",
    _updated: "m0ofg4dw",
    _scope: dj.DefScope.HOUR,
    _type: dj.DefType.NUMBER,
    _tags: ['health'],
    _range: ['>', '0']
}

const updatedRunDef: dj.Def = {
    _id: "RUN_MILES",
    _lbl: "Run (mi)",
    _emoji: "🏃‍♂️‍➡️",
    _desc: "How far you jogged, in miles",
    _updated: "m0ofg6rt", //is newer
    _scope: dj.DefScope.HOUR,
    _type: dj.DefType.NUMBER,
    _tags: ['health'],
    _range: ['>', '0']
}

const ateOutDef: dj.Def = {
    _id: "ATE_OUT",
    _lbl: "Ate Out",
    _emoji: "🍔",
    _desc: "You ate out. This is the name of the place you ate out at.",
    _updated: "m0ofg4dw",
    _scope: dj.DefScope.MINUTE,
    _type: dj.DefType.TEXT,
    _tags: ['health', 'money'],
    _range: []
}

const workoutTypeDef: dj.Def = {
    _id: "WORKOUT_TYPE",
    _lbl: "Workout Type",
    _emoji: "🏋️",
    _desc: "You did a broad workout of this type",
    _updated: "m0ofg4dw",
    _scope: dj.DefScope.HOUR,
    _type: dj.DefType.SELECT,
    _tags: ['health'],
    _range: ['CARDIO', 'STRENGTH', 'MOBILITY']
}

const workoutNameDef: dj.Def = {
    _id: "WORKOUT_NAME",
    _lbl: "Workout Name",
    _emoji: "💪",
    _desc: "The name of the routine, or brief description of it.",
    _updated: "m0ofg4dw",
    _scope: dj.DefScope.HOUR,
    _type: dj.DefType.TEXT,
    _tags: ['health'],
    _range: []
}

//#endregion

//#region ----- ENTRIES

export const readEntry: dj.Entry = {
    _id: "m0ofgfio_gjlp",
    _period: "2024-09-04T18:39:00",
    _created: "m0ofgfio",
    _updated: "m0ofgfio",
    _deleted: false,
    _note: "A very typical entry",
    _source: "Test data",
    BOOK_NAME: "Atomic Habits"
}

export const readAndWorkedOutEntry: dj.Entry = {
    _id: "m0ogacof_3fjk",
    _period: "2024-09-05T11:09:00",
    _created: "m0ogacof",
    _updated: "m0ogacof",
    _deleted: false,
    _note: "A very typical 2nd entry, with two entry points",
    _source: "Test data",
    BOOK_NAME: "Atomic Habits",
    WORKOUT_TYPE: 'CARDIO'
}

/**
 * An update to the above Entry
 */
const readAndWorkedOutWithName: dj.Entry = {
    _id: "m0ogacof_3fjk", // SAME ID
    _period: "2024-09-05T11:09:00",
    _created: "m0ogacof",
    _updated: "m0ogbzzz",
    _deleted: false,
    _note: "An *updated* entry, now with 3 points",
    _source: "Test data, with edit!",
    BOOK_NAME: "Atomic Habits",
    WORKOUT_TYPE: 'CARDIO',
    WORKOUT_NAME: 'Biked',
}

const lifted: dj.Entry = {
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

const deletedEntry: dj.Entry = {
    _id: "m0ofacho_poax",
    _period: "2024-09-06T10:38:00",
    _created: "m0ofacho",
    _updated: "m0zzzzzz",
    _deleted: true,
    _note: "Demo a deleted entry",
    _source: "Test daaata"
}

//#endregion

//#region ----- JOURNALS FOR MERGING
export const emptySet = {
    defs: [],
    entries: [],
}

export const defsOnlyA = {
    defs: [bookDef, movieDef, newMovieDef, runDef],
    entries: [],
}

export const defsOnlyB = {
    defs: [bookDef, sleepDef, updatedRunDef],
    entries: [],
}

export const defsOnlyAB = {
    defs: [bookDef, movieDef, newMovieDef, sleepDef, updatedRunDef],
    entries: [],
}

export const defsOnlyC = {
    defs: [ateOutDef, workoutTypeDef, workoutNameDef],
    entries: []
}

export const defsOnlyABC = {
    defs: [bookDef, movieDef, newMovieDef, sleepDef, updatedRunDef, ateOutDef, workoutTypeDef, workoutNameDef],
    entries: [],
}

export const smallJournalA = {
    defs: [bookDef],
    entries: [readEntry]
}

export const smallJournalB = {
    defs: [bookDef, workoutTypeDef],
    entries: [readAndWorkedOutEntry]
}

export const smallJournalAB = {
    defs: [bookDef, workoutTypeDef],
    entries: [readEntry, readAndWorkedOutEntry]
}

export const smallJournalC = {
    defs: [workoutTypeDef, workoutNameDef],
    entries: [readAndWorkedOutWithName, lifted]
}

export const smallJournalABC = {
    defs: [bookDef, workoutTypeDef, workoutNameDef],
    entries: [readEntry, readAndWorkedOutWithName, lifted]
}

//#endregion

//#region --- JOURNALS FOR OVERVIEW & INDEX

export const journalToOverviewAndIndex: dj.DataJournal = {
    defs: [bookDef, workoutTypeDef, workoutNameDef],
    entries: [readEntry, readAndWorkedOutWithName, lifted, deletedEntry]
}

export const expectedOverview: dj.Overview = {
    updated: {
        epochStr: "m0zzzzzz", //from the deleted entry
        localeStr: "9/12/2024, 7:46:32 PM", //translated
        isoStr: "2024-09-13T00:46:32.447Z", //translated
    },
    counts: {
        defs: 3,
        activeEntries: 3,
        deletedEntries: 1
    },
    index: {
        defMap: {
            "BOOK_READ_NAME": 0,
            "WORKOUT_TYPE": 1,
            "WORKOUT_NAME": 2
        },
        entryMap: {
            "M0OFGFIO_GJLP": 0,
            "M0OGACOF_3FJK": 1,
            "M0OGDGGG_CA3T": 2,
            "M0OFACHO_POAX": 3,
        },
        defLblToIdMap: {
            "Book": "BOOK_READ_NAME",
            "Workout Name": "WORKOUT_NAME",
            "Workout Type": "WORKOUT_TYPE",
        }
    }
}
//#endregion

//#region --- EXPECTED GROUPING
//uses smallJournalABC
export const expectedGroupingBySource = {
    "Test data": [readEntry, lifted],
    "Test data, with edit!": [readAndWorkedOutWithName],
}

//uses journalToOverviewAndIndex
export const expectedGroupingByDeleted = {
    "ACTIVE": [
        {
            "BOOK_NAME": "Atomic Habits",
            "_period": "2024-09-04T18:39:00",
            "_created": "m0ofgfio",
            "_deleted": false,
            "_id": "m0ofgfio_gjlp",
            "_note": "A very typical entry",
            "_source": "Test data",
            "_updated": "m0ofgfio",
        },
        {
            "BOOK_NAME": "Atomic Habits",
            "WORKOUT_NAME": "Biked",
            "WORKOUT_TYPE": "CARDIO",
            "_period": "2024-09-05T11:09:00",
            "_created": "m0ogacof",
            "_deleted": false,
            "_id": "m0ogacof_3fjk",
            "_note": "An *updated* entry, now with 3 points",
            "_source": "Test data, with edit!",
            "_updated": "m0ogbzzz",
        },
        {
            "WORKOUT_NAME": "Starting Strength A",
            "WORKOUT_TYPE": "STRENGTH",
            "_period": "2024-09-05T11:05:00",
            "_created": "m0ogdggg",
            "_deleted": false,
            "_id": "m0ogdggg_ca3t",
            "_note": "Got so swole",
            "_source": "Test data",
            "_updated": "m0ogdggg",
        },
    ],
    "DELETED": [
        {
            "_period": "2024-09-06T10:38:00",
            "_created": "m0ofacho",
            "_deleted": true,
            "_id": "m0ofacho_poax",
            "_note": "Demo a deleted entry",
            "_source": "Test daaata",
            "_updated": "m0zzzzzz",
        },
    ],
}

export const expectedGroupingByDefs = {
    "BOOK_NAME": [
        {
            "BOOK_NAME": "Atomic Habits",
            "_period": "2024-09-04T18:39:00",
            "_created": "m0ofgfio",
            "_deleted": false,
            "_id": "m0ofgfio_gjlp",
            "_note": "A very typical entry",
            "_source": "Test data",
            "_updated": "m0ofgfio",
        },
        {
            "BOOK_NAME": "Atomic Habits",
            "WORKOUT_NAME": "Biked",
            "WORKOUT_TYPE": "CARDIO",
            "_period": "2024-09-05T11:09:00",
            "_created": "m0ogacof",
            "_deleted": false,
            "_id": "m0ogacof_3fjk",
            "_note": "An *updated* entry, now with 3 points",
            "_source": "Test data, with edit!",
            "_updated": "m0ogbzzz",
        },
    ],
    "WORKOUT_NAME": [
        {
            "BOOK_NAME": "Atomic Habits",
            "WORKOUT_NAME": "Biked",
            "WORKOUT_TYPE": "CARDIO",
            "_period": "2024-09-05T11:09:00",
            "_created": "m0ogacof",
            "_deleted": false,
            "_id": "m0ogacof_3fjk",
            "_note": "An *updated* entry, now with 3 points",
            "_source": "Test data, with edit!",
            "_updated": "m0ogbzzz",
        },
        {
            "WORKOUT_NAME": "Starting Strength A",
            "WORKOUT_TYPE": "STRENGTH",
            "_period": "2024-09-05T11:05:00",
            "_created": "m0ogdggg",
            "_deleted": false,
            "_id": "m0ogdggg_ca3t",
            "_note": "Got so swole",
            "_source": "Test data",
            "_updated": "m0ogdggg",
        },
    ],
    "WORKOUT_TYPE": [
        {
            "BOOK_NAME": "Atomic Habits",
            "WORKOUT_NAME": "Biked",
            "WORKOUT_TYPE": "CARDIO",
            "_period": "2024-09-05T11:09:00",
            "_created": "m0ogacof",
            "_deleted": false,
            "_id": "m0ogacof_3fjk",
            "_note": "An *updated* entry, now with 3 points",
            "_source": "Test data, with edit!",
            "_updated": "m0ogbzzz",
        },
        {
            "WORKOUT_NAME": "Starting Strength A",
            "WORKOUT_TYPE": "STRENGTH",
            "_period": "2024-09-05T11:05:00",
            "_created": "m0ogdggg",
            "_deleted": false,
            "_id": "m0ogdggg_ca3t",
            "_note": "Got so swole",
            "_source": "Test data",
            "_updated": "m0ogdggg",
        },
    ],
}


//#endregion
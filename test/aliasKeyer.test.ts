import { describe, expect, test } from 'vitest';
import { AliasKeyer, AliasKeyes } from '../src/AliasKeyer'
import * as testData from './test_datasets';

describe('Apply and remove Aliases', () => {
    const aliasKeys: AliasKeyes = {
        "id": "_id",
        "per": "_period",
        "lbl": "_lbl",
        "typ": "_type",
        "dsc": "_desc",
        "emo": "_emoji",
        "rlp": "_rollup",
        "tag": "_tags",
        "rng": "_range",
        "scp": "_scope",
        "cre": "_created",
        "upd": "_updated",
        "del": "_deleted",
        "src": "_source",
        "nte": "_note",
        "workout name": "WORKOUT_NAME",
        "workout type": "WORKOUT_TYPE",
        "book": "BOOK_NAME",
    };

    test('Apply and Remove Aliases', () => {
        const normalDJ = testData.biggerJournal;
        //apply labels
        const aliasedDJ = AliasKeyer.applyAliases(normalDJ, aliasKeys);
        expect(aliasedDJ).toEqual(expectedAliasedDJ);
        //remove them
        const reconstitutedDJ = AliasKeyer.unapplyAliases(aliasedDJ, aliasKeys);
        expect(normalDJ).toEqual(reconstitutedDJ);
    })

    test('Apply blank aliases does nothing', () => {
        const normalDJ = testData.biggerJournal;
        const aliasedDJ = AliasKeyer.applyAliases(normalDJ, {});
        expect(aliasedDJ).toEqual(normalDJ);
    })
})

const expectedAliasedDJ = {
    defs: [
        {
            id: "BOOK_NAME",
            lbl: "Book",
            emo: "📖",
            dsc: "The name of the book you read.",
            upd: "m0ofg4dw",
            scp: "MINUTE",
            rlp: "COUNTDISTINCT",
            typ: "TEXT",
            tag: [
                "media",
            ],
            rng: [
            ],
        },
        {
            id: "WORKOUT_TYPE",
            lbl: "Workout Type",
            emo: "🏋️",
            dsc: "You did a broad workout of this type",
            upd: "m0ofg4dw",
            scp: "HOUR",
            typ: "SELECT",
            tag: [
                "health",
            ],
            rng: [
                "CARDIO",
                "STRENGTH",
                "MOBILITY",
            ],
        },
        {
            id: "WORKOUT_NAME",
            lbl: "Workout Name",
            emo: "💪",
            dsc: "The name of the routine, or brief description of it.",
            upd: "m0ofg4dw",
            scp: "HOUR",
            typ: "TEXT",
            tag: [
                "health",
            ],
            rng: [
            ],
        },
    ],
    entries: [
        {
            id: "m0ofgfio_gjlp",
            per: "2024-09-04T18:39:00",
            cre: "m0ofgfio",
            upd: "m0ofgfio",
            del: false,
            nte: "A very typical entry",
            src: "Test data",
            book: "Atomic Habits",
        },
        {
            id: "m0ogacof_3fjk",
            per: "2024-09-05T11:09:00",
            cre: "m0ogacof",
            upd: "m0ogbzzz",
            del: false,
            nte: "An *updated* entry, now with 3 points",
            src: "Test data, with edit!",
            book: "Atomic Habits",
            "workout type": "CARDIO",
            "workout name": "Biked",
        },
        {
            id: "m0ogdggg_ca3t",
            per: "2024-09-05T11:05:00",
            cre: "m0ogdggg",
            upd: "m0ogdggg",
            del: false,
            nte: "Got so swole",
            src: "Test data",
            "workout type": "STRENGTH",
            "workout name": "Starting Strength A",
        },
        {
            id: "m0ofacho_poax",
            per: "2024-09-06T10:38:00",
            cre: "m0ofacho",
            upd: "m0zzzzzz",
            del: true,
            nte: "Demo a deleted entry",
            src: "Test daaata",
        },
    ],
}
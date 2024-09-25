import { DataJournal } from "./DJ";

export type AliasKeyes = { [alias: string]: string };

export class AliasKeyer {
    /**
     * Takes in a regular Data Journal, returns the same DJ but with aliased keys
     * @param dataJournal regular Data Journal
     * @param aliasKeys the AliasKeys map to apply
     */
    static applyAliases(dataJournal: DataJournal, aliasKeys: AliasKeyes) {
        const returnObj = {
            defs: [],
            entries: []
        };
        const keyAliases = flipToKeyAlias(aliasKeys);
        dataJournal.defs.forEach(def => {
            let newDef = Object.fromEntries(
                Object
                    .entries(def)
                    .map(([key, value]) => {
                        if (keyAliases[key] === undefined) return [key, value]
                        return [keyAliases[key], value]
                    }))
                    //@ts-expect-error
                returnObj.defs.push(newDef);
        })
        dataJournal.entries.forEach(entry => {
            let newEntry = Object.fromEntries(
                Object
                    .entries(entry)
                    .map(([key, value]) => {
                        if (keyAliases[key] === undefined) return [key, value]
                        return [keyAliases[key], value]
                    }))
                    //@ts-expect-error
                returnObj.entries.push(newEntry);
        })
        return returnObj;
    }

    static unapplyAliases(dataJournal: DataJournal, aliasKeys: AliasKeyes) {
        const returnObj = {
            defs: [],
            entries: []
        };
        dataJournal.defs.forEach(def => {
            let newDef = Object.fromEntries(
                Object
                    .entries(def)
                    .map(([key, value]) => {
                        if (aliasKeys[key] === undefined) return [key, value]
                        return [aliasKeys[key], value]
                    }))
                    //@ts-expect-error
                returnObj.defs.push(newDef);
        })
        dataJournal.entries.forEach(entry => {
            let newEntry = Object.fromEntries(
                Object
                    .entries(entry)
                    .map(([key, value]) => {
                        if (aliasKeys[key] === undefined) return [key, value]
                        return [aliasKeys[key], value]
                    }))
                    //@ts-expect-error
                returnObj.entries.push(newEntry);
        })
        return returnObj;
    }
}

function flipToKeyAlias(aliasKey: AliasKeyes): AliasKeyes /* inverted */ {
    return Object.fromEntries(
        Object
            .entries(aliasKey)
            .map(([key, value]) => [value, key])
    );
}
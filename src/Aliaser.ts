import { DataJournal, DJ } from "./DataJournal.js";

/**
 * Alias => Key... like so:
 * {localName: 'canoncialName'}
 */
export type AliasKeyes = { [alias: string]: string };

export type AliasedDataJournal = {
    defs: any[],
    entries: any[]
}

export class Aliaser {
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
        const keyAliases = Aliaser.flipToKeyAlias(aliasKeys);
        const standardizedArray = Aliaser.buildStandardizedArray(keyAliases);
        dataJournal.defs.forEach(def => {
            let newDef = Object.fromEntries(
                Object
                    .entries(def)
                    .map(([key, value]) => {
                        const foundIndex = standardizedArray.findIndex(obj => obj.standardizedAlias === DJ.standardizeKey(key));
                        if (foundIndex === -1) return [key, value]
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
                        const foundIndex = standardizedArray.findIndex(obj => obj.standardizedAlias === DJ.standardizeKey(key));
                        if (foundIndex === -1) return [key, value]
                        return [keyAliases[standardizedArray[foundIndex].alias], value]
                    }))
            //@ts-expect-error
            returnObj.entries.push(newEntry);
        })
        return returnObj;
    }

    private static buildStandardizedArray(aliasKeys: AliasKeyes) {
        return Object.keys(aliasKeys).map(alias => {
            return {
                alias: alias,
                key: aliasKeys[alias],
                standardizedAlias: DJ.standardizeKey(alias)
            }
        })
    }

    static unapplyAliases(dataJournal: AliasedDataJournal, aliasKeys: AliasKeyes): DataJournal {
        //huh, turns out this was pretty simple
        return Aliaser.applyAliases(dataJournal, Aliaser.flipToKeyAlias(aliasKeys));
    }

    static flipToKeyAlias(aliasKey: AliasKeyes): AliasKeyes /* inverted */ {
        return Object.fromEntries(
            Object
                .entries(aliasKey)
                .map(([key, value]) => [value, key])
        );
    }
}
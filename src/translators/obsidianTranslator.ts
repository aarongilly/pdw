import * as fs from 'fs';
import * as dj from '../DataJournal.js';
import { Translator } from '../pdw.js';
import { AliasKeyer, AliasKeyes } from '../AliasKeyer.js';
import { Note, Block } from './MarkdownParsers.js'

/**
 * Obsidian Translator is basically just a Markdown Translator that
 * expects filenames to be dates & also uses the "^" as block ID shorthand
 */
export class ObsidianTranslator implements Translator {
    keyAliasFilePath?: string
    
    getServiceName(): string {
        return 'Markdown Translator'
    }

    setKeyAliasFile(pathToConfigMarkdownFile: string){
        this.keyAliasFilePath = pathToConfigMarkdownFile;
        return this;
    }

    static fromDataJournal(data: dj.DataJournal, filepath: string, aliasKeys: AliasKeyes = {}) {
        return new ObsidianTranslator().fromDataJournal(data, filepath, aliasKeys);
    }

    static toDataJournal(filepath: string, pathToConfigMarkdownFile: string): Promise<dj.DataJournal> {
        return new ObsidianTranslator().setKeyAliasFile(pathToConfigMarkdownFile).toDataJournal(filepath);
    }

    async fromDataJournal(data: dj.DataJournal, filepath: string, aliasKeys: AliasKeyes = {}) {
        const stats = fs.statSync(filepath);
        if (!stats.isDirectory()) {
            throw new Error("Supplied file path is NOT a folder, please supply a path to a folder of .md files")
        }
        this.updateMarkdownDataJournal(data, filepath, aliasKeys);
        //if that doesn't error, the file exists.
    }

    async updateMarkdownDataJournal(data: dj.DataJournal, filepath: string, aliasKeys: AliasKeyes = {}, readOnly = false): Promise<dj.DataJournal> {
        const note = new Note(filepath);
        const staticDJ = JSON.parse(JSON.stringify(data));

        let containedAliases: object = {}

        //obtain all aliases contained in the note
        note.blocks.forEach(block => {
            if (ObsidianTranslator.blockIsAliasKey(block)) {
                let mergeObj = ObsidianTranslator.mergeObjectIntoMarkdownString(block.text, aliasKeys, false);
                containedAliases = { ...containedAliases, ...mergeObj.keyValuesContained };
                block.text = mergeObj.resultString;
            }
        })

        //create aliased Data Journal applying aliases passed in AND read from the file, where passed-in trumps
        const combinedAliases = { ...aliasKeys, ...containedAliases };
        const aliasedDJ = AliasKeyer.applyAliases(staticDJ, combinedAliases);

        let containedDefs: object[] = [];
        let containedEntries: object[] = [];

        let defsToAppend = JSON.parse(JSON.stringify(aliasedDJ.defs));
        let entriesToAppend = JSON.parse(JSON.stringify(aliasedDJ.entries));
        let aliasesToAppend = JSON.parse(JSON.stringify(aliasKeys));
        //this is untested.
        Object.keys(containedAliases).forEach(containedKey => {
            if (Object.hasOwn(aliasesToAppend, containedKey)) delete aliasesToAppend[containedKey]
        })

        //do other stuff
        let idKey = '_id';
        const positionOfIdAlias = Object.values(combinedAliases).findIndex(canonKey => canonKey === idKey);
        if (positionOfIdAlias !== -1) idKey = Object.keys(combinedAliases)[positionOfIdAlias];

        note.blocks.forEach(block => {
            if (ObsidianTranslator.blockIsDef(block)) {
                let relatedDef: any = aliasedDJ.defs.filter(def => block.text.includes('::' + def[idKey] + ']'));
                if (relatedDef.length > 1) {
                    throw new Error('More than one Def._id match found in block!')
                }
                if (relatedDef.length === 1) defsToAppend = defsToAppend.filter(def => dj.DJ.standardizeKey(def[idKey]) !== dj.DJ.standardizeKey(relatedDef[0][idKey]))
                if (relatedDef.length === 0) relatedDef = [{}];
                let mergeObj = ObsidianTranslator.mergeObjectIntoMarkdownString(block.text, relatedDef[0], true);
                containedDefs.push(mergeObj.keyValuesContained);
                block.text = mergeObj.resultString;
            }
            if (ObsidianTranslator.blockIsEntry(block)) {
                const dateStrWithExtension = filepath.split('/').pop();
                const dateStr = dateStrWithExtension?.substring(0,dateStrWithExtension.length - 3);
                const timeStr = blockTime(block.text);
                const phantomPeriod = `${dateStr}T${timeStr}:00`;
                let carrotId = block.text.split('\n')[0].split(' ').pop();
                if(carrotId?.startsWith('^')){
                    carrotId = carrotId.substring(1);
                }
                const phantomId = carrotId;
                let relatedEntry: any = aliasedDJ.entries.filter(entry => block.text.includes(entry[idKey]));
                if (relatedEntry.length > 1) {
                    throw new Error('More than one Entry._id match found in block!')
                }
                if (relatedEntry.length === 1) entriesToAppend = entriesToAppend.filter(entry => dj.DJ.standardizeKey(entry[idKey]) !== dj.DJ.standardizeKey(relatedEntry[0][idKey]))
                if (relatedEntry.length === 0) relatedEntry = [{}];
                //this is so hacked together.
                if(!block.text.includes(`[${idKey}::`)) block.text = block.text + ` [${idKey}::${phantomId}]`
                if(!block.text.includes('[_period::')) block.text = block.text + ` [_period::${phantomPeriod}]`
                let mergeObj = ObsidianTranslator.mergeObjectIntoMarkdownString(block.text, relatedEntry[0], true);
                containedEntries.push(mergeObj.keyValuesContained)
                block.text = mergeObj.resultString;
            }
        })

        if (!readOnly) {
            let returnNoteText = '';
            note.blocks.forEach(block => returnNoteText += block.text + '\n');
            if (defsToAppend.length > 0) returnNoteText += ObsidianTranslator.makeBlocksOfDefs(defsToAppend, {});
            if (entriesToAppend.length > 0) returnNoteText += ObsidianTranslator.makeBlocksOfEntries(entriesToAppend, {});
            if (aliasesToAppend.length > 0) returnNoteText += ObsidianTranslator.makeBlockOfKeyAliases(aliasesToAppend);
            containedDefs = [...containedDefs, ...defsToAppend];
            containedEntries = [...containedEntries, ...entriesToAppend];

            fs.writeFileSync(filepath.slice(0, filepath.length - 3) + " (new).md", returnNoteText, 'utf8');
        }

        const unaliasedDJ = AliasKeyer.unapplyAliases({
            defs: containedDefs,
            entries: containedEntries
        }, aliasKeys)

        //convert any entry._deleted into actual boolean
        unaliasedDJ.entries.forEach(entry => {
            //@ts-expect-error
            if (entry._deleted !== undefined && typeof entry._deleted === 'string') entry._deleted = entry._deleted.toUpperCase() === 'TRUE'
        })

        return unaliasedDJ

        function blockTime(blockText: string): string | undefined {
            const possibleTimes = blockText.split('\n')[0].match(/([01][0-9]|2[0-3]):[0-5][0-9]/g);
            if (possibleTimes === null) return undefined;
            if (possibleTimes!.length > 1) {
                // console.warn('Multiple time values are present in block, defaulting to the first. Block text: ',this.text);
            }
            return possibleTimes[0];
        }
    }

    private static mergeObjectIntoMarkdownString(str: string, keyVals: object, appendMissingKeys = false): { keyValuesContained: object, resultString: string } {
        // const unmodified = str;
        const splitText = str.split('::');
        const keyValuesToAppend = JSON.parse(JSON.stringify(keyVals));
        let delimterUsed = ''; //variable shared within nested functions
        while (splitText.length > 1) {
            let key = findKey(splitText[0]);
            if (key === null) {
                //merge 0th element into 1st
                splitText[1] = splitText[0] + '::' + splitText[1]
                //remove 0th element
                splitText.shift();
                continue; //back to the top of the loop
            }
            const existsInPassedInObject = Object.hasOwn(keyVals, key);
            let val = findVal(splitText[1]);
            if (val === null) {
                //not sure if this can happen
                throw new Error('unhandled situation fapeihml');
            }
            if (!existsInPassedInObject) {
                //just reading it into keyVals
                keyVals[key] = val;
            } else {
                //replace value in the text that was found with passed in key/value value
                splitText[1] = keyVals[key] + splitText[1].substring(val!.length);
                delete keyValuesToAppend[key];
            }

            //merge 0th element into 1st
            splitText[1] = splitText[0] + '::' + splitText[1]
            //remove 0th element
            splitText.shift();
        }
        //append any remaining keyValuesToAppend
        let returnStr = splitText[0]
        let returnValsContained = keyVals;
        if (appendMissingKeys) {
            returnStr = appendKeyValues(returnStr, keyValuesToAppend);
            returnValsContained = { ...keyVals, ...keyValuesToAppend };
        }

        return {
            keyValuesContained: returnValsContained,
            resultString: returnStr
        }

        function appendKeyValues(toText: string, keyValuesToAppend: object): string {
            let returnText = toText;
            const middleBit = `\n\t- `;
            Object.keys(keyValuesToAppend).forEach(key => {
                returnText = returnText + middleBit + '[' + key + '::' + keyValuesToAppend[key] + ']'
            })
            return returnText
        }

        function findVal(text: string): string | null {
            if (delimterUsed === 'bracket') return findValWithBracket(text);
            if (delimterUsed === 'paren') return findValWithParen(text);
            throw new Error('whelp.')
        }

        function findValWithBracket(str: string): string | null {
            let openCount = 0;
            let closeCount = 0;
            for (let i = 0; i < str.length; i++) {
                if (str[i] === "[") {
                    openCount++;
                } else if (str[i] === "]") {
                    closeCount++;
                }

                if (closeCount === openCount
                    + 1) {
                    return str.slice(0, i);
                }
            }
            return null; // If no valid closing bracket is found
        }

        function findValWithParen(str: string): string | null {
            let openCount = 0;
            let closeCount = 0;
            for (let i = 0; i < str.length; i++) {
                if (str[i] === "(") {
                    openCount++;
                } else if (str[i] === ")") {
                    closeCount++;
                }

                if (closeCount === openCount
                    + 1) {
                    return str.slice(0, i);
                }
            }
            return null; // If no valid closing bracket is found
        }

        function findKey(text: string): string | null {
            delimterUsed = 'bracket';
            let key = findKeyWithBracket(text);
            if (key !== null) return key;
            delimterUsed = 'paren';
            return findKeyWithParen(text)
        }

        function findKeyWithBracket(text: string) {
            //key cannot have any () or [] in it
            const bracketSplit = text.split('[');
            if (bracketSplit.length === 1) return null
            let candidateKey = bracketSplit.pop()!;
            //key cannot have any other delimiters in it
            if (!candidateKey?.includes(']') &&
                !candidateKey?.includes('(') &&
                !candidateKey?.includes(')')) {
                return candidateKey;
            }
            return null
        }
        function findKeyWithParen(text: string) {
            //key cannot have any () or [] in it
            const bracketSplit = text.split('(');
            if (bracketSplit.length === 1) return null
            let candidateKey = bracketSplit.pop()!;
            //key cannot have any other delimiters in it
            if (!candidateKey?.includes(')') &&
                !candidateKey?.includes('[') &&
                !candidateKey?.includes(']')) {
                return candidateKey;
            }
            return null
        }
    }

    static makeBlockOfKeyAliases(aliasKeys: AliasKeyes): string {
        const aliases = Object.keys(aliasKeys);
        let returnStr = '- #keyAlias\n';
        aliases.forEach(alias => {
            returnStr += '\t- [' + alias + '::' + aliasKeys[alias] + ']\n';
        })
        return returnStr
    }
    static makeBlocksOfDefs(defs: dj.Def[], aliasKeys: AliasKeyes): string {
        const keyAliases = AliasKeyer.flipToKeyAlias(aliasKeys);
        let returnStr = ''
        defs.forEach(def => {
            returnStr += '- #def ^' + def._id +'\n';
            let rawKeys = Object.keys(def);
            rawKeys = rawKeys.filter(key=>key!=='_id');
            rawKeys.forEach(rawKey => {
                let aliasedKey = rawKey;
                if (keyAliases[rawKey] !== undefined) aliasedKey = keyAliases[rawKey];
                returnStr += '\t- [' + aliasedKey + '::' + def[rawKey] + ']\n';
            })
        })
        return returnStr
    }
    static makeBlocksOfEntries(entries: dj.Entry[], aliasKeys: AliasKeyes): string {
        let returnStr = ''
        entries.forEach(entry => {
            returnStr += '- ' + entry._period.slice(10) + ' #entry^' + entry._id +'\n';
            let rawKeys = Object.keys(entry);
            rawKeys = rawKeys.filter(key=>key!=='_id' && key !== '_period');
            rawKeys.forEach(rawKey => {
                let aliasedKey = rawKey;
                if (aliasKeys[rawKey] !== undefined) aliasedKey = aliasKeys[rawKey];
                returnStr += '\t- [' + aliasedKey + '::' + entry[rawKey] + ']\n';
            })
        })
        return returnStr;
    }

    static blockIsEntry(block: Block): boolean {
        const firstLine = block.text.split('\n')[0];
        return firstLine.toUpperCase().includes('#ENTRY');
    }
    static blockIsDef(block: Block): boolean {
        const firstLine = block.text.split('\n')[0];
        return firstLine.toUpperCase().includes('#DEF');
    }
    static blockIsAliasKey(block: Block): boolean {
        const firstLine = block.text.split('\n')[0];
        return firstLine.toUpperCase().includes('#KEYALIAS');
    }

    async toDataJournal(folderPath: string): Promise<dj.DataJournal> {
        //using code I already wrote, probably less efficient in terms of runtime,
        //but WAY more efficient in terms of getting this done.
        const aliasKeys = this.keyAliasFilePath === undefined ? {} : parseAliasKeysFromFile(this.keyAliasFilePath) as AliasKeyes;

        const stats = fs.statSync(folderPath);
        if (!stats.isDirectory()) {
            throw new Error("Supplied file path is NOT a folder, please supply a path to a folder.")
        }

        const folderFiles = fs.readdirSync(folderPath);
        const mdFiles = folderFiles.filter(file=>file.endsWith('.md'));
        const filePromiseArray = mdFiles.map(file=>{
            const fullpath = folderPath + '/' + file
            return this.updateMarkdownDataJournal({ defs: [], entries: [] }, fullpath, aliasKeys, true);
        })

        const individualJournals = await Promise.all(filePromiseArray);
        const combinedJournal = dj.DJ.merge(individualJournals);
        return combinedJournal

        function parseAliasKeysFromFile(filepath: string){
            const note = new Note(filepath);
    
            let containedAliases: object = {}
    
            //obtain all aliases contained in the note
            note.blocks.forEach(block => {
                if (ObsidianTranslator.blockIsAliasKey(block)) {
                    let mergeObj = ObsidianTranslator.mergeObjectIntoMarkdownString(block.text, {}, false);
                    containedAliases = { ...containedAliases, ...mergeObj.keyValuesContained };
                    block.text = mergeObj.resultString;
                }
            })
            
            return containedAliases
        }
    }
}
//#endregion

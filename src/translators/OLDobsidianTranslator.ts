//@ts-nocheck
import fs from 'fs'
import path from 'path'
import { DataJournal } from '../DataJournal';
import * as pdw from '../pdw'
import { Block, Note } from './MarkdownParsers';
//#TODO - probably refactor this as the whole-folder-based translator AND split out a Markdown trasnlator too,
//#THINK - if your folder structure doesn't have a guaranteed file title = ISODate String how do you import Entries into it?

export class ObsidianTranslator implements pdw.Translator {
    vaultPath: string;
    topTag?: string;
    configFilePath: string;
    subpathToFolderWithEntries: string;
    /**
     * For using inside the Obsidian Translator - not reaching outside anywhere.
     * Shouldn't be accessed outside this module.
     */
    private _internalPDW: pdw.PDW;
    /**
     * Need a factory to allow for effectively async construction to occur.
     * @param vaultPath 
     * @param configFileSubpath 
     */
    private constructor(vaultPath: string, configFileSubpath: string, pdwRef: pdw.PDW) {
        this.configFilePath = vaultPath + "/" + configFileSubpath;
        this.vaultPath = vaultPath;
        this.subpathToFolderWithEntries = '';
        this._internalPDW = pdwRef;
    }

    static async NewObsidianTranslator(vaultPath: string, configFileSubpath: string): Promise<ObsidianTranslator>{
        const localPDW = await pdw.PDW.newPDW([]);
        const instance = new ObsidianTranslator(vaultPath, configFileSubpath, localPDW);
        await instance.loadDefsAndTopTagFromConfig();
        return instance;
    }

    /**
     * 
     * @param defs list of defs to build the config file for
     * @param folderLocation a place to put the newly created '/ConfigOutput' directory
     * @param topTag do not include the hashtag. Default: "pdw"
     */
    static async BuildConfigFileAndTemplatesForDefs(defs: pdw.Def[] | pdw.DefData[], folderLocation: string, topTag = 'pdw') {
        const stats = fs.statSync(folderLocation);
        if (!stats.isDirectory()) {
            console.warn('Given path is not a folder. Please provide a folder path where the new "ConfigOutput" subfolder can be made.')
            throw new Error(folderLocation + " is not a folder");
        }
        const newFolderPath = folderLocation + '/ConfigOutput'
        if(!fs.existsSync(newFolderPath)) fs.mkdirSync(newFolderPath);
        
        if(!(defs[0] instanceof pdw.Def)){
            //DefData were passed in, creating a whole temporary pdw just to create defs,
            //probably just to flatten them immediately, not my best work - but I"m tired.
            const superTempPDW = await pdw.PDW.newPDW([]);
            superTempPDW.setDefs((<pdw.DefData[]>defs));
            defs = await superTempPDW.getDefs(true)
        }
        let defsString = JSON.stringify(pdw.PDW.flatten((<pdw.Def[]>defs)), null, 2);


        let configContent = `Copy/paste most of this to the active PDW Config, I reckon.
# Tag
- [tag::${topTag}]
# Paths
- [folderWithNotesContainingEntries::]
# Defs
\`\`\`json
${defsString}
\`\`\``;

        fs.writeFileSync(newFolderPath + "/Generated Config Contents" + ".md", configContent);

        /** 
         * Create Template Files - using the Templater approach, this is very specific to my current approach.
         * but that's fine I'm codifying it here.
         */
        defs.forEach(def=> {
            const content = makeTemplateStringForDef((<pdw.Def>def));
            fs.writeFileSync(newFolderPath + '/a' + def.lbl + ".md", content);
        })

        function makeTemplateStringForDef(def: pdw.Def): string {
            let returnStr = `
- <% tp.date.now('HH:mm') %> #${topTag}/${def.lbl.replace(' ', '_')} ^<%new Date().getTime().toString(36)%>`

            def.pts.forEach(pd => {
                returnStr = returnStr + `
    - [${pd.lbl}::]`
            })
            returnStr = returnStr + `
	- [note::]
	- [source::Added in Obsidian] [created::<% tp.date.now('YYYY-MM-DDTHH:MM') %>]`
            return returnStr
        }
    }

    async fromDataJournal(canonicalDataset: pdw.CanonicalDataset) {
        if(canonicalDataset.defs === undefined) throw new Error("No 'defs' key found in CanonicalDataset");
        if(canonicalDataset.defs.length === 0) throw new Error("No defs found in CanonicalDataset. Import requires Defs");
        /* Load pre-existing defs */
        await this.loadDefsAndTopTagFromConfig();
        console.log("defs loaded")
        /* merge with passed-in defs */
        await this._internalPDW.setAll(canonicalDataset);
        console.log("internal PDW loaded")
        /* Parallelizing the two async functions. I should do this more. */
        const promises = [this._internalPDW.getDefs(true), this._internalPDW.getEntries({includeDeleted: 'yes'})];
        const [defs, entries] = await Promise.all(promises);
        console.log("writing to defs: " + defs.length)
        this.overwriteDefsInConfigFile((<pdw.Def[]>defs));
        console.log("writing to entries: " + entries.length)
        this.mergeInEntries((<pdw.Entry[]>entries));
    }

    async toDataJournal(): Promise<pdw.CanonicalDataset> {
        //ensure clear DataStores - basically this should have been a static method, but it's not.
        //@ts-expect-error - hacking this
        this._internalPDW.dataStore.entries = [];

        //traverse folders, accumulate Blocks
        const notes: Note[] = [];
        recursivelyAddToNotesList(this.vaultPath + "/" + this.subpathToFolderWithEntries);
        
        const that = this; //for use in functions without passing.
        notes.forEach(note => {
            note.blocks.forEach(block => {
                if (that.blockIsEntry(block)) {
                    blockToEntry(block, note);
                }
            })
        })

        return this._internalPDW.getAll({includeDeleted:'yes'});

        function recursivelyAddToNotesList(pathIn: string) {
            const pathNames = fs.readdirSync(pathIn);

            pathNames.forEach(fileName => {
                const filePath = pathIn + "/" + fileName;
                const fileStats = fs.statSync(filePath)

                /* Resurse for folders */
                if (fileStats.isDirectory()) {
                    recursivelyAddToNotesList(filePath);
                }
                /* Ignore non-files */
                if (fs.statSync(filePath).isFile() == false) return

                /* Ignore non-markdown files */
                if (path.extname(fileName) !== '.md') return

                notes.push(Note.parseFromPath(filePath))
            })
        }

        /**
         * Parses & adds the block to the internal _PDWInstance
         */
        async function blockToEntry(block: Block, obsidianNote: Note) {
            const altArray: { key: string, value: any }[] = [];
            const props: any = {};
            block.props.forEach(kv => {
                const key = Object.keys(kv)[0]//.toUpperCase();
                const value = kv[key];
                props[key] = value;
                altArray.push({ key: key, value: value });
            });

            const entryTypeLabel = pdwSubTag(block.text)?.replaceAll('_', ' ');
            if (entryTypeLabel === undefined) throw new Error('Entry Type Label was not found');
            const assDef = that._internalPDW.getDefFromManifest(entryTypeLabel);
            if(assDef === undefined) throw new Error('No associated Def found for ' + entryTypeLabel + ' block in ' + obsidianNote.fileName);

            let id = block.id;
            if (id === undefined) {
                id = mkId();
                console.warn("Block without ID in " + obsidianNote.fileName + ". Made id for it: " + id)
            }

            //PROPS ARE AN ARRAY, NOT AN OBJECT.
            let eid = props.eid;
            if (eid === undefined) {
                eid = id;
            } else {
                delete props.eid
            }

            let period = obsidianNote.fileNameNoExtension;
            if (period === undefined) throw new Error('No filename?');
            const time = blockTime(block.text);
            if (time !== undefined) period = period + "T" + time;
            if (assDef.scope !== pdw.Scope.HOUR &&
                assDef.scope !== pdw.Scope.MINUTE &&
                assDef.scope !== pdw.Scope.SECOND
            ) period = period.split('T')[0];

            let created = props.created;
            if (created === undefined) {
                created = obsidianNote.stats.ctime.getTime().toString(36);
            } else {
                delete props.created
            }

            let updated = props.updated;
            if (updated === undefined) {
                updated = obsidianNote.stats.mtime.getTime().toString(36);
            } else {
                delete props.updated
            }

            let source = props.source;
            if (source === undefined) {
                source = ''
            } else {
                delete props.source
            }

            let entryNote = props.note;
            if (entryNote === undefined) {
                entryNote = ''
            } else {
                delete props.note
            }

            let newEntryData: pdw.EntryData = {
                _eid: eid,
                _note: entryNote,
                _period: period,
                _did: assDef!.did,
                _source: source,
                _uid: id,
                _deleted: false,
                _created: created,
                _updated: updated,
            }

            // /* For all remaining props, find associated _pid */
            Object.keys(props).forEach((key: any) => {
                const match = assDef.getPoint(key.replaceAll('_',' '))
                let pid = key;
                if (match === undefined) {
                    console.warn('No matching pid found under ' + assDef.lbl + ' for point labeled ' + key + ' in file ' + obsidianNote.fileName);
                } else {
                    pid = match.pid
                }
                newEntryData[pid.replaceAll('_',' ')] = props[key]
            })

            await assDef.newEntry(newEntryData)

            function blockTime(blockText: string): string | undefined {
                const possibleTimes = blockText.split('\n')[0].match(/([01][0-9]|2[0-3]):[0-5][0-9]/g);
                if (possibleTimes === null) return undefined;
                if (possibleTimes!.length > 1) {
                    // console.warn('Multiple time values are present in block, defaulting to the first. Block text: ',this.text);
                }
                return possibleTimes[0];
            }

            function mkId(len = 3) { return new Date().getTime().toString(36) + "-" + Math.random().toString(36).slice(13 - len).padStart(len, "0") }

            function pdwSubTag(blockText: string): string | undefined {
                const firstLine = blockText.split('\n')[0];
                if (!firstLine.includes('#' + that.topTag)) {
                    throw new Error('No "' + that.topTag + '" tag was found in block.')
                }
                let words = firstLine.split(' ');
                let tagText: string | undefined;
                words.forEach(word => {
                    if (tagText !== undefined) return
                    if (word.startsWith('#' + that.topTag + '/')) tagText = word;
                })
                //full tag captured, including "#pdw/", splitting to get subtag
                return tagText?.split('/')[1]
            }
        }
    }

    blockIsEntry(block: Block): boolean {
        const firstLine = block.text.split('\n')[0];
        return firstLine.includes('#' + this.topTag);
    }

    async mergeInEntries(entries: pdw.Entry[]){
        console.log('beginning summarization')
        const summaries = pdw.PDW.summarize(entries,pdw.Scope.DAY);
        let entryCount = 0;
        let filesWritten = 0;
        console.log('begin looping over summaries: ' + summaries.length)
        summaries.forEach(summary=>{
            console.log('Doing day ' + summary.period);
            entryCount = entryCount + 1;
            if(summary.entries.length === 0) return;
            const filePath = this.vaultPath + "/" + this.subpathToFolderWithEntries + "/" + summary.period + ".md"
            if(fs.existsSync(filePath)){
                // //handle previously existing file
                let obsidianNote = Note.parseFromPath(filePath);
                obsidianNote.blocks.forEach(block=>{
                    if(!this.blockIsEntry(block)) return
                    //make all attempts to find a uid, through the "^" approach or a "uid" dataview prop
                    let blockId = block.id;
                    if(blockId === undefined){
                        const uidProp = block.props.find(prop=>Object.keys(prop)[0]==='uid');
                        if(uidProp===undefined) return
                        blockId = Object.values(uidProp)[0];
                    }
                    if(blockId === undefined) return
                    //remove the matching entry, if it exists
                    summary.entries = summary.entries.filter(entry => entry._uid !== blockId);
                })
                //append all remaining entries to the bottom of the file
                    const contentToAppendToFile = summary.entries.map(e=>this.entryToBlockText(e)).join('');
                    const newFileContent = obsidianNote._rawContent + contentToAppendToFile;
                    fs.writeFileSync(filePath, newFileContent, 'utf-8');
            }else{
                //create new file
                const newFileContent = summary.entries.map(e=>this.entryToBlockText(e)).join('');
                fs.writeFileSync(filePath, newFileContent, 'utf-8');
                filesWritten = filesWritten + 1;
                console.log(filesWritten);
            }
        })
    }

    entryToBlockText(entry: pdw.EntryData): string{
        let blockText = `\n- `;
        let assDef = this._internalPDW.getDefFromManifest(entry._did);
        if(assDef === undefined) throw new Error('No Def found for Entry. FPEIUPA')
        if(scopeNeedsTimeAdded(assDef.scope)){
            let timeText = entry._period.toString().split('T')[1];
            if(assDef.scope === pdw.Scope.SECOND) timeText = timeText.substring(0,5);
            blockText = blockText + timeText + ' ';
        }

        blockText = blockText + '#' + this.topTag + '/' + assDef.lbl.replaceAll(' ','_') + ' ';
        blockText = blockText + "^" + entry._uid + '\n';
        const entryPoints = Object.keys(entry).filter(key=>!key.startsWith('_')).map(key=>{
            return {
                lbl: assDef.getPoint(key)!.lbl,
                val: entry[key]
            }});
        entryPoints.forEach(entryPoint=>{
            blockText = blockText + `\t- [${entryPoint.lbl.replaceAll(' ', '_')}::${entryPoint.val}]\n`
        })
        if(entry._note !== '') blockText = blockText + '\t- [note::' +  entry._note +']\n'
        const createdStr = pdw.parseTemporalFromEpochStr(entry._created).toString().substring(0,16)
        const updatedStr = pdw.parseTemporalFromEpochStr(entry._updated).toString().substring(0,16)
        blockText = blockText + '\t- [source::' +  entry._source + '] [created::' + createdStr + '] [updated::' + updatedStr + ']'

        return blockText

        //local helper function
        function scopeNeedsTimeAdded(scope: string){
            return scope === pdw.Scope.SECOND || scope === pdw.Scope.MINUTE || scope === pdw.Scope.HOUR;
        }
    }
   
    private async overwriteDefsInConfigFile(defs: pdw.Def[]){
        const configFileContent = await this.getConfigFileText();
        const jsonBlockSplit = configFileContent.split('```json');
        if(jsonBlockSplit.length !== 2) throw new Error('Error in overwriting defs to config file due to the ```json block either not existing or existing multiple times');
        const newContent = jsonBlockSplit[0] + '```json\n' + JSON.stringify(pdw.PDW.flatten(defs), null, 2) + '\n```';
        await fs.writeFileSync(this.configFilePath, newContent, 'utf-8');
    }

    private async loadDefsAndTopTagFromConfig(){
        const text = await this.getConfigFileText() 
        const tagStart = text.indexOf('# Tag\n- [tag::');
        let tag = text.substring(tagStart + 14);
        this.topTag = tag.split(']')[0];
        const topHeadingArr = text.split('# ');

        const pathsText = topHeadingArr.filter(content => content.startsWith('Paths\n'))[0];
        const pathsBlocks = Block.splitStringToBlockArray(pathsText);
        pathsBlocks.forEach(block => {
            if(block.text.startsWith('- [folderWithNotesContainingEntries::')){
                this.subpathToFolderWithEntries = Object.values(block.props[0])[0];
            } 
        })

        const defsText = topHeadingArr.filter(content => content.startsWith('Defs\n'))[0];
        const defsBlocks = Block.splitStringToBlockArray(defsText);
        
        /* Look for the defBlock that starts ```json */
        const jsonBlock = defsBlocks.find(block=> block.text.startsWith("```json"));
        
        let jsonBlockSplit = jsonBlock?.text.split('\n');
        jsonBlockSplit?.pop();
        jsonBlockSplit?.shift();
        const jsonContent = jsonBlockSplit?.join('')!;
        let parsedDefs = JSON.parse(jsonContent);
        await this._internalPDW.setDefs(undefined, parsedDefs);

        console.log('Obsidian PDW config loaded! Using top tag "' + this.topTag + '", loaded ' + this._internalPDW.manifest.length + ' Defs');
    }

    private async getConfigFileText(){
        const configText = fs.readFileSync(this.configFilePath, 'utf8');
        if (!this.isValidConfig(configText)) throw new Error('Config File did not look right. Run ObsidianAsyncDataStore.logConfigFileTemplate() to see what it should look like.');
        return configText
    }

    private isValidConfig(fileText: string): boolean {
        if (!fileText.includes('# Tag')) return false
        if (!fileText.includes('[tag::')) return false
        if (!fileText.includes('# Paths')) return false
        if (!fileText.includes('folderWithNotesContainingEntries::')) return false
        if (!fileText.includes('# Defs')) return false
        return true
    }
}
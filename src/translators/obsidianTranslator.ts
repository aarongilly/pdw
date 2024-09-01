import fs from 'fs'
import path from 'path'
import * as pdw from '../pdw';

type defMap = {
    did: string,
    label: string,
    points: { pid: string, label: string }[]
}
type config = {
    tag: string;
    daily: string;
    weekly?: string;
    monthly?: string;
    quarterly?: string;
    yearly?: string;
    defMap: defMap[]
}

export class ObsidianTranslator implements pdw.CanonicalDataTranslator {
    vaultPath: string;
    dailyFolder: string;
    topTag: string;
    weeklyFolder?: string;
    monthlyFolder?: string;
    quarterlyFolder?: string;
    yearlyFolder?: string;
    defMap: defMap[];
    configFilePath: string;
    /**
     * This is the constructor
     * @param vaultPath 
     * @param configFileSubpath 
     */
    constructor(vaultPath: string, configFileSubpath: string) {
        this.configFilePath = vaultPath + "/" + configFileSubpath;
        const configFile = fs.readFileSync(this.configFilePath, 'utf8');
        if (!this.isValidConfig(configFile)) throw new Error('Config File did not look right. Run ObsidianAsyncDataStore.logConfigFileTemplate() to see what it should look like.');
        this.vaultPath = vaultPath;
        const config = this.parseConfig(configFile);
        this.dailyFolder = config.daily;
        this.weeklyFolder = config.weekly;
        this.monthlyFolder = config.monthly;
        this.quarterlyFolder = config.quarterly;
        this.yearlyFolder = config.yearly;
        this.topTag = config.tag;
        this.defMap = config.defMap;
        console.log('Obsidian PDW config loaded!');
    }

    fromCanonicalData(canonicalDataset: pdw.CanonicalDataset, params: any) {
        throw new Error('Method not implemented.');
    }

    async toCanonicalData(): Promise<pdw.CanonicalDataset> {
        //traverse folders, accumulate Blocks
        const foldersToTraverse = [this.dailyFolder];
        if (this.weeklyFolder !== undefined) foldersToTraverse.push(this.weeklyFolder);
        if (this.monthlyFolder !== undefined) foldersToTraverse.push(this.monthlyFolder);
        if (this.quarterlyFolder !== undefined) foldersToTraverse.push(this.quarterlyFolder);
        if (this.yearlyFolder !== undefined) foldersToTraverse.push(this.yearlyFolder);

        const notes: Note[] = [];
        foldersToTraverse.forEach(folderName => {
            recursivelyAddToNotesList(this.vaultPath + "/" + folderName);
        })

        const entryData: pdw.EntryData[] = [];
        const that = this; //for use in functions without passing.
        notes.forEach(note => {
            note.blocks.forEach(block => {
                if (blockIsEntry(block)) {
                    entryData.push(blockToEntry(block, note));
                }
            })
        })
        
        let returnObj: pdw.CanonicalDataset ={
            defs: [],
            entries: entryData
        }

        return returnObj;
        
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

        function blockIsEntry(block: Block): boolean {
            const firstLine = block.text.split('\n')[0];
            return firstLine.includes('#' + that.topTag);
        }

        function blockToEntry(block: Block, note: Note): pdw.EntryData {
            const altArray: {key: string, value: any}[] = [];
            const props: any = {};
            block.props.forEach(kv=>{
                const key = Object.keys(kv)[0]//.toUpperCase();
                const value = kv[key];
                props[key] = value;
                altArray.push({key: key, value: value});
            });

            const entryTypeLabel = pdwSubTag(block.text);
            if (entryTypeLabel === undefined) throw new Error('Entry Type Label was not found')

            let defMap = that.defMap.find(defKeyVal =>
                defKeyVal.label.toUpperCase() === entryTypeLabel?.toUpperCase()
            );

            if (defMap === undefined) {
                console.warn('No DefMap found for ' + entryTypeLabel);
                defMap = {
                    did: entryTypeLabel,
                    label: entryTypeLabel,
                    points: []
                }
            }

            let id = block.id;
            if (id === undefined) {
                id = mkId();
                console.warn("Block without ID in " + note.fileName + ". Made id for it: " + id)
            }

            //PROPS ARE AN ARRAY, NOT AN OBJECT. SHIT

            let eid = props.eid;
            if (eid === undefined) {
                eid = id;
            } else {
                delete props.eid
            }

            let period = note.fileNameNoExtension;
            if (period === undefined) throw new Error('No filename?');
            const time = blockTime(block.text);
            if (time !== undefined) period = period + "T" + time;

            let created = props.created;
            if (created === undefined) {
                created = note.stats.ctime.getTime().toString(36);
            } else {
                delete props.created
            }

            let updated = props.updated;
            if (updated === undefined) {
                updated = note.stats.mtime.getTime().toString(36);
            }else {
                delete props.updated
            }

            let source = props.source;
            if (source === undefined) {
                source = ''
            }else {
                delete props.source
            }

            let entryNote = props.note;
            if (entryNote === undefined) {
                entryNote = ''
            }else {
                delete props.note
            }

            let newEntryData: pdw.EntryData = {
                _eid: eid,
                _note: entryNote,
                _period: period,
                _did: defMap.did,
                _source: source,
                _uid: id,
                _deleted: false,
                _created: created,
                _updated: updated,
            }

            /* For all remaining props, find associated _pid */
            Object.keys(props).forEach((key:any)=>{
                const keyUpper = key.toUpperCase();
                const match = defMap.points.find((pt:any)=>
                    pt.label.toUpperCase() === keyUpper
                )
                let pid = key;
                if(match === undefined){
                    console.warn('No matching pid found under ' + defMap.label + ' for point labeled ' + key + ' in file ' + note.fileName);
                }else{
                    pid = match.pid
                }
                newEntryData[pid] = props[key]
            })

            return newEntryData


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
    /**
     * Write to an Obsidian folder
     * @param allData 
     * @param params 
     */
    async exportTo(allData: pdw.CanonicalDataset, params?: any) {
        const oldConfigContent = await fs.readFileSync(this.configFilePath, 'utf-8');
        /*
        It's late. Calling it a night.
        You're gonna wanna add a param to say "you want to overwrite the defs in the config?"
        and call a function here called "updateConfigDefs()" or something.
        */
        console.log(allData);

        throw new Error('Method not implemented.');
    }

    private parseConfig(text: string): config {
        let returnObj: config = {
            tag: '',
            daily: '',
            weekly: undefined,
            monthly: undefined,
            quarterly: undefined,
            yearly: undefined,
            defMap: []
        }
        const tagStart = text.indexOf('# Tag\n- [tag::');
        let tag = text.substring(tagStart + 14);
        returnObj.tag = tag.split(']')[0];
        const topHeadingArr = text.split('# ');

        const pathsText = topHeadingArr.filter(content => content.startsWith('Paths\n'))[0];
        const pathsBlocks = Block.splitStringToBlockArray(pathsText);
        pathsBlocks.forEach(block => {
            returnObj = { ...returnObj, ...block.props[0] }
        })

        const defsText = topHeadingArr.filter(content => content.startsWith('Def Map\n'))[0];
        const defsBlocks = Block.splitStringToBlockArray(defsText);
        //@ts-expect-error
        returnObj.defMap = defsBlocks.map(defBlock => {
            let returnObj: defMap = {
                did: '',
                label: '',
                points: []
            }
            let props = defBlock.props;
            if (Object.keys(props).length === 0) return
            returnObj.did = Object.keys(props[0])[0];
            returnObj.label = props[0][returnObj.did];
            //remove the first one, it's for the def
            props.shift();
            //iterate over remaining ones, they're for points
            props.forEach(prop => {
                let pid = Object.keys(prop)[0];
                let label = prop[pid];
                returnObj.points.push({ pid: pid, label: label });
            })
            return returnObj
        })
        //remove any blocks that wound up with undefined values (blank lines, etc);
        returnObj.defMap = returnObj.defMap.filter(defMap => defMap !== undefined)

        return returnObj
    }

    static logConfigFileTemplate() {
        console.log(ObsidianTranslator.configTemplate);
    }

    private static configTemplate = `Configuration file contents, including this line if you want.
            # Tag
            [tag::pdw] %%don't include the hashtag%%
            # Paths
            - [daily::Periods/1 - Daily] %%required%%
            - [weekly::Periods/2 - Weekly]
            - [monthly::Periods/3 - Monthly]
            - [quarterly:: Periods/4 - Quarterly]
            - [yearly::Periods/5 - Yearly]
            # Defs
            - [hz44::New_Experiences] %%did::label to use in Obsidian%%
                - [4eiv::Thing] %%pid::label to use in Obsidian%%
            - [8mkn::Saw_Friends] %%did2... and so on
            `

    private isValidConfig(fileText: string): boolean {
        if (!fileText.includes('# Tag')) return false
        if (!fileText.includes('[tag::')) return false
        if (!fileText.includes('# Paths')) return false
        if (!fileText.includes('daily::')) return false
        if (!fileText.includes('# Defs')) return false
        return true
    }
} 

class Note{
    stats: fs.Stats;
    path: string;
    _rawContent: string;
    blocks: Block[];
    private constructor(filePath: string){
        this.stats = fs.statSync(filePath);
        if (!this.stats.isFile()) throw new Error('Provided path does not point to a file: ' + filePath);
        if (path.extname(filePath) !== '.md') throw new Error('File at path is not a Markdown file: ' + filePath);
        this.path = filePath;
        this._rawContent = fs.readFileSync(filePath,"utf-8");
        this.blocks = Block.splitStringToBlockArray(this._rawContent);        
    }

    get fileName(){
        const chunks = this.path.split('/');
        return chunks.pop();
    }

    get fileLocation(){
        const chunks = this.path.split('/');
        chunks.pop();
        return chunks.join('/');
    }

    get fileNameNoExtension(){
        let nameSplit = this.fileName?.split('.');
        nameSplit?.pop();
        return nameSplit?.join('.')
    }

    /**
     * There should be a method to sort the time-based notes to make sure they're in the correct order.
     * Also could do other things, but I'm not sure what yet.
     */
    standardize(){
        throw new Error("Method only ideated, not implemented")
    }

    static parseFromPath(filePath: string){
        return new Note(filePath);
    }

    static createAtPath(filePath: string, noteContents: string){
        
    }

    saveChanges(){

    }
}

type BlockType = 
    "text" |
    "h1" |
    "h2" |
    "h3" |
    "h4" |
    "h5" |
    "h6" |
    "openTask" |
    "completedTask" |
    "otherTask" |
    "ol" |
    "ul" |
    "blockQuote" |
    "codeBlock" |
    "empty"

/**
 * Breaks a string into a series of blocks, attempting to replicate
 * Obsidian's standard behavior for block ID handling.
 */
export default class Block {
    text: string;
    type: BlockType;

    private constructor(text: string) {
        this.text = text;
        this.type = Block.determineType(this.text);
    }

    /**
     * Grabs all Dataview-formatted key-value pairs contained in block, 
     * presents them in order.
     */
    get props(): {[key:string]: string}[] {
        let returnArr:{[key:string]: string}[] = [];
        const splitText = this.text.split('::');
        if(splitText.length === 1) return returnArr;
        let key: string
        let val: any
        splitText.forEach(chunk=>{
            if(key !== undefined){
                val = chunk.split(']').shift();
                returnArr.push({[key]:val});
            }
            key = chunk.split('[').pop()!;
        })
        return returnArr;
    }

    /**
     * If any line ends with a "^somethingwithoutaspace", returns that
     */
    get id(): string | undefined{
        const lastWords = this.text.split('\n').map(line=>line.split(' ').pop());
        let possibleID: string | undefined = undefined;
        lastWords.forEach(word=>{
            if(possibleID !== undefined) return
            if(word?.startsWith('^')) possibleID = word.substring(1);
        })
        
        return possibleID;
    }

    static splitStringToBlockArray(text: string, includeEmptyBlocks = true, customTopTag = 'pdw'): Block[] {
        const blocks: string[] = [];
        const lines = text.split('\n');

        let currentBlock = lines.shift(); //remove first line, add to block list
        lines.forEach(line=>{
            /* This handles the line *after* code blocks */
            if(currentBlock === undefined){
                currentBlock = line;
                return;
            }
            /* Code Blocks cannot be handled via 2-line compare */
            if(currentBlock.trim()?.startsWith('```') && line.trim().startsWith('```')){
                currentBlock += '\n' + line;
                blocks.push(currentBlock!)
                currentBlock = undefined;
                return;
            }
            /* Do 2-line compare to determine if they're the same block */
            if(this.areSameBlock(currentBlock!, line)){
                currentBlock += '\n' + line;
            }else{
                blocks.push(currentBlock!)
                currentBlock = line;
            }
        })

        //and add remaining line to the end of the blocks
        if(currentBlock !== undefined) blocks.push(currentBlock);


        //#endregion

        // Remove empty blocks
        if (includeEmptyBlocks) {
            return blocks.map(block=>new Block(block));
        }

        return blocks.filter(block => block.trim() !== '').map(block=>new Block(block));
    }

    static determineType(text: string): BlockType{
        const trimmedText = text.trim();
        const upToFirstSpace = trimmedText.split(' ')[0];
        if(trimmedText.startsWith('# ')) return 'h1'
        if(trimmedText.startsWith('## ')) return 'h2'
        if(trimmedText.startsWith('### ')) return 'h3'
        if(trimmedText.startsWith('#### ')) return 'h4'
        if(trimmedText.startsWith('##### ')) return 'h5'
        if(trimmedText.startsWith('###### ')) return 'h6'
        if(trimmedText.startsWith('- [ ] ')) return 'openTask'
        if(trimmedText.startsWith('- [x] ')) return 'completedTask'
        if(/^- \[[a-zA-Z0-9]]$/.test(upToFirstSpace)) return 'otherTask'
        if(/^\d+[.)]$/.test(upToFirstSpace)) return 'ol'
        if(/^[-*]$/.test(upToFirstSpace)) return 'ul'
        if(trimmedText.startsWith('```')) return 'codeBlock'
        if(trimmedText.startsWith('>')) return 'blockQuote'
        if(trimmedText === '') return "empty"
        return 'text'
    }
    
    private static areSameBlock(firstLine: string, secondLine: string): boolean{
        //#NOTE - the order here was carefully chosen, don't mess it up.
        //Existing code blocks adopt all following lines (the end delimiter is handled elsewhere)
        const trimmedFirstLine = firstLine.trim()
        if(trimmedFirstLine.startsWith('```')) return true;
        //Empty lines are never combined with anything (outside of code blocks).
        if(firstLine === '' || secondLine === '') return false;
        //Block IDs are always combined with any non-empty block
        const trimmedSecondLine = secondLine.trim();
        if(trimmedSecondLine.startsWith('^') && !trimmedSecondLine.includes(' ')) return true;
        const firstLineFirstWord = firstLine.split(' ')[0]
        const secondLineFirstWord = secondLine.split(' ')[0]
        //Headers are always blocks of themselves
        if(/^#{1,6}$/.test(firstLineFirstWord) || /^#{1,6}$/.test(secondLineFirstWord)) return false;
        //Block quote continuations are the same block
        if(firstLine.startsWith('>') && trimmedSecondLine.startsWith('>')) return true;
        //New block quotes or Code Blocks always the start of a block
        if(trimmedSecondLine.startsWith('```') || trimmedSecondLine.startsWith('>')) return false;
        //New lists are always the start of a block
        if(secondLineFirstWord === '-' || secondLineFirstWord === '*' || /^\d+[.)]$/.test(secondLineFirstWord)) return false
        //Block Quotes only merge with other block quotes
        if(firstLine.startsWith('>') && !secondLine.startsWith('>')) return false;
        //Lists 
        if(firstLineFirstWord === '-' || firstLineFirstWord === '*' || /^\d+[.)]$/.test(firstLineFirstWord)){
            //Indention of second line means same block
            if(secondLine.startsWith(' ') || secondLine.startsWith('\t')) return true
            //No indention means new block
            return false;
        }
        //if the first line is a list, and the second line isn't an indentation, then 
        //you may be able to just return true at this point, but want to test
        if(Block.determineType(firstLine)==='text' && Block.determineType(secondLine) === 'text') return true;
        //should not hit this?
        throw new Error(`Line conversion to blocks was unhandled for lines:
            ${firstLine}
            ...and...
            ${secondLine}`);
    }
}
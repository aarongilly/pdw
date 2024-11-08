import fs from 'fs'
import path from 'path'

export class Note {
    stats: fs.Stats;
    path: string;
    _rawContent: string;
    blocks: Block[];
    constructor(filePath: string) {
        this.stats = fs.statSync(filePath);
        if (!this.stats.isFile()) throw new Error('Provided path does not point to a file: ' + filePath);
        if (path.extname(filePath) !== '.md') throw new Error('File at path is not a Markdown file: ' + filePath);
        this.path = filePath;
        this._rawContent = fs.readFileSync(filePath, "utf-8");
        this.blocks = Block.splitStringToBlockArray(this._rawContent);
    }

    get fileName() {
        const chunks = this.path.split('/');
        return chunks.pop();
    }

    get fileLocation() {
        const chunks = this.path.split('/');
        chunks.pop();
        return chunks.join('/');
    }

    get fileNameNoExtension() {
        let nameSplit = this.fileName?.split('.');
        nameSplit?.pop();
        return nameSplit?.join('.')
    }

    /**
     * There should be a method to sort the time-based notes to make sure they're in the correct order.
     * Also could do other things, but I'm not sure what yet.
     */
    standardize() {
        throw new Error("Method only ideated, not implemented")
    }

    static parseFromPath(filePath: string) {
        return new Note(filePath);
    }

    // static createAtPath(filePath: string, noteContents: string){

    // }

    saveChanges() {

    }
}

export type BlockType =
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
export class Block {
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
    get props(): { [key: string]: string }[] {
        let returnArr: { [key: string]: string }[] = [];
        const splitText = this.text.split('::');
        if (splitText.length === 1) return returnArr;
        let key: string
        let val: any
        //find first even matching pair of parens or square brackets
        splitText.forEach(chunk => {
            if (key !== undefined) {
                val = chunk.split(']').shift();
                returnArr.push({ [key]: val });
            }
            key = chunk.split('[').pop()!;
        })
        return returnArr;
    }

    /**
     * If any line ends with a "^somethingwithoutaspace", returns that
     */
    get id(): string | undefined {
        const lastWords = this.text.split('\n').map(line => line.split(' ').pop());
        let possibleID: string | undefined = undefined;
        lastWords.forEach(word => {
            if (possibleID !== undefined) return
            if (word?.startsWith('^')) possibleID = word.substring(1);
        })

        return possibleID;
    }

    static splitStringToBlockArray(text: string, includeEmptyBlocks = true): Block[] {
        const blocks: string[] = [];
        const lines = text.split('\n');

        let currentBlock = lines.shift(); //remove first line, add to block list
        lines.forEach(line => {
            /* This handles the line *after* code blocks */
            if (currentBlock === undefined) {
                currentBlock = line;
                return;
            }
            /* Code Blocks cannot be handled via 2-line compare */
            if (currentBlock.trim()?.startsWith('```') && line.trim().startsWith('```')) {
                currentBlock += '\n' + line;
                blocks.push(currentBlock!)
                currentBlock = undefined;
                return;
            }
            /* Do 2-line compare to determine if they're the same block */
            if (this.areSameBlock(currentBlock!, line)) {
                currentBlock += '\n' + line;
            } else {
                blocks.push(currentBlock!)
                currentBlock = line;
            }
        })

        //and add remaining line to the end of the blocks
        if (currentBlock !== undefined) blocks.push(currentBlock);


        //#endregion

        // Remove empty blocks
        if (includeEmptyBlocks) {
            return blocks.map(block => new Block(block));
        }

        return blocks.filter(block => block.trim() !== '').map(block => new Block(block));
    }

    static determineType(text: string): BlockType {
        const trimmedText = text.trim();
        const upToFirstSpace = trimmedText.split(' ')[0];
        if (trimmedText.startsWith('# ')) return 'h1'
        if (trimmedText.startsWith('## ')) return 'h2'
        if (trimmedText.startsWith('### ')) return 'h3'
        if (trimmedText.startsWith('#### ')) return 'h4'
        if (trimmedText.startsWith('##### ')) return 'h5'
        if (trimmedText.startsWith('###### ')) return 'h6'
        if (trimmedText.startsWith('- [ ] ')) return 'openTask'
        if (trimmedText.startsWith('- [x] ')) return 'completedTask'
        if (/^- \[[a-zA-Z0-9]]$/.test(upToFirstSpace)) return 'otherTask' //#TODO - try testing "- [-]" and similar,does "\[.\]" worK?
        if (/^\d+[.)]$/.test(upToFirstSpace)) return 'ol'
        if (/^[-*]$/.test(upToFirstSpace)) return 'ul'
        if (trimmedText.startsWith('```')) return 'codeBlock'
        if (trimmedText.startsWith('>')) return 'blockQuote'
        if (trimmedText === '') return "empty"
        return 'text'
    }

    private static areSameBlock(firstLine: string, secondLine: string): boolean {
        //#NOTE - the order here was carefully chosen, don't mess it up.
        //Existing code blocks adopt all following lines (the end delimiter is handled elsewhere)
        const trimmedFirstLine = firstLine.trim()
        if (trimmedFirstLine.startsWith('```')) return true;
        //Empty lines are never combined with anything (outside of code blocks).
        if (firstLine === '' || secondLine === '') return false;
        //Block IDs are always combined with any non-empty block
        const trimmedSecondLine = secondLine.trim();
        if (trimmedSecondLine.startsWith('^') && !trimmedSecondLine.includes(' ')) return true;
        const firstLineFirstWord = firstLine.split(' ')[0]
        const secondLineFirstWord = secondLine.split(' ')[0]
        //Headers are always blocks of themselves
        if (/^#{1,6}$/.test(firstLineFirstWord) || /^#{1,6}$/.test(secondLineFirstWord)) return false;
        //Block quote continuations are the same block
        if (firstLine.startsWith('>') && trimmedSecondLine.startsWith('>')) return true;
        //New block quotes or Code Blocks always the start of a block
        if (trimmedSecondLine.startsWith('```') || trimmedSecondLine.startsWith('>')) return false;
        //New lists are always the start of a block
        if (secondLineFirstWord === '-' || secondLineFirstWord === '*' || /^\d+[.)]$/.test(secondLineFirstWord)) return false
        //Block Quotes only merge with other block quotes
        if (firstLine.startsWith('>') && !secondLine.startsWith('>')) return false;
        //Lists 
        if (firstLineFirstWord === '-' || firstLineFirstWord === '*' || /^\d+[.)]$/.test(firstLineFirstWord)) {
            //Indention of second line means same block
            if (secondLine.startsWith(' ') || secondLine.startsWith('    ') || secondLine.startsWith('\t')) return true
            //No indention means new block
            return false;
        }
        //if the first line is a list, and the second line isn't an indentation, then 
        //you may be able to just return true at this point, but want to test
        if (Block.determineType(firstLine) === 'text' && (Block.determineType(secondLine) === 'text' || Block.determineType(secondLine) === 'ul')) return true;
        //should not hit this?
        throw new Error(`Line conversion to blocks was unhandled for lines:
            ${firstLine}
            ...and...
            ${secondLine}`);
    }
}
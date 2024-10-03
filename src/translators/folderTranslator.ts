import * as fs from 'fs';
import { Translator } from '../pdw';
import { DataJournal } from '../DataJournal';

export class FolderTranslator implements Translator {
    getServiceName(): string {
        return "Folder Translator"
    }
    toDataJournal(filepath: string): Promise<DataJournal> {
        const stats = fs.statSync(filepath);
        if (!stats.isDirectory()) {
            throw new Error("Supplied file path is NOT a folder, please supply a path to a folder.")
        }
        const returnDJ: DataJournal = {
            defs: [],
            entries: []
        }
        
    }
    fromDataJournal(canonicalDataset: DataJournal, params: any) {
        throw new Error('Method not implemented. And probably will not be?');
    }

}
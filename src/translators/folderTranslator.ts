import * as fs from 'fs';
import { Translator } from '../pdw';
import { DataJournal, DJ } from '../DataJournal.js';
import { CsvTranslator, fileToDataJournal } from './fileTranslators.js';

export class FolderTranslator implements Translator {
    getServiceName(): string {
        return "Folder Translator"
    }

    static toDataJournal(filepath: string): Promise<DataJournal> {
        return new FolderTranslator().toDataJournal(filepath);
    }

    async toDataJournal(folderPath: string): Promise<DataJournal> {
        const stats = fs.statSync(folderPath);
        if (!stats.isDirectory()) {
            throw new Error("Supplied file path is NOT a folder, please supply a path to a folder.")
        }

        const folderFiles = fs.readdirSync(folderPath);

        const configFiles = folderFiles.filter(file => file.endsWith('.config.json'));
        let filesThatMightBeDataJournals = folderFiles.filter(file => !file.endsWith('.config.json'));

        const configedFileNamesSansExtension =
            configFiles.map(file => file.substring(0, file.length - 12))

        let filesWithConfiguration: string[] = [];
        const nonConfigedFiles = filesThatMightBeDataJournals.filter(file => {
            const filenameSansExtension = file.substring(0, file.lastIndexOf('.'));
            const hasConfiguration = configedFileNamesSansExtension.includes(filenameSansExtension)
            if (hasConfiguration) filesWithConfiguration.push(file);
            return !hasConfiguration
        });

        const filePromiseArray: Promise<unknown>[] = nonConfigedFiles.map(file => fileToDataJournal(folderPath + '/' + file));

        if (filesWithConfiguration.length > 0) {
            const configFilePromises: Promise<unknown>[] = configFiles.map(file => readFileAsync(folderPath + '/' + file));
            const configurations = await Promise.all(configFilePromises) as string[];
            filesWithConfiguration.forEach((file: string, index: number) => {
                const parsed = JSON.parse(configurations[index]);
                //Right now the only supported configuration is csvType
                if(parsed.csvType === undefined) throw new Error('Could not read configuration. Right now you only support "csvType" with one of "entries" or "defs".');
                if(parsed.csvType.toUpperCase() === 'ENTRIES') filePromiseArray.push(CsvTranslator.toEntries(folderPath + '/' + file));
                if(parsed.csvType.toUpperCase() === 'DEFS') filePromiseArray.push(CsvTranslator.toDefs(folderPath + '/' + file));
            })
        }

        const individualJournals = await Promise.all(filePromiseArray);

        const parsedFiles = individualJournals.filter(journal => journal !== null) as object[];

        //at this point, parsedFiles will include arrays of Entries or Defs for any csv files loaded containing only those
        const validJournals: DataJournal[] = [];
        parsedFiles.forEach(journalOrArrayOfDefsOrEntries => {
            if(DJ.isValidDataJournal(journalOrArrayOfDefsOrEntries)) return validJournals.push(journalOrArrayOfDefsOrEntries as DataJournal);
            if(!Array.isArray(journalOrArrayOfDefsOrEntries)) throw new Error('A non-array was found where one really should not be.', journalOrArrayOfDefsOrEntries);
            if(journalOrArrayOfDefsOrEntries.length === 0) return console.warn('A zero-length array was found when looking to parse a def or entry csv file contents. Ignoring the file.');
            if(DJ.isValidDef(journalOrArrayOfDefsOrEntries[0])) return validJournals.push({defs:journalOrArrayOfDefsOrEntries, entries: []} as DataJournal);
            if(DJ.isValidEntry(journalOrArrayOfDefsOrEntries[0])) return validJournals.push({defs:[], entries: journalOrArrayOfDefsOrEntries} as DataJournal);
            console.warn('CSV file configured as only containing arrays or defs was analyzed and found not to contain valid entries or defs');
        });

        const combinedJournal = DJ.merge(validJournals);

        return combinedJournal;

        function readFileAsync(filePath) {
            return new Promise((resolve, reject) => {
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });
        }
    }

    fromDataJournal(canonicalDataset: DataJournal, params: any) {
        throw new Error('Method not implemented. And probably will not be?');
    }

}
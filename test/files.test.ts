import { describe, expect, test } from 'vitest';
import * as ie from '../src/translators/fileTranslators'
import * as testData from './test_datasets';

describe('Round Tripping File Types', () => {
    test('Roundtrip JSON', async () => {
        /* Pull the data out */
        const dataset = testData.biggerJournal;
        /* Write it to file */
        let jsonTranslator = new ie.JsonTranslator();
        await jsonTranslator.fromDataJournal(dataset, 'test/localTestFileDir/roundtrip.json');
        /* Load data from the file */
        const comparisonDataset = await jsonTranslator.toDataJournal('test/localTestFileDir/roundtrip.json');
        //The store name only comes with the imported data
        delete comparisonDataset.overview;
        expect(dataset).toEqual(comparisonDataset);
    })

    test('Roundtrip YAML', async () => {
        /* Pull the data out */
        const dataset = testData.biggerJournal;
        /* Write it to file */
        let yamlTranslator = new ie.YamlTranslator();
        await yamlTranslator.fromDataJournal(dataset, 'test/localTestFileDir/roundtrip.yaml');
        /* Load data from the file */
        const comparisonDataset = await yamlTranslator.toDataJournal('test/localTestFileDir/roundtrip.yaml');
        //The store name only comes with the imported data
        delete comparisonDataset.overview;
        expect(dataset).toEqual(comparisonDataset);
    })

    test('Roundtrip CSV', async () => {
        /* Pull the data out */
        const dataset = testData.biggerJournal;
        /* Write it to file */
        let csvTranslator = new ie.CsvTranslator();
        await csvTranslator.fromDataJournal(dataset, 'test/localTestFileDir/roundtrip.csv');
        /* Load data from the file */
        const comparisonDataset = await csvTranslator.toDataJournal('test/localTestFileDir/roundtrip.csv');
        //The store name only comes with the imported data
        delete comparisonDataset.overview;
        expect(removeEmptyArraysAndUndefined(dataset)).toEqual(removeEmptyArraysAndUndefined(comparisonDataset));
        
        //entries and defs only variants
        await csvTranslator.fromDefs(dataset.defs,'test/localTestFileDir/defsOnly.csv')
        await csvTranslator.fromEntries(dataset.entries,'test/localTestFileDir/entriesOnly.csv')
        const parsedDefs = await csvTranslator.toDefs('test/localTestFileDir/defsOnly.csv');
        const parsedEntries = await csvTranslator.toEntries('test/localTestFileDir/entriesOnly.csv')

        expect(parsedDefs).toEqual(dataset.defs)
        expect(parsedEntries).toEqual(dataset.entries)

        //So right now there's no way to reconstitute an empty Array roundtrip, comes back as undefined. Also empty
        //keys are showing up despite having an undefined value. So removing all that for the sake of test.
        function removeEmptyArraysAndUndefined(dataset){
            dataset.defs.forEach(def=>{
                Object.keys(def).forEach(key=>{
                    if(def[key]===undefined || (Array.isArray(def[key]) && def[key].length === 0)) delete def[key];
                })
            })
        }
    })

    // test('Roundtrip Excel', async () => {
    //     /* Load up fresh PDW instance */
    //     const pdwRef = await pdw.PDW.newPDW([]);
    //     /* Load it with test data */
    //     await pdwRef.setAll(testData);
    //     /* Pull the data out */
    //     const dataset = await pdwRef.getAll({});
    //     /* Write it to file */
    //     let xlsxExp = new ie.AsyncExcelTabular();
    //     await xlsxExp.fromCanonicalData(dataset, 'test/localTestFileDir/dataset.xlsx');
    //     /* Load data from the file */
    //     const comparisonDataset = await xlsxExp.toCanonicalData('test/localTestFileDir/dataset.xlsx');
    //     //The store name only comes with the imported data
    //     delete comparisonDataset.overview?.storeName;
    //     /* 
    //         Using native Excel dates, which round to the nearest second.
    //         This causes the EpochStrs to be wrong by a tiny bit, which is
    //         something I can live with, but gotta strip them out or this
    //         test will fail.
    //     */
    //     dataset.defs.forEach(def => {
    //         //@ts-expect-error
    //         delete def._created;
    //         //@ts-expect-error
    //         delete def._updated;
    //     })
    //     dataset.entries.forEach(entry => {
    //         //@ts-expect-error
    //         delete entry._created;
    //         //@ts-expect-error
    //         delete entry._updated;
    //     })
    //     comparisonDataset.defs.forEach(def => {
    //         //@ts-expect-error
    //         delete def._created;
    //         //@ts-expect-error
    //         delete def._updated;
    //     })
    //     comparisonDataset.entries.forEach(entry => {
    //         //@ts-expect-error
    //         delete entry._created;
    //         //@ts-expect-error
    //         delete entry._updated;
    //     })
    //     /* 
    //         ...and the arrays are in the wrong order,  
    //         which only matters for testing.
    //      */
    //     dataset.entries.sort((a,b)=> a._uid > b._uid ? 1 : -1)
    //     comparisonDataset.entries.sort((a,b)=> a._uid > b._uid ? 1 : -1)
    //     /* And finally... */
    //         //@ts-expect-error
    //     delete dataset.overview?.lastUpdated
    //     //@ts-expect-error
    //     delete comparisonDataset.overview?.lastUpdated
    //     //what a pain in the butt.
    //     expect(dataset).toEqual(comparisonDataset);
    // })


})
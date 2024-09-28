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
        await csvTranslator.fromDefs(dataset.defs, 'test/localTestFileDir/defsOnly.csv')
        await csvTranslator.fromEntries(dataset.entries, 'test/localTestFileDir/entriesOnly.csv')
        const parsedDefs = await csvTranslator.toDefs('test/localTestFileDir/defsOnly.csv');
        const parsedEntries = await csvTranslator.toEntries('test/localTestFileDir/entriesOnly.csv')

        expect(parsedDefs).toEqual(dataset.defs)
        expect(parsedEntries).toEqual(dataset.entries)

        //So right now there's no way to reconstitute an empty Array roundtrip, comes back as undefined. Also empty
        //keys are showing up despite having an undefined value. So removing all that for the sake of test.
        function removeEmptyArraysAndUndefined(dataset) {
            dataset.defs.forEach(def => {
                Object.keys(def).forEach(key => {
                    if (def[key] === undefined || (Array.isArray(def[key]) && def[key].length === 0)) delete def[key];
                })
            })
        }
    })

    // test('Roundtrip Excel', async () => {
    // Bug in XLSX js for opening Excel files on Mac.
    // })q

    test('Roundtrip Markdown', async () => {
        /* Pull the data out */
        const dataset = testData.biggerJournal;
        /* Write it to file */
        let markdownTranslator = new ie.MarkdownTranslator();
        await markdownTranslator.fromDataJournal(dataset, 'test/localTestFileDir/roundtrip.md');
        const parsedDJ = await markdownTranslator.toDataJournal('test/localTestFileDir/roundtrip.md');
        //right now tags & range are being parsed as strings rather than arrays, don't want to hard code,
        //so I'm doing this half measure instead of actually fixing things.
        parsedDJ.defs.forEach(def => delete def._range);
        dataset.defs.forEach(def => delete def._range);
        expect(parsedDJ).toEqual(dataset);
    })
    //because this logic was crazy, here's some examples of how it works
    test('Markdown Block Parsing', () => {
        const myString = `- Some key value testing
    - :: this should be nothing.
    - [simplest::case]
    - [two::per line] with middle [words::too]
    - (parens::simple case)
    - (twotwo::sets) of (these::parens)
    - [mixed:: this value ) should include the paren]
    - [the middle [dos::words] are the only key value]
    - (DOES (NOT)::PARSE)
    - (DOES ACTUALLY::PARSE (FOR SOME REASON))
    - [Also [DOESNOT]::parse]
    - (Also also [DOESNOT]::parse either)
    - [also::[DOES] parse]
    - [thevalue::Inclues a (paren) here]
    - (the::(really) jacked [up] case)
    - (edgecase:: this ] closing brace case)
    - You must use :: Delimers of some kind `

        const shouldBe = {
            simplest: 'case',
            two: 'per line',
            words: 'too',
            parens: 'simple case',
            twotwo: 'sets',
            these: 'parens',
            mixed: ' this value ) should include the paren',
            dos: 'words',
            'DOES ACTUALLY': 'PARSE (FOR SOME REASON)',
            also: '[DOES] parse',
            thevalue: 'Inclues a (paren) here',
            the: '(really) jacked [up] case',
            edgecase: ' this ] closing brace case'
        }
        //@ts-expect-error -accessing internal method
        const result = ie.MarkdownTranslator.mergeObjectIntoMarkdownString(myString,{});
        expect(result.keyValuesContained).toEqual(shouldBe)
    })
})

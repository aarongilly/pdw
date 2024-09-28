// import * as pdw from './pdw.js'
// import * as ie from './translators/fileTranslators.js'
// import * as fs from 'fs'
// // import * as obs from './translators/obsidianTranslator.js'
// // import * as XLSX from 'xlsx'
// // import * as fs from 'fs'
// import * as testData from '../test/test_datasets.js'
// import { Def, DefType, DJ, DataJournal, Entry } from './DataJournal.js'
// import { AliasKeyer, AliasKeyes } from './AliasKeyer.js';
// import { JsonTranslator, MarkdownTranslator } from './translators/fileTranslators.js';
// import { Note } from './translators/MarkdownParsers.js'

// // const translator = new JsonTranslator();

// // const singleTranslatorConfig: pdw.Config = {
// //     translators: [
// //         {
// //             serviceName: 'JSON',
// //             filePath: 'test/localTestFileDir/dataset.json'
// //         }
// //     ]
// // }

// // const myString = '- How much [thing::wood] would a (animal::woodchuck with more) [action::[hard] chuck] if a ((tricky) thing::woodchuck)'
// const myString = `- Some key value testing
//     - :: this should be nothing.
// 	- [simplest::case]
// 	- [two::per line] with middle [words::too]
// 	- (parens::simple case)
// 	- (twotwo::sets) of (these::parens)
// 	- [mixed:: this value ) should include the paren]
// 	- [the middle [dos::words] are the only key value]
// 	- (DOES (NOT)::PARSE)
// 	- (DOES ACTUALLY::PARSE (FOR SOME REASON))
// 	- [Also [DOESNOT]::parse]
// 	- (Also also [DOESNOT]::parse either)
// 	- [also::[DOES] parse]
// 	- [thevalue::Inclues a (paren) here]
// 	- (the::(really) jacked [up] case)
// 	- (edgecase:: this ] closing brace case)
//     - forcing :: that engecasere`

// const shouldBe = {
//     simplest: 'case',
//     two: 'per line',
//     words: 'too',
//     parens: 'simple case',
//     twotwo: 'sets',
//     these: 'parens',
//     mixed: ' this value ) should include the paren',
//     dos: 'words',
//     'DOES ACTUALLY': 'PARSE (FOR SOME REASON)',
//     also: '[DOES] parse',
//     thevalue: 'Inclues a (paren) here',
//     the: '(really) jacked [up] case',
//     edgecase: ' this ] closing brace case'
// }

// new MarkdownTranslator().updateMarkdownDataJournal(testData.biggerJournal, 'test/localTestFileDir/small.md', {})




// //#region ---- WHERE YOU ARE GOING
// /*
// // Sort of a note to self - beginning with the end in mind. You want to enable this.
// //const
// //const config = loadConfigFileAtPath('path/to/pdw_config.json')d
// //...or
// const config = {
//     translators: [
//         {
//             type: 'excel',
//             path: 'path/to/excel.xlsx'
//         },
//         {
//             type: 'csv',
//             path: 'path/to/csv.csv'
//         },
//         {g
//             type: 'yaml',
//             path: 'path/to/yaml.yaml'
//         },
//         {
//             type: 'json',
//             path: 'path/to/json.json'
//         },
//         {
//             type: 'markdown', //uses obsidian & dataview syntax
//             path: 'path/to/markdown.md'
//         },
//         {
//             type: 'folder', //supports files of all the above types
//             path: 'path/to/folder'
//         },
//     ],
//     connectors: [
//         {
//             type: 'sqlite',
//             config: { //contents set by the connector class
//                 location: 'path/to/database',
//                 user: 'aaron',
//                 pass: 'whatever'
//             },
//             readonly: false //allow writes to database for PDW.sync() (which may exist at some point)
//         },
//         {
//             type: 'firestore',
//             config: {
//                 location: 'url or whatever',
//                 otherProps: 'whatever key value pairs the connector class uses'
//             },
//             readonly: true //don't allow writes to database
//         }
//     ]
// }
// const PDW = await pdw.PDW.newPDW(config)
// PDW.saveToFile('path/to/output.xlsx');

// const QUERY = PDW.buildQuery().from('2024').defs(['lbl a', 'id b']);
// const result = PDW.query(QUERY)
// const altWayToResult = await PDW.buildQuery().from('2024').defs(['lbl a', 'id b']).run();
// expect(result).toEqual(altWayToResult);
// */
// //#endregion


// //#region ---- New "final version" one time import


// /**
//  * Translating from medium new to new new
//  */
// // const filepath = '.archiveOfOutdated/All-REAL-DATA-AFTER.json'

// // const file = JSON.parse(fs.readFileSync(filepath).toString());

// // const defs: any[] = [];

// // (<any[]>file.defs).forEach((defish: any) => {
// //     // console.log(defish);
// //     defish._pts.forEach(pt => {
// //         console.log(defish);
// //         console.log(pt);
// //         const def: Def = {
// //             _id: defish._did + "_" + pt._pid,
// //             _type: pt._type,
// //             _updated: defish._updated,
// //             _lbl: defish._lbl + "_" + pt._lbl,
// //             _desc: pt._desc,
// //             _emoji: pt._emoji,
// //             _rollup: pt._rollup,
// //             _scope: defish._scope
// //         }
// //         defs.push(def);
// //     })
// // })

// // const entries: any[] = [];

// // file.entries.forEach((entryish: any) => {
// //     const entry: Entry = {
// //         _id: entryish._uid,
// //         _period: entryish._period,
// //         _updated: entryish._updated,
// //         _created: entryish._created,
// //         _source: entryish._source,
// //         _note: entryish._note,
// //         _deleted: entryish._deleted
// //     }
// //     const keys = Object.keys(entryish);
// //     keys.forEach(key => {
// //         if (key.startsWith('_')) return
// //         entry[entryish._did + "_" + key] = entryish[key]
// //     })
// //     entries.push(entry)
// // })

// // console.log(defs)

// // const returnData: DataJournal = {
// //     defs: defs,
// //     entries: entries
// // }

// // const translator = new ie.JsonTranslator();
// // translator.fromDataJournal(returnData, '.archiveOfOutdated/ALL-DEFS-AFTER.json')


// //#endregion
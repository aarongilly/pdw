export {} //delete this line when starting development

//import { DefLike, StorageConnector } from "../pdw";
// import * as XLSX from 'xlsx';
// import * as fs from 'fs';

/**
 * Try not to chase 3 rabbits. This is intended to KEEP THE END IN MIND.
 * 
 * Image test: ![IMAGE](/test.png)
 * 
 * #TODO 
 */
// export class PlainTextConnector implements StorageConnector {
//     connectedDbName: string;
//     serviceName: string;
//     subDir: string
//     constructor(subDir: string) {
//         this.connectedDbName = 'Temporary';
//         this.serviceName = "PlainText";
//         this.subDir = subDir;
//         XLSX.set_fs(fs);
//     }

//     setDefs(defs: DefLike[]) {
//         if(defs) console.log(defs);
        
//         throw new Error("Method not implemented.");
//     }

//     getDefs(params?: string[] | undefined) {
//         if (params) console.log('I see your', params);
//         throw new Error("Method not implemented.");
//         return [];
//     }
// }



/*
# Straight-up Text Files refernce code
    
// writeFile function with filename, content and callback function
fs.writeFile('fs-test/newfile.txt', 'Learn Node FS module', function (err) {
    if (err) throw err;
    console.log('File is created successfully.');
});

// read file sample.html
fs.readFile('fs-test/newfile.txt',
// callback function that is called when reading file is done
function(err, data) {
    if (err) throw err;
    // data is a buffer containing file content
    console.log(data.toString('utf8'))
});
*/




//#Contents of Local-Test when it was working.
// if (false){//testing == 'csv') {
//     XLSX.set_fs(fs);
//     let demoSwitch = 'write';
//     demoSwitch = 'read';
//     if (demoSwitch == 'write') {
//         const date = new Date();
//         const myObj = { "hello": "world" }
//         var wb = XLSX.utils.book_new(); var ws = XLSX.utils.aoa_to_sheet([
//             ["Header", "<3", "CSV Test"],
//             [72, , 'Then he said, "This should trip you up, dad".'],
//             [, 62, myObj],
//             [true, false, date],
//         ]);
//         XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
//         XLSX.writeFile(wb, "fs-test/textport.csv");
//     }else{
//         let contents = XLSX.readFile('fs-test/te3xtport.csv');
//         console.log(contents.Sheets.Sheet1.A1.v);
//     }
// }
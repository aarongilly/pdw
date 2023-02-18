import * as XLSX from 'xlsx';
import fetch from 'node-fetch'
import * as fs from 'fs';

// XLSX.set_fs(fs);

export async function createXLSXFile(){
    const f = await (await fetch("https://sheetjs.com/pres.xlsx")).arrayBuffer();
    const wb = XLSX.read(f);
    const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    console.log(data);
    

    // Write File 
    XLSX.writeFile(wb, "node.xlsx");
    ii
}

export const test = () => {
    // createXLSXFile();
    //How do we tie into the librarys in development?
    
    // writeFile function with filename, content and callback function
//     fs.writeFile('fs-test/newfile.txt', 'Learn Node FS module', function (err) {
//         if (err) throw err;
//         console.log('File is created successfully.');
//     });

    // read file sample.html
    fs.readFile('fs-test/newfile.txt',
    // callback function that is called when reading file is done
    function(err, data) {       
        if (err) throw err;
        // data is a buffer containing file content
        console.log(data.toString('utf8'))
    });
}

test();

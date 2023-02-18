import { StorageConnector } from "../pdw";

/**
 * Try not to chase 3 rabbits. This is intended to KEEP THE END IN MIND.
 * 
 * This sort of thing would have to handle authorization and authentication.
 * It's not obvious to me yet whether the PDW library needs to know about
 * or be involved with that at all. Probably not?
 */
export class PlainTextConnector implements StorageConnector{
    constructor(){
        this.connectedDbName = 'Temporary';
        this.serviceName = "PlainText";
    }
    getDefs(params?: string[] | undefined) {
        if(params) console.log('I see your', params);
        throw new Error("Method not implemented.");
    }
    connectedDbName: string;
    serviceName: string;
}

function testCreate(){
    console.log('Hello');
    return true;
}

testCreate();

/*

//How do we tie into the librarys in development?
    
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
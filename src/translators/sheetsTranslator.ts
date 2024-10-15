// import { google } from 'googleapis';
// import * as dotenv from 'dotenv'

// export async function mainFunc(){
    
// dotenv.config();

// //#region SHEETS stuff

// const auth = await google.auth.getClient({scopes: ['https://www.googleapis.com/auth/spreadsheets']});

// const sheets = google.sheets({version: 'v4', auth});

// //# REMINDER TO SELF - I had to explicitly share the files/folders I wanted access to with the service account email:
// //my-learning-act@nodejs-learning-438417.iam.gserviceaccount.com
// //The best example code you found that is actually relevant:
// //https://developers.google.com/sheets/api/guides/values#node.js_4


// // const repsonse = await sheets.spreadsheets.values.batchGet({spreadsheetId: process.env.SHEET_ID, ranges: [
// //     'A:A','B:B'
// // ]});//.get({spreadsheetId: process.env.SHEET_ID,range:'A:ZZ'})
// // console.log(response.data)

// /* GET SHEET DATA with Helpers */
// const valuesAsStringsOnly = true;
// const myRenderOption = valuesAsStringsOnly ? 'FORMATTED_VALUE' : 'UNFORMATTED_VALUE'; 
// const repsonse = await sheets.spreadsheets.values.get({spreadsheetId: process.env.SHEET_ID,range:'Sheet1!A:ZZ',valueRenderOption:myRenderOption});
// const vals = convert2DArrayToObjectArray(repsonse.data.values);
// console.log(vals)

// function convert2DArrayToObjectArray(arr) {
//     const headers = arr[0];
//     const dataRows = arr.slice(1);
//     const objectArray: any[] = [];
  
//     for (const row of dataRows) {
//       const obj: any = {};
//       for (let i = 0; i < headers.length; i++) {
//         obj[headers[i]] = row[i];
//       }
//       objectArray.push(obj);
//     }
  
//     return objectArray;
//   }

 
// /* GET SHEET DATA */
// // const repsonse = await sheets.spreadsheets.values.get({spreadsheetId: process.env.SHEET_ID,range:'Sheet1!A:ZZ'});

// /* GET SHEET NAMES */
// // const repsonse = await sheets.spreadsheets.get({spreadsheetId: process.env.SHEET_ID});
// // const sheetNames = repsonse.data.sheets.map(sheet=>sheet.properties.title);


// /* APPENDING TO SHEET */
// // await sheets.spreadsheets.values.append({spreadsheetId: process.env.SHEET_ID,range:'a1',valueInputOption:'RAW',resource:{values:[['yo','mamma']]}})

// //#endregion

// //#region --- DRIVE Stuff
// // const auth = await google.auth.getClient({ scopes: ['https://www.googleapis.com/auth/drive'] });
// // const drive = google.drive({ version: 'v3', auth });

// // /* GET FOLDERS Example */
// // const files = await drive.files.list({
// //     q: "mimeType = 'application/vnd.google-apps.folder'",
// //     pageSize: 10,
// //   });


// /* GET TEXT FILES Example */
// // const files = await drive.files.list({
// //         q: "name contains '.txt'",
// //         pageSize: 10,
// //     });
// // const fileIds = files.data.files.map(file=>file.id);
// // const content = await drive.files.get({fileId:fileIds[0],alt:'media'});
// // console.log(content);

// //#endregion

// }
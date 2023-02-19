# Personal Data Warehouse

## TODO NEXT TIME

### Get a Local Connector Workflow
Pick up on trying out [CSV writer](https://www.npmjs.com/package/csv-writer)  
and/or  
Figure out how to set xlsx to write to file via localtest

XLSX coudl be extra powerful given it can work in-browser & locally

### Build Up pdw.ts Directly
Connectors are cool, but the product is vital... and not really started.

## Project Meta

This is made with Vite: ![test image input](/vite.svg)

This is the README.md - it also generates the top-level documentation page.

The goal here is to have a pdw.ts library you could publish to NPM - along with a connector or two.

Also to develop (some) **LOCAL FIRST** storage connector(s)

You've made good progress:

- [x] made functioning `npm run localtest` script
- [x] created poc local .txt files
- [x] created poc local sqlite database
- [x] create local .csv files
- [x] read local .csv files
    - [ ] had to use `npm i --save https://cdn.sheetjs.com/xlsx-0.19.2/xlsx-0.19.2.tgz`


You can use [this site](https://tsuml-demo.firebaseapp.com/) to generate UML maps and insert them into the markup here.

You could also use Excalidraw for neat documentation.

## Reminders

- The "out" directory was created by you in the tsconfig file in order to power the localtest functionality. You had to set: 
noEmit = false //was true
outDir = out //property didnt' exist

- You were able to create & read straight up text files. This is what the 'fs-test' directory is for

- You were able to set up a launch.json to run localtest.ts by simply pressing `f5`

# Connector Dev

Try to **remain connector agnostic!** Also to have the API work in-browser and in Node.
(can you use the Temporal polyfill in node?)

Anyway, `npm run dev` for Docs & browser-based stuff

- [ ] TODO - make a LOCAL tester script and add it to package.json to test SQL

|Firebase|XLSX|SQLite|
|:-:|:-:|:-:|
|Browser|Both?|Local|i
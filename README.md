# Personal Data Warehouse

This is the README.md - it also generates the top-level documentation page.

The goal here is to have a pdw.ts library you could publish to NPM - along with a connector or two. This is a library development project, for a single codebase that can be used to interact with local data or data in the cloud, depending on the storage connector.

Also want to develop a few StorageConnectors - in order:
1. Excel
2. Firebase --- and a front-end with Svelte(Kit?)
3. SQLite

Regarding TypeDoc - you can use images:  
This is made with Vite: ![test image input](/vite.svg)

You *could* also use Excalidraw for neat documentation. StarUML for legit UML documentaiton, or [this site](https://tsuml-demo.firebaseapp.com/) to generate UML maps and insert them into the markup here.

## TODO NEXT TIME
Pick up with these things 👇

- [ ] Build up the `loadFromExcel` function to handle variability of inputs for defs
- [ ] Start working on setDefs
- [ ] Start working on getEntries/setEntries

## Reminders

- The "out" directory was created by you in the tsconfig file in order to power the localtest functionality. You had to set: 
noEmit = false //was true
outDir = out //property didnt' exist

- You were able to create & read straight up text files. This is what the 'fs-test' directory is for

- You were able to set up a launch.json to run localtest.ts by simply pressing `f5`

- You can use [this site](https://tsuml-demo.firebaseapp.com/) to generate UML maps and insert them into the markup here.

### Local Development
`npm run localtest` -or- `f5` runs src/local-test.ts --- it works great!

### Cloud Development
`npm run dev` for Docs & browser-based stuff

# Connector Dev

Try to **remain connector agnostic!** Also to have the API work in-browser and in Node.
(can you use the Temporal polyfill in node?)

|Firebase|XLSX|SQLite|
|:-:|:-:|:-:|
|Browser|Both?|Local|i
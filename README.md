# Personal Data Warehouse

This **README** is what generates the top-level TypeDoc documentation page. 

The goal here is to have a pdw.ts library you could publish to NPM - along with a connector or two. This is a library development project, for a single codebase that can be used to interact with local data or data in the cloud, depending on the storage connector.

Regarding TypeDoc - you can use images: ![test image input](/vite.svg)

You *could* also use Excalidraw for neat documentation. StarUML for legit UML documentaiton, or [this site](https://tsuml-demo.firebaseapp.com/) to generate UML maps and insert them into the markup here.

## Reminders

- The "out" directory was created by you in the tsconfig file in order to power the localtest functionality. You had to set: 
noEmit = false //was true
outDir = out //property didnt' exist

- You were able to set up a launch.json to run localtest.ts by simply pressing `f5`

- You can use [this site](https://tsuml-demo.firebaseapp.com/) to generate UML maps and insert them into the markup here.

### Local Development
`npm run localtest` -or- `f5` runs src/local-test.ts --- it works great

### Browser Development
`npm run dev` for Docs & browser-based stuff

# Structure

This is already out-of-date, but I want something like this to show up so hey.

![class diagram](/classes.png)
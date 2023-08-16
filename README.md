# Personal Data Warehouse

This **README** is what generates the top-level TypeDoc documentation page. 

The goal here is to have a pdw.ts library you could publish to NPM - along with a connector or two. This is a library development project, for a single codebase that can be used to interact with local data or data in the cloud, depending on the storage connector.

Regarding TypeDoc - you can use images: ![test image input](/vite.svg)

You *could* also use Excalidraw for neat documentation. Or [this site](https://tsuml-demo.firebaseapp.com/) to generate UML maps and insert them into the markup here.

## Reminders

- The "out" directory was created by you in the tsconfig file in order to power the localtest functionality. You had to set: 
noEmit = false //was true
outDir = out //property didnt' exist

- You were able to set up a launch.json to run localtest.ts by simply pressing `f5`
- You can use [this site](https://tsuml-demo.firebaseapp.com/) to generate UML maps and insert them into the markup here.
- You got a good Vitest workflow going.

### Local Development
`npm run localtest` -or- `f5` runs src/local-test.ts --- it works great

Alternatively, run tests with `npm run test`

### Browser Development
`npm run dev` for Docs & browser-based stuff.

# Structure


```mermaid
---
title: Data Structure
---
erDiagram
    DEF{
        string _did
        string _lbl
        string _emoji
        string _desc
        enum _scope
    }
    TAG{
        string _tid
        string _lbl
        string[] _dids
    }
    TAG }o--o{ DEF : references

    ENTRY {
        string _did
        string _eid
        string _period
        string _note
        string _source
    }
    POINTDEF{
        string _pid
        string _lbl
        string _emoji
        string _desc
        enum _type
        enum _rollup
    }
    ELEMENT{
        string _uid
        string _created
        string _updated
        string _deleted
    }

    DEF ||--o{ POINTDEF : owns

    DEF ||--o{ ENTRY : describes
    DEF ||--|| ELEMENT : is
    ELEMENT ||--|| ENTRY : is
    ELEMENT ||--|| TAG : is
    ENTRYPOINT {
        any pid "<- key is value of _pid from PointDef"
    }
    ENTRY ||--o{ ENTRYPOINT : owns
    POINTDEF ||--o{ ENTRYPOINT : describes
```

## PDW

## Elements

There are three kinds of Elements. All of which extend from the abstract "Element" base class. This base class handles some common functions, and has 4 properties.

### Def


### Entry


### Tag




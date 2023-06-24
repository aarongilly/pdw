import { expect, test } from 'vitest'
import * as pdw from '../src/pdw';
import { Temporal } from 'temporal-polyfill';
import { DefaultDataStore } from '../src/DefaultDataStore';
import { importFromFile } from '../src/dataStores/fileAsyncDataStores';

const pdwRef = pdw.PDW.getInstance();

test('Def Setting and Getting', () => {
    /**
     * Most Basic Def Creation
    */
    let firstDef = pdwRef.newDef({
        _did: 'aaaa'
    });
    expect(firstDef._did).toBe('aaaa'); //accepts input value
    expect(firstDef._lbl).toBe('Unlabeled Definition aaaa'); //return value
    expect(firstDef._scope).toBe(pdw.Scope.SECOND); //default scope
    expect(firstDef._emoji).toBe('🆕') //default emoji
    expect(firstDef._pts).toEqual([]); //default points = empty array
    expect(firstDef._desc).toBe('Set a description'); //default description
    expect(firstDef._deleted).toBe(false); //default deletion status
    expect(firstDef.__tempCreated.epochMilliseconds).toBeGreaterThan(Number.parseInt(Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString()) - 5000) //created not long ago...
    expect(firstDef.__tempCreated.epochMilliseconds).toBeLessThan(Number.parseInt(Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString())) //...but not in the future

    /**
     * Fully specified Def Creation
     */
    let secondDef = pdwRef.newDef({
        _created: '2023-05-19T16:13:30',
        _updated: '2023-05-19T16:13:30',
        _deleted: false,
        _emoji: '🌭',
        _scope: pdw.Scope.DAY,
        _uid: 'handjammed-30so',
        _did: 'gggg',
        _lbl: 'Second Def',
        _desc: 'Test Desc'
    })
    expect(secondDef._desc).toBe('Test Desc');
    expect(secondDef._emoji).toBe('🌭');
    expect(secondDef._scope).toBe('DAY');
    expect(secondDef._uid).toBe('handjammed-30so');
    expect(secondDef._did).toBe('gggg');
    expect(secondDef._lbl).toBe('Second Def');
    expect(secondDef._deleted).toBe(false);
    //checking epochStr
    const epochMillis = parseInt(secondDef._created, 36)
    const parsedTemporal = Temporal.Instant.fromEpochMilliseconds(epochMillis).toZonedDateTimeISO(Temporal.Now.timeZone());
    const localeString = parsedTemporal.toLocaleString();
    expect(localeString).toBe('5/19/2023, 4:13:30\u202fPM CDT'); //until daylight savings hits, then it will be an hour off. also \u202f is the non-breaking space char code    
    expect(secondDef._created).toEqual(secondDef._updated); //created & updated are the same if the Element isn't an update to an existing one

    /**
     * Some base class {@link Element} methods
     */
    expect(firstDef.getType()).toBe('DefLike');
    expect(firstDef.isOlderThan(secondDef)).toBe(false); //because secondDef was backdated on creation
    expect(firstDef.shouldBeReplacedWith(secondDef)).toBe(false); //not the same _did
    expect(firstDef.sameIdAs(secondDef)).toBe(false); //not the same _did
    expect(firstDef.sameTypeAs(secondDef)).toBe(true); //both 'DefLike'
    
    /**
    * Wide-open getter
    */
    let defs = pdwRef.getDefs();
    expect(defs[0]).toEqual(firstDef); //REF deep-equal syntax
    expect(defs[1]).toEqual(secondDef);

    /**
     * Specified getter
     */
    defs = pdwRef.getDefs({ did: ['gggg'] });
    expect(defs[0]._lbl).toBe('Second Def');

    /**
     * Bulk Def Creation
     */
    let thirdAndForthDef = pdwRef.setDefs(
        [
            {
                _lbl: 'Third def'
            },
            {
                _lbl: 'Forth def'
            }
        ]
    );
    expect(thirdAndForthDef[0]._lbl).toBe('Third def');
    expect(thirdAndForthDef[1]._lbl).toBe('Forth def');
    defs = pdwRef.getDefs()
    expect(defs.length).toBe(4);

    /**
     * Emoji not emoji error
     */
    expect(() => pdwRef.newDef({
        _emoji: 'not an emoji' //emoji isn't 1 character long
    })).toThrowError('Def was mal-formed.');

    /**
     * Invalid Scope Error
     */
    expect(() => pdwRef.newDef(
        { 
            _lbl: 'invalid scope test', 
            //@ts-expect-error // luckily typescript warns me on this
            _scope: 'millisecond' 
        }
    )).toThrowError('Invalid scope supplied when creating Def: millisecond');

    (<DefaultDataStore>pdwRef.dataStores[0]).clearAllStoreArrays();

    /**
     * Setting Def with explicity ._pts PointDefs 
     */
    firstDef = pdwRef.newDef({
        _did: 'aaaa',
        _lbl: 'Def 1',
        _pts: [
            {
                _pid: 'a111',
                _lbl: 'Def 1 point 1',
                _emoji: '1️⃣',
                _desc: 'Text type',
                _type: pdw.PointType.TEXT
            },
            {
                _pid: 'a222',
                _lbl: 'Def 1 point 2',
                _emoji: '2️⃣',
                _desc: "Boolean Type",
                _type: pdw.PointType.BOOL
            }
        ]
    })
    expect(firstDef._pts.length).toBe(2);
    expect(firstDef._pts[0]._lbl).toBe('Def 1 point 1');
    expect(firstDef._pts[1]._lbl).toBe('Def 1 point 2');
    
    /**
     * Setting Def with implicit Points
     */
    secondDef = pdwRef.newDef({
        _did: 'bbbb',
        _lbl: 'Def 2',
        'b111': {
            _lbl: 'Def 2 point 1',
            _type: pdw.PointType.NUMBER,
            _desc: 'Number Type'
        },
        'b222': {
            _lbl: 'Def 2 point 2',
            _type: pdw.PointType.SELECT,
            _desc: 'Select type'
        }
    })
    expect(secondDef._pts.length).toBe(2);
    expect(secondDef._pts[0]._lbl).toBe('Def 2 point 1');
    expect(secondDef._pts[1]._lbl).toBe('Def 2 point 2');

    /**
     * Setting a Def using both - probably not common to do in practice
     */
    let thirdDef = pdwRef.newDef({
        _did: 'cccc',
        _lbl: 'Def 3',
        'c111': {
            _lbl: 'Def 3 point 1',
            _type: pdw.PointType.MARKDOWN,
            _desc: 'Markdown type'
        },
        _pts: [
            {
                _pid: 'c222',
                _lbl: 'Def 3 point 2',
                _type: pdw.PointType.MULTISELECT,
                _desc: 'Multiselect Type'
            }
        ]
    })
    expect(thirdDef._pts.length).toBe(2);
    expect(thirdDef._pts[1]._lbl).toBe('Def 3 point 1'); //order cannot be trusted I guess
    expect(thirdDef._pts[0]._lbl).toBe('Def 3 point 2');

    /**
     * Setting Defs & PointDefs implicitly, mixing point setter methods
     */
    let defsFourAndFive = pdwRef.setDefs([
        {
            _did: 'dddd',
            _pts: [
                {
                    _pid: 'd1111',
                    _lbl: 'Def 4 point 1',
                    _type: pdw.PointType.DURATION,
                }
            ]
        },
        {
            _did: 'eeee',
            'e111': {
                _lbl: 'Def 5 point 1',
                _type: pdw.PointType.JSON
            }
        }
    ]);
    expect(defsFourAndFive[0]._pts[0]._lbl).toBe('Def 4 point 1');
    expect(defsFourAndFive[1]._pts[0]._lbl).toBe('Def 5 point 1');

    /**
     * Def.getPoint(pid)
     */
    let point = firstDef.getPoint('a111');
    expect(point._type).toBe(pdw.PointType.TEXT);

    /**
     * Def.getPoint(lbl)
     */
    point = firstDef.getPoint('Def 1 point 2');
    expect(point._type).toBe(pdw.PointType.BOOL);

    /**
     * Point.getDef
     */
    expect(point.getDef()).toEqual(firstDef);

    /**
     * Should have Options Property
     */
    let textType = firstDef.getPoint('a111');
    let selectType = secondDef.getPoint('b222');
    let multiselectType = thirdDef.getPoint('c222');
    //predicate
    expect(textType.shouldHaveOptsProp()).toBe(false);
    expect(selectType.shouldHaveOptsProp()).toBe(true);
    expect(multiselectType.shouldHaveOptsProp()).toBe(true);
    //existance & type of prop
    expect(textType._opts).toBeUndefined();
    expect(Array.isArray(selectType._opts)).toBe(true);
    expect(Array.isArray(multiselectType._opts)).toBe(true);

    /**
     * Invalid PointDef (bad Type)
     */    
    expect(()=>{
        pdwRef.newDef({
            _did: 'test',
            _pts:[
                {
                    _pid: 'test',
                    //@ts-expect-error //nice
                    _type: 'Invalid type'
                }
            ]
        })
    }).toThrowError('Cannot parse point type Invalid type')
    
    /**
     * Invalid PointDef (bad Rollup)
    */    
   expect(()=>{
       pdwRef.newDef({
           _did: 'test',
           _pts:[
               {
                   _pid: 'test',
                   //@ts-expect-error //nice
                    _rollup: 'Invalid rollup'
                }
            ]
        })
    }).toThrowError('Cannot parse point rollup Invalid rollup');

    /**
     * Defs are Deflike, but not PointDefs
     */
    expect(pdw.Def.isDefLike(firstDef)).toBe(true);
    expect(pdw.Def.isDefLike(point)).toBe(false);

    /**
     * Vice Versa
     */
    expect(pdw.PointDef.isPointDefLike(point)).toBe(true);
    expect(pdw.PointDef.isPointDefLike(firstDef)).toBe(false);

})

test('Update Logic', ()=>{
    (<DefaultDataStore>pdwRef.dataStores[0]).clearAllStoreArrays();

    let origUid = pdw.makeUID();

    let firstDef = pdwRef.newDef({
        _uid: origUid,
        _did: 'aaaa',
        _lbl: 'Def 1',
        _desc: 'Def Desc',
        _pts: [
            {       
                _pid: 'a111',
                _lbl: 'Def 1 point 1',
                _desc: 'Point Desc'
            }
        ]
    });

    expect(pdwRef.getDefs({did: 'aaaa'})[0]._lbl).toBe('Def 1');
    
    /**
     * Element.deleteAndSave()
     */
    firstDef = firstDef.deleteAndSave() as pdw.Def;
    expect(firstDef._deleted).toBe(true);
    expect(pdwRef.getDefs({includeDeleted: 'yes'}).length).toBe(1);
    expect(pdwRef.getDefs({includeDeleted: 'only'}).length).toBe(1);
    expect(pdwRef.getDefs({includeDeleted: 'only'})[0]).toEqual(firstDef);
    
    /**
     * Element.unDeleteAndSave()
     */
    firstDef = firstDef.unDeleteAndSave() as pdw.Def;
    expect(firstDef._deleted).toBe(false);
    expect(pdwRef.getDefs({includeDeleted: 'yes'}).length).toBe(1);
    expect(pdwRef.getDefs({includeDeleted: 'no'}).length).toBe(1);
    
    /**
     * Update Props, don't save yet
     */
    let modified = firstDef.setProps({_lbl: 'DEF ONE'}) as pdw.Def;
    expect(modified._lbl).toBe('DEF ONE'); //new object created
    expect(firstDef._lbl).toBe('Def 1'); //original object unchanged
    expect(modified._desc).toEqual(firstDef._desc); //unchanged props inherited
    expect(pdwRef.getDefs({includeDeleted: 'yes'}).length).toBe(1); //DataStore not changed yet

    /**
     * Save to DataStore after updating
     */
    modified.save();
    expect(pdwRef.getDefs({includeDeleted: 'yes'}).length).toBe(2);
    expect(pdwRef.getDefs({includeDeleted: 'no'}).length).toBe(1);
    let defs = pdwRef.getDefs({did: 'aaaa', includeDeleted: 'yes'});
    expect(defs.length).toBe(2);
    expect(defs.find(def=>def._deleted)!._lbl).toBe('Def 1'); //deleted one unchanged
    expect(defs.find(def=>!def._deleted)!._lbl).toBe('DEF ONE'); //new one reflects change

    /**
     * Set a few props & save
     */
    modified = modified.setProps({_desc: 'New Description', _emoji: '🧠'}).save() as pdw.Def;
    expect(pdwRef.getDefs({did: 'aaaa', includeDeleted: 'yes'}).length).toBe(3);
    expect(pdwRef.getDefs({did: 'aaaa', includeDeleted: 'no'}).length).toBe(1);
    let fromStore = pdwRef.getDefs({did: 'aaaa', includeDeleted: 'no'})[0];
    // expect(modified).toEqual(fromStore); //_tempUpdated is slightly off? Weird.
    expect(modified._updated).toEqual(fromStore._updated);
    expect(fromStore._desc).toBe("New Description");
    expect(fromStore._emoji).toBe("🧠");
    let overwritenFromStore = pdwRef.getDefs({did: 'aaaa', includeDeleted: 'only'});
    expect(overwritenFromStore.length).toBe(2);
    expect(overwritenFromStore[0]._desc).toBe('Def Desc');
    expect(overwritenFromStore[0]._emoji).toBe("🆕");
    expect(overwritenFromStore[1]._desc).toBe('Def Desc');
    expect(overwritenFromStore[1]._emoji).toBe("🆕");

    /**
     * setting no props doesn't change datastore
     */
    expect(pdwRef.getDefs({includeDeleted: 'yes'}).length).toBe(3);
    modified.setProps({});
    expect(pdwRef.getDefs({includeDeleted: 'yes'}).length).toBe(3);
    
    /**
     * Cannot set ID-like props
    */
   modified = modified.setProps({_did: 'bbbb'}) as pdw.Def; //should log warning about not updating ID
   expect(modified._did).toBe('aaaa');
   origUid = modified._uid;
   modified = modified.setProps({_uid: 'whatever'}) as pdw.Def; //should log warning about not updating ID
   expect(modified._uid).toBe(origUid);

   //#### Updating PointDef stuff ####
    
})

test.skip('Entry Basics', () => {
    (<DefaultDataStore>pdwRef.dataStores[0]).clearAllStoreArrays();

    const testDef = pdwRef.newDef({
        _did: 'aaaa',
        _lbl: 'Default Scope test',
        'yyyy': {
            _lbl: 'Point A'
        },
        'zzzz': {
            _lbl: 'Point B',
            _type: pdw.PointType.BOOL
        }
    });

    /**
     * Basic Entry Creation
     */
    const sameSecond = pdw.Period.now(pdw.Scope.SECOND);
    pdwRef.newEntry({
        _did: 'aaaa',
    });
    let entries = pdwRef.getEntries();
    expect(entries.length).toBe(1);
    expect(entries[0]._tempCreated.epochMilliseconds).toBeGreaterThan(Number.parseInt(Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString()) - 5000) //created not long ago...
    expect(entries[0]._tempCreated.epochMilliseconds).toBeLessThan(Number.parseInt(Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString())) //...but not in the future
    expect(entries[0]._period).toBe(sameSecond); //technically could fail every 1000 or so runs

    /**
     * Create Entry with Points
    */
    let testEntry = pdwRef.newEntry({
        _did: 'aaaa',
        'yyyy': 'Text value', //by _pid
        'Point B': true //by _lbl
    })
    entries = pdwRef.getEntries();
    expect(entries.length).toBe(2);
    expect(testEntry._did).toBe('aaaa');
    let points = entries[1].getPoints();
    expect(points.length).toBe(2);

    /**
     * Entry.getPoint with pid
     */
    let point = testEntry.getPoint('yyyy');
    expect(point!._val).toBe('Text value');

    /**
     * Entry.getPoint with pointLbl
     */
    point = testEntry.getPoint('Point B');
    expect(point!._val).toBe(true);

    /**
    * Direct Entry Creation    
    */
    let epochStr = pdw.makeEpochStr();
    testEntry = pdwRef.setEntries([{
        _did: 'aaaa',
        _created: epochStr,
        _deleted: false,
        _eid: 'hand-jammed',
        _note: 'Direct set all values',
        _period: '2023-06-03T11:29:08',
        _source: "Testing code",
        _uid: 'also-hand-jammed',
        _updated: epochStr
    }])[0]
    entries = pdwRef.getEntries();
    expect(entries.length).toBe(3);
    expect(entries[2]).toEqual(testEntry);
    expect(testEntry._created).toBe(epochStr);
    expect(testEntry._updated).toBe(epochStr);
    expect(testEntry._period).toBe('2023-06-03T11:29:08');
    expect(testEntry._source).toBe("Testing code");
    expect(testEntry._uid).toBe("also-hand-jammed");
    expect(testEntry._note).toBe("Direct set all values");
    expect(testEntry._eid).toBe("hand-jammed");
    expect(testEntry._deleted).toBe(false);
    expect(testEntry._did).toBe('aaaa');

    /**
     * Get Specified entry
     */
    entries = pdwRef.getEntries({ eid: 'hand-jammed' });
    expect(entries.length).toBe(1);

    /**
     * Entry.getDef
     */
    expect(testEntry.getDef()).toEqual(testDef)

    /**
     * Def.newEntry method
     */
    testEntry = testDef.newEntry({});
    expect(testEntry._did).toBe('aaaa');

    /**
     * Entry.getPoints for an Entry with no EntryPoints
     */
    points = testEntry.getPoints();
    expect(points.length).toBe(0);

    /**
     * Entry.getPoint for an Entry without that DataPoint
     */
    expect(testEntry.getPoint('zzzz')).toBe(null);

    /**
     * Entry.setPoint method for EntryPoint creation
     */
    testEntry.setPoint('zzzz', false);
    let testPoint = testEntry.getPoint('zzzz');
    expect(testPoint!._val).toBe(false);

    /**
     * Entry.setPoint for EntryPoint overwrite
     */
    testEntry.setPoint('zzzz', true);
    testPoint = testEntry.getPoint('zzzz');
    expect(testPoint!._val).toBe(true);

    /**
     * Ensure the overwritten EntryPoint wasn't erased
     */
    expect(testEntry.getPoints().length).toBe(1);
    expect(testEntry.getPoints(true).length).toBe(2);

    /**
     * Create entry with bad point value types
     */
    expect(() => pdwRef.newEntry({
        _did: 'aaaa',
        'yyyy': { 'an': 'Object can be converted to strings but...' },
        'zzzz': { '...this bool': 'should fail' }
    })).toThrowError();

    /**
     * Create entry with bad EntryPoint ID
     */
    expect(() => {
        pdwRef.newEntry({
            _did: 'aaaa',
            'bbbb': { 'a': 'non-existant pointDef value' },
            'yyyy': 'Testing failure given an extra point supplied (bbbb)',
            'zzzz': true
        })
    }).toThrowError()

    //setting up further tests
    const dayScopeDef = pdwRef.newDef({
        _did: 'bbbb',
        _scope: pdw.Scope.DAY,
        _lbl: 'Day scope test def',
        'rvew': {
            _lbl: 'Day Rating',
            _type: pdw.PointType.NUMBER
        }
    })

    /**
     * Scope default inheritance
     */
    let testDayEntry = dayScopeDef.newEntry({
        //period not specified, should inhereit scope from Def
        'rvew': 10
    });
    expect(pdw.Period.inferScope(testDayEntry._period)).toBe(pdw.Scope.DAY);
    expect(testDayEntry.getPoint('rvew')!._val).toBe(10)

    /**
     * Specified period with correct scope
     */
    testDayEntry = dayScopeDef.newEntry({
        _period: '2023-06-03'
    })
    expect(testDayEntry._period).toBe('2023-06-03');

    /**
     * Scope too granular
     */
    testDayEntry = dayScopeDef.newEntry({
        _period: '2023-06-03T12:24:49'
    })
    expect(testDayEntry._period).toBe('2023-06-03');

    /**
     * Scope too broad, defaults to beginning of period
     */
    testEntry = testDef.newEntry({
        _period: '2023-06-03'
    });
    expect(testEntry._period).toBe('2023-06-03T00:00:00');

    /**
     * Entry.setPeriod
     */
    let updatedTestDayEntry = testDayEntry.setPeriod('2023-06-04');
    expect(updatedTestDayEntry._period).toBe('2023-06-04');
    expect(testDayEntry._period).toBe('2023-06-03'); //original isn't changed
    expect(testDayEntry._deleted).toBe(true); //...but is marked deleted
    expect(testDayEntry._eid).toBe(updatedTestDayEntry._eid);

    /**
     * Entry.setNote
     */
    updatedTestDayEntry = updatedTestDayEntry.setNote('Now with note');
    expect(updatedTestDayEntry._note).toBe('Now with note');

})

test.skip('Tag Basics', () => {
    (<DefaultDataStore>pdwRef.dataStores[0]).clearAllStoreArrays();

    let testDef = pdwRef.newDef({
        _did: 'aaaa'
    })

    /**
     * PDW.newTagDef
     */
    let tagDefA = pdwRef.newTagDef({
        _lbl: 'test tag',
        _tid: 'taga'
    })
    expect(pdwRef.getTagDefs()[0]).toEqual(tagDefA);

    /**
     * Indirect tag creation
     */
    let tagDefB = pdwRef.setTagDefs([{
        _lbl: 'tag b',
        _tid: 'tagb'
    }])[0]
    expect(tagDefB._lbl).toBe('tag b');

    /**
     * Indirect tag label update
     */
    let tagBNew = pdwRef.setTagDefs([{
        _lbl: 'Tag B',
        _tid: 'tagb'
    }])[0]
    expect(tagDefB._deleted).toBe(true);
    expect(tagDefB._lbl).toBe('tag b');
    expect(tagBNew._lbl).toBe('Tag B');

    /**
     * TagDef type error test
     */
    expect(() => {
        pdwRef.newTagDef({
            //@ts-expect-error
            _lbl: 5, //wrong type, should error
        })
    }).toThrowError('TagDef created is not TagDefLik');

    /**
     * Indirectly create Tag on a Def
     */
    let tagA = pdwRef.newTag({
        _did: 'aaaa',
        _tid: 'taga'
    });
    expect(tagA._did).toBe('aaaa');
    expect(tagA._tid).toBe('taga');
    expect(pdwRef.getTags({ tid: 'taga' })[0]).toEqual(tagA);

    /**
     * Def.addTag method 
     */
    let tagB = testDef.addTag('tagb');
    expect(pdwRef.getTags({ did: 'aaaa' }).length).toBe(2);
    expect(pdwRef.getTags({ did: 'aaaa', tid: 'tagb' })[0]).toEqual(tagB);

    /**
     * TagDef.getTaggedDefs
     */
    let tAndD = tagDefA.getTagsAndDefs();
    expect(tAndD.defs[0]).toEqual(testDef);
    expect(tAndD.tags[0]).toEqual(tagA);

    /**
     * TagDef.addTag
     */
    tagDefB.addTag('aaaa')
    expect(pdwRef.getTags({ did: 'aaaa' }).length).toBe(2);

    /**
     * Don't create duplicates
     */
    let numBefore = pdwRef.getTags({ includeDeleted: 'only' }).length
    testDef.addTag('taga') //already exists
    //creates a new Tag, but deletes the old one, even though they're the same content
    expect(pdwRef.getTags({ includeDeleted: 'only' }).length).toBe(numBefore + 1);

    //Enumerations
    //Create Definition with a Select type
    let defWithEnum = pdwRef.newDef({
        _did: 'bbbb',
        _lbl: 'Def with an Enum Point',
        'bbaa': {
            _pid: 'bbaa',
            _lbl: 'Enum PointDef',
            _type: pdw.PointType.SELECT
        }
    });

    let enumPoint = defWithEnum.getPointsAsArray()[0];
    expect(enumPoint._lbl).toBe('Enum PointDef');

    /**
     * Indirectly add 2 choices
     */
    numBefore = pdwRef.getTagDefs().length;
    pdwRef.setTagDefs([
        {
            _lbl: 'Choice A',
            _tid: 'Axxx'
        },
        {
            _lbl: 'Choice B',
            _tid: 'Bxxx'
        }
    ])
    expect(pdwRef.getTagDefs().length).toBe(numBefore + 2);
    numBefore = pdwRef.getTags().length;
    pdwRef.setTags([
        {
            _tid: 'Axxx',
            _did: 'bbbb',
            _pid: 'bbaa'
        },
        {
            _tid: 'Bxxx',
            _did: 'bbbb',
            _pid: 'bbaa'
        }
    ])
    expect(pdwRef.getTags().length).toBe(numBefore + 2);

    /**
     * PointDef.getEnumOptions
     */
    let enumTags = enumPoint.getEnumOptions();
    expect(enumTags.length).toBe(2);

    /**
     * PointDef.addEnumOption
     */
    enumPoint.addEnumOption('Choice C');
    enumTags = enumPoint.getEnumOptions();
    expect(enumTags.length).toBe(3);
    expect(enumTags.map(t => t.getLbl())).toEqual(['Choice A', 'Choice B', 'Choice C']);
    let tagDef = pdwRef.getTagDefs({ tagLbl: 'Choice C' })[0];
    let tagC = pdwRef.getTags({ tid: tagDef._tid })[0];
    expect(tagC.getDef()._lbl).toBe('Choice C'); //tagDef was created

    /**
     * Tag.setLbl && Tag.getLbl
     */
    tagC.setLbl('CHOICE C'); //updates the TagDef
    expect(tagC.getLbl()).toBe('CHOICE C'); //will pull the newly updated TagDef. Nice.
})

test.skip('Query Basics', () => {
    (<DefaultDataStore>pdwRef.dataStores[0]).clearAllStoreArrays();

    let q = new pdw.Query();
    loadFullTestDatasetFromFile();
    //#TODO - build a better test file, then build Query out

    // q.run();
})

test.skip('Data Merge', () => {
    (<DefaultDataStore>pdwRef.dataStores[0]).clearAllStoreArrays();
})

function loadFullTestDatasetFromFile() {
    importFromFile('data-files/OutExcel1.xlsx');
    console.log(pdwRef.getAll({}));

}
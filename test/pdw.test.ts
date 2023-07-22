import { expect, test } from 'vitest'
import * as pdw from '../src/pdw';
import { Temporal } from 'temporal-polyfill';
import { DefaultDataStore } from '../src/DefaultDataStore';
import { importFromFile } from '../src/dataStores/fileAsyncDataStores';

const pdwRef = pdw.PDW.getInstance();

function resetTestDataset() {
    (<DefaultDataStore>pdwRef.dataStores[0]).clearAllStoreArrays();
}

test('Def Creation and Getting', () => {
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
    expect(pdw.Def.toData(secondDef)).toEqual({
        _created: "lhv25fo0", //converted from date string in Element constructor
        _updated: "lhv25fo0", //converted from date string in Element constructor
        _deleted: false,
        _emoji: '🌭',
        _scope: pdw.Scope.DAY,
        _uid: 'handjammed-30so',
        _did: 'gggg',
        _lbl: 'Second Def',
        _desc: 'Test Desc',
        _pts: [] //added as default
    });
    let copy = firstDef.makeStaticCopy() as pdw.Def;
    expect(copy).toEqual(firstDef); //copies start off equal
    //@ts-expect-error - ts warns about setting a read-only prop, nice
    copy._lbl = 'changed.'
    expect(copy._lbl).toBe('changed.'); //copy IS changed.
    expect(firstDef._lbl).toBe('Unlabeled Definition aaaa'); //original is NOT changed

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

    //###### reset datasets for fresh testing below #######
    resetTestDataset();

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
     * Def.getPoint() that doesn't exist
     */
    expect(() => {
        firstDef.getPoint('NO SUCH POINT')
    }).toThrowError()

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
    expect(() => {
        pdwRef.newDef({
            _did: 'test',
            _pts: [
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
    expect(() => {
        pdwRef.newDef({
            _did: 'test',
            _pts: [
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

    /**
     * PointDef with _opts Options
     */
    const defWithOptions = pdwRef.newDef({
        _did: 'ffff',
        _pts: [
            {
                _pid: 'aaaa',
                _type: pdw.PointType.SELECT,
                _opts: [
                    {
                        _oid: '1111',
                        _lbl: 'Opt 1'
                    },
                    {
                        _oid: '2222',
                        _lbl: 'Opt 2'
                    }
                ]

            }
        ]
    });
    const pointWithOptions = defWithOptions.getPoint('aaaa');
    expect(pointWithOptions._opts!.length).toBe(2);
    expect(pointWithOptions._opts![0]._lbl).toBe('Opt 1');
    expect(pointWithOptions._opts![1]._lbl).toBe('Opt 2');
    expect(pointWithOptions.getOpts().length).toBe(2);

})

test('Entry Creation and Getting', () => {
    resetTestDataset();

    const testDef = pdwRef.newDef({
        _did: 'aaaa',
        _lbl: 'Default Scope test',
        'yyyy': {
            _lbl: 'Point A',
            _desc: 'Test point desc'
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
    let entry = entries[0];
    expect(entry.__tempCreated.epochMilliseconds).toBeGreaterThan(Number.parseInt(Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString()) - 5000) //created not long ago...
    expect(entry.__tempCreated.epochMilliseconds).toBeLessThan(Number.parseInt(Temporal.Now.zonedDateTimeISO().epochMilliseconds.toString())) //...but not in the future
    expect(entry._period).toBe(sameSecond); //technically could fail every 1000 or so runs
    expect(entry.getPoints().length).toBe(0); //points weren't supplied, they aren't generated
    expect(entry._note).toBe(''); //default
    expect(entry._source).toBe(''); //default
    
    /**
     * Create Entry with explicit Points
    */
    let testEntry = pdwRef.newEntry({
        _did: 'aaaa',
        'yyyy': 'Text value', //by _pid
        'Point B': true //by _lbl
    })
    entries = pdwRef.getEntries();
    expect(entries.length).toBe(2);
    entry = entries[1];
    expect(testEntry._did).toBe('aaaa');
    //checking values - the typical, easy way
    expect(entry['yyyy']).toBe('Text value');
    expect(entry['zzzz']).toBe(true);

    /**
     * Entry.getPoints
     */
    //getPoints returns an object with these keys
    let points = entry.getPoints();
    expect(points.length).toBe(2);
    let entryPointObj = points.find(point=>point.pid==='yyyy')!;
    expect(entryPointObj.pointDef._desc).toBe('Test point desc');
    expect(entryPointObj.pid).toBe('yyyy');
    expect(entryPointObj.lbl).toBe('Point A');
    expect(entryPointObj.val).toBe('Text value');

    /**
     * Entry.getPoint with pid and with lbl
     */
    //getPoint returns the same keys, but for only the point specified by pid or lbl
    expect(entry.getPoint('yyyy')).toEqual(entryPointObj);
    expect(entry.getPoint('yyyy')).toEqual(entry.getPoint('Point A'));

    /**
     * Entry.getPoint for a non-existnt point
     */
    expect(entry.getPoint('zzzz not real')).toBeUndefined();
    
    /**
    * Full Entry Creation    
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
    expect(pdwRef.getEntries().length).toBe(3);
    testEntry = testDef.newEntry({});
    expect(pdwRef.getEntries().length).toBe(4);
    expect(testEntry._did).toBe('aaaa');

    /**
     * Create entry with bad point value types
     */
    expect(() => pdwRef.newEntry({
        _did: 'aaaa',
        'yyyy': { 'an': 'Object is implicitly coerced to string but...' },
        'zzzz': { '...this bool': 'should fail' }
    })).toThrowError();

    /**
     * Create entry with bad EntryPoint ID
     */
    expect(() => {
        pdwRef.newEntry({
            _did: 'aaaa',
            'bbbb': { 'a': 'non-existant pointDef value' }
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
    expect(testDayEntry.getPoint('rvew')!.val).toBe(10)

    /**
     * Specified period with correct scope
     */
    testDayEntry = dayScopeDef.newEntry({
        _period: '2023-06-03'
    })
    expect(testDayEntry._period).toBe('2023-06-03');

    /**
     * Scope too granular, zooms out to correct level
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
     * OPTS
     */
    let defWithOpts = pdwRef.newDef({
        _did: 'bbbb',
        _pts: [
            {
                _pid: 'b111',
                _lbl: 'Select Point',
                _type: pdw.PointType.SELECT,
                _opts: [
                    {
                        _oid: 'bbb1',
                        _lbl: 'Opt 1'
                    },
                    {
                        _oid: 'bbb2',
                        _lbl: 'Opt 2'
                    }
                ]
            }
        ]
    })
    /**
     * Basic creation of entry with a Select
     */
    let entryWithOpts = defWithOpts.newEntry({
        _note: 'Setting Opt 1',
        'b111': 'bbb1' //weird, but how it has to work
    })
    expect(entryWithOpts.getPoint('Select Point')?.val).toBe('bbb1');
    expect(entryWithOpts.getPoint('b111')?.pointDef.getOpt('bbb1')?._lbl).toBe('Opt 1');
    
    /**
     * Select Opts are not validated! It's not worth doing.
     * Just check that the result is defined when running pointDef.getOpt()
     */
    entryWithOpts = defWithOpts.newEntry({
        _note: 'Setting Non-existant opt',
        'b111': 'fake oid'
    })
    let point = entryWithOpts.getPoint('b111')!;
    expect(point.val).toBe('fake oid'); //no errors thrown
    expect(point.pointDef.getOpt('fake oid')).toBeUndefined(); //is undefined

    let defWithMultiselect = pdwRef.newDef({
        _did: 'cccc',
        _pts: [
            {
                _pid: 'c111',
                _type: pdw.PointType.MULTISELECT,
                _opts: [
                    {
                        _oid: 'ccc1',
                        _lbl: 'One',
                    },
                    {
                        _oid: 'ccc2',
                        _lbl: 'Two',
                    }
                ]
            }
        ]
    })
    let none = defWithMultiselect.newEntry({
        'c111': []
    });
    let one = defWithMultiselect.newEntry({
        'c111': ['ccc1']
    });
    let both = defWithMultiselect.newEntry({
        'c111': ['ccc1','ccc2']
    });
    expect(none.getPoint('c111')?.val).toEqual([]);
    expect(one.getPoint('c111')?.val).toEqual(['ccc1']);
    expect(both.getPoint('c111')?.val).toEqual(['ccc1', 'ccc2']);
})

test('Tag Basics', () => {
    resetTestDataset();

    pdwRef.newDef({
        _did: 'aaaa',
        _lbl: 'for tagging'
    })

    /**
     * PDW.newTagDef
     */
    let tagA = pdwRef.newTag({
        _lbl: 'test tag',
        _tid: 'taga'
    })
    let tag = pdwRef.getTags()[0]
    expect(tag).toEqual(tagA);
    expect(tag._lbl).toBe('test tag');
    expect(tag._tid).toBe('taga');
    expect(tag._dids).toEqual([]);
    expect(pdw.Tag.isTagLike(tag)).toBe(true);
    
    let tagB = pdwRef.newTag({
        _lbl: 'tag with content!',
        _tid: 'tagb',
        _dids: ['aaaa']
    })
    expect(tagB._dids).toEqual(['aaaa']);
    expect(tagB.getDefs().length).toBe(1);
    expect(tagB.getDefs()[0]._lbl).toBe('for tagging');
    
    let tagC = pdwRef.newTag({
        _dids: ['zzzz']
    })
    expect(tagC._dids).toEqual(['zzzz']); //non-existant _dids may live amongst your _dids
    //... I guess there's not a lot else to them outside of updates
});

test('Update Logic', () => {
    resetTestDataset();
    
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
            },
            {
                _pid: 'a222',
                _lbl: 'Def 1 point 2',
                _desc: 'Numero Dos'
            }
        ]
    });

    /**
     * Element.deleteAndSave()
     */
    firstDef.deleteAndSave() as pdw.Def;
    expect(firstDef._deleted).toBe(true);
    expect(pdwRef.getDefs({ includeDeleted: 'yes' }).length).toBe(1);
    expect(pdwRef.getDefs({ includeDeleted: 'only' }).length).toBe(1); //WHAT? 
    /**
     * note to self here - the above line works if ONLY THIS TEST is being run, 
     * but BREAKS if any other test swuit is being run... and for some reason it's *just* this line.
     */
    expect(pdwRef.getDefs({ includeDeleted: 'no' }).length).toBe(0);
    //doing element.toData because __tempUpdated is 1 millisecond off & toData nukes metaproperties
    expect(pdw.Element.toData(pdwRef.getDefs({ includeDeleted: 'only' })[0])).toEqual(pdw.Element.toData(firstDef));

    /**
     * Element.unDeleteAndSave()
     */
    firstDef.unDeleteAndSave() as pdw.Def;
    expect(firstDef._deleted).toBe(false);
    expect(pdwRef.getDefs({ includeDeleted: 'yes' }).length).toBe(1);
    expect(pdwRef.getDefs({ includeDeleted: 'only' }).length).toBe(0);
    expect(pdwRef.getDefs({ includeDeleted: 'no' }).length).toBe(1);

    /**
     * Update Props, don't save yet
     */
    firstDef.setProps({ _lbl: 'DEF ONE' });
    expect(firstDef._lbl).toBe('DEF ONE');
    let unmodified = pdwRef.getDefs()[0];
    expect(unmodified._lbl).toBe('Def 1');
    expect(pdwRef.getDefs({ includeDeleted: 'yes' }).length).toBe(1); //DataStore not changed yet

    /**
     * Save to DataStore after updating
     */
    firstDef.save();
    expect(pdwRef.getDefs({ includeDeleted: 'yes' }).length).toBe(2);
    expect(pdwRef.getDefs({ includeDeleted: 'no' }).length).toBe(1);
    let defs = pdwRef.getDefs({ did: 'aaaa', includeDeleted: 'yes' });
    expect(defs.length).toBe(2);
    expect(defs.find(def => def._deleted)!._lbl).toBe('Def 1'); //deleted one unchanged
    expect(defs.find(def => !def._deleted)!._lbl).toBe('DEF ONE'); //new one reflects change

    /**
     * Set a few props & save
     */
    firstDef.setProps({ _desc: 'New Description', _emoji: '🧠' }).save() as pdw.Def;
    expect(pdwRef.getDefs({ did: 'aaaa', includeDeleted: 'yes' }).length).toBe(3);
    expect(pdwRef.getDefs({ did: 'aaaa', includeDeleted: 'no' }).length).toBe(1);
    let fromStore: any = pdwRef.getDefs({ did: 'aaaa', includeDeleted: 'no' })[0];
    // expect(modified).toEqual(fromStore); //_tempUpdated is slightly off? Weird.
    expect(firstDef._updated).toEqual(fromStore._updated);
    expect(fromStore._desc).toBe("New Description");
    expect(fromStore._emoji).toBe("🧠");
    let overwritenFromStore = pdwRef.getDefs({ did: 'aaaa', includeDeleted: 'only' });
    expect(overwritenFromStore.length).toBe(2);
    expect(overwritenFromStore[0]._desc).toBe('Def Desc');
    expect(overwritenFromStore[0]._emoji).toBe("🆕");
    expect(overwritenFromStore[1]._desc).toBe('Def Desc');
    expect(overwritenFromStore[1]._emoji).toBe("🆕");

    /**
     * Set single prop - calls "setProps" internally
     */
    firstDef.setProp('_lbl', 'New Label');
    expect(firstDef._lbl).toBe('New Label');

    /**
     * setting no props doesn't change datastore
     */
    expect(pdwRef.getDefs({ includeDeleted: 'yes' }).length).toBe(3);
    firstDef.setProps({});
    expect(pdwRef.getDefs({ includeDeleted: 'yes' }).length).toBe(3);

    /**
     * Cannot set ID-like props
    */
    firstDef.setProps({ _did: 'bbbb' }) as pdw.Def; //should log warning about not updating ID
    expect(firstDef._did).toBe('aaaa');
    origUid = firstDef._uid;
    firstDef = firstDef.setProps({ _uid: 'whatever' }) as pdw.Def; //should log warning about not updating ID
    expect(firstDef._uid).toBe(origUid);

    /**
     * Data validation for Emoji
     */
    expect(firstDef._emoji).toBe("🧠");
    firstDef.setEmoji("not an emoji");
    expect(firstDef._emoji).toBe("🧠"); //won't update
    firstDef.setProps({_emoji: 'also not an emoji'}); //setProps forwards to setEmoji
    expect(firstDef._emoji).toBe("🧠"); 
    firstDef.setEmoji("🌭");
    expect(firstDef._emoji).toBe("🌭"); //does work, though

    /**
     * Data validation for _updated & _created
     */
    let stringDate = '2023-07-22T15:55:27'; //plaindatetime string
    firstDef.setProps({_created: stringDate});
    expect(firstDef._created).toBe('lkehoqoo') //lkehoqoo is right
    //console.log(pdw.parseTemporalFromEpochStr('lkehoqoo').toPlainDateTime().toString());
    let date = new Date();
    //firstDef.setProps({_created: date}); //also works, but difficult to prove again and again

    //#### Updating PointDef stuff ####
    /**
     * Def.setPointProps()
     */
    let def = pdwRef.getDefs({ did: 'aaaa' })[0];
    def.setPointProps('a111', { _desc: 'Updated Description' })
    expect(def.getPoint('a111')._desc).toBe('Updated Description');
    fromStore = pdwRef.getDefs({ did: 'aaaa', includeDeleted: 'no' })[0];
    expect(fromStore.getPoint('a111')._desc).toBe('Point Desc'); //change isn't saved yet
    def.save();
    fromStore = pdwRef.getDefs({ did: 'aaaa', includeDeleted: 'no' })[0];
    expect(fromStore.getPoint('a111')._desc).toBe('Updated Description'); //change is now saved

    /**
     * PointDef.setProps()
    */
    let point = def.getPoint('a111');
    point.setProps({ _desc: 'Updated Description Again' });
    expect(def.getPoint('a111')._desc).toBe('Updated Description Again');
    //would need to save() to save changes to DataStore

    /**
     * PointDef.setProp - calls setProps() internally
     */
    point.setProp('_desc', 'Updated again again');
    expect(point._desc).toBe('Updated again again');

    /**
     * Data Validation on PointDef.setProps on emoji, rollup, and type
     */
    expect(point._emoji).toBe('🆕');
    point.setProps({_emoji: 'Invalid emoji'})
    expect(point._emoji).toBe('🆕'); //no change
    expect(point._rollup).toBe(pdw.Rollup.COUNT);
    //@ts-expect-error - typescript warning, nice
    point.setProps({_rollup: 'Invalid rollup'})
    expect(point._rollup).toBe(pdw.Rollup.COUNT); //no change
    expect(point._type).toBe(pdw.PointType.TEXT);
    //@ts-expect-error - typescript warning, nice
    point.setProps({_type: 'Invalid type'})
    expect(point._type).toBe(pdw.PointType.TEXT); //no change

    /**
     * Def.deactivatePoint()
     */
    expect(def._pts.length).toBe(2);
    expect(def._pts.filter(p => p._active).length).toBe(2);
    def.deactivatePoint('a222');
    expect(def._pts.length).toBe(2); //still got 2
    expect(def._pts.filter(p => p._active).length).toBe(1); //but only 1 is active
    point = def.getPoint('a111');
    def.deactivatePoint(point);
    expect(def._pts.length).toBe(2); //still got 2
    expect(def._pts.filter(p => p._active).length).toBe(0); //but neither is active
    expect(def.getPoint('a111')._lbl).toBe('Def 1 point 1'); //inactive points can still be got
    expect(def.getPoint('a222')._active).toBe(false); //...they're just inactive
    //would need to save() to save changes to DataStore

    /**
     * Def.reactivatePoint()
     */
    expect(def._pts.length).toBe(2);
    expect(def._pts.filter(p => p._active).length).toBe(0);
    def.reactivatePoint('a222');
    expect(def._pts.length).toBe(2); //still got 2
    expect(def._pts.filter(p => p._active).length).toBe(1); //but 1 is active again
    //would need to save() to save changes to DataStore

    /**
     * Def.newPoint()
     */
    expect(def._pts.length).toBe(2);
    expect(def._pts.filter(p => p._active).length).toBe(1);
    def.addPoint({_desc: '3rd Point', _pid: 'a333', _type: pdw.PointType.SELECT});
    expect(def._pts.length).toBe(3);
    expect(def._pts.filter(p => p._active).length).toBe(2);
    expect(def.getPoint('a333')._desc).toBe('3rd Point');
    def.save();

    /**
     * Opts
     */
    let optsPoint = def.getPoint('a333');
    expect(optsPoint.shouldHaveOptsProp()).toBe(true);
    optsPoint.addOpt('Option 1', 'o111'); //specified _oid
    expect(optsPoint._opts?.length).toBe(1);
    optsPoint.addOpt('Option 2'); //unspecified _oid => one is made for it
    expect(optsPoint._opts?.length).toBe(2);
    optsPoint.addOpt('Option 3', 'o333'); //needed for later
    optsPoint.setOpt('o111','New Title');
    expect(optsPoint.getOpt('o111')?._lbl).toBe('New Title'); //get by opt._oid
    expect(optsPoint.getOpt('Option 2')?._lbl).toBe('Option 2'); //get by opt._lbl
    optsPoint.removeOpt('Option 2');
    optsPoint.setOpt('o333', 'New Option 2'); //a common real world use case, I imagine
    expect(optsPoint._opts!.length).toBe(2);
    expect(optsPoint._opts![0]._lbl).toBe('New Title');

    /**
     * Entries
     */
    let entry = pdwRef.newEntry({
        _did: def._did,
        'a333': 'o111',
        'a222': 'Point value'
    });

    /**
     * Base entry props updating
     */
    expect(entry._note).toBe('');
    expect(entry['a222']).toBe('Point value');
    entry.setProps({_note: 'Added note', _source: 'Test procedure'});
    expect(entry._note).toBe('Added note');
    expect(entry._source).toBe('Test procedure');
    expect(entry['a222']).toBe('Point value');

    entry.setProps({_period: '2023-07-21T14:04:33'});
    expect(entry._period).toBe('2023-07-21T14:04:33');
    let updated = pdwRef.getEntries()[0];
    expect(updated._note).toBe(''); //store not updated yet
    entry.save(); //update stored entry
    updated = pdwRef.getEntries({includeDeleted: 'no'})[0];
    expect(updated._note).toBe('Added note'); //store updated with new entry
    expect(updated['a222']).toBe('Point value'); //point is retained
    let original = pdwRef.getEntries({includeDeleted: 'only'})[0];
    expect(original._note).toBe(''); //original entry retained unchanged
    expect(original._uid !== updated._uid).toBe(true); //uid is different
    expect(original._eid === updated._eid).toBe(true); //eid is the same

    /**
     * Entry Point Values
     */
    entry.setPointVals([
        {'a333': 'o333'},
        {'a222': 'Other point new value!'}
    ]);
    expect(entry.getPoint('a222')!.val).toBe('Other point new value!');
    expect(entry.getPoint('a333')!.val).toBe('o333');
    //or set one at a time:
    entry.setPointVal('a333','o111');
    expect(entry.getPoint('a333')!.val).toBe('o111');

    /**
     * Multiselect Opts
     */
    def.addPoint({
        _pid: 'a444',
        _lbl: 'Multiselect Test',
        _type: pdw.PointType.MULTISELECT,
        _opts: [
            {
                _lbl: 'A',
                _oid: 'aaaa'
            },
            {
                _lbl: 'B',
                _oid: 'bbbb'
            }
        ]
    }).save(); //must save to make the new point available to new entries
    entry = def.newEntry({
        'a444': []
    });
    expect(entry.getPoint('Multiselect Test')!.val).toEqual([]);
    entry.setPointVal('a444',['aaaa','bbbb']); //change multiselect selections
    expect(entry.getPoint('Multiselect Test')!.val).toEqual(['aaaa','bbbb']); //works
    entry.setPointVal('a444','aaaa, bbbb, cccc'); //can also just have comma-delimited string
    expect(entry.getPoint('Multiselect Test')!.val).toEqual(['aaaa','bbbb','cccc']); //works, doesn't care about the non-existant 'cccc' opt
    entry.setPointVal('a444','aaaa,bbbb'); //spacing on a comma-delimited string is ignored
    expect(entry.getPoint('Multiselect Test')!.val).toEqual(['aaaa','bbbb']); //works
    entry.setPointVal('a444','aaaa'); //and a single string value is converted to an array
    expect(entry.getPoint('Multiselect Test')!.val).toEqual(['aaaa']); //works
    
    /**
     * Entry Period scope protection
     */
    entry.setProps({_period: '2023-07-21'});
    expect(entry._period).toBe('2023-07-21T00:00:00');

    let tag = pdwRef.newTag({
        _tid: 'taga',
        _lbl: 'My tag',
        _dids: []
    });
    tag.setProp('_dids',[def._did]);
    expect(tag._dids).toEqual([def._did]);
    fromStore = pdwRef.getTags()[0];
    expect(fromStore._dids).toEqual([]); //stores not updated yet.
    tag.save();
    fromStore = pdwRef.getTags()[0];
    expect(fromStore._dids).toEqual([def._did]); //now it is

    let tagTwo = pdwRef.newTag({
        _tid: 'tagb',
        _lbl: 'Other tag'
    })
    /**
     * Adding and removing defs
     */
    tagTwo.addDef(def); //by def ref
    expect(tagTwo._dids).toEqual([def._did]);
    tagTwo.removeDef(def); //by def ref
    expect(tagTwo._dids).toEqual([]);
    tagTwo.addDef(def._did); //by _did
    expect(tagTwo._dids).toEqual([def._did]);
    tagTwo.addDef(def._did); //adding the same did doesn't create a duplicate entry
    expect(tagTwo._dids).toEqual([def._did]); 
    tagTwo.removeDef(def._did); //by _did
    expect(tagTwo._dids).toEqual([]);

    /**
     * Tagging Def *from the Def*
     */
    def.addTag(tagTwo); //by tag ref
    expect(tagTwo.getDefs()[0]._lbl).toBe(def._lbl);
    def.removeTag(tagTwo); //by tag ref
    expect(tagTwo.getDefs().length).toBe(0);
    
    def.addTag(tagTwo._tid); //by tid
    tagTwo = pdwRef.getTags({tid: 'tagb'})[0]; //updated tag object is in stores
    expect(tagTwo.getDefs()[0]._lbl).toBe(def._lbl);
    
    def.removeTag(tagTwo._tid); //by tid
    tagTwo = pdwRef.getTags({tid: 'tagb'})[0];
    expect(tagTwo.getDefs().length).toBe(0);
    
    def.addTag(tagTwo._lbl); //by tag label
    expect(tagTwo.getDefs()[0]._lbl).toBe(def._lbl);
    tagTwo = pdwRef.getTags({tid: 'tagb'})[0];

    def.removeTag(tagTwo._lbl); //by tag label
    tagTwo = pdwRef.getTags({tid: 'tagb'})[0];
    expect(tagTwo.getDefs().length).toBe(0);

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
import { StorageConnector, QueryParams, FullManifest, FullEntry } from './PDW-Lib'

export class MongoConnector implements StorageConnector {

    getEntries(params: QueryParams): FullEntry | FullEntry[] {
        throw new Error('Method not implemented.');
    }
    setEntries(entries: FullEntry[], forceUpdate?: boolean) {
        console.log('test');
        throw new Error('Method not implemented.');
    }

    /**
     * Currently returning fake data, will hit the API
     */
    async getManifests(): Promise<FullManifest[]> {
        //const data = await http<FullManifest[]>('https://lifeline-journal.glitch.me/api/getManifests')
        console.log("WHere this be?")
        const data = await new Promise((resolve, _reject) => setTimeout(() => resolve([
            {
                "_emoji": "📝",
                "_tags": [],
                "_scope": "time",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "Value",
                        "_emoji": "📝",
                        "_type": "text",
                        "_desc": "The note itself.",
                        "_rollup": "count",
                        "_format": "@"
                    },
                    {
                        "_pid": "2",
                        "_label": "Tag",
                        "_emoji": "🏷",
                        "_type": "text",
                        "_desc": "The contextualizing tag for the note. ",
                        "_rollup": "count",
                        "_format": "@"
                    }
                ],
                "_id": "5f4ac83dc099fd6e3234e6ba",
                "_mid": "1",
                "_first": "2020-08-30T00:00:00.000Z",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_label": "Events",
                "_desc": "Generic note about something that happened. Tagged with a contextualizing tag."
            },
            {
                "_emoji": "🎬",
                "_tags": [
                ],
                "_scope": "time",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "Movie",
                        "_format": "@",
                        "_emoji": "🎬",
                        "_type": "text",
                        "_rollup": "count",
                        "_desc": "The name of the movie"
                    },
                    {
                        "_pid": "2",
                        "_label": "New",
                        "_format": "yes/no",
                        "_emoji": "🆕",
                        "_type": "text",
                        "_rollup": "count yes/no",
                        "_desc": "Is this my first time seeing the movie?"
                    }
                ],
                "_id": "5f4c1c8aab08355400f61904",
                "_mid": "2",
                "_first": "2020-08-30T00:00:00.000Z",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_desc": "A movie I watched",
                "_label": "Movies"
            },
            {
                "_emoji": "📺",
                "_tags": [
                ],
                "_scope": "time",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "Show",
                        "_format": "@",
                        "_emoji": "📺",
                        "_type": "text",
                        "_rollup": "count",
                        "_desc": "The name of the show."
                    }
                ],
                "_id": "5f66d255d549336a84f34600",
                "_label": "Television",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_first": "2020-08-30T00:00:00.000Z",
                "_desc": "Television watched.",
                "_mid": "3"
            },
            {
                "_emoji": "👀",
                "_tags": [

                ],
                "_scope": "day",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "Summary",
                        "_format": "@",
                        "_emoji": "📓",
                        "_type": "text",
                        "_rollup": "count",
                        "_desc": "A summary of the day."
                    },
                    {
                        "_pid": "2",
                        "_label": "Health Status",
                        "_format": "#",
                        "_emoji": "🌡",
                        "_type": "number",
                        "_rollup": "average",
                        "_desc": "1 - Almost dying. 10 - perfectly healthy"
                    },
                    {
                        "_pid": "3",
                        "_label": "Satisfaction",
                        "_format": "#",
                        "_emoji": "😃",
                        "_type": "number",
                        "_rollup": "average",
                        "_desc": "1 - horrible day, 10 - perfect day"
                    },
                    {
                        "_pid": "4",
                        "_label": "Challenge",
                        "_format": "@",
                        "_emoji": "🎯",
                        "_type": "text",
                        "_rollup": "count",
                        "_desc": "What I did to adhere to my 30 Day Challenge."
                    }
                ],
                "_id": "5f66d4dfd549336a84f34602",
                "_label": "Nightly Review",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_first": "2020-08-30T00:00:00.000Z",
                "_desc": "A nightly reflection on the day.",
                "_mid": "4"
            },
            {
                "_emoji": "🎮",
                "_tags": [],
                "_scope": "time",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "Game",
                        "_format": "@",
                        "_emoji": "🎮",
                        "_type": "text",
                        "_rollup": "count",
                        "_desc": "The name of the game."
                    }
                ],
                "_id": "5f67a44d782c7233c6615217",
                "_label": "Videogames",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_first": "2020-08-30T00:00:00.000Z",
                "_desc": "Played a videogame.",
                "_mid": "5"
            },
            {
                "_emoji": "📖",
                "_tags": [],
                "_scope": "time",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "Book",
                        "_emoji": "📖",
                        "_type": "text",
                        "_desc": "The name of the book.",
                        "_rollup": "count distinct",
                        "_format": "@",
                    }
                ],
                "_id": "5f67aa2ba582df363f4180eb",
                "_mid": "6",
                "_first": "2020-08-30T00:00:00.000Z",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_label": "Books",
                "_desc": "Spent some time reading a book (or listening, whatever)."
            },
            {
                "_emoji": "🗺",
                "_tags": [],
                "_scope": "day",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "sleep location",
                        "_format": "@",
                        "_emoji": "🗺",
                        "_type": "text",
                        "_rollup": "count distinct",
                        "_desc": "The name of the city I slept in."
                    }
                ],
                "_id": "5f6864968fc70a10e2b4067b",
                "_label": "Sleep Locations",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_first": "2020-08-30T00:00:00.000Z",
                "_desc": "A proxy for travel. Automatically tracked by Shortcuts each night.",
                "_mid": "7"
            },
            {
                "_emoji": "⏳",
                "_tags": [],
                "_scope": "time",
                "_active": false,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "Usage",
                        "_emoji": "⚡",
                        "_type": "text",
                        "_desc": "How I used my time.",
                        "_rollup": "count",
                        "_format": "@"
                    }
                ],
                "_id": "5f688d9317b16500aa513bd0",
                "_mid": "8",
                "_first": "2020-08-30T00:00:00.000Z",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_label": "Power Hour",
                "_desc": "My daily quadrant 2 work."
            },
            {
                "_emoji": "🤕",
                "_tags": [],
                "_scope": "time",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "Pains",
                        "_format": "list",
                        "_emoji": "🤕",
                        "_type": "list",
                        "_rollup": "count",
                        "_desc": "Things that hurt."
                    },
                    {
                        "_pid": "2",
                        "_label": "Treatments",
                        "_format": "list",
                        "_emoji": "💊",
                        "_type": "list",
                        "_rollup": "count",
                        "_desc": "Things I did to help abate symptoms."
                    }
                ],
                "_id": "5f688dc017b16500aa513bd2",
                "_label": "Pains",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_first": "2020-08-30T00:00:00.000Z",
                "_desc": "Injuries, aches, illnesses, general complaints, and the treatments I used for them.",
                "_mid": "9"
            },
            {
                "_emoji": "🏋️‍♀️",
                "_tags": [
                ],
                "_scope": "time",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "Workout",
                        "_emoji": "🏋️‍♀️",
                        "_type": "text",
                        "_desc": "The name of the workout.",
                        "_rollup": "count",
                        "_format": "@",
                    },
                    {
                        "_pid": "2",
                        "_label": "_tags",
                        "_emoji": "🏃‍♂️",
                        "_type": "list",
                        "_desc": "What did you exercise?",
                        "_rollup": "count",
                        "_format": "list",
                    }
                ],
                "_id": "5f695c0e1069dd18081f87ba",
                "_mid": "10",
                "_first": "2020-08-30T00:00:00.000Z",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_label": "Workouts",
                "_desc": "Intentional exercise. Running. Lifting. Sports. Yoga."
            },
            {
                "_emoji": "😴",
                "_tags": [
                ],
                "_scope": "time",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "Duration",
                        "_format": "#.#",
                        "_emoji": "⌚",
                        "_type": "number",
                        "_rollup": "sum",
                        "_desc": "Time spent napping, in hours."
                    }
                ],
                "_id": "5f6bb30359ba660e496e6950",
                "_label": "Naps",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_first": "2020-08-30T00:00:00.000Z",
                "_desc": "Naps and midday sleeps.",
                "_mid": "11"
            },
            {
                "_emoji": "✅",
                "_tags": [
                ],
                "_scope": "day",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "Completions",
                        "_format": "#",
                        "_emoji": "🔢",
                        "_type": "text",
                        "_rollup": "count",
                        "_desc": "Number of reminders completed."
                    },
                    {
                        "_pid": "2",
                        "_label": "taskarray",
                        "_format": "(hide)",
                        "_emoji": "✔",
                        "_type": "json",
                        "_rollup": "count",
                        "_desc": "JSON Object containing array of Reminders."
                    }
                ],
                "_id": "5f6c26a7435cbc0217ab1b32",
                "_label": "Reminders Completed",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_first": "2020-08-30T00:00:00.000Z",
                "_desc": "Daily reminders completed",
                "_mid": "12"
            },
            {
                "_emoji": "💬",
                "_tags": [],
                "_scope": "time",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "Quote",
                        "_emoji": "💬",
                        "_type": "text",
                        "_desc": "The saying.",
                        "_rollup": "count",
                        "_format": "@"
                    },
                    {
                        "_pid": "2",
                        "_label": "Quoter",
                        "_emoji": "🙊",
                        "_type": "text",
                        "_desc": "The sayer.",
                        "_rollup": "count distinct",
                        "_format": "@"
                    }
                ],
                "_id": "5f6cbdeeb906d30102f56f29",
                "_mid": "13",
                "_first": "2020-08-30T00:00:00.000Z",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_label": "Quotes",
                "_desc": "Good quotes."
            },
            {
                "_emoji": "👾",
                "_tags": [
                ],
                "_scope": "day",
                "_active": false,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "Streaks",
                        "_emoji": "📃",
                        "_type": "json",
                        "_desc": "The Streaks Object.",
                        "_rollup": "count",
                        "_format": "(hide)"
                    },
                    {
                        "_pid": "2",
                        "_label": "Busted",
                        "_emoji": "❌",
                        "_type": "text",
                        "_desc": "The number of streaks broken today.",
                        "_rollup": "count",
                        "_format": "#"
                    }
                ],
                "_id": "5f6ec9ad93f8ed0224ee6a48",
                "_mid": "14",
                "_first": "2020-08-30T00:00:00.000Z",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_label": "Streaks",
                "_desc": "Streaks app daily results."
            },
            {
                "_emoji": "👨‍🦳",
                "_tags": [
                ],
                "_scope": "time",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "Who",
                        "_format": "@",
                        "_emoji": "👨‍👨‍👦‍👦",
                        "_type": "text",
                        "_rollup": "count",
                        "_desc": "Who we saw."
                    }
                ],
                "_id": "5f710988fea626011abd081c",
                "_label": "Saw Family",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_first": "2020-08-30T00:00:00.000Z",
                "_desc": "Saw family members.",
                "_mid": "15"
            },
            {
                "_emoji": "🍔",
                "_tags": [
                ],
                "_scope": "time",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "Where",
                        "_format": "@",
                        "_emoji": "🍴",
                        "_type": "text",
                        "_rollup": "count",
                        "_desc": "The name of the place you ate at."
                    }
                ],
                "_id": "5f7134647dc47b0143d84b83",
                "_label": "Eating Out",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_first": "2020-08-30T00:00:00.000Z",
                "_desc": "Eating food you bought ready to eat at a restaurant.",
                "_mid": "16"
            },
            {
                "_emoji": "🙏",
                "_tags": [
                ],
                "_scope": "time",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "Who",
                        "_format": "list",
                        "_emoji": "🤼",
                        "_type": "text",
                        "_rollup": "count",
                        "_desc": "Who I hung out with."
                    }
                ],
                "_id": "5f74086b8b32e4009f7be70d",
                "_label": "Saw Friends",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_first": "2020-08-30T00:00:00.000Z",
                "_desc": "Social experiences. Seeing friends.",
                "_mid": "17"
            },
            {
                "_emoji": "🥤",
                "_tags": [],
                "_scope": "time",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "Drank",
                        "_emoji": "🥤",
                        "_type": "text",
                        "_desc": "The kind of drink I had.",
                        "_rollup": "count",
                        "_format": "@",
                    }
                ],
                "_id": "5f7679f3ec291800a40a634d",
                "_mid": "18",
                "_first": "2020-08-30T00:00:00.000Z",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_label": "Drinks",
                "_desc": "Drank a soda/energy drink/or alcohol"
            },
            {
                "_emoji": "🥰",
                "_tags": [],
                "_scope": "time",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "what",
                        "_emoji": "💏",
                        "_type": "text",
                        "_desc": "What we did for our date. Hopefully something good.",
                        "_rollup": "count",
                        "_format": "@",
                    }
                ],
                "_id": "5f792246e1c295008d14d074",
                "_mid": "19",
                "_first": "2020-08-30T00:00:00.000Z",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_label": "Dates",
                "_desc": "Outings for the benefit of the marriage."
            },
            {
                "_emoji": "🎓",
                "_tags": [
                ],
                "_scope": "time",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "Subject",
                        "_format": "@",
                        "_emoji": "🎒",
                        "_type": "text",
                        "_rollup": "count",
                        "_desc": "What I learned about."
                    }
                ],
                "_id": "5f7a33d7d59b0a00add6ba4b",
                "_label": "Learning",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_first": "2020-08-30T00:00:00.000Z",
                "_desc": "Furthered education with intentional study.",
                "_mid": "20"
            },
            {
                "_emoji": "👨‍👩‍👦‍👦",
                "_tags": [
                ],
                "_scope": "time",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "what",
                        "_format": "@",
                        "_emoji": "🗺",
                        "_type": "text",
                        "_rollup": "count",
                        "_desc": "Where we went on the outing."
                    }
                ],
                "_id": "5f7e51821d81ef007e9bcebb",
                "_label": "Outings with Kids",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_first": "2020-08-30T00:00:00.000Z",
                "_desc": "Outings for the benefits of the children.",
                "_mid": "21"
            },
            {
                "_emoji": "🆕",
                "_tags": [
                ],
                "_scope": "time",
                "_active": true,
                "_points": [
                    {
                        "_pid": "1",
                        "_label": "value",
                        "_format": "@",
                        "_emoji": "🆕",
                        "_type": "text",
                        "_rollup": "count",
                        "_desc": "The thing you did or saw that was new."
                    }
                ],
                "_id": "5f8052772b5515006738310e",
                "_label": "New Experiences",
                "_latest": "2020-08-30T00:00:00.000Z",
                "_first": "2020-08-30T00:00:00.000Z",
                "_desc": "New experiences. Exploration. The spice of life.",
                "_mid": "22"
            }
        ]
        ), 500));
        return data as FullManifest[];
    }
    async setManifests(manifests: FullManifest | FullManifest[]) {
        throw new Error('Method not implemented.');
    }

}

export async function http<T>(
    request: RequestInfo
): Promise<T> {
    const response = await fetch(request);
    const body = await response.json();
    return body;
}
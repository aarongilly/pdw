---
status: proposed
date: 2024-09-11
---
#TODO - decide for sure on this.

# All Entries are at the Lowest-Level Scope

## Context and Problem Statement

When the decision was made to remove the 1:1 relationship between `Entry` a corresponding `Def`, it no longer became natural to have the `_scope` of `Entry._period` be constrained by any given `Def`. Yet a the concept of *when* an `Entry` takes place is essential to the entire system.

## Decision Drivers

* Consistency & simplicity - the fewest rules & exceptions possible
* Coverage of use cases
* Continued support of varying levels of granularity

## Considered Options

* All `Entry`s are at the lowest-level scope.
* `Entry` may have any scope, and its contained points are constrained by their `Def._scope`
* `Entry` may have any scope, and conflicts between `Def._scope` and `Entry._period` are managed after the fact 
* `Entry._period` is broken into `Entry._date` and `Entry._time`
* `Entry._period` is broken into `Entry._date` and time is completely disregarded

## Decision Outcome

Chosen option: "{title of option 1}", because {justification. e.g., only option, which meets k.o. criterion decision driver | which resolves force {force} | … | comes out best (see below)}.

<!-- This is an optional element. Feel free to remove. -->
### Consequences

* Good, because {positive consequence, e.g., improvement of one or more desired qualities, …}
* Bad, because {negative consequence, e.g., compromising one or more desired qualities, …}
* … <!-- numbers of consequences can vary -->

### Confirmation

Something like:

```javascript
const allEntries = getAllEntriesMethod();
const hasHigherPeriods = allEntries.some(entry=>secondIsProperlyFormatted(entry._period))
expect(hasHigherPeriods).toBe(false);

function secondIsProperlyFormatted(secondStr){
    return /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d/i.test(secondStr)
}
```

## Pros and Cons of the Options

### {title of option 1}

<!-- This is an optional element. Feel free to remove. -->
{example | description | pointer to more information | …}

* Good, because {argument a}
* Good, because {argument b}
<!-- use "neutral" if the given argument weights neither for good nor bad -->
* Neutral, because {argument c}
* Bad, because {argument d}
* … <!-- numbers of pros and cons can vary -->

### {title of other option}

{example | description | pointer to more information | …}

* Good, because {argument a}
* Good, because {argument b}
* Neutral, because {argument c}
* Bad, because {argument d}
* …

<!-- This is an optional element. Feel free to remove. -->
## More Information

{You might want to provide additional evidence/confidence for the decision outcome here and/or document the team agreement on the decision and/or define when/how this decision the decision should be realized and if/when it should be re-visited. Links to other decisions and resources might appear here as well.}
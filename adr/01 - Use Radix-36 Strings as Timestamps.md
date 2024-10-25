---
status: accepted
date: 2024-08-21
---

# Use Radix-36 Strings as Timestamps

## Context and Problem Statement

Elements in the PDW need to be timestamped with absolute references to *when* they were created & updated to enable data merging and general maintenance. Also PDW is meant to be uncoupled from and not bound to any **one** data tool. Different data tools approach timestamps differenty from one-another, and often are in conflict. Notably, Microsoft Excel causes problems with both storing timestamps as human-readable text dates and storing them as large numbers. A solution is needed to ensure a consistent canonical data model can be maintained without interpretation errors. The timestamp needs to be alphabetically sortable and relatively short. Also there is a desire for a lightweight solution that does not necessitate including large chunks of code for handling timestamping.


## Decision Drivers

* Unambiguous
* Portable
* Tooling-independent 
* Consistent
* Sortable

## Considered Options

* Radix-36 Strings
* ISO-8601 Strings ending with "Z"
* ISO-8601 Strings ending with Timezone

## Decision Outcome

Chosen option: "Radix-36 Strings", because it is completely platform-independent and requires the same standard approach regardless of the tool being used. It is not interpreted by *any* tool as a date, therefore *every* tool will require translation into & out of.

### Consequences

* Good, because they are portable, sortable, and consistent due to their tooling-independence
* Bad, because they are not human-readable
* Good, because they can be unambiguously to/from Dates with a single line of JS

## Pros and Cons of the Options

### Radix-36 Strings

See Consequences, above.

### ISO-8601 Strings ending with "Z"

* Good, because they are sortable and consistent
* Good, because they are an ISO Standard
* Neutral, because they are human-readable-*ish*
* Bad, because they introduce timezone issues when the "Z" is imporperly handled
* Bad, because *some* tools recognize them while others don't leading to inconsistency

### ISO-8601 Strings ending with Timezone

* Good, because they are human-readable and consistent
* Good, because they are an ISO Standard
* Bad, because they are not sortable - **reason for rejection**
* Bad, because they introduce timezone issues when the timezone suffix is imporperly handled
* Bad, because *some* tools recognize them while others don't leading to inconsistency

## More Information
The two lines of JavaScript necessary to translate in both directions.

```javascript
function makeEpochStrFrom(stringOrDate: string | Date): EpochStr | undefined {
    return new Date(stringOrDate).getTime().toString(36);
}


function parseDateFromEpochStr(epochStr: EpochStr): Date {
    return new Date(parseInt(epochStr, 36)) 
}
```
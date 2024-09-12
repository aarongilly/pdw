
---
status: accepted
date: 2024-09-11
---

# An Entry may utilize zero or more Defs

## Context and Problem Statement

The original formulation of the PDW used a 1:1 relationship for `Entry`s to `Def`s. An `Entry` was described by a single `Def`. `EntryPoints` were described by the `PointDefs` under that `Def`. This created the need for a 2-level hierarchy, which is not easy to manage via flat-files and introduced a lot of management overhead.

## Considered Options

* An `Entry` may utilize zero or more `Def`s
* An `Entry` has exactly one `Def`, with zero or mor `PointDefs`
* An `Entry` has exactly one `Def`, and the `PointDef` concept is removed

## Decision Outcome

Chosen option: "An `Entry` may utilize zero or more `Def`s", because it enables a consistent approach for all `Entry`s and the ability use very *natural* .csv files for storing, editing, and viewing data. It also removes the need for the common `Entry`-train occurrence where multiple `Entry`s were spawned for the same event *(e.g. New Experience + Ate Out + Went on a Date)*.

### Consequences

* Good, because `Data Journal` now has a simpler, flat structure
* Good, because the core data now lend themselves to PivotTables
* Good, because multiple successive `Entry`s for the same event can now be one
* Bad, because an `Entry` now 
* Bad, because there are strange `Def`s that don't make sense absent others (e.g. "Movie Is Rewatch" without "Movie title")
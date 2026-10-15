# frontend-architecture — rationale

For whoever next changes this skill: why the rules are what they are, which
calls were judgement rather than fact, and what is deliberately absent.

The skill is self-contained. `SKILL.md` carries the rules,
[`examples.md`](examples.md) illustrative good/bad pairs, and
[`enforcement.md`](enforcement.md) the compliance greps. This file is read
only when changing the skill.

## Why it exists

A React app is often already consistent before anything is written down:
private `_components/` folders, fixed `constants.ts` / `helpers.ts` /
`styles.ts` / `index.ts` roles, one query hook per domain, a single typed
fetch client. What it lacks is a stated rule for *when* something moves, so
every session re-derives it. Like `onion-architecture`, this skill is
**descriptive first** — it names the ladder a repo already climbs rather than
importing a layered methodology that would fight the App Router's route tree.

It was written from the official React and Next.js docs, the TanStack Query
docs, Vercel's own composition-patterns rules, and the long-running community
arguments about frontend structure (Bulletproof React, Kent C. Dodds, Dan
Abramov, Josh Comeau, Feature-Sliced Design, and the TanStack Query
maintainer's blog). Where a claim below is surprising or contested, its source
is linked inline.

## Where the rules came from

**The ladder itself** (`distance-equals-consumers`) is Josh Comeau's
promotion path for helpers — a function starts in a component-specific file
and moves to a shared one once a second caller appears — with Kent C. Dodds
supplying the counter-pressure that a thing hoisted before its second consumer
outlives the death of its first, and his AHA principle supplying the timing:
wait until the duplication is obvious.

**The rungs** map onto Next's own colocation and private-folder semantics. The
framework is explicitly unopinionated about project structure and lists both
top-level folders and split-by-feature as valid, so the route tree was chosen
as the feature boundary rather than inventing a second taxonomy beside it.

**Component rules** come from Thinking in React on single responsibility,
Kent C. Dodds on not splitting before you feel the problem, and Vercel's
composition-patterns skill for the boolean-prop and compound-component rules.

**The state decision tree** is react.dev's minimal-state questions and Kent C.
Dodds' colocation ladder, plus the server-cache-versus-UI-state split that
TanStack Query is built around. The no-global-store default follows from the
TanStack position that once async data moves to the query cache, the genuinely
global client state left over is tiny.

**Data and hooks** follow Next's guidance to pick one data approach and its
named reasons to keep fetching client-side, plus the TanStack maintainer's
rules that the query key is a dependency array and that keys belong beside
their queries rather than in a global registry.

**The seam** is Next's server-and-client boundary guide, which is also where
the compound-component hazard and the push-the-directive-to-the-leaves advice
come from.

**Barrels** rest on the TanStack maintainer's
[measurement](https://tkdodo.eu/blog/please-stop-using-barrel-files) that
removing internal barrels took a Next.js project from about 11,000 modules to
3,500, against Comeau's defence of the single-module forwarder. Both are right
about different objects, which is why the skill splits them.

**Testing colocation** is Kent C. Dodds' colocation argument, with Next
confirming tests may live inside `app`.

## The contested calls

Six places where sources genuinely disagreed and the skill had to choose.

1. **Container/presentational.** Abramov
   [retracted it](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0)
   in 2019: "I don't suggest splitting your components like this anymore …
   Hooks let me do the same thing without an arbitrary division." The
   separation survives under other names (Feature-Sliced Design's `ui` and
   `model` segments, Vercel's provider-owns-state rule). **Decided:** ban the
   mechanical file split, keep what it bought.

2. **Folder-by-feature versus flat.** Bulletproof React and Feature-Sliced
   Design prescribe feature trees; Comeau argues categorization is the hard
   part and stays flat; Next takes no side. **Decided:** the route tree is the
   feature boundary, with one flat shared area.

3. **Barrels.** Near-unanimous against aggregating barrels, genuinely split on
   the single-module forwarder. **Decided:** keep single-module forwarders,
   add no aggregators. The weakest-consensus rule in the skill.

4. **Global client store.** TanStack and Kent C. Dodds both hold that most
   global state was never client state; Bulletproof React keeps the menu open.
   **Decided:** no store by default.

5. **How much structure up front.** Next is unopinionated, Feature-Sliced
   Design prescribes seven layers and a linter. **Decided:** encode what the
   repo does, keep the rule count small, prefer mechanically checkable rules.

6. **Custom query hook versus shared `queryOptions`.** A reversal by the same
   author five years apart: "creating a custom hook usually pays off" in 2019,
   then hooks that only wrap `useQuery` "seem a bit pointless" once
   `queryOptions` existed. **Decided:** keep the hook when it adds a transform,
   derived flags or a stable contract.

Two further calls are the skill's own rather than any source's:

- **When a `_components` child graduates to `src/components/`.** "On the second
  consumer" is sourced; a component that is obviously design-system-shaped from
  birth is not. Left as judgement.
- **Whether `page.tsx` should become a Server Component.** Next's direction is
  unambiguous and the mechanics exist, but an app talking to a separate backend
  is Next's explicitly sanctioned
  [External HTTP APIs](https://nextjs.org/docs/app/guides/data-security) shape,
  and two of its named reasons to keep fetching client-side often apply
  (frequently polled data, browser APIs). The skill therefore recommends
  converting shells, not a blanket migration, and treats a client-rendered page
  as accepted debt rather than a defect.

## Deliberately absent

No source consulted covered these, so the skill's rules on them are local
decisions or silent: React Compiler, styling architecture beyond the RSC
zero-runtime constraint, i18n and message placement, accessibility as a
structural concern, cross-package type sharing, error-boundary placement, form
architecture, OpenAPI or client codegen, and WebSocket or SSE transport. A
rule added on any of these is unsourced — label it a local decision. (The
i18n, styling and streaming rules in `SKILL.md` are such local decisions.)

`dependency-cruiser` likewise appears in none of them. The only frontend
import-boundary tooling with support behind it is ESLint (`import/no-cycle`,
`import/no-restricted-paths`, `check-file/*`). Matching a backend tool would
be a local decision.

Out of scope by design: performance guidance (waterfalls, bundle size,
re-renders). Only two structure-adjacent performance rules — barrel imports and
server-to-client serialization — are reflected here.

## Overlap with other guidance

- General React best-practice guidance owns hook misuse, derive-don't-store,
  memoization and re-render cost. **One conflict, resolved in this skill's
  favour:** some of that guidance prescribes "container components fetch data;
  presentational components receive props and render UI". This skill forbids
  the split as a file convention, for the reason in call 1 above, and
  `SKILL.md` states the override in its scope note.
- The framework's own docs own the special-file table, route segments,
  parallel and intercepting routes, async `params`, metadata, image and font
  handling, and the server-component prop-serialization rules. This skill
  covers only what placement needs: which rung a file sits on, and where the
  `"use client"` entry goes.
- [`onion-architecture`](../onion-architecture/SKILL.md) is the backend
  counterpart. A contract change touches both when the contracts are shared
  between frontend and backend.

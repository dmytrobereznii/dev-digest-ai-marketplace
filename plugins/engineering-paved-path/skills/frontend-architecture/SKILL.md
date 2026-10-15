---
name: frontend-architecture
description: >-
  Where code goes in a React web app — components, hooks, constants, helpers,
  state, contracts and the server/client boundary — as a placement ladder
  with stable rule identifiers to cite: code lives beside its only consumer
  and moves up one rung when a second consumer appears. Use when adding to or
  refactoring frontend code, when deciding where a piece of frontend code
  belongs, or when reviewing a frontend change for placement and the
  repository's own architecture docs are silent.
---

# frontend-architecture

A backend is an onion; a web app is a **ladder**. This skill names the rungs
and keeps new code on the lowest one that works. Worked good/bad pairs:
[`examples.md`](examples.md). Greps and lint options for checking compliance:
[`enforcement.md`](enforcement.md). Sources and rationale:
[`references.md`](references.md).

**The repository's own rules come first.** If the repo has an architecture doc
(`ARCHITECTURE.md`, `docs/architecture*`, the frontend section of
`CLAUDE.md` / `AGENTS.md`) or boundary lint rules, read them before this skill
and follow them where the two disagree. This skill is the default model when
the repo says nothing. It is written for a React app with file-system routing
(the reference is the Next.js App Router); in another router, a "route
folder" is the folder that owns one page or screen, and the rules hold.

Scope is *placement* — where code lives and what owns it. Hook misuse,
derive-don't-store and rendering cost belong to general React guidance;
special-file semantics and server-component prop rules to the framework's own
docs. Neither is repeated here.

This skill is not the whole pre-flight. Before building UI, check the repo's
instructions for design references and for whether an in-flight change needs
a spec. Neither is this skill's job; both are easy to skip if its checklist is
treated as the whole list.

**One override.** Some React guidance prescribes a container/presentational
split. This skill forbids it as a file convention (`no-container-view-split`,
§ Components); the pattern's author retracted it and hooks replaced it. On
component structure, this file wins.

Every rule carries a stable identifier in backticks. Cite a rule as
`frontend-architecture → <id>`. The full list is in
[§ Rule identifiers](#rule-identifiers).

## The rule

`distance-equals-consumers` — **Distance equals consumers.** Code lives
beside its only consumer and moves outward exactly one rung when a second
consumer appears — never before.

```
_components/<Name>/  ──▶  route folder  ──▶  src/components · src/lib  ──▶  shared package
   one component           one route            two or more routes          two or more packages
```

"Never before" is the load-bearing half: a helper hoisted ahead of its second
consumer outlives the death of its first, and nothing ever deletes it. Wait
until the duplication is concrete, then move.

`ladder-runs-both-ways` — When a rung-2 component or helper is left with one
consumer, push it back down beside that consumer. When it is left with none,
delete it — a shared thing with no callers is the exact debt the rule exists to
prevent.

## The rungs

The paths are the App Router reference layout; map them onto the repo's own.

| Rung | Lives in | Holds | Promote when |
|---|---|---|---|
| 0 — Component | `app/**/_components/<Name>/` | `<Name>.tsx` plus its own `constants.ts`, `helpers.ts`, `styles.ts`, `index.ts`, tests | a sibling component in the same route needs it |
| 0 — Nested | `<Name>/_components/<Child>/` | a child only `<Name>` renders | a second component renders it |
| 1 — Route | beside `page.tsx`, e.g. `app/orders/[orderId]/` | `constants.ts`, `helpers.ts`, `styles.ts` shared by that route's `_components` | a second route in the segment needs it |
| 1 — Segment | `app/<segment>/_components/<Name>/` | a component shared by routes inside one segment, e.g. `OrderCard` used by `/orders` and `/orders/[id]` | a route outside the segment needs it |
| 2 — App | `src/components/<kebab-name>/`, `src/lib/**` | cross-route components; the API client, query hooks, contexts | a second package needs it |
| 3 — Shared | the design-system package, the shared contracts package | design system, schema contracts | — see § Styling and § Types |

Rung 0 exists because a private folder (`_components` in the App Router) is
opted out of routing: a component can sit inside a route segment without
becoming a URL.

## Where does this code go?

1. Renders UI? → a component at the lowest rung with a consumer. § Components
2. A magic value? → `constants.ts` at that rung. § Constants
3. A pure function over the data being rendered? → `helpers.ts` at that rung.
   § Helpers
4. Calls hooks? → a hook. § Hooks
5. Talks to the API? → § Data
6. A type that crosses the API? → § Types
7. Style? → the repo's styling approach, at that rung. § Styling
8. User-visible copy? → a feature namespace in the message catalog. § Copy

## Components

- `split-on-responsibility` — Split on responsibility, not size, and not
  before you feel the problem. A growing component is cheaper than a premature
  abstraction.
- `one-component-per-file` — One exported component per file, named the same
  as the file and the folder.
- `props-budget` — More than ~7 props, or more than two booleans that
  combine, means the component does too much. Each boolean doubles the state
  space.
- `variants-as-components` — Express variants as explicit components that
  compose shared internals, rather than as boolean flags on one component.
- `children-over-render-props` — Prefer `children` over a `renderX` prop for
  static structure. Keep a render prop where the parent must receive data
  back.
- `no-container-view-split` — **A `*Container.tsx` / `*View.tsx` split is not
  a convention.** What it bought — UI that doesn't know where its state comes
  from — is bought instead by a query hook or a context provider.
- `page-is-composition-root` — A page (`page.tsx`) is a composition root:
  resolve params, call hooks, hand data down. Logic in a page belongs in a
  colocated `_components/` view.

## Constants

- `constants-at-owning-rung` — Component-scoped constants live in that
  component's `constants.ts`, each with a one-line doc comment. `helpers.ts`
  imports from `./constants`; the reverse is a cycle. A constant used by two
  components in one route moves to the route's `constants.ts`. One used by two
  routes moves to `src/lib/`.
- `env-in-one-place` — Only the framework's public-prefixed environment
  variables (for example `NEXT_PUBLIC_`) reach the browser. Read each one in a
  single module (typically the API client); components read no
  `process.env`.

## Helpers

- `helpers-are-pure` — `helpers.ts` holds pure functions. If it needs a hook,
  it is a hook. A helper called by one component stays in that component's
  folder however long it gets. Length is not a promotion trigger; a second
  caller is.
- `helper-naming` — Name a non-hook function `get*` / `format*` / `filter*`.
  The `use` prefix is what tells the linter and the reader where hooks can
  hide.
- Pure helpers get their own `helpers.test.ts`. That is the point of
  extracting them (`tests-colocated`).

## Styling and the design system

- `follow-the-repo-styling` — Follow the styling approach the repo actually
  uses, not what its manifest makes available. A CSS framework can be a
  dependency, even compiled into the global stylesheet, while every component
  uses style objects or CSS modules instead. Read three existing components
  before writing a fourth.
- `theme-variables-not-literals` — Reference theme variables
  (`var(--accent)`, `var(--text-muted)`, `var(--border)`) rather than
  hard-coding colors, so every theme keeps working. Where the repo uses style
  objects, `styles.ts` exports one object at the rung that owns the
  component. Domain colour maps (status, severity, category) come from the
  design system; prefer its rendered badge component over reading the map.
- `design-system-is-generic` — **Promotion to the design-system package is a
  different move from rung 2.** A component earns a place there only when it
  is generic: no domain types, no data hooks, no knowledge of a route. One
  that still knows about orders or invoices belongs in `src/components/`,
  however many routes use it. Adding one means following the design system's
  own contribution guide (its README, its gallery or stories, rendered in
  every theme).

## Copy and i18n

- `copy-through-i18n` — Every user-visible string goes through the repo's
  i18n library (for example `useTranslations("<namespace>")` in client
  components, its server equivalent in server components). There may be a
  single locale today; that is a reason to keep strings out of components,
  not a reason to skip the namespace.
- `namespace-per-surface` — A namespace is a **user-facing surface**, not a
  unit of work: `orders`, `checkout`, `settings`, `shell`. Keys are nested
  camelCase (`filters.hideCancelled`). Adding a control to an existing surface
  adds keys to that surface's file. A filter on the orders list is
  `orders.json`, not a new namespace. **A genuinely new surface adds its own
  file**; reach for a `common` namespace only for wording shared across
  surfaces.

## State

`state-decision-tree` — The decision tree, in order. Stop at the first line
that fits:

1. Computable from props or existing state? → compute it in render. Not state.
2. Used only inside this component? → `useState` here.
3. Used by one child? → keep it here, pass it down.
4. Used by a sibling? → lift to the closest common parent.
5. Should it be **linkable** — shareable, bookmarkable, part of where you
   are? → the URL (a `?tab=` search param).
6. Should it merely **persist per viewer** — a preference nobody wants in a
   pasted link? → `localStorage` behind a context in `src/lib/`. Note the
   cost: server-rendered markup cannot know the stored value, so a theme
   stored this way needs a before-paint script in the root layout. Prefer the
   URL when either fits.
7. Comes from the API? → it is server cache, not state. It belongs to the
   server-cache library (TanStack Query, SWR), and a query result is never
   copied into `useState` (`server-cache-not-state`).
8. Genuinely cross-cutting (theme, toasts, the active account)? → a small
   domain-scoped context in `src/lib/`, with a hook that throws when used
   outside its provider.

Two rules fall out of it:

- `no-global-store` — **No global client store** by default. Server state is
  in the query cache and UI state is colocated; what is left is tiny. Adding
  Redux, Zustand or Jotai needs a named reason.
- `providers-as-deep-as-needed` — Render each provider as deep as it is
  needed, not at the root by reflex.

## Hooks

- `data-hooks-per-domain` — `src/lib/hooks/` is the home of every data hook,
  one file per domain.
- `hook-earns-its-keep` — Keep a custom hook when it adds a `select` or
  transform, derived flags, or a stable component-facing contract. A hook
  whose whole body is `useQuery(someOptions)` earns little.
- `query-key-is-dependency-array` — The query key is a dependency array.
  Every variable the query function uses is in it, and the key lives beside
  the query, not in a global `queryKeys.ts`. Structure keys most-generic to
  most-specific (`["order-shipments", orderId]`) so a broad
  `invalidateQueries` does the right thing.
- `hook-without-hooks-is-helper` — A hook that calls no other hook is a
  helper. Rename it and move it.

## Data and the API layer

- `check-the-data-exists` — **Check the data exists before planning any
  files.** A "frontend feature" is often blocked on a backend change. Confirm
  the field is on the contract *and* that an endpoint actually serves it —
  some contracts describe endpoints no one has implemented yet. If it is
  missing, the change spans both sides, and the backend half belongs to
  [`onion-architecture`](../onion-architecture/SKILL.md).
- `one-transport` — One transport: a single API client module
  (`src/lib/api.ts`). It normalizes failures to one error type so the UI can
  branch on status. A component that calls `fetch` has skipped a rung.
- When the app talks to a separate backend service (Next's **External HTTP
  APIs** shape), that is a sanctioned approach for an existing backend, not
  debt awaiting migration. Keep to one data approach rather than mixing in a
  second. Client-side fetching stays correct for frequently polled data and
  anything touching browser APIs.
- `streams-in-hooks` — A streaming transport (SSE, WebSocket) is the one
  exception to the single client: open it inside a hook in `src/lib/hooks/`,
  and feed its events into the query cache. Open a stream in a hook, not in a
  component.

## Types and contracts

- `contracts-from-shared` — Every shape crossing the API comes from the
  shared contracts package (or the generated API types). Import it from there
  directly in new code; never restate it locally. A local re-export hub of
  contract types is not a place for new types — prefer the direct import, and
  add there only when a contract genuinely has no home yet.
- Contracts are schemas with the type inferred from the schema, one
  declaration rather than two.
- `shared-contract-copies-in-sync` — If the contracts are copied into more
  than one package (vendored, generated per package), changing a contract
  means changing every copy. Diff before assuming:

  ```sh
  diff -r <package-a>/<shared-dir> <package-b>/<shared-dir>
  ```

- `wire-mapping-at-edge` — When the API speaks snake_case and React
  camelCase, that mapping is edge work and belongs in `helpers.ts`.

## The server/client seam (React Server Components)

Applies when the framework renders Server Components; skip it otherwise.

- `client-directive-at-subtree-entry` — `"use client"` marks the **entry to
  a client subtree**. Everything imported from that entry is already in the
  client graph; repeating the directive inside it is noise. Push the
  directive toward the leaves: a route's shell can stay a Server Component
  while its interactive view does not. A server `page.tsx` rendering one
  colocated client view is the shape to copy.
- Rendered elements are data, so `children` lets a server subtree sit inside a
  client component without entering the client graph. That is the tool for
  moving the boundary down.
- `no-compound-components-across-seam` — **Compound components break across
  the seam.** A Server Component importing a Client Component gets a client
  reference, so `Menu.Item` is `undefined` and React throws `Element type is
  invalid`. Expose named exports rather than static properties.
- Context cannot be created in a Server Component. A provider is rendered from
  one, which is what a root layout does.
- `minimum-props-across-seam` — Pass a client component the minimum it
  renders, rather than a whole record because it was already loaded.

## Naming, imports and barrels

- Component folder and file PascalCase (`OrderFilters/OrderFilters.tsx`);
  support files fixed lowercase (`constants.ts`, `helpers.ts`, `styles.ts`,
  `index.ts`); hooks and lib files kebab-case — unless the repo documents
  another convention.
- `use-the-alias` — **Use the path alias** (for example `@/`) in place of
  `../../../../lib/hooks`. A new alias goes in every config that resolves
  modules (the TypeScript config *and* the test runner's config) — miss one
  and tests break while the app still builds.
- `no-aggregating-barrels` — Two kinds of barrel exist and they are **not one
  decision**. A one-line forwarder for a single component folder
  (`export { X, X as default } from "./X"`) is cheap — keep it. An
  **aggregating** barrel re-exporting many modules (`src/lib/hooks/index.ts`)
  loads all of them synchronously and invites `module → index → module`
  cycles — add no more, and import `@/lib/hooks/<domain>` directly.
- `export * from "./X"` and `export { default } from "./X"` in one file is a
  build error under the App Router: `the name 'default' is exported multiple
  times`.
- `optimizePackageImports` (Next.js) is for third-party packages with hundreds
  of modules. It does not rescue your own directories, and it stops working
  silently once a barrel contains one non-re-export line.

## Testing

- `tests-colocated` — Tests are colocated: `<Name>.test.tsx` beside the
  component, `helpers.test.ts` beside the helpers. No mirrored test tree.
- Test the component through its rendered output and the pure helpers directly.
  The split exists so both are cheap.
- `fetch` is mocked in component tests; the suite needs neither the API nor a
  database. Real browser journeys live in the end-to-end suite, outside
  `src/`.

## Known exceptions — accepted debt

`known-exceptions-shrink` — Deviations that predate the rules are recorded,
dated, in the repo's architecture doc so they are recognised rather than
rediscovered. Leave them unless the task is that code, and mark a row fixed
rather than deleting it. **This list shrinks; it never grows.**

The table shape:

| Where | What | Target shape |
|---|---|---|
| Most `page.tsx` files | `"use client"` sits at the route, not the leaves | Convert page shells to Server Components, keep polling subtrees client |
| Deep relative imports | The alias is configured but underused | Use the alias in new code; convert files you already touch |
| `src/lib/hooks/index.ts` | Aggregating barrel | Import `@/lib/hooks/<domain>` directly in new code; the barrel stays for existing callers |

Editing a listed file is fine. Adding a row is a finding.

## Checklist — adding a feature to a route

Reference shape: a server `page.tsx` → a colocated `_components/<Feature>View/`
(view, `constants.ts`, `helpers.ts`, `styles.ts`, `index.ts`, nested
`_components/` for its children), beside any segment-rung component the
segment's routes share.

- [ ] The data already exists on the contract and an endpoint serves it
- [ ] Every § *Where does this code go?* question answered for the new code
- [ ] Copy in the surface's namespace file, reached through the i18n library
- [ ] `helpers.test.ts` for the pure helpers, `<Name>.test.tsx` for the component
- [ ] `"use client"` only at the subtree entry; the page stays a shell if it can
- [ ] Alias imports, and no new aggregating barrel
- [ ] The repo's typecheck and frontend tests pass — use the commands the repo
      documents (`CLAUDE.md` / `AGENTS.md`, then the `Makefile`, then the
      package manifest's scripts). If none is found, say "no test command
      found" and what was searched; never invent one or mark it passed.

## Rule identifiers

Cite as `frontend-architecture → <id>`. These identifiers are stable across
versions; a renamed rule keeps its old identifier as an alias.

| Identifier | Section | One line |
|---|---|---|
| `distance-equals-consumers` | The rule | Live beside the only consumer; move up one rung on the second, never before |
| `ladder-runs-both-ways` | The rule | Push down to one consumer; delete at zero |
| `split-on-responsibility` | Components | Split on responsibility, not size, and not early |
| `one-component-per-file` | Components | One exported component, named as its file and folder |
| `props-budget` | Components | ~7 props or two combining booleans is too many |
| `variants-as-components` | Components | Variants are components, not boolean flags |
| `children-over-render-props` | Components | `children` for static structure |
| `no-container-view-split` | Components | No `*Container` / `*View` file split |
| `page-is-composition-root` | Components | A page resolves params, calls hooks, hands data down |
| `constants-at-owning-rung` | Constants | Doc-commented constants at the rung that uses them |
| `env-in-one-place` | Constants | Public env vars read in one module; components read none |
| `helpers-are-pure` | Helpers | No hooks in helpers; length never promotes |
| `helper-naming` | Helpers | `get*` / `format*` / `filter*`; `use*` only for hooks |
| `follow-the-repo-styling` | Styling | Use the styling the repo uses, not what it installs |
| `theme-variables-not-literals` | Styling | Theme variables, never hard-coded colours |
| `design-system-is-generic` | Styling | Only domain-free components enter the design system |
| `copy-through-i18n` | Copy | Every user-visible string through the i18n library |
| `namespace-per-surface` | Copy | One namespace per user-facing surface |
| `state-decision-tree` | State | Derive, local, lift, URL, storage, query cache, context — in that order |
| `server-cache-not-state` | State | Query results are never copied into local state |
| `no-global-store` | State | No global client store without a named reason |
| `providers-as-deep-as-needed` | State | Providers render where they are needed, not at the root |
| `data-hooks-per-domain` | Hooks | One data-hook file per domain |
| `hook-earns-its-keep` | Hooks | A hook adds a transform, flags or a stable contract |
| `query-key-is-dependency-array` | Hooks | Key holds every query input, lives beside the query |
| `hook-without-hooks-is-helper` | Hooks | A hook calling no hook is a helper |
| `check-the-data-exists` | Data | Confirm the contract field and the endpoint first |
| `one-transport` | Data | One API client; no `fetch` in components |
| `streams-in-hooks` | Data | Streams open in hooks and feed the query cache |
| `contracts-from-shared` | Types | API shapes come from the shared contracts, never restated |
| `shared-contract-copies-in-sync` | Types | Change every copy of a duplicated contract |
| `wire-mapping-at-edge` | Types | Case mapping lives in `helpers.ts` |
| `client-directive-at-subtree-entry` | Seam | `"use client"` at the subtree entry, pushed to the leaves |
| `no-compound-components-across-seam` | Seam | Named exports, not static properties, across the seam |
| `minimum-props-across-seam` | Seam | Pass a client component only what it renders |
| `use-the-alias` | Imports | Path alias over deep relative imports; register it everywhere |
| `no-aggregating-barrels` | Imports | Single-module forwarders only |
| `tests-colocated` | Testing | Tests beside the code they test |
| `known-exceptions-shrink` | Known exceptions | Debt is listed by name; the list never grows |

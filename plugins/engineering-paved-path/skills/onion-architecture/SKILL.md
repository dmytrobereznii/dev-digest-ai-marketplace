---
name: onion-architecture
description: >-
  A backend ring model — contracts → ports → services → repositories →
  adapters and routes, with dependencies pointing inward only, and stable rule
  identifiers to cite. Use when adding or changing backend code: a new
  endpoint, a new external integration, a new table, or a refactor that moves
  logic between handlers, services and repositories. Also use when deciding
  where a piece of backend code belongs, or when reviewing a backend change
  for layer boundaries and the repository's own architecture docs are silent.
---

# onion-architecture

A ring model for backend code, and the rules that keep new code inside it.
Worked good/bad pairs: [`examples.md`](examples.md). Sources and rationale:
[`references.md`](references.md).

**The repository's own rules come first.** If the repo has an architecture doc
(`ARCHITECTURE.md`, `docs/architecture*`, the architecture section of
`CLAUDE.md` / `AGENTS.md`) or a dependency-rule tool config, read it before
this skill and follow it where the two disagree. This skill is the default
model when the repo says nothing, and a vocabulary for mapping what the repo
already does. Describe the rings the code already has before prescribing new
ones: a repo that is already onion-shaped needs names and a rule, not a
generic `domain/application/infrastructure` layout that fights its existing
module convention.

Every rule below carries a stable identifier in backticks. Cite a rule as
`onion-architecture → <id>`. The full list is in
[§ Rule identifiers](#rule-identifiers).

## The rule

`dependencies-point-inward` — **Source dependencies point inward.** An outer
ring may name an inner one. An inner ring may never name an outer one — it
declares an interface and waits to be handed an implementation.

```
routes ──▶ service ──▶ repository ──▶ db/
   │          │
   │          └──▶ ports ◀── adapters/
   └─────────────▶ contracts ◀── everything
```

`composition-root-only` — Only the **composition root** (the DI container or
wiring module, plus the app entry point) is allowed to know both a port and
the concrete class that satisfies it.

## The rings

The paths are a reference layout, not a requirement. Map each ring onto the
repo's own directories before applying the rules; a repo that slices by
feature keeps the rings *inside* each feature module.

| Ring | Lives in (reference layout) | May import | Rule |
|---|---|---|---|
| 1 — Contracts | `contracts/` | the schema library, sibling contracts | Nothing else. Ever. (`contracts-stay-pure`) |
| 1 — Core | a pure domain or engine package, e.g. `core/` | contracts, the schema library, the types of the one port it calls | No filesystem, no runtime built-ins, no DB, no network except through an injected port (`core-has-no-io`) |
| 2 — Ports | `ports/` or one `ports.ts` per module | ring 1 | Interfaces only — no implementation, no import of implementation code (`ports-know-no-implementations`) |
| 3 — Application | `modules/*/service.*`, cross-cutting policy in `platform/` | rings 1–2, own repository | Speaks contracts and DTOs; never sees a SQL table (`services-speak-contracts`) |
| 4 — Infrastructure | `adapters/**`, `db/**`, `modules/*/repository.*` | rings 1–3 | The only place a vendor SDK or the ORM appears |
| 4 — Delivery | `modules/*/routes.*` (handlers, controllers) | own service, contracts, the error types | HTTP shape only |
| 5 — Composition root | the container / wiring module, the app entry point | everything | The only file allowed to `new` a concrete adapter |

Note the shape: rings 4 and 5 are *outside*, not on top. `adapters/` and the
route handlers are peers — one adapts the world to the app, the other adapts
the app to the world.

## Where does this code go?

1. Does it touch the network, the filesystem, or the database? → **ring 4**:
   an adapter (outbound) or a repository (persistence). Never anywhere else.
2. Does it decide *what* should happen — orchestration, policy, permissions,
   sequencing? → **ring 3**, the module's service.
3. Is it pure computation over contracts? → the pure core if it is domain
   logic, a cross-cutting backend helper (pricing, routing, tracing) if it is
   not.
4. Is it about the HTTP wire — status codes, wire-format bodies, param
   parsing? → the route handler, plus the module's `helpers` for the mapping.
5. Is it a type two rings share? → **ring 1**, a contract. Every copy, if the
   repo keeps more than one (see below).

## Per-concern rules

The reference stack in the examples is TypeScript (an HTTP framework with
schema-validated routes, an ORM or typed query builder, a schema library such
as Zod). The rules are the same in any stack; the names change.

### HTTP handlers — routes are adapters, not logic

- `thin-handlers` — A handler validates, calls **one** service method, and
  returns. **Budget:** a handler body over ~15 lines, or one that names a
  database table, has logic in it. Move it down a ring.
- `validate-at-the-edge` — Validate params, body and response with the
  framework's schema support. Validation is the boundary, so it belongs at the
  edge.
- `errors-through-handler` — Throw the app's domain error types
  (`NotFoundError`, `ValidationError`); one central error handler turns them
  into the API's error envelope. Never hand-roll a status-code response in a
  handler.
- `app-wide-plugins-only` — If the framework scopes each module (for example
  plugin encapsulation), keep that scope. Break encapsulation only for
  genuinely app-wide infrastructure, such as decorating the app with the
  container; every other use is a hole in a boundary.

### Persistence — the query stops at the repository

- `orm-only-in-repository` — The ORM or query builder and the schema module
  are importable from repositories and `db/**`. Nowhere else.
- `sql-in-routes` — In particular, no ORM import, query or schema module in a
  route handler.
- `routes-skip-service` — A route handler never imports a repository
  directly; it goes through its service.
- `repository-returns-domain` — A repository returns **domain or DTO
  shapes**, never a query builder, never a raw ORM or driver error. Translate
  constraint violations into the app's error types at that edge — otherwise
  the service has to understand the database to handle them, and the
  abstraction has bought nothing.
- `rows-stay-in-persistence` — Row types are persistence detail. A service
  that imports a `*Row` type is reaching outward; map to a DTO in the
  module's `helpers` instead.
- `split-repository-by-aggregate` — When a repository grows, split it by
  aggregate (`repository/order.repo.ts`, `repository/line-item.repo.ts`), not
  by query type.
- `migrations-through-tool` — Schema changes go through the schema source and
  the migration generator. Generated migrations are never hand-edited, and a
  merged migration is never changed; add a new one.

### Contracts and validation — one schema, two jobs

- `contracts-stay-pure` — Contracts are ring 1 and stay dependency-free: the
  schema library and sibling contracts, nothing more. A contract that imports
  a port has inverted the onion.
- `schema-once` — Define the schema once and infer the type from it, with the
  same name for both, rather than declaring both by hand.
- `parse-once-pass-inward` — Parse at the boundary; pass the parsed type
  inward. Services receive values that are already valid — they should not
  re-validate, and should not accept `unknown`.
- `wire-mapping-at-edge` — When the wire format and the code differ in shape
  or case (snake_case JSON, camelCase code), that mapping is edge work: it
  belongs in the module's `helpers`, not in the service.

### Vendor SDKs — behind a port

- `sdk-outside-adapters` — No vendor SDK (a hosted API client, an LLM SDK, a
  git library, a code-analysis library) is imported outside `adapters/`.
- `integration-four-steps` — Adding an integration is always these four
  steps, in order:
  1. **Port** — an interface in ring 2 (every copy, if contracts are copied).
  2. **Adapter** — the implementation in `adapters/<name>/`, the only file
     that imports the SDK.
  3. **Wiring** — a lazy getter or factory in the composition root, plus an
     override hook so tests can inject.
  4. **Test double** — a fake implementing the same interface, beside the
     other mocks.
- `io-adapter-in-module` — Not every file under `adapters/` is an I/O
  client: a diff parser or an AST extractor is a pure function, and importing
  it from a module is fine. Importing a *credentialed client* (anything that
  holds a token, a connection or a secret) by name is not: get it from the
  composition root through injection.

### Dependency injection

- `constructor-injection` — Services take their dependencies in the
  constructor. The composition root is the only file that constructs concrete
  adapters. No service-locator lookups buried in a call stack: if a function
  needs a port, it is a parameter.
- `inject-ports-not-container` — Prefer injecting the **ports a service
  actually uses** over the whole container. Passing the container may be the
  repo's current convention and acceptable for existing code, but it is what
  creates a `service ↔ container` import cycle — new services should take
  what they need.

## Shared contracts kept in more than one copy

`shared-contract-copies-in-sync` — Some repos keep the same contracts in more
than one place: vendored into each package, generated per client, or copied
by hand. Those copies drift. Changing a ring-1 contract means changing every
copy. Diff before assuming a type is shared:

```sh
diff -r <package-a>/<shared-dir> <package-b>/<shared-dir>
```

If the repo documents drift it has accepted, drift in those files alone is
baseline.

## Enforcement

Encode the rings as rules in the repo's dependency-rule tool, so a violation
is a lint error rather than a review comment. Options by ecosystem:
dependency-cruiser or `eslint-plugin-boundaries` / `import/no-restricted-paths`
(JavaScript and TypeScript), import-linter (Python), ArchUnit or Konsist (JVM),
NetArchTest or ArchUnitNET (.NET), go-arch-lint or golangci-lint's `depguard`
(Go). Pick the one the repo already depends on: a ruleset that adds a config
file and no package is free to run.

**Record the baseline** (errors and warnings at a known commit). A new error
is something the change introduced. The rules worth making errors, each of
which should be verified to fire by planting a temporary violation:

| Rule | Catches |
|---|---|
| `sdk-outside-adapters` | a vendor SDK imported outside `adapters/` |
| `sql-in-routes` | the ORM or the schema module in a route handler |
| `routes-skip-service` | a route importing a repository directly |
| `io-adapter-in-module` | a credentialed adapter imported by name |
| `contracts-stay-pure` | ring 1 importing anything but the schema library |
| `ports-know-no-implementations` | ports reaching into implementation code |

Import cycles usually start as warnings: cycles that predate the ruleset would
otherwise make the lint unusable on day one.

Grep fallback when no tool is configured (adjust the SDK names and paths to
the repo):

```sh
# vendor SDKs outside adapters/
grep -rnE --include='*.ts' "from '(<sdk-a>|<sdk-b>)'" src | grep -v '^src/adapters/'
# the ORM or schema module in route handlers
grep -rlE "<orm-package>|db/schema" src/modules/*/routes.*
```

## Known exceptions — accepted debt

`known-exceptions-shrink` — Code that predates the rules is recorded as
dated, named debt in the repo's architecture doc, not fixed as a side effect
of unrelated work. List it so an agent recognises it as known rather than
"discovering" it mid-task. Fix one only when the task is that module, or when
asked. Exempt the listed files **by name** in the lint config so the rule can
stay an error for everything else. **That list shrinks; it never grows.**

The table shape:

| Where | What | Target shape |
|---|---|---|
| `modules/billing/routes.ts` | ORM queries inline in handlers; no service, no repository | Extract `service` + `repository` |
| `modules/orders/service.ts` | Imports row types from ring 3 | Map rows to DTOs at the repository edge |
| `modules/search/service ↔ container` | Cycle via whole-container injection | Inject the ports the service uses |

Editing a listed file is fine. Adding a row is a finding.

## Checklist — adding a module

Reference shape: `modules/<feature>/` with `routes` → `service` →
`repository` → `helpers` → `constants`.

- [ ] `routes` — request/response schemas, one service call per handler
- [ ] `service` — orchestration; takes its dependencies in the constructor
- [ ] `repository` — the only file importing the ORM / the schema module
- [ ] `helpers` — row → DTO, code case → wire case
- [ ] `constants` — defaults and magic values
- [ ] Registered wherever the app registers modules
- [ ] New external call? port + adapter + composition-root getter + test double
- [ ] The dependency-rule tool still reports no new errors
- [ ] The repo's typecheck and unit tests pass — use the commands the repo
      documents (`CLAUDE.md` / `AGENTS.md`, then the `Makefile`, then the
      package manifest's scripts). If none is found, say "no test command
      found" and what was searched; never invent one or mark it passed.

## Rule identifiers

Cite as `onion-architecture → <id>`. These identifiers are stable across
versions; a renamed rule keeps its old identifier as an alias.

| Identifier | Section | One line |
|---|---|---|
| `dependencies-point-inward` | The rule | Outer rings may name inner ones, never the reverse |
| `composition-root-only` | The rule | Only the composition root knows a port and its concrete class |
| `contracts-stay-pure` | Rings, Contracts | Ring 1 imports only the schema library and sibling contracts |
| `core-has-no-io` | Rings | A pure core has no filesystem, built-ins, DB or network except an injected port |
| `ports-know-no-implementations` | Rings | Ports are interfaces only and import no implementation code |
| `services-speak-contracts` | Rings | The application ring speaks contracts and DTOs, never tables |
| `thin-handlers` | HTTP handlers | Validate, call one service method, return; ~15-line budget |
| `validate-at-the-edge` | HTTP handlers | Request and response validation sits in the handler's schema |
| `errors-through-handler` | HTTP handlers | Throw domain errors; one central handler renders the envelope |
| `app-wide-plugins-only` | HTTP handlers | Break framework encapsulation only for app-wide infrastructure |
| `orm-only-in-repository` | Persistence | The ORM and schema module appear only in repositories and `db/` |
| `sql-in-routes` | Persistence | No ORM, query or schema module in a route handler |
| `routes-skip-service` | Persistence | A route never imports a repository directly |
| `repository-returns-domain` | Persistence | Return DTOs; never a query builder or a raw driver error |
| `rows-stay-in-persistence` | Persistence | Row types never reach the service |
| `split-repository-by-aggregate` | Persistence | Split a growing repository by aggregate |
| `migrations-through-tool` | Persistence | Migrations come from the generator and are never hand-edited |
| `schema-once` | Contracts | One schema, type inferred, same name |
| `parse-once-pass-inward` | Contracts | Parse at the boundary; services take parsed types |
| `wire-mapping-at-edge` | Contracts | Case and shape mapping lives in `helpers`, not the service |
| `sdk-outside-adapters` | Vendor SDKs | No vendor SDK outside `adapters/` |
| `integration-four-steps` | Vendor SDKs | Port, adapter, wiring, test double — in that order |
| `io-adapter-in-module` | Vendor SDKs | Credentialed clients come through injection, not by import |
| `constructor-injection` | Dependency injection | Dependencies arrive in the constructor; no service location |
| `inject-ports-not-container` | Dependency injection | New services take the ports they use, not the whole container |
| `shared-contract-copies-in-sync` | Shared contracts | Change every copy of a duplicated contract |
| `known-exceptions-shrink` | Known exceptions | Debt is listed by name; the list never grows |

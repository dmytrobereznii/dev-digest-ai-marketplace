# onion-architecture — sources and rationale

For whoever next changes this skill: where each rule came from, and what it is
defending against.

## Why this skill exists

Many backends are *already* onion-shaped before anyone names it: ports in a
shared interfaces file, a composition root that wires them, adapters isolated
under one directory, a pure core. What they lack is a name, a written rule,
and anything that would notice a violation. Modules drift, and nothing flags
it.

So the skill is deliberately **descriptive first, prescriptive second**: it
names rings that exist rather than importing a generic
`domain/application/infrastructure` layout that would fight a repo's
`modules/*` convention. Applied to a new repo, start by mapping its
directories onto the rings, then record the exceptions.

## Foundational

- [The Onion Architecture: part 1 — Jeffrey Palermo (2008)](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/)
  — the original. Two claims we lean on: *behaviour is defined by interfaces*,
  and *infrastructure is externalised*. Also the caveat that the pattern is
  aimed at long-lived applications with complex behaviour, not small sites —
  which is why routes/service/repository is required per module but a fifth
  ring of use-case objects is not.
- [Onion Architecture — Herberto Graça, *Software Architecture Chronicles*](https://medium.com/the-software-architecture-chronicles/onion-architecture-79529d127f85)
  — the clearest breakdown of the rings and how they relate to DDD.
- [Hexagonal architecture — Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture)
  — ports & adapters (2005). Source of the "routes and adapters are peers, not
  a stack" framing in the ring table: inbound and outbound adapters sit on the
  same outer edge.
- [Clean vs Onion vs Hexagonal — Milan Jovanović](https://milanjovanovic.tech/blog/clean-architecture-vs-onion-vs-hexagonal)
  — the three are cousins sharing the inward-dependency rule and differing
  mostly in naming. We adopt Onion's ring names and Hexagonal's ports/adapters
  terminology, and skip Clean Architecture's mandatory use-case objects.
- [Sliced Onion Architecture — Oliver Drotbohm (2023)](http://odrotbohm.github.io/2023/07/sliced-onion-architecture/)
  — rings *inside* vertical modules rather than across the whole app. This is
  the single most load-bearing reference: it is exactly the
  `modules/<feature>/{routes,service,repository}` shape, and it is the
  argument for why the rings are per-module and not top-level folders.
- [Demystifying software architecture patterns — Thoughtworks](https://www.thoughtworks.com/en-de/insights/blog/architecture/demystify-software-architecture-patterns)

## TypeScript / Node practice

- [Implementing SOLID and the onion architecture in Node.js with TypeScript — Wolk Software](http://blog.wolksoftware.com/implementing-solid-and-the-onion-architecture-in-node-js-with-typescript-and-inversifyjs)
  — the canonical Node treatment. We take the dependency-inversion discipline
  and **reject** the IoC-container-with-decorators approach: a container with
  lazy getters plus a test-override object already gives constructor
  injection and test seams without InversifyJS or `reflect-metadata`.
- [Clean architecture with TypeScript: DDD, Onion — André Bazaglia](https://bazaglia.com/clean-architecture-with-typescript-ddd-onion/)
- [Hexagonal Architecture guide + TypeScript](https://generalistprogrammer.com/tutorials/hexagonal-architecture-complete-guide)

## Tool-specific

- [The complete guide to the Fastify plugin system — Nearform](https://nearform.com/digital-community/the-complete-guide-to-fastify-plugin-system/)
  and [Fastify Plugins Guide](https://fastify.dev/docs/latest/Guides/Plugins-Guide/)
  — encapsulation as the module boundary; children inherit ancestors, siblings
  are isolated. Source of `app-wide-plugins-only`: wrapping in
  `fastify-plugin` deliberately *breaks* encapsulation, so every use is a hole
  in a boundary. Other frameworks with module scoping (NestJS modules, Flask
  blueprints) carry the same trade-off.
- [Atomic Repositories in Clean Architecture and TypeScript — Sentry](https://blog.sentry.io/atomic-repositories-in-clean-architecture-and-typescript/)
  — transactions spanning repositories without leaking the ORM.
- [You might not need… the repository pattern — Jay Freestone](https://dev.to/jayfreestone/you-might-not-need-the-repository-pattern-46b)
  — the counter-argument, included on purpose. A repository is only worth it if
  it protects a real boundary or hides real persistence complexity; otherwise
  it is a thin leaky wrapper. This is why the skill demands repositories return
  DTOs and translate errors (`repository-returns-domain`) rather than merely
  demanding the file exist.
- [Drizzle ORM best practices — Paul Serban](https://paulserban.eu/blog/post/drizzle-orm-best-practices-principles-patterns-and-real-world-case-studies/)
  — and the framing that a typed query builder is more a query builder than
  an ORM, which is why leaking it is so easy and the boundary has to be
  explicit.
- [Drizzle discussion #232 — further abstractions](https://github.com/drizzle-team/drizzle-orm/discussions/232)

## Enforcement tooling

- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) — a good
  default for JavaScript and TypeScript when the repo already depends on it
  (for example for an import-graph feature): the ruleset then adds a config
  file and no package.
- [eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries)
  — the alternative. Whichever is chosen, keep the ring rules in **one** tool:
  if the dependency-rule tool owns every boundary, keep the ESLint config thin
  so there is never a second source of truth for one rule.
- Other ecosystems: [import-linter](https://github.com/seddonym/import-linter)
  (Python), [ArchUnit](https://www.archunit.org/) (JVM),
  [go-arch-lint](https://github.com/fe3dback/go-arch-lint) or golangci-lint's
  `depguard` (Go), NetArchTest (.NET).

### Gotchas found while writing a dependency-cruiser config

Both cost a debugging round-trip; do not reintroduce them.

- **Package-manager path anchoring.** `to.path` is matched against the
  *resolved* path, which under pnpm is
  `node_modules/.pnpm/<pkg>@<version>_.../node_modules/<pkg>/index.js`. A rule
  written as `^<pkg>` or `^node_modules/<pkg>` silently matches nothing and
  the rule looks green. Write `node_modules/<pkg>` — no `^`.
- **A rule that never fires looks identical to a rule that passes.** Validate
  every error-level rule by planting a temporary violation, confirming the
  error, and removing it. Do that again after editing the ruleset. This holds
  for every dependency-rule tool, not just this one.

## Design choices

| Decision | Choice | Why |
|---|---|---|
| Scope | Backend rings, plus one purity rule for a pure core where one exists | A pure core usually already imports no runtime built-ins; the rule (`core-has-no-io`) preserves a property that already holds |
| Existing violations | Recorded as dated, named debt; exempted by name in the lint config | An error-level rule is worth more than a clean slate. Exempting a few files by name keeps the rule live for everything else and makes the debt machine-readable (`known-exceptions-shrink`) |
| Cycle-rule severity | `warn`, not `error`, at first | Cycles that predate the config would make the lint unusable on day one |
| IoC container | None required | A composition root with lazy getters and test overrides already provides constructor injection |
| Rule identifiers | Stable kebab-case ids, matching the dependency-rule names where one exists | Reviewers cite them; the six enforceable rules share their id with the lint rule that catches them |

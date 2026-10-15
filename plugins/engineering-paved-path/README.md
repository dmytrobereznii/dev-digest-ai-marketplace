# engineering-paved-path

Shared engineering skills: the paved path other plugins in this marketplace
build on. Two are first-party architecture models with stable rule
identifiers; five are third-party stack skills redistributed under their MIT
licences.

## Components

| Skill | Kind | What it does |
|---|---|---|
| `onion-architecture` | first-party | A backend ring model — contracts → ports → services → repositories → adapters and routes, dependencies pointing inward — with a placement guide, per-concern rules, enforcement options and stable rule identifiers |
| `frontend-architecture` | first-party | A placement ladder for a React app — code lives beside its only consumer and moves up one rung on the second — covering components, constants, helpers, state, hooks, data, contracts and the server/client seam, with compliance greps and stable rule identifiers |
| `typescript-expert` | third-party | TypeScript and JavaScript type-level programming, performance, monorepos, migrations and tooling |
| `zod` | third-party | Zod schema validation practices: parsing, inference, error handling |
| `fastify-best-practices` | third-party | Building Fastify servers and REST APIs: routes, plugins, validation, errors, hooks |
| `drizzle-orm-patterns` | third-party | Drizzle ORM schemas, queries, relations, transactions and migrations |
| `postgresql-table-design` | third-party | PostgreSQL schema design: types, indexes, constraints, performance patterns |

Skills load on demand when a task matches their description, or by name
(`engineering-paved-path:onion-architecture`).

## The two architecture skills

Each one is a **default model**, not an override: both tell Claude to read the
repository's own architecture doc (`ARCHITECTURE.md`, `docs/architecture*`,
the architecture section of `CLAUDE.md` / `AGENTS.md`) and dependency-rule
config first, and to follow the repo where the two disagree. Paths in them
(`modules/<feature>/routes.ts`, `adapters/`, `app/**/_components/`) are a
reference layout to map onto your own.

Every rule carries an identifier, listed in a **Rule identifiers** table at the
end of each `SKILL.md`. Reviews cite them as
`onion-architecture → <id>` or `frontend-architecture → <id>`; the
`architecture-review:architecture-reviewer` agent does exactly that. The
identifiers are stable across `1.x`.

| Skill | Files |
|---|---|
| `onion-architecture` | `SKILL.md` (rules and identifiers), `examples.md` (good/bad pairs), `references.md` (sources and design choices) |
| `frontend-architecture` | `SKILL.md`, `examples.md`, `enforcement.md` (compliance greps and lint options), `references.md` |

### Inputs and defaults

| Input | Where it comes from | Default |
|---|---|---|
| Architecture rules | the repo's architecture doc or `CLAUDE.md` / `AGENTS.md` | the skill's own model |
| Typecheck, lint and test commands (checklists) | `CLAUDE.md` / `AGENTS.md`, then `Makefile` targets, then manifest scripts | none — the skill says to report "no test command found" with what was searched, never to invent one |
| Accepted debt | a dated known-exceptions table in the repo's architecture doc | none |

## Third-party skills

Redistributed from MIT-licensed projects; source, copyright and changes for
each are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

- `typescript-expert` — from `sickn33/agentic-awesome-skills`
- `zod` — from `pproenca/dot-skills`
- `fastify-best-practices` — from `mcollina/skills`
- `drizzle-orm-patterns` — from `giuseppe-trisciuoglio/developer-kit`
- `postgresql-table-design` — from `wshobson/agents`

## Install

```bash
claude plugin marketplace add dmytrobereznii/dev-digest-ai-marketplace
claude plugin install engineering-paved-path@dev-digest-ai-marketplace
```

`architecture-review` and `sdd-engineering` install it automatically as a
dependency.

## Dependencies

None.

## What it does not do

- Run anything on its own. The skills are guidance; only the architecture
  skills' checklists and `enforcement.md` suggest commands, and those come
  from your repo.
- Override your repository's documented architecture.
- Ship agents. The reviewer that applies the architecture skills is
  `architecture-review:architecture-reviewer`.

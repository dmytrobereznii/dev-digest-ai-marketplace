# Component inventory — what leaves DevDigest, and why

> **Temporary.** Working note for the first extraction (lab step 2). Delete it
> once `sdd-engineering@1.0.0` is released; the plugin READMEs carry the result.

Source: `dmytrobereznii/dev-digest` at `main` `317aa3e`, `.claude/agents/` and
`.claude/skills/`. "Refs" counts mentions of DevDigest paths, packages, `make`
or `pnpm` targets, `.context/` or `INSIGHTS.md` — the editorial load of
generalizing that file.

## The four groups

| Group | What goes there | Ships? |
|---|---|---|
| **Reusable** | Agents and skills whose job is the same in any repo once paths become inputs | Yes, into a plugin |
| **Project-specific** | `CLAUDE.md`, product specs, rules that name DevDigest modules | No — stays in DevDigest |
| **Optional integration** | Anything needing network access or credentials (MCP servers) | No in 1.0.0; documented as optional |
| **Local leftover** | Caches, personal memory, experiments, absolute paths | Never |

## Agents

| Agent | Lines | Refs | Group | Plugin | Owner | Notes for the editorial pass |
|---|---|---|---|---|---|---|
| `spec-creator` | 218 | 18 | Reusable | `sdd-engineering` | SDD workflow | Drop the four `mcp__devdigest__*` tools (optional integration). Spec path becomes an input with a default (`.context/specs/`). `design-reference` mention goes. |
| `implementation-planner` | 171 | 17 | Reusable | `sdd-engineering` | SDD workflow | Skill mentions → `engineering-paved-path:*`. Drop `dev-env`, `commit`, `design-reference`. |
| `implementer` | 131 | 26 | Reusable | `sdd-engineering` | SDD workflow | Preloads `dev-env` (DevDigest Makefile) — replace with "discover the test command from the repo's instructions; if none is found, stop and ask". |
| `plan-verifier` | 176 | 19 | Reusable | `sdd-engineering` | SDD workflow | `pr-self-review`, `dev-env`, `commit` mentions go. |
| `test-writer` | 144 | 28 | Reusable | `sdd-engineering` (**proposed**) | SDD workflow | Not on the lab's list, but `run-plan` dispatches it in every slice (7 mentions). Without it the workflow is incomplete. |
| `researcher` | 128 | 11 | Reusable | `research-tools` | Research tools | Mostly generic already; drop the DevDigest examples. |
| `architecture-reviewer` | 174 | 21 | Reusable after rewrite | `architecture-review` | Architecture review | Hardcodes server rings, `reviewer-core` purity, `depcruise`. Rewrite to read the repo's own architecture docs and lint config; cite `engineering-paved-path:onion-architecture` / `:frontend-architecture` for the generic rules. |
| `security-reviewer` | 155 | 17 | Reusable | none in 1.0.0 | — | `run-plan` uses it as an optional gate: "if installed". Candidate for a later plugin. |
| `brainstormer` | 126 | 18 | Reusable | none in 1.0.0 | — | Optional, referenced once by `run-plan`. |
| `doc-writer` | 95 | 9 | Project-specific | none | — | Owns DevDigest's `docs/`. |

## Skills

| Skill | Files | Refs | Group | Plugin | Notes |
|---|---|---|---|---|---|
| `implement-spec` → **`run-plan`** | 2 | 5 | Reusable | `sdd-engineering` | Renamed. `make check` / `make typecheck lint …` → "the repo's check command". The reviewer routing table (server paths) → "the paths the repo's architecture doc names". |
| `workflow-reviewer` → **`workflow-retro`** | 4 | 11 | Reusable | `sdd-engineering` | Renamed. `scripts/report.mjs` called via `${CLAUDE_SKILL_DIR}`. Ledger path becomes an input with a default. Manual-only (`disable-model-invocation`). |
| `engineering-insights` | 3 | 42 | Reusable after rewrite | `sdd-engineering` | Heaviest rewrite: per-package `INSIGHTS.md` locations become an input; DevDigest examples replaced. |
| `onion-architecture` | 3 | 24 | Reusable after rewrite | `engineering-paved-path` | Keep the generic ring model; drop DevDigest module names. Needed by `architecture-review`. |
| `frontend-architecture` | 4 | 25 | Reusable after rewrite | `engineering-paved-path` | Same treatment. Needed by `architecture-review`. |
| `security` | 4 | 1 | Reusable | `engineering-paved-path` | Referenced by 5 of 6 agents. |
| `zod` | 48 | 0 | Reusable | `engineering-paved-path` | Third-party origin unknown — see licences. |
| `typescript-expert` | 5 | 2 | Reusable | `engineering-paved-path` | `source: community`. |
| `react-best-practices` | 2 | 0 | Reusable | `engineering-paved-path` | |
| `react-testing-library` | 2 | 0 | Reusable | `engineering-paved-path` | Used by `test-writer`. |
| `next-best-practices` | 20 | 3 | Reusable | `engineering-paved-path` | |
| `fastify-best-practices` | 21 | 1 | Reusable | `engineering-paved-path` | |
| `drizzle-orm-patterns` | 10 | 0 | Reusable | `engineering-paved-path` | |
| `postgresql-table-design` | 1 | 1 | Reusable | `engineering-paved-path` | |
| `mermaid-diagram` | 2 | 0 | Reusable | `engineering-paved-path` | Used by `spec-creator` / plans for diagrams. |
| `dev-env` | 1 | 10 | Project-specific | none | DevDigest Makefile. |
| `design-reference` | 1 | 6 | Project-specific | none | DevDigest artboards. |
| `pr-self-review` | 3 | 26 | Project-specific | none | Its hook gate is DevDigest's. |
| `commit` | 1 | 1 | Project-specific | none | Repo commit convention. |
| `finalize-pr` | 2 | 8 | Project-specific | none | |

## Also staying behind

- `.claude/hooks/pr-self-review-gate.sh`, `.claude/settings*.json` — project wiring.
- `evals/` — DevDigest's harness evals. The plugins get their own `evals/`
  in `claude plugin eval` format.
- `.context/**`, `CLAUDE.md`, `INSIGHTS.md` contents — project knowledge.

## Open for the human decision (lab: boundaries are a person's call)

1. Add `test-writer` to `sdd-engineering`? Proposed yes.
2. `security-reviewer` and `brainstormer`: leave out of 1.0.0 and make
   `run-plan` treat them as "use if installed"? Proposed yes.
3. Third-party stack skills: their origin and licence are not recorded in
   DevDigest. Publishing them in a public repo redistributes someone else's
   content. Either find the upstream repos and keep their licence and
   attribution, or ship only the skills we wrote.

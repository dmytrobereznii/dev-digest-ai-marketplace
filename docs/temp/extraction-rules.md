# Extraction rules for 1.0.0

> **Temporary.** The brief every extraction pass follows. Delete with the rest
> of `docs/temp/` after the release.

Source (read-only, never edit): `/Users/dmytro/Code/dev-digest/.claude/`
Target: `plugins/<plugin>/` in this repo.

## Decisions taken

| # | Decision | Why |
|---|---|---|
| D1 | `test-writer` ships in `sdd-engineering` | `run-plan` dispatches it in every slice; without it the workflow is incomplete |
| D2 | `security-reviewer`, `brainstormer`, `doc-writer` do not ship in 1.0.0 | `run-plan` uses them only as optional gates; refer to them as "if available in the session, otherwise skip and say so" |
| D3 | Third-party stack skills ship only with a confirmed source and licence, plus attribution | Public repo; we don't redistribute content we can't attribute |
| D4 | 1.0.0 is a **faithful** extraction: keep the substance, rules and output formats; do not shorten or deduplicate | 1.0.0 is the cost baseline. Removing duplication between agent prompts and skills is the single measured optimisation in lab step 8 |
| D5 | `implement-spec` → `run-plan`, `workflow-reviewer` → `workflow-retro` | Lab names |

## Rewrite rules

1. **No source-project knowledge.** Remove every DevDigest name, package
   (`server/`, `client/`, `reviewer-core/`, `e2e/`, `mcp/`, `evals/`),
   path, module, port, `make` / `pnpm` target, lesson reference (L01…L08),
   SPEC number, date-stamped anecdote and session id. Replace a
   DevDigest-specific example with a neutral one, or drop it when the rule
   stands without it.
2. **Repository facts become inputs with defaults.** Read them from the
   user's `CLAUDE.md` / `AGENTS.md` first; use the default only when the repo
   says nothing:

   | Input | Default |
   |---|---|
   | Spec directory | `.context/specs/` (per-package `<pkg>/.context/specs/` when the repo has packages) |
   | Spec file name | `YYYY-MM-DD-feature-slug.md` with a `Spec ID: SPEC-NN` header; plan beside it as `.plan.md` |
   | Insights file | `.context/insights/INSIGHTS.md` (per package when the repo has packages) |
   | Retro ledger | `.context/retros/ledger.md` |
   | Architecture rules | the repo's own architecture doc (`ARCHITECTURE.md`, `docs/architecture*`, the relevant section of `CLAUDE.md`), then its dependency-rule tool config if any |

3. **Check and test commands are discovered, never assumed.** Order:
   `CLAUDE.md` / `AGENTS.md` → `Makefile` targets → `package.json` scripts
   (`go test ./...`, `pytest`, `cargo test` for those ecosystems). **If none is
   found: stop and report "no test command found" with what was searched;
   never invent one and never mark a check as passed.** Say this explicitly
   in every agent or skill that runs checks.
4. **Namespaced references.** Other components are named by their plugin:
   `sdd-engineering:spec-creator`, `sdd-engineering:implementation-planner`,
   `sdd-engineering:implementer`, `sdd-engineering:test-writer`,
   `sdd-engineering:plan-verifier`, `research-tools:researcher`,
   `architecture-review:architecture-reviewer`; skills
   `sdd-engineering:run-plan`, `sdd-engineering:workflow-retro`,
   `sdd-engineering:engineering-insights`.
5. **Paved-path skills you may reference by name** (all others: drop, or say
   "the matching `engineering-paved-path` skill, if one covers the stack"):
   `engineering-paved-path:onion-architecture`,
   `engineering-paved-path:frontend-architecture`,
   `engineering-paved-path:typescript-expert`,
   `engineering-paved-path:zod`,
   `engineering-paved-path:fastify-best-practices`,
   `engineering-paved-path:drizzle-orm-patterns`,
   `engineering-paved-path:postgresql-table-design`.
   **Updated after the licence review (D3):** `security`,
   `react-testing-library`, `react-best-practices`, `mermaid-diagram` and
   `next-best-practices` do **not** ship in 1.0.0 (no licence at their
   source). Do not name them; where an agent relied on them, keep the
   guidance generic ("apply the repo's security rules / testing
   conventions") and do not inline their content.
6. **Removed project-specific skills and tools:** `dev-env`,
   `design-reference`, `pr-self-review`, `commit`, `finalize-pr`, every
   `mcp__devdigest__*` tool, `depcruise` as a fixed tool (it becomes "the
   repo's dependency-rule tool, if it has one"), hooks.
7. **Frontmatter.** Keep `name`, `description`, `model`, `effort`, `tools`,
   `omitClaudeMd`, `color`, `maxTurns`. Drop `permissionMode`, `hooks`,
   `mcpServers`, `initialPrompt` (ignored for plugin agents). **Do not use
   `skills:` preloading** (qualified names there are unverified); tell the
   agent to load skills with the Skill tool when relevant. Rewrite the
   `description` so it triggers in any repository. Keep YAML comments that
   explain model choice only if they stay true.
8. **Plugin paths.** A file inside the plugin is `${CLAUDE_PLUGIN_ROOT}/…`; a
   script inside a skill is `${CLAUDE_SKILL_DIR}/…`. Nothing refers outside
   the plugin directory.
9. **English only.** No absolute paths. No secrets.
10. **Session-protocol coupling.** DevDigest's "read INSIGHTS.md and announce
    it" protocol belongs to `engineering-insights`. Agents may keep a line
    "if the repo keeps an insights file, read the relevant one first", but
    not DevDigest's wording.

## Per plugin, also write

- `README.md` — what it does, components with one line each, inputs and
  their defaults, outputs and where they land, how the pieces work together
  (a short Mermaid diagram for `sdd-engineering`), install command,
  dependencies, what it deliberately does not do.
- `CHANGELOG.md` — `## 1.0.0 — 2026-10-15` with the initial contents.
- `COMPATIBILITY.md` — Claude Code `>= 2.1.289`; the dependency ranges;
  plugin-agent frontmatter limits; optional components it uses if present.

## Done when

- `node scripts/check-hygiene.mjs` passes.
- `claude plugin validate plugins/<plugin> --strict` passes.
- Every removed or rewritten DevDigest rule is listed in your report, so a
  person can check the boundary call.

# architecture-review

An **architecture-reviewer** agent that checks a change or an area of code for
layer boundaries, dependency direction, coupling and leaking abstractions —
against **your repository's own architecture docs and dependency-rule tool**,
not against rules hard-coded for one project. Where your docs say nothing, it
falls back to two generic models from `engineering-paved-path` and tells you
which one it used.

## Components

| Component | Kind | What it does |
|---|---|---|
| `architecture-reviewer` | agent | Reads the repo's architecture rules, runs its dependency-rule tool read-only, and returns cited findings with a verdict |

Ask for it by name (`use architecture-review:architecture-reviewer on this
branch`) or let Claude delegate: "does this respect the layers?", a refactor
that moves logic between handlers, services and repositories, a new
integration, or an area audit.

## How it finds the rules

```
task message → CLAUDE.md / AGENTS.md → ARCHITECTURE.md, docs/architecture*, ADRs,
repo skills, insights file → dependency-rule tool config → generic model
```

1. **Architecture docs** — whatever the repo documents. A repo rule always
   beats the generic model.
2. **Dependency-rule tool** — discovered, never assumed: a command named in
   `CLAUDE.md` / `AGENTS.md`, then `Makefile` targets, then package-manifest
   scripts, then a config it recognises (dependency-cruiser, ESLint boundary
   and import rules, Nx module boundaries, import-linter, ArchUnit / Konsist,
   NetArchTest, go-arch-lint, golangci-lint `depguard`, `go vet`). It runs the
   tool read-only from an installed binary, quotes its totals, and separates
   new violations from the base-ref baseline. If there is no tool it says
   `no dependency-rule tool found` with what it searched, and reviews from the
   docs and source. It never installs a tool and never reports a check as
   passed that did not run.
3. **Generic model** — only where the docs are silent:
   `engineering-paved-path:onion-architecture` for backend code,
   `engineering-paved-path:frontend-architecture` for UI code.

## Inputs

| Input | Where it comes from | Default |
|---|---|---|
| Scope | the task message: a base ref, a branch, "the working tree", or a path | the working tree against `git merge-base <default branch> HEAD` |
| Architecture rules | the task message, `CLAUDE.md` / `AGENTS.md`, architecture docs | the generic model, named in the output |
| Dependency-rule command | the task message, `CLAUDE.md` / `AGENTS.md`, `Makefile`, manifest scripts, tool config | none — reported as not found |

## Output

One `<result>` block returned to the caller (at most 500 words, 8 findings):

- a verdict — `NO_FINDINGS`, `CONCERNS` or `BLOCKING`;
- the scope and **which rules governed each package** (`repo: <doc>` or
  `generic: <skill>`);
- the mechanical result — tool totals, base-ref baseline, new violations, or
  `no dependency-rule tool found`;
- findings, each with `path:line`, severity, confidence, a fix, and a
  **`rule:`** citation: a repo doc rule, a rule identifier from the generic
  skills (`onion-architecture → sdk-outside-adapters`), a tool rule, or a
  named principle plus a concrete ripple.

Nothing is written to disk.

## Install

```bash
claude plugin marketplace add dmytrobereznii/dev-digest-ai-marketplace
claude plugin install architecture-review@dev-digest-ai-marketplace
```

## Dependencies

| Plugin | Range | Uses |
|---|---|---|
| `engineering-paved-path` | `^1.0.0` | Skills `onion-architecture` and `frontend-architecture` (the generic models and their rule identifiers, plus `frontend-architecture`'s `enforcement.md` greps) |

It installs automatically with this plugin.

## What it does not do

- Edit files, write a verdict file, install packages, or mutate git or a
  database. Bash is for read-only `git`, the dependency-rule tool in check
  mode, `diff -r` and `grep`.
- Review bugs (`/code-review`), security exposure (a security reviewer, if you
  have one), spec conformance (`sdd-engineering:plan-verifier`), or design a
  structure that does not exist yet.
- Grow a diff review into an audit, or report findings below 80 confidence.
- Propose moving a boundary rule into a different tool.

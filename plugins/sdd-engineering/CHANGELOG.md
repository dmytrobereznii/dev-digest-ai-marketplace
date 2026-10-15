# Changelog

## 1.1.0 — 2026-10-15

### Added

- `spec-creator` will not finish a spec until every required requirement has
  an acceptance criterion. Every goal, `US-n`, `NFR-n`, and every must stated in
  the request or the materials gets a row in a new **Requirement coverage**
  table with the `AC-n` that proves it. A row without an AC must get a
  criterion, move to Non-goals with a reason, or become a blocking question.
  Until then the spec stays `draft` and the agent cannot return `WRITTEN`.
- Eval case `finishes-spec-covers-every-requirement`: a draft spec whose goal
  has no criterion must come out covered, with the coverage table. 1.0.1
  scores 0.64 on it (no table); 1.1.0 scores 1.00.

### Changed

- `spec-creator`'s description now also routes "finish", "complete" or
  "revise this draft spec" requests to it. In one run the main session
  finished a draft spec itself and bypassed the new gate.

Backward compatible: existing specs stay valid, and they gain the table the
next time spec-creator edits them.

## 1.0.1 — 2026-10-15

### Fixed

- `run-plan` now runs `architecture-review:architecture-reviewer` on every
  build that changes source code, including edit-only changes and repos with
  no separate architecture doc. In 1.0.0 it ran only when a file was added,
  renamed or deleted under a boundary named in an architecture doc, so in an
  ordinary repository the review gate never opened. Found by installing 1.0.0
  in another project: an edit-only build across three packages finished with
  plan-verifier alone.
- `run-plan` always states who reviewed and who was skipped, and carries that
  line into the final report.

## 1.0.0 — 2026-10-15

Initial release, extracted from a working project harness and generalized to
run in any repository.

### Agents

- `spec-creator` — feature specs with EARS acceptance criteria `AC-n`,
  sized to the change (a single flag or command usually needs 3–6 criteria;
  see `docs/COST-BASELINE.md`). Its description tells the main session to
  delegate spec requests instead of writing specs itself.
- `implementation-planner` — a `.plan.md` beside the spec; every task cites an
  `AC-n` and a test. Its description tells the main session to delegate plan
  requests, including the plan half of a "spec and plan" request.
- `implementer` — builds a plan or a slice and proves it with the repo's
  discovered checks.
- `test-writer` — writes and runs the tests a slice names; reports source
  bugs instead of fixing them.
- `plan-verifier` — read-only verdict per requirement, with the
  AC → task → test → commit matrix.

### Skills

- `run-plan` — plan → build slice by slice → review → verify for one approved
  spec, with one approval gate and a two-round rework budget.
- `workflow-retro` — manual-only retro from the transcripts on disk, with
  `scripts/report.mjs` (no dependencies) and an append-only ledger.
- `engineering-insights` — read-first, propose-at-the-end loop over
  `INSIGHTS.md`, with seven fixed sections and a cap of three entries per
  session.

### Inputs

- Spec directory, insights file, retro ledger and architecture rules are read
  from `CLAUDE.md` / `AGENTS.md`, with documented defaults.
- Check and test commands are discovered; when none is found, the run stops
  and reports `no test command found`.

### Dependencies

- `architecture-review` `^1.0.0`, `research-tools` `^1.0.0`,
  `engineering-paved-path` `^1.0.0`.

# Changelog

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

# Cost baseline

What one run of the SDD workflow costs, and the one optimisation we measured
against it. Re-measure after any change to `sdd-engineering`'s agents or
skills that could move these numbers, and add a section below.

## How it is measured

**Scenario (fixed).** A user asks for a spec and a plan for a small feature,
`todo list --json`, in a small committed Node CLI with tests. The prompt and
the workspace are the `spec-and-plan` eval case:
`plugins/sdd-engineering/evals/spec-and-plan/`.

**Harness.** `node scripts/cost-run.mjs --label <name> --runs 5 --model claude-sonnet-5-5`

- Each run gets a fresh temp workspace from the case's `fixture.sh` and one headless `claude -p` session.
- The four plugins are loaded from this checkout with `--plugin-dir`.
- User settings and MCP servers are off (`--setting-sources project,local --strict-mcp-config`), and there is no project `CLAUDE.md`.
- Usage comes from the session's own `stream-json` output, summed over every model, which includes the subagents.
- Latency is wall-clock time.
- Raw results go to `.eval-runs/cost-<label>.json`, which is git-ignored.

**Models.** The main session is `claude-sonnet-5-5`, pinned. `spec-creator` and
`implementation-planner` run on `claude-opus-5-5` at high effort, per their own
frontmatter. Claude Code 2.1.299.

**Quality gate.** A run passes only if all of these hold:
- A spec with `Spec ID: SPEC-n` and `AC-1` exists.
- A `.plan.md` exists and cites every AC in the spec.
- Nothing under `src/` or `test/` changed.
- The session ended successfully.
- The spec still covers the two behaviours that matter: an empty list prints `[]`, and output without `--json` is unchanged. Losing either is recorded as a **critical false negative**.

On top of that, the `claude plugin eval` suite (3 cases × 3 runs) must stay at 1.00.

## Baseline — `sdd-engineering` 1.0.0 candidate at `f1abe56`

5 runs, 2026-10-15. Pass rate **5/5**, critical false negatives **0**.

| Run | Pass | Cost | Latency | Input | Output | Cache read | Cache write | API calls | Tool calls | Agent dispatches | ACs | Spec | Plan |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ✓ | $0.903 | 277 s | 30 | 29,804 | 272,543 | 57,565 | 13 | 25 | 2 | 19 | 11.0 KB | 16.2 KB |
| 2 | ✓ | $0.742 | 319 s | 38 | 22,745 | 316,105 | 53,825 | 17 | 23 | 2 | 15 | 8.8 KB | 9.9 KB |
| 3 | ✓ | $0.777 | 224 s | 36 | 24,764 | 294,940 | 54,096 | 16 | 23 | 2 | 19 | 9.9 KB | 12.2 KB |
| 4 | ✓ | $1.076 | 302 s | 46 | 32,674 | 417,741 | 81,065 | 19 | 33 | 4 | 13 | 10.2 KB | 13.5 KB |
| 5 | ✓ | $0.882 | 241 s | 48 | 26,091 | 388,064 | 68,735 | 20 | 24 | 2 | 16 | 9.9 KB | 12.3 KB |
| **Median** | | **$0.882** | **277 s** | 38 | **26,091** | 316,105 | 57,565 | 17 | 24 | 2 | 16 | 9.9 KB | 12.3 KB |

**Where the money goes:**
- About **85–90% of the cost is Opus output in the two subagents**, 20k–29k output tokens per run. The Sonnet main session costs $0.08–0.15.
- Specs ran to **13–19 acceptance criteria for one CLI flag**, and the planner then maps every one of them to tasks and tests.

## Optimisation — size the spec to the change

**One change.** `spec-creator` gained one rule under "Acceptance criteria":

> **Size the set to the change.** One criterion per behaviour a user or a caller can tell apart, not one per sentence of description. A single flag, field or command usually needs 3–6; more than 8 for one command means the criteria restate each other or carry the plan. A case one criterion already decides goes in the Edge cases table, not into a criterion of its own.

Nothing else changed: same model, same routing, same scenario, same harness.

**Why this and not the suggested candidate.** The obvious candidate was removing instructions duplicated between agent prompts. Measured, that duplication is about 1 KB per agent: the shared "Repository conventions" table and a few boilerplate lines. It is cached on every turn after the first, so it would save under 2%, far inside the run-to-run spread above. The data pointed at Opus output instead, and at what drives it: oversized specs that the planner then has to cover.

### Result — 5 runs, 2026-10-15

Pass rate **5/5**, critical false negatives **0**.

| Run | Pass | Cost | Latency | Input | Output | Cache read | Cache write | API calls | Tool calls | Agent dispatches | ACs | Spec | Plan |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ✓ | $1.090 | 294 s | 60 | 32,635 | 503,134 | 84,910 | 26 | 39 | 4 | 7 | 7.4 KB | 13.3 KB |
| 2 | ✓ | $0.698 | 197 s | 36 | 21,804 | 294,270 | 49,860 | 16 | 22 | 2 | 7 | 6.9 KB | 10.3 KB |
| 3 | ✓ | $0.817 | 247 s | 36 | 26,604 | 298,025 | 54,481 | 16 | 22 | 2 | 6 | 7.2 KB | 12.3 KB |
| 4 | ✓ | $0.682 | 176 s | 44 | 19,739 | 335,644 | 57,833 | 18 | 22 | 2 | 6 | 5.6 KB | 9.4 KB |
| 5 | ✓ | $0.530 | 140 s | 34 | 15,417 | 274,375 | 42,574 | 15 | 21 | 2 | 5 | 5.0 KB | 7.0 KB |
| **Median** | | **$0.698** | **197 s** | 36 | **21,804** | 298,025 | 54,481 | 16 | 22 | 2 | 6 | 6.9 KB | 10.3 KB |

| Median | Baseline | Candidate | Change |
|---|---|---|---|
| Cost | $0.882 | $0.698 | −21% |
| Latency | 277 s | 197 s | −29% |
| Output tokens | 26,091 | 21,804 | −16% |
| Acceptance criteria | 16 (13–19) | 6 (5–7) | −63% |
| Spec size | 9.9 KB | 6.9 KB | −30% |

### What we can and cannot claim

- **The behaviour change is real.** The criteria count and spec size do not overlap between the two sets of runs: 13–19 against 5–7 criteria, 8.8–11.0 KB against 5.0–7.4 KB.
- **The cost and latency reductions are likely, but not shown at 5 runs a side.**
  - The per-run ranges overlap: cost $0.74–1.08 against $0.53–1.09, latency 224–319 s against 140–294 s.
  - A one-sided rank test on 5 against 5 gives roughly p ≈ 0.15 for cost and p ≈ 0.08 for latency.
  - We report the medians as measured and do not claim the saving is proven.
- **The largest source of noise is a repeated dispatch.** One run on each side dispatched `spec-creator` and `implementation-planner` twice (4 dispatches), and that run is the most expensive on its side. That cost doesn't come from the spec, so it is not this change's to fix. It is the next thing to investigate.
- **Quality gate.** All 10 runs passed the harness gate with 0 critical false negatives. The eval suite result is below.

#### Eval suite on the candidate

Same 3 cases, 3 runs each, with the plugin only (`--ablation none`), same pinned models.

| Case | Score | Notes |
|---|---|---|
| `ignores-unrelated-question` | 1.00 | |
| `plan-from-spec` | 1.00 | The planner still covers AC-1 to AC-4 of a fixed spec, with nothing out of scope |
| `spec-and-plan` | 0.97, then 1.00 on re-run | See below |

**The one failure was the grader, not the plugin.**
- **What failed:** one run failed `no-source-changes` with "Edit called 1×". That grader matched `src/` anywhere in the Edit call's JSON input, including the text being written. An edit to the spec or plan that merely mentions `src/cli.js` therefore counted as a source change.
- **What else we know about that run:**
  - Its reply says nothing was built.
  - The cost harness checks the real files with `git status` and found no source change in any of its 10 runs.
  - That run's trace was already deleted, so we cannot show which file the Edit touched. "It was a spec or plan edit" is the most likely explanation, not a proven one.
- **The fix:**
  - The grader is now anchored on `file_path` under `src/` or `test/`.
  - A matching `Write` check was added, which the old grader missed.
  - Both were tested against the three shapes: a plan edit mentioning `src/` does not match; a real `src/` Edit and a `test/` Write do.
- **The re-run:** `spec-and-plan` scored 3/3 at 1.00. The kept traces show only two writes per run, the spec and the plan, both by the subagents, and no Edit at all.

## Decision

**Keep the change.**
- It is in `sdd-engineering` 1.0.0.
- The quality gate is green, and there are no critical false negatives in 10 harness runs and 9 eval runs.
- The intended behaviour change is unambiguous: 5–7 criteria instead of 13–19.
- The medians moved the right way: cost −21%, latency −29%, output −16%.

**Not claimed:** that the saving is proven. With this spread, 5 runs a side cannot separate a ~20% change from noise. Before treating the number as settled:
- Run 10 or more per side.
- Find out why a run sometimes dispatches each agent twice.

**Measurement cost:**
- Baseline harness: $4.38.
- Candidate harness: $3.82.
- Eval gate: $3.46, plus a $2.33 re-run.

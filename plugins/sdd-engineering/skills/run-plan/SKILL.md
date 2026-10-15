---
name: run-plan
description: >-
  Builds one approved feature spec end to end through the sdd-engineering
  agents: implementation-planner writes the plan, implementer and test-writer
  build it slice by slice, the reviewers the diff calls for check it, and
  plan-verifier grades every `AC-n`. Use when asked to implement, build, run
  or finish a spec written by spec-creator, given as a path or `SPEC-NN`. Not
  for writing the spec (use spec-creator) or for a change that has no spec.
argument-hint: "[spec path | SPEC-NN]"
---

# run-plan

Runs the plan → build → verify → retro steps of the spec-driven pipeline
described in `${CLAUDE_PLUGIN_ROOT}/README.md` for one spec.

You are the **parent**. You spawn each agent, carry its return into the next
brief, put decisions to the user, commit, and keep the plan's books. The
agents read the code, write it, test it and review it. Your own writes are
three: the spec's `Status:` line, the plan's task boxes and Commit column, and
the commits.

Every delegation uses its brief from [`briefs.md`](briefs.md).

**The plan file is the run's state.** A ticked task box is a landed task, and
a filled Commit cell is a committed one. A run that stopped is re-entered by
invoking this skill again: it resumes at the first slice with an unticked
task.

**Rework** is one resume of an agent to fix what another agent or a lane
found. The budget is two rounds per slice and two after the verdict. A third
round means the plan or the spec is wrong, so stop and report instead.

Arguments passed to the skill: `$ARGUMENTS`

## Inputs

Read each one from the repo's `CLAUDE.md` / `AGENTS.md` first. Use the
default only when the repo says nothing.

| Input | Default |
|---|---|
| Spec directory | `.context/specs/`; in a repo with packages, also `<package>/.context/specs/` |
| Spec file | `YYYY-MM-DD-feature-slug.md` with a `Spec ID: SPEC-NN` header; its plan beside it as `<same name>.plan.md` |
| Check command | Discovered in Step 1. Never assumed |
| Architecture rules | The repo's architecture doc (`ARCHITECTURE.md`, `docs/architecture*`, the relevant section of `CLAUDE.md`), then its dependency-rule tool config, if any |
| Commit convention | What `CLAUDE.md` / `AGENTS.md` says, else the shape of the recent `git log` subjects |

The agents are this plugin's, named by namespace:
`sdd-engineering:implementation-planner`, `sdd-engineering:implementer`,
`sdd-engineering:test-writer`, `sdd-engineering:plan-verifier`,
`sdd-engineering:spec-creator`, plus `architecture-review:architecture-reviewer`
and `research-tools:researcher` from the dependencies. A `security-reviewer`,
`brainstormer` or `doc-writer` is used only **if one is available in the
session**; when it is not, skip that step and say so in the report.

## Step 1 — Resolve the spec and open the run

1. **Find the one spec.** A path is used as given. `SPEC-NN` resolves with
   `grep -rl '^Spec ID: SPEC-NN$' <spec directories>`, by default
   `grep -rl '^Spec ID: SPEC-NN$' .context/specs ./*/.context/specs`. With no
   argument, take the only spec whose status is `approved`; with none or
   several, list them and ask.
2. **Read it in full** and check the gate:
   - A `[NEEDS CLARIFICATION: …]` marker remains: stop, list the markers, and
     name `sdd-engineering:spec-creator`.
   - `Status: draft` with no marker: ask the user to approve it as written.
     On a yes, set the line to `Status: approved`.
   - No `Spec ID:` header: stop. It was not written in the spec-creator
     format, and this skill does not run it. Name
     `sdd-engineering:spec-creator` to rewrite it.
3. **Discover the check command.** Look, in this order:
   1. `CLAUDE.md` / `AGENTS.md` (root, then the package the spec belongs to);
   2. `Makefile` targets (`check`, `test`, `typecheck`, `lint`);
   3. `package.json` scripts, or the ecosystem's own runner where its
      manifest is present: `go test ./...` for `go.mod`, `pytest` for
      `pyproject.toml` / `pytest.ini`, `cargo test` for `Cargo.toml`.

   Record two things: the **full check command** (everything the repo gates
   on: typecheck, lint, dependency rules, unit and integration tests, build),
   and the **fast lanes** a wave runs (typecheck, lint, dependency rules, unit
   tests: whichever of them the repo has). One command may be both.

   **If no test command is found: stop and report `no test command found`,
   with every place you searched.** Never invent a command, and never mark a
   check as passed that did not run.
4. **Record the base.** `BASE` is `git rev-parse HEAD` now. On re-entry it is
   the parent of the oldest hash in the plan's Commit column.
5. **Record the dirty files** from `git status --porcelain`. They are not
   this run's, and no commit of this run stages them.

Done when you hold one approved spec with no marker, the check command,
`BASE`, and the list of files that were already dirty.

## Step 2 — Plan

A plan is `<spec name>.plan.md` beside the spec.

- `Status: ready`: reuse it.
- `Status: draft`: put its open question to the user, then have
  `sdd-engineering:implementation-planner` finish it.
- None: spawn `sdd-engineering:implementation-planner`.

| Planner returns | Next |
|---|---|
| `WRITTEN` | Continue. Its `[recommendation]` feedback goes into the Step 3 summary |
| `BLOCKED` | [Route the return](#routing-a-return-that-is-not-a-success), then resume the planner with the answer |
| `DECLINED` | Stop. The change needs no plan: tell the user it is a direct edit |

Done when the plan is `ready` and the planner's `<coverage>` shows every
`AC-n` and `NFR-n` with a task and a test.

## Step 3 — One gate before the build

Show the planner's `<summary>`, `<decisions>`, the slice list and any
recommendation it had for the spec. Then ask both questions in one
`AskUserQuestion`:

1. **Execution**: in order (one slice at a time) or in parallel (the plan's
   §5 groups). Put the planner's recommendation first.
2. **Commits**: commit after each landed slice, or leave everything in the
   working tree.

If this session also wrote the spec or the plan, say above the questions that
the build can start from a fresh session instead, with
`/sdd-engineering:run-plan <spec path>`: the plan file is the run's state, and
every agent return re-reads the parent's whole context.

This is the only planned stop. After it, stop again only for a routed
decision or a spent rework budget.

## Step 4 — Build, slice by slice

Follow the plan's §5 order. In parallel mode each §5 group is one wave:
spawn its implementers in one message. The slices of a wave share this
working tree, because `isolation: worktree` branches from the default branch
and would not hold the earlier slices. That is why their briefs carry the
parallel clause, and why you run the fast lanes from Step 1 yourself once the
wave's agents are back.

For each slice:

1. Spawn `sdd-engineering:implementer` with the slice brief. Keep its agent
   id. A task whose only output is a test file or an end-to-end flow has no
   implementer step: leave it out of the implementer's brief and give it to
   `sdd-engineering:test-writer` with the slice's tests. A task whose only
   output is prose in the spec directory's project notes (a `.context/`
   directory or its equivalent) goes to the implementer.
2. On `DONE`, spawn `sdd-engineering:test-writer` for the tests the slice's
   task lines name and that do not exist yet. A slice with none skips this.
3. Read the returns:

   | Return | Next |
   |---|---|
   | test-writer `GREEN` | Land the slice |
   | `RED_SOURCE_BUG`, or a `<needs_source_change>` | Rework: resume that implementer with the items, then resume the test-writer to re-run |
   | A lane you ran is red | Rework: resume the implementer whose file the first error names |
   | implementer `BLOCKED` or `PARTIAL`, test-writer `BLOCKED` or `PARTIAL` | [Route the return](#routing-a-return-that-is-not-a-success) |

4. **Land the slice.** Tick its task boxes in the plan. With commits
   approved:
   - Stage by path: the files both returns list, plus the by-products of
     their owning tools (a generated migration and its metadata, a lockfile
     beside a dependency change).
   - Commit in the repo's commit convention, one commit per slice.
   - Write `git log -1 --format=%h` into the Commit cell of every `AC-n` and
     `NFR-n` row the slice's tasks cite.

   A changed file that no return names stays unstaged and goes in the final
   report.

Hold every `<deviations>`, `<notes>` and `<insight_candidates>` you receive:
Step 7 and Step 8 need them.

Done when every task box in the plan's §3 is ticked.

## Step 5 — Check the whole tree

Run the full check command from Step 1 once, as
`<check command> 2>&1 | tail -40`. It adds the lanes the slices did not run,
such as integration tests and the build.

- Red: rework with the implementer whose file the first error names, then run
  it again.
- A lane that skipped itself (no Docker, a dev server holding a port the
  build needs) is `SKIPPED`, and the final report says so.

Done when the check command exits 0 and you have listed the lanes that
skipped.

## Step 6 — Review what the diff calls for

Read `git diff --name-status "$BASE"` and spawn every reviewer whose row
matches, all in one message:

| The run produced | Agent |
|---|---|
| A file added, renamed or deleted under a path the repo's architecture doc names as a boundary (a layer, ring, module root, or a shared-contracts package); or a plan decision that adds a port, an adapter, a module or a layer | `architecture-review:architecture-reviewer` |
| A spec whose **Untrusted inputs** section names an input; or a change to request handlers or routes, settings or secret handling, adapters to external services, prompt assembly for a model, a shell or process call, or UI that renders user-, third-party- or model-supplied text | a `security-reviewer` agent, **if one is available in the session**; otherwise skip it and say so |

Say in one line which ran and why, including when none did:
`Reviewers: architecture-reviewer (new adapter under the infrastructure layer). Security: skipped, no security-reviewer in this session (AC-6 renders user-supplied titles).`

- `BLOCKING` from the architecture reviewer, or `BLOCK` from a security
  reviewer: one rework round with the implementer that owns the path, then
  resume the reviewer to re-check those findings only.
- Every other finding goes in the final report. It is the user's call.
- A finding that disputes a plan decision `Dn` or an `AC-n` is a decision,
  not a fix: [route it](#routing-a-return-that-is-not-a-success).

Then, only when a task in the plan names a documentation file, spawn a
`doc-writer` agent with the changed paths if one is available in the session.
If none is, list those docs in the final report as the user's to update.

Commit what this step changed as its own commit, if commits are approved, and
run the full check command again if any source changed.

## Step 7 — Verify against the spec

Spawn `sdd-engineering:plan-verifier` with the verify brief: the spec path,
`BASE`, the full check command's result and the deviations you held.

| Verdict | Next |
|---|---|
| `CONFORMS` | Set the spec to `Status: implemented` |
| `GAPS` | Rework each Missing or Partial row: a source gap to the implementer, a test gap to the test-writer, each brief quoting the row. Run the full check command, then resume the verifier on those IDs only |
| `BLOCKED` | Supply what it names and resume it |

A **Deviated** row is a question before it is a gap. Where an implementer's
`<deviations>` line explains it, the plan is the stale side: resume
`sdd-engineering:implementation-planner` to amend that `Dn`, then re-verify
the row. Where nothing explains it, rework it like a Missing row.

`<spec_issues>` and `<unplanned>` are never fixed in code. They go to the
user in the final report: spec-creator and implementation-planner own the
edits, and an unplanned change is the user's to keep or drop.

Done when the verdict is `CONFORMS`, or the rework budget is spent and every
open row is listed for the user.

## Step 8 — Close the run

1. With commits approved, commit the spec and the plan with their final
   status, boxes and Commit cells.
2. Report:

   ```markdown
   ## SPEC-NN <feature name>: CONFORMS | GAPS (<n> open)

   **Coverage:** <the verifier's coverage line>
   **Checks:** `<check command>` PASS · skipped: <lane (reason)> | none
   **Run:** <n> agents · <n> rework rounds · in order | in parallel

   | Slice | Tasks | Commit | Rework |
   |---|---|---|---|
   | 3.1 Contracts | T1–T3 | a1b2c3d | 0 |

   **Yours to decide:** <open verifier rows · reviewer findings that were not
   fixed · reviewers skipped as unavailable · unplanned changes · spec issues
   · deviations · unstaged files> | none
   ```

3. Run `sdd-engineering:engineering-insights` with the candidates you held.
   Then tell the user the run can be reviewed with
   `/sdd-engineering:workflow-retro`; it runs only when they invoke it.

Opening a pull request is not part of this skill. It starts on the user's ask.

## Routing a return that is not a success

A `BLOCKED` or `PARTIAL` return is a decision that belongs to someone else.
Find the owner, get the answer, and **resume the blocked agent** with it
through `SendMessage`, so it keeps the context it built. After re-entry in a
new session the agent ids are gone: spawn a fresh agent whose brief names
only the open items.

| The return needs | Owner |
|---|---|
| A change to what the user sees, a criterion, scope or a non-goal | The user decides through `AskUserQuestion`, with the agent's proposed wording as the first option. Then `sdd-engineering:spec-creator` edits the spec, and the planner is resumed to re-plan the tasks it touches |
| A change to the how: a contract shape, a new table, module or dependency, a task that cannot be built as written | `sdd-engineering:implementation-planner`, resumed with the blocker. It amends the plan |
| A pick between viable directions | A `brainstormer` agent if one is available in the session, then resume the agent with the pick. Otherwise the user picks through `AskUserQuestion`, with the options the blocked agent named |
| A fact about a library or the running system | `research-tools:researcher`, then resume the agent with the finding |
| A failure outside this run's diff | The user. Report it and carry on with the slices it does not block |
| Two or three failed attempts at the same error | The user. That slice stops; slices that do not depend on it continue |

A plan edited mid-run keeps its ticked boxes. Slices already landed are
rebuilt only where the planner says the change reaches them.

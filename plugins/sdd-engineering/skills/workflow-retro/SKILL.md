---
name: workflow-retro
description: >-
  Runs a retro on a finished session or multi-agent run, from the transcripts
  on disk: what was asked, what the agents actually worked on, where and why
  they left the task, what that cost, and which instruction let it happen. Use
  after a spec → plan → build pipeline run or any session that spawned
  subagents, and for "retro", "review the workflow", "what were you doing",
  "why was that run so expensive".
argument-hint: "[session-id ...] [--since 2h] [--type implementer]"
disable-model-invocation: true
allowed-tools:
  - Bash(node "${CLAUDE_SKILL_DIR}/scripts/report.mjs" *)
---

# workflow-retro

A **retro** on one run. Its subject is **focus**: what was asked, against what
the work actually went to. It reads like "you asked for the export endpoint;
60% of the turn went to debugging the auth middleware, because its
integration test failed during the test run". Tool calls and token counts are
**evidence** for that story, never the story.

It produces a focus account per ask, at most three **actions** on the
instructions that allowed a drift, and one row in the retro ledger.

A fact about the codebase goes to `/sdd-engineering:engineering-insights`.
This skill changes how the agents are instructed.

Output formats: [`template.md`](template.md). What the numbers mean:
[`references.md`](references.md), for a number that looks wrong and for
whoever next changes the script.

## Inputs

| Input | Default |
|---|---|
| Sessions | This one, `${CLAUDE_SESSION_ID}` |
| Retro ledger | The path the repo's `CLAUDE.md` / `AGENTS.md` names, else `.context/retros/ledger.md` |
| Agent-authoring checklist | The repo's own guide for writing agents and skills, if it has one; else none |

The script reads Claude Code's transcripts for this project from
`~/.claude/projects/` (or `$CLAUDE_CONFIG_DIR/projects/`), needs Node 18 or
later, and writes nothing.

## Step 1 — Scope the run

1. Pick the sessions. The default is this one, `${CLAUDE_SESSION_ID}`. A
   pipeline that wrote the spec and plan in one session and built in another
   is one run: list the sessions and pass every id.

   ```sh
   node "${CLAUDE_SKILL_DIR}/scripts/report.mjs" --list
   ```

2. If a session holds more than the run, cut it with `--since` / `--until`.
3. Read the ledger: the last five rows and every `open` action. If it does
   not exist yet, this is the first retro: the ledger is created in Step 6
   from the skeleton in [`template.md`](template.md).

Arguments passed to the skill: `$ARGUMENTS`

Done when you can name the sessions, and the open actions this run can
confirm or refute.

## Step 2 — Read the timeline

```sh
node "${CLAUDE_SKILL_DIR}/scripts/report.mjs" <session-id> [<session-id> ...] --timeline
```

It lists every **ask** (a human turn in the main session, the brief of an
agent) and then the work that followed, in chunks of 25 calls: the
directories touched, the commands run, the agents spawned, and what the agent
said at the time.

## Step 3 — Account for the focus

For every ask, in the main session first and then in each agent:

1. **State the focus** the ask set, in the asker's words.
2. **Name each chunk's activity** in plain words: "debugging the auth
   middleware", "testing the export view in the browser", "re-running lint".
   Name the feature or the problem, not the tool.
3. **Label it**:
   - `on-task`: the ask needs it.
   - `detour`: off the ask, but the ask was blocked without it, such as a bug
     in feature A that stops feature B's tests.
   - `drift`: off the ask and not needed for it.
4. For every detour and drift, record:
   - **where** it began: the chunk and its time
   - **the trigger**: the agent's own words, or the error, that turned it
   - **the size**: calls, and the share of that ask's input
   - **whether it came back**, and whether the asker was told at the time
   - **the gap**: the wording in the prompt, brief, agent definition or skill
     that made it look in scope, or the missing line that would have stopped
     it. Quote it.

The timeline holds no thinking, because transcripts store none. The agent's
remarks are the only direct record of why it turned. When a turn has no
stated reason, write `unexplained` and open a trace of that agent:

```sh
node "${CLAUDE_SKILL_DIR}/scripts/report.mjs" <session-id> --agent <id>
```

When the run happened in this session, the conversation is evidence too: a
user correction outranks anything on disk.

Done when every chunk of every ask has an activity and a label, and every
detour and drift has its five facts.

## Step 4 — Size it and record the outcome

```sh
node "${CLAUDE_SKILL_DIR}/scripts/report.mjs" <session-id> [<session-id> ...] --ledger <ledger path>
```

Use this report for two things only: what each detour and drift cost, and
which agents were expensive while on-task. Cost is requests × context: each
request re-reads the whole context, so an agent with 80 requests at 200k
reads 14M tokens however small each tool result was.

Then record what the run bought:

- the `plan-verifier` verdict, with its counts of Partial, Missing and Deviated
- whether the check lanes were green at the end
- rework: agents spawned to fix an earlier agent's work
- human corrections: how many, and what each corrected

## Step 5 — Turn findings into actions

Most actions come from a gap found in Step 3:

| Finding | Action |
| --- | --- |
| Drift the ask did not exclude | The brief or definition states the scope's edge: "only X; report anything else you find and stop" |
| A detour nobody was told about | The definition's output template gains a line for work done outside the brief |
| A detour that recurs across runs | The blocker is a real defect or a missing step upstream: fix it, or put it in the plan |
| A vague ask ("continue", "fix it") followed by wide work | The parent restates the focus before delegating; the brief template names the done criterion |
| An agent that kept going after its task was done | The definition's stop condition |
| Expensive while on-task: many requests at a large context | Smaller briefs, batched reads, one full check lane at the end |
| The same file re-read by many agents | Quote the needed section in the brief |

Rules for an action:

- **One run is an anecdote.** Propose an action when the drift was large, or
  the same gap shows in the ledger. Put the rest under Watch.
- **At most three actions**, and one change per agent, so the next run can
  attribute the difference.
- An action names the file, the exact wording to add or change, the evidence,
  and the **expected effect** the next retro can check.
- An agent or skill installed from a plugin lives in the plugin cache and is
  overwritten on update. Target the repo's own instructions instead
  (`CLAUDE.md`, a project agent or skill, the brief the parent writes), or
  record the action as a proposed change to that plugin and apply nothing.

## Step 6 — Report and record

1. Report in chat, in the format in [`template.md`](template.md).
2. Put the actions in one `AskUserQuestion` multi-select. Each option shows
   the exact change and its target file.
3. Apply the selected actions. An edit to an agent or skill passes the repo's
   agent-authoring checklist, if it has one.
4. Write the ledger: append the run's row, add each applied action as `open`,
   and set every earlier `open` action this run tested to `confirmed` or
   `no effect`. Create the ledger from the skeleton in
   [`template.md`](template.md) if it does not exist.

Report one line per file written, then stop.

## Reviewing one agent over time

To validate a single agent rather than a run, read its recent history:

```sh
node "${CLAUDE_SKILL_DIR}/scripts/report.mjs" --last 10 --type implementer --timeline
```

`--type` also matches a plugin-namespaced agent type such as
`sdd-engineering:implementer`. Account for the focus of each run as in Step 3,
then look for the gap that repeats. This path writes actions, and no ledger
row.

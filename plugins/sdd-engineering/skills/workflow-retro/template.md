# workflow-retro — output formats

## The report, in chat

```markdown
## Retro: <run name> (<date>, sessions <id8>[+<id8>])

**Focus:** <n>% on-task · <n> detour(s) · <n> drift(s)
**Outcome:** <plan-verifier verdict and counts> · checks <green | red: lane> ·
<n> rework agent(s) · <n> human correction(s)
**Cost:** <$> · <n> agents, peak <n> parallel · main active <t>

### Asked vs did

**Turn 2: "start implementation"** (55 calls, 33% of the session)
- on-task: ran the spec's seven steps through 13 agents, one after another
- detour: fixed the "1 files" plural by hand while checking the browser
  (+1h43m, 6 calls). Trigger: "One bug: the count reads '1 files'". Came back,
  and said so at the time. Gap: none, the fix was inside the feature.

**implementer#6: "Step 6: export view + hooks + translations"** (116 calls)
- on-task: read the existing table view, built the view, hooks and strings
- drift: ran every lane one by one and then the full check command, which
  repeats them (+15m22s, 14 calls, 12% of its input). Trigger: the brief
  lists five checks and the definition says "run the repo's checks". Did not
  report it. Gap: neither says the full check command covers the rest.

### Findings

1. <claim> — <evidence: chunk, quote or number>

### Actions

| Id | Target | Change | Evidence | Expected effect |
| --- | --- | --- | --- | --- |
| R4-A1 | `CLAUDE.md` § Running checks | <the wording> | <the drift it answers> | <what the next retro should see> |

### Watch

- <a gap seen once, with its evidence; not yet an action>

### Earlier actions

- R3-A2 → confirmed: <what this run showed> | no effect | not tested
```

One block per ask, main session first, then agents in start order. An ask
that stayed on-task gets one line. Leave out a section that has nothing in
it, except Outcome and Actions: write `none` there.

The on-task share is calls labelled `on-task` ÷ all calls in the run.

## The ledger

Default path `.context/retros/ledger.md`, append-only. The script prints the
row with the measured cells filled; the last four are yours.

```markdown
| 2026-10-03 | R4 csv-export | 3b6db235 | 19 | 2 | 2h29m | ~361k | 3.12M | 93.5M | 97% | 6 | $44.13 | 88% | CONFORMS after 2 rework agents | implementers re-ran every lane before the full check | R4-A1 |
```

- **Run**: `R<n>` and a short name. `n` is one sequence for the whole file.
- **On-task**: the share from the report.
- **Outcome**: the Step 4 result in a few words.
- **Top finding**: the largest detour or drift, or the largest on-task cost.

An action, under `## Actions`, newest first:

```markdown
- **R4-A1** `open` — `CLAUDE.md` § Running checks: "While iterating, run the
  one test file. Before reporting, run the full check command once."
  Evidence: implementer#6 ran 14 lane commands, then the full check. Expect:
  at most two full-lane commands per implementer.
```

When a later run tests it, change the status and say what that run showed.
Keep the original text.

```markdown
- **R4-A1** `confirmed` in R5 (full-lane commands per implementer 14 → 1) — …
- **R4-A2** `no effect` in R5 — …
```

## A new ledger

When the ledger does not exist, create it with this skeleton. The column
order is the order the script prints the row in.

```markdown
# Workflow retros — ledger

One row per multi-agent run, written by the `workflow-retro` skill.
Read the trend, not the row: one run is an anecdote.

**Append-only.** Newest row last.

## Runs

| Date | Run | Sessions | Agents | Max parallel | Main active | Out | Cache write | Cache read | Hit | Tool errors | Cost | On-task | Outcome | Top finding | Actions |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## Actions

Newest first. Status is `open`, `confirmed` or `no effect`.
```

---
type: llm
focus: last_message
weight: 2
---
The approved spec has exactly four criteria: AC-1 (`--json` prints a JSON array), AC-2 (empty list prints `[]`), AC-3 (output without `--json` unchanged), AC-4 (items have exactly `id`, `text`, `done`). Out of scope: filtering, sorting, JSON for `add` and `done`.
PASS if the reply describes a plan whose tasks are tied to these AC ids, covers all four, and adds no out-of-scope requirement.
FAIL if a criterion is missing, a task adds filtering, sorting or JSON output for `add`/`done`, or the reply says code was implemented.

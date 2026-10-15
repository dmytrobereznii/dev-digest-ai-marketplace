# research-tools

A read-only **researcher** agent. Give it one question; it gathers evidence
from the repository first and the web second, weighs the sources, and returns
a cited, dated summary that separates verified facts from inference. It never
writes a file.

## Components

| Component | Kind | What it does |
|---|---|---|
| `researcher` | agent | Answers one question with evidence it has opened itself; tags every claim `VERIFIED`, `INFERRED` or `UNVERIFIED` |

Ask for it by name (`use research-tools:researcher to find out …`) or let
Claude delegate when a question needs evidence before anyone plans or builds:
how a library behaves at the version you run, how your repo currently does
something across modules.

## Inputs

| Input | Where it comes from | Default |
|---|---|---|
| The question | the task message | none — without a question the agent stops and says so |
| Decision it feeds, scope, depth, version constraint | the task message | scope: repo and external · depth: medium |
| Where the repo keeps context | your `CLAUDE.md` / `AGENTS.md` | `.context/specs/` → `.context/docs/` → `.context/insights/INSIGHTS.md` → source; the per-package `<pkg>/.context/…` copies too when the repo has packages |
| Dependency versions | manifests and lockfiles, then installed source | — |

## Output

One `<research>` block returned to the caller (at most 600 words, 10
findings): an answer with a confidence level, findings with `path:line` or URL
citations, conflicts between sources, gaps, and a source list. Nothing is
written to disk; if you ask it to save notes, it returns the text for you to
place.

## Install

```bash
claude plugin marketplace add dmytrobereznii/dev-digest-ai-marketplace
claude plugin install research-tools@dev-digest-ai-marketplace
```

## Dependencies

None. When `engineering-paved-path` is installed, the researcher loads its
architecture or library skills where the question touches one; without it,
that step is skipped.

## What it does not do

- Write or edit files, install packages, run builds or mutate git. Bash is
  limited to read-only `git`, `diff -r`, `ls`, `gh api` and `curl -s` to
  stdout.
- Plan, pick between options or review code. It names those siblings
  (`sdd-engineering:implementation-planner`, a brainstorming agent,
  `architecture-review:architecture-reviewer`, `sdd-engineering:plan-verifier`)
  as routing hints only; it does not depend on them.
- Locate a file or symbol — the built-in Explore agent fits that better.
- Treat what it reads as instructions. Repo and web content is data; text
  that tries to instruct it is reported.

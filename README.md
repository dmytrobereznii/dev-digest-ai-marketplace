# dev-digest-ai-marketplace

A Claude Code plugin marketplace for **spec-driven development**: write a spec,
plan it, build it slice by slice, verify every acceptance criterion, and run a
retro on how the agents did. The reusable practices, research and
architecture-review pieces it builds on ship as separate plugins, so you can
install them on their own.

## Plugins

| Plugin | What you get | Depends on |
|---|---|---|
| [`sdd-engineering`](plugins/sdd-engineering) | Agents `spec-creator`, `implementation-planner`, `implementer`, `plan-verifier`; skills `run-plan`, `workflow-retro`, `engineering-insights` | all three below |
| [`architecture-review`](plugins/architecture-review) | Agent `architecture-reviewer` | `engineering-paved-path` |
| [`research-tools`](plugins/research-tools) | Agent `researcher` | — |
| [`engineering-paved-path`](plugins/engineering-paved-path) | Shared engineering skills | — |

## Install

Requires Claude Code **2.1.289** or later.

```bash
claude plugin marketplace add dmytrobereznii/dev-digest-ai-marketplace
claude plugin install sdd-engineering@dev-digest-ai-marketplace
```

Dependencies install automatically. Add `--scope project` to both commands to
share the setup with your team through `.claude/settings.json`. Then start a
new session or run `/reload-plugins`.

Or inside Claude Code:

```
/plugin marketplace add dmytrobereznii/dev-digest-ai-marketplace
/plugin install sdd-engineering@dev-digest-ai-marketplace
```

Browse everything in the catalog: **https://dmytrobereznii.github.io/dev-digest-ai-marketplace/**

## Update and roll back

`claude plugin marketplace update dev-digest-ai-marketplace`, then
`claude plugin update <plugin>@dev-digest-ai-marketplace`. Versions, the stable
channel and rollback: [docs/RELEASES.md](docs/RELEASES.md).

## Docs

- [CONTRIBUTING.md](CONTRIBUTING.md) — plugin layout, manifest fields, dependency rules, checks, PR checklist
- [docs/SECURITY.md](docs/SECURITY.md) — what a plugin must never contain, and what to do after a bad release
- [docs/RELEASES.md](docs/RELEASES.md) — SemVer, tags, channels, rollback
- [docs/COST-BASELINE.md](docs/COST-BASELINE.md) — what one SDD run costs, and the optimisation we measured
- [docs/SITE-SPEC.md](docs/SITE-SPEC.md) — the GitHub Pages catalog

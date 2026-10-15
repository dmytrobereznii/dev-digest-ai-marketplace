# Changelog

## 1.0.0 — 2026-10-15

Initial release.

- `researcher` agent: repo-first, read-only research that returns a cited,
  dated `<research>` block with `VERIFIED` / `INFERRED` / `UNVERIFIED` findings,
  conflicts, gaps and sources.
- The repo's context reading order is read from `CLAUDE.md` / `AGENTS.md`, with
  `.context/specs/` → `.context/docs/` → `.context/insights/INSIGHTS.md` →
  source as the default.
- Loads `engineering-paved-path` skills with the Skill tool when that plugin is
  installed and the topic matches.

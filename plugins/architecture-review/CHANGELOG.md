# Changelog

## 1.0.0 — 2026-10-15

Initial release.

- `architecture-reviewer` agent: reviews a diff or an area for dependency
  direction, coupling and leaking abstractions.
- Reads the repository's own architecture rules (`CLAUDE.md` / `AGENTS.md`,
  `ARCHITECTURE.md`, `docs/architecture*`, ADRs, repo skills) instead of
  built-in project checks.
- Discovers and runs the repo's dependency-rule tool read-only and cites its
  output; reports `no dependency-rule tool found` when there is none.
- Falls back to `engineering-paved-path:onion-architecture` and
  `engineering-paved-path:frontend-architecture` where the repo's docs are
  silent, and names the model used in its output.
- Every finding cites a repo rule, a generic-skill rule identifier, a tool rule,
  or a named principle with a concrete ripple.

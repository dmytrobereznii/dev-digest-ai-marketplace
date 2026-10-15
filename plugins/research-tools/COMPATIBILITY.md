# Compatibility

| Requirement | Range |
|---|---|
| Claude Code | `>= 2.1.289` |
| Plugin dependencies | none |

## Plugin-agent frontmatter

The agent declares `name`, `description`, `model: sonnet`, `tools` and
`omitClaudeMd: true`. Claude Code ignores `permissionMode`, `hooks` and
`mcpServers` on plugin agents, so the agent relies on none of them; its
read-only behaviour comes from its tool list (`Read, Grep, Glob, WebFetch,
WebSearch, Bash, Skill` — no `Write` or `Edit`) and the constraints in its
prompt. It does not preload skills through `skills:`; it loads them with the
Skill tool when relevant.

Because of `omitClaudeMd: true` the agent does not see your `CLAUDE.md`
automatically. It reads `CLAUDE.md` / `AGENTS.md` itself when the repo's
layout matters.

## Optional components it uses if present

| Component | Used for | Without it |
|---|---|---|
| `engineering-paved-path` skills (`onion-architecture`, `frontend-architecture`, `typescript-expert`, `zod`, `fastify-best-practices`, `drizzle-orm-patterns`, `postgresql-table-design`) | Where-does-code-belong and library questions | Skipped |
| The built-in `Explore` agent | Named as the better fit for pure "where is X" lookups | — |
| `gh` CLI | `gh api` for verbatim upstream content | Falls back to `curl -s` or WebFetch |
| WebFetch / WebSearch permissions | External sources | Repo-only answer; external gaps reported as `UNVERIFIED` |

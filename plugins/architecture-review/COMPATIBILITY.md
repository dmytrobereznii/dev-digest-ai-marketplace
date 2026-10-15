# Compatibility

| Requirement | Range |
|---|---|
| Claude Code | `>= 2.1.289` |
| `engineering-paved-path` | `^1.0.0` |

The reviewer cites the rule identifiers listed in
`engineering-paved-path`'s `onion-architecture` and `frontend-architecture`
skills. Those identifiers are stable within the `1.x` range; renaming or
removing one is a major version of `engineering-paved-path`.

## Plugin-agent frontmatter

The agent declares `name`, `description`, `model: sonnet`, `tools` and
`omitClaudeMd: true`. Claude Code ignores `permissionMode`, `hooks` and
`mcpServers` on plugin agents, so the agent relies on none of them; its
read-only behaviour comes from its tool list (`Read, Grep, Glob, Bash, Skill` —
no `Write` or `Edit`) and the constraints in its prompt. It does not preload
skills through `skills:`; it loads the two generic models with the Skill tool
when the repo's docs are silent.

Because of `omitClaudeMd: true` the agent does not see your `CLAUDE.md`
automatically. It reads `CLAUDE.md` / `AGENTS.md` itself as the first source
of architecture rules and house rules.

## Optional components it uses if present

| Component | Used for | Without it |
|---|---|---|
| A dependency-rule tool installed in the repo (dependency-cruiser, ESLint boundary rules, import-linter, ArchUnit, go-arch-lint, `depguard`, …) | The mechanical check and the new-versus-baseline split | Reviews from docs and source; says `no dependency-rule tool found` |
| An architecture-test framework run through the test suite (ArchUnit, Konsist, NetArchTest) | Same | Needs a discoverable test command; otherwise reports `no test command found` |
| An insights file in the repo | Accepted cycles and known debt | — |
| A security reviewer agent | Handoff target for exposure noted in `<notes>` | Handoff named generically |
| `sdd-engineering` | Routing hints in the description only | — |

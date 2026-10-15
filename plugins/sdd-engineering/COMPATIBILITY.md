# Compatibility

## Claude Code

`>= 2.1.289`. Earlier versions are untested: plugin dependencies, namespaced
plugin agents and skills, and `claude plugin validate` on a directory that
holds both manifests are what this release relies on.

## Dependencies

| Plugin | Range |
|---|---|
| `engineering-paved-path` | `^1.0.0` |
| `research-tools` | `^1.0.0` |
| `architecture-review` | `^1.0.0` |

They install with this plugin. A range resolves against the marketplace's
`<plugin>--v<version>` tags.

## Runtime

- `git`, in a git repository: `run-plan` records a base commit and diffs
  against it.
- Node.js 18 or later for `workflow-retro`'s `scripts/report.mjs`. It has no
  dependencies and touches no lockfile.
- `workflow-retro` reads Claude Code's local transcripts under
  `~/.claude/projects/` (or `$CLAUDE_CONFIG_DIR/projects/`). Their format is
  undocumented; the script was built against transcripts from Claude Code
  2.1.272 to 2.1.285. See `skills/workflow-retro/references.md`.

## Plugin-agent frontmatter limits

- Plugin agents ignore `permissionMode`, `hooks`, `mcpServers` and
  `initialPrompt`, so none of these agents uses them. Write scopes and
  read-only Bash are enforced by each agent's prompt, not by permissions.
- The agents do not preload skills with `skills:`; they load skills with the
  Skill tool when the change calls for one.
- `AskUserQuestion` is not available to an agent running as a subagent. The
  agents return their questions to the parent, which asks you.
- `workflow-retro` sets `disable-model-invocation: true`, so only you can
  start it, and its `allowed-tools` grants only its own script invocation.

## Optional components used if present

| Component | Used by | Without it |
|---|---|---|
| A `security-reviewer` agent | `run-plan` Step 6 | Security review is skipped and the report says so |
| A `brainstormer` agent | `run-plan`, for a choice between directions | The choice goes to you |
| A `doc-writer` agent | `run-plan`, when the plan names a doc | The docs are listed in the report as yours to update |

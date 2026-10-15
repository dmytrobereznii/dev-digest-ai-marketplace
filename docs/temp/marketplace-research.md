# Marketplace research

> **Temporary.** Delete once the first release ships; the durable parts live in
> `CONTRIBUTING.md`, `docs/RELEASES.md` and `docs/SECURITY.md`.

As of 2026-10-15, Claude Code **2.1.299**. Sources: `claude plugin <cmd> --help`
and the raw pages under `https://code.claude.com/docs/en/` (`DOCS/` below).
**Verified** means read in one of those; everything else is marked.

## Facts we build on

### Manifests

- `.claude-plugin/marketplace.json` requires `name`, `owner.name`, `plugins[]`;
  each entry requires `name` and `source`. Relative sources start with `./`
  and may not contain `..`. `validate` warns when `description` is missing.
  *(DOCS/plugins/marketplace-reference.md)*
- Put `version` in `plugin.json` only. It wins over the marketplace entry, and
  `validate` warns when both are set. *(DOCS/plugins/loading.md)*
- If `version` is set and commits are pushed without bumping it, users stay on
  the cached copy. Every behavioural change needs a bump.

### Dependencies

- `plugin.json` → `dependencies: [{ "name", "version": "<semver range>" }]`, or
  a bare string. Ranges are node-semver. *(DOCS/plugins/dependencies.md)*
- Bare names resolve in the declaring plugin's **own** marketplace.
- The installer installs missing dependencies automatically; `claude plugin
  prune` removes ones nothing needs.
- A range resolves against `<name>--v<version>` **git tags on the marketplace
  repo**. For a relative-path plugin with no satisfying tag, the install falls
  back to the current copy, and the range is checked only at load time. So
  **tag every plugin on every release**, dependencies first.
- `claude plugin list --json` → `errorDetails[].type` is
  `dependency-unsatisfied` or `dependency-version-unsatisfied`.
  *(DOCS/plugins/troubleshooting.md)*

### Validation and tags

- `claude plugin validate <path> [--strict] [--json]`. `--strict` turns
  warnings into errors, intended for CI. A root run does not open plugin
  component files, so validate each plugin directory too.
- `claude plugin tag [path] [--dry-run] [--push]` creates `{name}--v{version}`
  after validating, and checks that `plugin.json` and the marketplace entry
  agree. It needs a clean tree and refuses an existing tag.

### Plugin components

- Plugin agents honour `name`, `description`, `model`, `effort`, `maxTurns`,
  `tools`, `disallowedTools`, `skills`, `memory`, `background`,
  `omitClaudeMd`, `isolation`, `color`. **`permissionMode`, `hooks`,
  `mcpServers`, `initialPrompt` are ignored.** *(DOCS/plugins/components.md)*
- Names are namespaced: skill `/plugin:skill`, agent `plugin:agent`.
- `${CLAUDE_PLUGIN_ROOT}` is the versioned cache dir (changes on every update;
  never write state there). `${CLAUDE_PLUGIN_DATA}` survives updates.
  `${CLAUDE_SKILL_DIR}` is the skill's own directory.
- Installed plugins are **copied** to a cache. Files outside the plugin
  directory (`../shared`) are not copied.

### Install, update, auto-update

```bash
claude plugin marketplace add dmytrobereznii/dev-digest-ai-marketplace --scope project
claude plugin install sdd-engineering@dev-digest-ai-marketplace --scope project
claude plugin marketplace update dev-digest-ai-marketplace
claude plugin update sdd-engineering@dev-digest-ai-marketplace --scope project
```

- `--scope project` writes `extraKnownMarketplaces` and `enabledPlugins` into
  the project's committed `.claude/settings.json`.
- Auto-update is off by default for third-party marketplaces. Turn it on with
  `"autoUpdate": true` on the `extraKnownMarketplaces` entry, or with the
  `/plugin` → Marketplaces → "Enable auto-update" toggle.
  *(DOCS/settings-reference.md)*

### Release channels and rollback

- "Claude Code has no release-channel concept." Channels are **two
  marketplaces with different `name`s** whose entries point at different refs.
  *(DOCS/plugins/host-marketplace.md → Run release channels)*
- A relative-path source cannot be pinned; a `github`, `url` or `git-subdir`
  source takes `ref` / `sha`. A marketplace can be added from a hosted
  `marketplace.json` URL. *(DOCS/plugins/cli-reference.md)*
- **There is no `plugin rollback` command** (confirmed in `claude plugin --help`).

### Evals and cost

- `claude plugin eval [target]` (v2.1.269+): cases under `evals/<case>/` with
  `prompt.md` and `graders/*.md`; grader types `regex`, `tool_used`,
  `tool_order`, `file_exists` (free) and `llm`, `baseline` (judged). It runs a
  with-plugin and a no-plugin arm by default. `--json` report includes
  `costUsd` and `durationSeconds`. *(DOCS/plugin-evals.md)*
- `claude plugin details <name>` prints the always-on token cost per session.
  *(DOCS/plugins/measure.md)*

## Where the course text is wrong or unconfirmed

| Course says | Actual |
|---|---|
| `validate` has no `--strict` | It does; we use it in CI |
| Error types `range-conflict`, `no-matching-tag` | Types are `dependency-unsatisfied` / `dependency-version-unsatisfied`; the other two are only message text (`has conflicting version requirements`, `has no git tag satisfying`) |
| Minimum Claude Code `>=2.1.110` for dependencies | Not stated in the docs. We pin `>=2.1.289` (validating a directory with both manifests) |

## Public marketplaces worth copying

- **anthropics/claude-plugins-official** — `plugins/` one level deep; CI runs
  `validate-plugins`, frontmatter and licence checks as required PR checks,
  path-filtered and including the workflow files themselves.
- **anthropics/skills** — keeps `THIRD_PARTY_NOTICES.md` for vendored content.

## Still to test ourselves

- Whether an agent's `skills:` field accepts a dependency's qualified name
  (`engineering-paved-path:zod`). Not documented. Test with `--plugin-dir`.
- The `errorDetails.type` for a range conflict and a missing tag.

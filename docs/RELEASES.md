# Releases

Each plugin is versioned on its own. A release is a commit on `main` that
passed CI, plus one git tag per plugin that changed.

## Versions

[Semantic versioning](https://semver.org), set in the plugin's
`.claude-plugin/plugin.json` and **only there** — never on the marketplace
entry as well.

| Bump | When | Example |
|---|---|---|
| **Major** | A user must change something: a component renamed or removed, an input or output format changed, a dependency's major bumped | `spec-creator` renamed |
| **Minor** | New behaviour that existing users don't have to act on | `spec-creator` now refuses a requirement with no acceptance criterion |
| **Patch** | A fix or wording change with no new behaviour | A typo in a skill |

Claude Code detects updates by comparing `version`. A behavioural change
pushed without a bump never reaches users who already installed the plugin.

Dependency ranges use caret: `"^1.0.0"`. Bumping a dependency's **major**
is a major for every plugin that depends on it.

## Tags

One tag per plugin per release, in the form Claude Code resolves dependency
ranges against:

```
<plugin-name>--v<version>        e.g. sdd-engineering--v1.0.0
```

Without a tag that satisfies a range, a relative-path dependency silently
falls back to whatever is on `main`. Tag every release.

**A published tag never moves and is never deleted.** Installs that resolved
it must keep getting the same commit. A bad release is fixed forward.

## Releasing

Release dependencies before the plugins that depend on them:
`engineering-paved-path` → `research-tools` → `architecture-review` →
`sdd-engineering`.

For each plugin that changed:

1. Bump `version` in its `plugin.json` and add a section to its `CHANGELOG.md`.
2. Run its evals: `claude plugin eval plugins/<name>`. Old cases and new
   ones must pass.
3. Open a PR. Merge it once `validate` is green.
4. On an up-to-date, clean `main`:

   ```bash
   claude plugin tag plugins/<name> --dry-run   # check the tag name and version
   claude plugin tag plugins/<name> --push
   ```

   The command validates the plugin, checks that `plugin.json` and the
   marketplace entry agree, and refuses a dirty tree or an existing tag.
5. Check that the tag points at the commit CI passed:
   `git rev-parse <name>--v<version>^{commit}`.

## Updating, as a user

```bash
claude plugin marketplace update dev-digest-ai-marketplace
claude plugin update sdd-engineering@dev-digest-ai-marketplace --scope project
```

Then `/reload-plugins` or a new session. `claude plugin list --json` shows
the installed versions.

**Auto-update** is off by default for third-party marketplaces. Turn it on in
`/plugin` → Marketplaces → "Enable auto-update", or set `"autoUpdate": true` on
the marketplace's `extraKnownMarketplaces` entry in your settings.

## Channels: latest and stable

Claude Code has no built-in release channels. A channel is a separate
marketplace with its own `name`, pointing at a fixed ref.

| Channel | Marketplace name | How to add it | Serves |
|---|---|---|---|
| latest | `dev-digest-ai-marketplace` | `claude plugin marketplace add dmytrobereznii/dev-digest-ai-marketplace` | `main` |
| stable | `dev-digest-ai-marketplace-stable` | `claude plugin marketplace add https://raw.githubusercontent.com/dmytrobereznii/dev-digest-ai-marketplace/main/channels/stable/marketplace.json` | The tags listed in that file |

`channels/stable/marketplace.json` lists all four plugins, because a bare
dependency name resolves in the declaring plugin's own marketplace. Each entry
uses a `git-subdir` source pinned to a release tag:

```json
{
  "name": "sdd-engineering",
  "source": {
    "source": "git-subdir",
    "url": "https://github.com/dmytrobereznii/dev-digest-ai-marketplace.git",
    "path": "plugins/sdd-engineering",
    "ref": "sdd-engineering--v1.0.0"
  }
}
```

Promoting a release to stable means a PR that changes the `ref`s in that file.

## Rollback

There is no `claude plugin rollback` command. Rolling back means moving to the
stable channel:

```bash
# 1. Leave the latest channel. --prune also removes the three dependencies
#    the install pulled in; without it they stay installed.
claude plugin uninstall sdd-engineering@dev-digest-ai-marketplace --scope project --prune -y
claude plugin marketplace remove dev-digest-ai-marketplace

# 2. Install from stable (dependencies come along, pinned to their tags)
claude plugin marketplace add https://raw.githubusercontent.com/dmytrobereznii/dev-digest-ai-marketplace/main/channels/stable/marketplace.json --scope project
claude plugin install sdd-engineering@dev-digest-ai-marketplace-stable --scope project

# 3. Check: four plugins from -stable, sdd-engineering at the stable version, no errors
claude plugin list --json | jq -r '.[] | select(.id|test("dev-digest")) | "\(.id) \(.version) errors=\((.errors // [])|length)"'
```

4. **Smoke check, in a new session** (or after `/reload-plugins`) in the
   project. Ask any read-only question, then confirm the session's init lists
   `sdd-engineering` at the stable version, loaded from
   `~/.claude/plugins/cache/dev-digest-ai-marketplace-stable/`, with all seven
   agents. Headless:

   ```bash
   claude -p "What does <a function in this repo> do? One sentence." --output-format stream-json --verbose \
     | jq -c 'select(.subtype=="init") | [.plugins[] | select(.path|test("dev-digest")) | .path]'
   ```

   The behaviour evals do **not** run against an installed plugin: in the
   install cache each plugin sits in its own directory, so the cases' relative
   paths to their dependency plugins do not resolve. To re-run them for a
   released version, check out its tag and run them there:
   `git worktree add /tmp/rel <plugin>--v<version>`, then from that checkout
   `claude plugin eval . --eval-dir plugins/sdd-engineering/evals --tag smoke --scaffold --allow-tools Write Edit`.

Return to latest the same way in reverse (`uninstall … -stable --prune -y`,
`marketplace remove dev-digest-ai-marketplace-stable`, then add and install
from latest).

**Plugin data.** `uninstall` removes `~/.claude/plugins/data/<id>/` unless you
pass `--keep-data`. These plugins keep their working files (specs, plans,
insights, retro ledger) in the user's repository, not in plugin data, so a
rollback loses nothing. A plugin that starts writing outside the repository
must document how to restore that state here.

**Rehearsed 2026-10-15** (Claude Code 2.1.299) in a project on
`sdd-engineering` 1.1.0:
- **Latest to stable:** the project went to 1.0.0 from the stable channel, and the dependencies came along at their `--v1.0.0` tags.
- **Smoke check:** the session loaded 1.0.0 from `…-stable/` with seven agents.
- **Back to latest:** it returned to 1.1.0.
- **Clean:** no errors and nothing left over.
- **Plugin data:** none existed, so `--keep-data` was not needed.

Without `--prune` on step 1, the three dependencies of the latest channel
stayed installed until their marketplace was removed.

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
# 1. Leave the latest channel
claude plugin uninstall sdd-engineering@dev-digest-ai-marketplace --scope project
claude plugin marketplace remove dev-digest-ai-marketplace

# 2. Install from stable
claude plugin marketplace add https://raw.githubusercontent.com/dmytrobereznii/dev-digest-ai-marketplace/main/channels/stable/marketplace.json --scope project
claude plugin install sdd-engineering@dev-digest-ai-marketplace-stable --scope project

# 3. Load it and check the version
#    /reload-plugins (or a new session), then:
claude plugin list --json
```

4. Run the smoke eval: `claude plugin eval sdd-engineering@dev-digest-ai-marketplace-stable --case smoke`.

Return to latest the same way in reverse, once the fix is released.

**Plugin data.** `uninstall` removes `~/.claude/plugins/data/<id>/` unless you
pass `--keep-data`. These plugins keep their working files (specs, plans,
insights, retro ledger) in the user's repository, not in plugin data, so a
rollback loses nothing. A plugin that starts writing outside the repository
must document how to restore that state here.

> The command sequence above is rehearsed in the lab's step 11 and corrected
> here if any step behaves differently.

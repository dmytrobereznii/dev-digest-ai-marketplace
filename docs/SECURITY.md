# Security policy

Plugins from this marketplace run inside other people's Claude Code sessions,
with their permissions, in their repositories. A plugin is code you ship to
someone else's machine. Review it as such.

## What a plugin must never contain

- **Secrets.** No API keys, tokens, passwords or private URLs — not in a
  manifest, a skill, an agent prompt, an example or a test fixture. A plugin
  that needs a credential reads it from the user's environment at run time
  and says so in its README.
- **Absolute paths.** No `/Users/...`, `/home/...`, `C:\...`. Refer to files
  inside a plugin through `${CLAUDE_PLUGIN_ROOT}` and to a skill's own files
  through `${CLAUDE_SKILL_DIR}`. Refer to the user's repository by relative path
  or through an input the user supplies.
- **Project-specific knowledge.** No module names, package names or paths
  from the repository a component was extracted from. A plugin that only
  works in one repository belongs in that repository.
- **Network calls or MCP servers** in a plugin's default configuration. They
  are optional integrations: documented, off by default, and listed in the
  plugin's README with what they reach and why.

## Tool and permission review

Every agent declares `tools:` explicitly. A reviewer checks that:

- read-only agents (reviewers, researchers, verifiers) have no `Write`,
  `Edit` or unrestricted `Bash`;
- an agent that writes files names the directories it writes to in its
  prompt;
- no skill sets `allowed-tools` wider than the script it runs.

## Reporting a problem

Open a private security advisory on this repository (GitHub → Security →
Advisories → Report a vulnerability). Do not open a public issue for an
unsafe release.

## After an unsafe release

1. Point users at the last safe version through the stable channel
   (see [RELEASES.md](RELEASES.md) → Rollback).
2. Fix forward with a new patch version. **Never move or delete a published
   tag** — installs that pinned it must keep resolving to the same commit.
3. If a secret was published, revoke it at its issuer first. Removing it from
   git history does not un-publish it.
4. Record what happened and the fix in the plugin's `CHANGELOG.md`.

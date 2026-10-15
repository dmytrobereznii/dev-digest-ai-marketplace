# Contributing

This file answers "where does my file go and what do I run" without asking
in chat. If it doesn't, fix this file in the same PR.

## Layout

```
.claude-plugin/marketplace.json   the catalog: name, source, description per plugin
plugins/<name>/                   one directory per plugin, one level deep
channels/stable/marketplace.json  the stable channel (see docs/RELEASES.md)
docs/                             policy: security, releases, cost baseline, site spec
scripts/                          repo tooling (index build, hygiene check)
site/                             the GitHub Pages catalog (React + Vite)
```

## A plugin

```
plugins/<name>/
├── .claude-plugin/plugin.json    name, version, description, author, keywords, dependencies
├── agents/<agent>.md             optional
├── skills/<skill>/SKILL.md       optional; supporting files beside SKILL.md
├── evals/<case>/                 prompt.md + graders/*.md (claude plugin eval)
├── README.md                     required
├── CHANGELOG.md                  required
└── COMPATIBILITY.md              required
```

### Manifest fields

| Field | Required | Rule |
|---|---|---|
| `name` | yes | kebab-case, equals the directory name and the marketplace entry |
| `version` | yes | SemVer. Lives here only — never on the marketplace entry |
| `description` | yes | One sentence, same text as the marketplace entry |
| `author` | yes | `{ "name": … }` |
| `keywords` | yes | Used by the catalog search |
| `dependencies` | if any | `[{ "name": "<plugin>", "version": "^<major>.0.0" }]` |

### Dependency rules

- A dependency must be a plugin in **this** marketplace.
- Depend on a plugin only for a component you actually reference. Each
  dependency is installed and loaded for every user.
- No cycles. The current graph:

  ```
  sdd-engineering ──▶ engineering-paved-path
        │        ──▶ research-tools
        └───────────▶ architecture-review ──▶ engineering-paved-path
  ```

- Refer to another plugin's components by their namespaced name:
  `engineering-paved-path:zod`, `research-tools:researcher`.
- Shared skills live once, in `engineering-paved-path`. Do not copy a skill
  into a second plugin.

### Content rules

- English only: code, comments, docs, prompts.
- No secrets, no absolute paths, no names or paths from the project a
  component came from — see [docs/SECURITY.md](docs/SECURITY.md).
- A path inside the plugin is `${CLAUDE_PLUGIN_ROOT}/…`; a script inside a
  skill is `${CLAUDE_SKILL_DIR}/…`. Nothing reaches outside the plugin
  directory: installed plugins are copied to a cache, and `../` files are not.
- Anything the plugin needs from the user's repository (where specs live,
  the test command) is an **input with a documented default**, not an
  assumption. Document what happens when it is missing.
- An agent declares `tools:` explicitly. Plugin agents ignore
  `permissionMode`, `hooks` and `mcpServers`, so don't rely on them.

## Checks

Run before opening a PR:

```bash
claude plugin validate . --strict
for p in plugins/*/; do claude plugin validate "$p" --strict; done
node scripts/check-hygiene.mjs
claude plugin eval plugins/<name>     # for each plugin whose behaviour changed
```

CI runs the first three on every PR. Evals start live model sessions, so
they run locally and their result goes in the PR description.

## Pull request checklist

- [ ] One plugin per PR, unless the change is a coordinated dependency bump
- [ ] `version` bumped per [docs/RELEASES.md](docs/RELEASES.md), `CHANGELOG.md` updated
- [ ] README updated if a component, input or output changed
- [ ] Validation and the hygiene check pass locally
- [ ] Evals pass, old and new; result pasted in the PR
- [ ] No secrets, absolute paths or source-project names
- [ ] Reviewed by the code owner of every directory touched (`CODEOWNERS`)

# Catalog site — spec

The marketplace is installed through the Claude Code CLI. The site exists for
**discovery**: find a plugin, skill or agent by what it does, read its
documentation, see what it depends on, and copy the install command.

Hosted on GitHub Pages: static files only, no backend.

## Out of scope for the first version

Accounts, ratings, comments, download counters, server-side search, analytics,
and anything that needs a backend or a third-party service.

## Data

All data is generated at build time by `scripts/build-index.mjs` from the
repository itself. The site shows **only what is in the repository**: no
sample, placeholder or prototype data, in any build.

Inputs: `.claude-plugin/marketplace.json`; each plugin's
`.claude-plugin/plugin.json`, `README.md`, `CHANGELOG.md`, `COMPATIBILITY.md`;
the frontmatter and body of every `agents/*.md` and `skills/*/SKILL.md`;
`git tag --list '*--v*'` with tag dates.

Output, to `site/public/` (git-ignored, rebuilt in CI):

| File | Contents |
|---|---|
| `index.json` | `{ generatedAt, commit, marketplace: { name, description, owner }, plugins: Plugin[], artifacts: Artifact[] }` |
| `releases.json` | `Release[]`, newest first: `{ plugin, version, tag, date, changes: string[] }` from tags and the matching `CHANGELOG.md` section |
| `stats.json` | Counts: plugins, agents, skills, dependency edges; per plugin, component counts |
| `bodies/<id>.md` | Full Markdown of each README and component, loaded on demand |

```ts
type Plugin = {
  name: string; version: string; description: string; author: string;
  keywords: string[]; dependencies: { name: string; range: string }[];
  dependents: string[];            // reverse edges, computed
  compatibility: string;           // first line of COMPATIBILITY.md
  readme: string;                  // bodies/ id
  artifacts: string[];             // Artifact ids
  latestTag: string | null;
};
type Artifact = {
  id: string;                      // "<plugin>:<name>"
  kind: 'agent' | 'skill';
  plugin: string; name: string; description: string;
  tools?: string[]; model?: string;
  body: string;                    // bodies/ id
};
```

The build fails, rather than emitting a partial index, when a manifest is
invalid, a plugin listed in the marketplace has no directory, or a dependency
names a plugin that is not in the marketplace.

## Routes

Hash routing, so deep links work on GitHub Pages without server rewrites.

| Route | Screen |
|---|---|
| `#/` | Home: marketplace description, search box, plugin cards, "What's new" (latest 5 releases), install quick start |
| `#/search?q=` | Results as cards for plugins **and** individual agents and skills; filter chips by kind and by plugin |
| `#/plugin/<name>` | Plugin detail (below) |
| `#/artifact/<plugin>:<name>` | Agent or skill detail: description, plugin, tools and model for agents, rendered body, install command for its plugin |
| `#/whats-new` | Full release feed from `releases.json` |
| `#/getting-started` | Add the marketplace, install, update, auto-update, rollback (from `docs/RELEASES.md`) |

## Plugin detail

- Name, version, latest tag, author, compatibility.
- **Install** command with a Copy button:
  `/plugin install <name>@dev-digest-ai-marketplace`.
- **Dependencies** (with their ranges) and **dependents**, each a link.
- Contents: agents and skills as cards linking to their detail page.
- README rendered; CHANGELOG in a collapsible section.

## Search

- Client-side with MiniSearch over plugin name, description, keywords, README;
  and artifact name, description, body.
- Field boosts: name ×3, description ×2, keywords ×2, body ×1. Prefix and
  fuzzy (0.2) matching, so "secur" and "architechture" still find results.
- A plain-language query ("I need a skill for writing specs") returns cards
  ranked by those fields. No model is involved.
- Empty result: say so, and suggest browsing all plugins.

## Rendering and safety

Markdown is rendered with `marked` and **always** passed through `DOMPurify`
before insertion. The catalog shows repository content, which is not trusted
HTML. No `dangerouslySetInnerHTML` without the sanitiser.

## UI

- React + TypeScript + Vite, in `site/`, separate from the plugins.
- Dark theme by default, light theme as a toggle; the choice persists in
  `localStorage` (and the site still works without it).
- **All UI strings live in one file**, `site/src/i18n/en.json`; components
  never hard-code user-facing text.
- Works at phone width; no horizontal scroll.
- Copy buttons confirm with a short "Copied" state.

## Build and deploy

- Local: `npm run build:index` at the root, then `cd site && npm ci && npm run
  dev` (dev server) or `npm run build && npm run preview`.
- `validate.yml` gets a separate **`site`** job (index + frontend build), so a
  broken site build shows as its own check, apart from the plugin checks.
- `pages.yml` runs on push to `main`: build the index, build the site, deploy
  `site/dist` with `actions/deploy-pages`. Pages source: **GitHub Actions**.
- Vite `base` is `/dev-digest-ai-marketplace/`.

## Acceptance

- Searching a skill's distinctive word finds that skill's card and its plugin.
- Every version and dependency shown equals the manifest at the built commit.
- Copy install copies the exact command.
- A plugin added to the repo appears after the next merge, with no site change.
- A `<script>` in a README renders as text, not as a script.

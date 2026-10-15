# frontend-architecture — checking compliance

**The repo's linter covers part of this** — the framework's lint config, the
hook-dependency rules, and any import-boundary or alias rules the repo has
added. Run it with the command the repo documents (`CLAUDE.md` / `AGENTS.md`,
then the `Makefile`, then the package manifest's scripts) and record its
baseline at the base ref: a warning count that is all known debt (for example
deep relative imports listed under *Known exceptions*) is baseline, not a
finding. If no lint command is found, say so; never invent one.

Everything the linter cannot express — data-fetching placement, barrel shape,
the `"use client"` rung — is still convention plus review, and these greps are
the fallback. Run them from the frontend source root (`src/` in the reference
layout); adjust `app` and `components` to the repo's directory names.

```sh
# a component calling the network directly (target 0; \b excludes refetch())   — one-transport
grep -rnE '\bfetch\(' --include='*.tsx' app components

# deep relative imports that should use the alias                               — use-the-alias
grep -rn --include='*.ts*' -E 'from "(\.\./){3,}' . | wc -l

# the barrel shape that fails the App Router build (target 0)                    — no-aggregating-barrels
grep -rl 'export \*' --include='index.ts' . | xargs grep -l 'export { default' 2>/dev/null

# aggregating barrels — each hit is a file re-exporting several modules          — no-aggregating-barrels
grep -rc 'export \*' --include='index.ts' . | grep -v ':0$' | grep -v ':1$'

# breadth of the client boundary; compare against page.tsx count                 — client-directive-at-subtree-entry
grep -rl '"use client"' --include='*.tsx' . | wc -l
find app -name 'page.tsx' | wc -l
```

The aggregating-barrel grep also reports vendored or generated package
entries (a design system, shared contracts) copied into the source tree; a
barrel is the right shape there and the code is not the app's to change.
Count only the app's own barrels.

The last pair is a trend, not a gate. The number that matters is whether the
files you just touched put `"use client"` at a subtree entry or at a route.

## If enforcement earns a dependency

Sourced options, in the order they would pay off:

| Rule | Catches | Package |
|---|---|---|
| `import/no-cycle` | the `module → index → module` cycle an aggregating barrel invites | `eslint-plugin-import` |
| `import/no-restricted-paths` | one route's `_components` imported by another route | `eslint-plugin-import` |
| `check-file/filename-naming-convention` | PascalCase components, kebab-case lib files | `eslint-plugin-check-file` |

A backend may use a dependency-rule tool such as dependency-cruiser (see
[`onion-architecture`](../onion-architecture/SKILL.md) § Enforcement). Nothing
in the research recommends it for a frontend, so matching the backend there
would be a local decision rather than a sourced one.

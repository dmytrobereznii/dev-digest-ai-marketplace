# Compatibility

| Requirement | Range |
|---|---|
| Claude Code | `>= 2.1.289` |
| Plugin dependencies | none |

## Dependents

`architecture-review` and `sdd-engineering` depend on this plugin at `^1.0.0`.
The rule identifiers in `onion-architecture` and `frontend-architecture` are
part of the public interface: within `1.x` an identifier is never renamed or
removed (a renamed rule keeps its old identifier as an alias). Removing one, or
removing a skill, is a major version.

## Skills

Skills declare `name` and `description` only (third-party skills keep the
upstream frontmatter). None preloads other skills; they load on demand or
through the Skill tool.

The architecture skills are written for TypeScript examples, with a Next.js
App Router reference layout for `frontend-architecture`. Their rules are stack
neutral; the server/client-seam section of `frontend-architecture` applies
only to frameworks that render React Server Components.

## Optional components they use if present

| Component | Used for | Without it |
|---|---|---|
| The repo's architecture doc | Overrides the skills' default model | The skills' model applies |
| A dependency-rule tool in the repo | `onion-architecture` § Enforcement | The grep fallback |
| The repo's linter | `frontend-architecture` `enforcement.md` | The greps alone |

#!/usr/bin/env bash
# Shared workspace for the sdd-engineering cases: a tiny Node CLI with tests,
# committed to git, so the agents have a real repo to read and plan against.
# Case copy: an approved spec (SPEC-01) and its approved plan, ready to build.
set -euo pipefail

mkdir -p src test
cat > package.json <<'JSON'
{
  "name": "todo-cli",
  "version": "0.1.0",
  "type": "module",
  "bin": { "todo": "src/cli.js" },
  "scripts": { "test": "node --test" }
}
JSON

cat > src/store.js <<'JS'
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FILE = process.env.TODO_FILE ?? '.todos.json';

export function load() {
  return existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : [];
}

export function save(todos) {
  writeFileSync(FILE, JSON.stringify(todos, null, 2));
}
JS

cat > src/todo.js <<'JS'
import { load, save } from './store.js';

export function add(text) {
  const todos = load();
  const todo = { id: todos.length + 1, text, done: false };
  save([...todos, todo]);
  return todo;
}

export function list() {
  return load();
}

export function complete(id) {
  const todos = load().map((t) => (t.id === id ? { ...t, done: true } : t));
  save(todos);
  return todos.find((t) => t.id === id) ?? null;
}
JS

cat > src/cli.js <<'JS'
#!/usr/bin/env node
import { add, list, complete } from './todo.js';

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case 'add':
    console.log(`Added #${add(args.join(' ')).id}`);
    break;
  case 'list':
    for (const t of list()) console.log(`${t.done ? '[x]' : '[ ]'} ${t.id}. ${t.text}`);
    break;
  case 'done':
    console.log(complete(Number(args[0])) ? 'Done' : 'No such todo');
    break;
  default:
    console.log('Usage: todo <add|list|done> [args]');
    process.exitCode = 1;
}
JS

cat > test/todo.test.js <<'JS'
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';

process.env.TODO_FILE = '.todos.test.json';
const { add, list, complete } = await import('../src/todo.js');

beforeEach(() => rmSync('.todos.test.json', { force: true }));

test('add then list returns the todo', () => {
  add('buy milk');
  assert.deepEqual(list(), [{ id: 1, text: 'buy milk', done: false }]);
});

test('complete marks a todo done', () => {
  add('a');
  assert.equal(complete(1).done, true);
});
JS

cat > README.md <<'MD'
# todo-cli

A tiny todo list for the terminal. `todo add <text>`, `todo list`, `todo done <id>`.
Tests: `npm test`.
MD

if true; then
  mkdir -p .context/specs
  cat > .context/specs/2026-10-15-list-json-output.md <<'MD'
# List as JSON

Spec ID: SPEC-01
Status: Approved

## Problem
Scripts that consume `todo list` have to parse human-formatted lines.

## Acceptance criteria
- **AC-1** WHEN the user runs `todo list --json`, the CLI SHALL print the todos as a JSON array on stdout and nothing else.
- **AC-2** WHEN there are no todos and `--json` is given, the CLI SHALL print `[]`.
- **AC-3** WHEN `--json` is not given, the CLI SHALL keep the current human-readable output unchanged.
- **AC-4** Each item in the JSON array SHALL have exactly the fields `id`, `text` and `done`.

## Out of scope
Filtering, sorting, and JSON output for `add` and `done`.
MD
fi

cat > .context/specs/2026-10-15-list-json-output.plan.md <<'MD'
# Plan: List as JSON

Spec: SPEC-01 (.context/specs/2026-10-15-list-json-output.md)
Status: Approved

## 1. What already ships
| Layer | Fact | Path |
|---|---|---|
| CLI | `list` prints one human-readable line per todo | src/cli.js:11 |
| Domain | `list()` returns the stored array of `{ id, text, done }` | src/todo.js:12 |

## 2. Decisions
### D1 — Format in the CLI, not in `todo.js`
Why: output format is presentation; `list()` already returns the right shape. Serves: AC-1, AC-4.

## 3. Tasks
### 3.1 CLI
- [ ] **T1** In `src/cli.js`, when `list` gets `--json`, print `JSON.stringify(list())` and nothing else. AC-1, AC-2, AC-4. Test: T3.
- [ ] **T2** Without `--json`, keep the current output byte for byte. AC-3. Test: T3.
### 3.2 Tests
- [ ] **T3** Add `test/cli.test.js`: run `src/cli.js` as a child process with a temp `TODO_FILE`; cover a populated list, an empty list (`[]`), the field set, and unchanged plain output. AC-1..AC-4.

## 4. Traceability
| AC | Task | Test | Commit |
|---|---|---|---|
| AC-1 | T1 | T3 | |
| AC-2 | T1 | T3 | |
| AC-3 | T2 | T3 | |
| AC-4 | T1 | T3 | |

## 5. Execution
One slice, in order: 3.1 then 3.2.

## 6. Verification
`npm test`
MD

git init -q
git add -A
git -c user.name=eval -c user.email=eval@example.invalid commit -qm "initial"

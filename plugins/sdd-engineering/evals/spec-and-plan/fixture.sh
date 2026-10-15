#!/usr/bin/env bash
# Shared workspace for the sdd-engineering cases: a tiny Node CLI with tests,
# committed to git, so the agents have a real repo to read and plan against.
# Case copy: no spec.
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

if [[ "${1:-}" == "--with-spec" ]]; then
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

git init -q
git add -A
git -c user.name=eval -c user.email=eval@example.invalid commit -qm "initial"

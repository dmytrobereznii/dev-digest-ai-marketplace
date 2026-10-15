#!/usr/bin/env node
// Fails on content a published plugin must never carry: absolute paths,
// likely secrets, names from the project the components were extracted from,
// and non-English (Cyrillic) text. See docs/SECURITY.md and CONTRIBUTING.md.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SCAN = ['plugins', 'channels', '.claude-plugin', 'docs', 'README.md', 'CONTRIBUTING.md'];
const SKIP_DIRS = new Set(['node_modules', 'results', '.git', 'temp']);
const TEXT = /\.(md|json|ya?ml|mjs|js|ts|sh|py|txt)$/;

const RULES = [
  {
    name: 'absolute path',
    re: /(?<![\w.])(\/Users\/|\/home\/[a-z]|[A-Z]:\\\\)/,
    // The policy itself quotes the forms it bans.
    except: ['docs/SECURITY.md'],
  },
  {
    name: 'possible secret',
    re: /(sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/,
  },
  {
    name: 'source-project reference',
    re: /\b(devdigest|reviewer-core|@devdigest\/|server\/src\/|client\/src\/|vendor\/shared)\b/i,
    // The marketplace's own name contains "dev-digest"; only plugin content is held to this rule.
    only: 'plugins/',
  },
  { name: 'non-English text', re: /[Ѐ-ӿ]/ },
];

function* walk(path) {
  const st = statSync(path, { throwIfNoEntry: false });
  if (!st) return;
  if (st.isFile()) {
    if (TEXT.test(path)) yield path;
    return;
  }
  for (const entry of readdirSync(path)) {
    if (SKIP_DIRS.has(entry)) continue;
    yield* walk(join(path, entry));
  }
}

let failures = 0;
for (const top of SCAN) {
  for (const file of walk(join(ROOT, top))) {
    const rel = relative(ROOT, file);
    if (rel === 'scripts/check-hygiene.mjs') continue;
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        for (const rule of RULES) {
          if (rule.only && !rel.startsWith(rule.only)) continue;
          if (rule.except?.includes(rel)) continue;
          if (rule.re.test(line)) {
            failures++;
            console.log(`${rel}:${i + 1}: ${rule.name}: ${line.trim().slice(0, 120)}`);
          }
        }
      });
  }
}

if (failures) {
  console.log(`\n${failures} problem(s). See docs/SECURITY.md and CONTRIBUTING.md.`);
  process.exit(1);
}
console.log('Hygiene check passed.');

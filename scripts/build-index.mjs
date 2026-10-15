#!/usr/bin/env node
// Builds the catalog data the site reads (docs/SITE-SPEC.md → Data).
// Reads only the repository; writes site/public/{index,releases,stats}.json
// and site/public/bodies/*.md. Fails instead of emitting a partial index.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'site', 'public');
const BODIES = join(OUT, 'bodies');

const errors = [];
const fail = (msg) => errors.push(msg);

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const readText = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : '');

function splitFrontmatter(text, file) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) {
    fail(`${file}: no YAML frontmatter`);
    return { data: {}, body: text };
  }
  try {
    return { data: parseYaml(m[1]) ?? {}, body: m[2] };
  } catch (e) {
    fail(`${file}: invalid frontmatter: ${e.message}`);
    return { data: {}, body: m[2] };
  }
}

const oneLine = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const toList = (v) =>
  Array.isArray(v) ? v.map(String) : v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : [];

function git(...args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

// CHANGELOG.md sections look like "## 1.0.0 — 2026-10-15" followed by bullets.
function changelogSection(changelog, version) {
  const lines = changelog.split('\n');
  const start = lines.findIndex((l) => new RegExp(`^##\\s+\\[?${version.replace(/\./g, '\\.')}\\]?\\b`).test(l));
  if (start === -1) return [];
  const out = [];
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break;
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) out.push(bullet[1].trim());
  }
  return out;
}

const bodies = new Map();
const addBody = (id, text) => {
  const file = `${id.replace(/[^a-z0-9._-]+/gi, '__')}.md`;
  bodies.set(file, text);
  return file;
};

const marketplace = readJson(join(ROOT, '.claude-plugin', 'marketplace.json'));
const plugins = [];
const artifacts = [];

for (const entry of marketplace.plugins ?? []) {
  const dir = join(ROOT, entry.source ?? '');
  const manifestPath = join(dir, '.claude-plugin', 'plugin.json');
  if (!existsSync(manifestPath)) {
    fail(`${entry.name}: listed in marketplace.json but ${entry.source}/.claude-plugin/plugin.json is missing`);
    continue;
  }
  const manifest = readJson(manifestPath);
  if (manifest.name !== entry.name) fail(`${entry.name}: plugin.json name is "${manifest.name}"`);

  const ids = [];
  const agentsDir = join(dir, 'agents');
  if (existsSync(agentsDir)) {
    for (const f of readdirSync(agentsDir).filter((f) => f.endsWith('.md')).sort()) {
      const rel = `${entry.source}/agents/${f}`;
      const { data, body } = splitFrontmatter(readFileSync(join(agentsDir, f), 'utf8'), rel);
      const name = data.name ?? f.replace(/\.md$/, '');
      const id = `${manifest.name}:${name}`;
      artifacts.push({
        id,
        kind: 'agent',
        plugin: manifest.name,
        name,
        description: oneLine(data.description),
        tools: toList(data.tools),
        model: data.model ?? null,
        body: addBody(id, body),
      });
      ids.push(id);
    }
  }
  const skillsDir = join(dir, 'skills');
  if (existsSync(skillsDir)) {
    for (const s of readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()) {
      const rel = `${entry.source}/skills/${s}/SKILL.md`;
      const path = join(skillsDir, s, 'SKILL.md');
      if (!existsSync(path)) {
        fail(`${rel} is missing`);
        continue;
      }
      const { data, body } = splitFrontmatter(readFileSync(path, 'utf8'), rel);
      const name = data.name ?? s;
      const id = `${manifest.name}:${name}`;
      artifacts.push({
        id,
        kind: 'skill',
        plugin: manifest.name,
        name,
        description: oneLine(data.description),
        body: addBody(id, body),
      });
      ids.push(id);
    }
  }

  const tags = git('tag', '--list', `${manifest.name}--v*`, '--sort=-v:refname').split('\n').filter(Boolean);
  plugins.push({
    name: manifest.name,
    version: manifest.version ?? '0.0.0',
    description: oneLine(manifest.description ?? entry.description),
    author: manifest.author?.name ?? marketplace.owner?.name ?? '',
    keywords: manifest.keywords ?? [],
    dependencies: (manifest.dependencies ?? []).map((d) =>
      typeof d === 'string' ? { name: d.split('@')[0], range: '*' } : { name: d.name, range: d.version ?? '*' },
    ),
    dependents: [],
    compatibility: oneLine(readText(join(dir, 'COMPATIBILITY.md')).split('\n').find((l) => /\d+\.\d+\.\d+/.test(l)) ?? ''),
    readme: addBody(`${manifest.name}:README`, readText(join(dir, 'README.md'))),
    changelog: addBody(`${manifest.name}:CHANGELOG`, readText(join(dir, 'CHANGELOG.md'))),
    artifacts: ids,
    latestTag: tags[0] ?? null,
    _changelog: readText(join(dir, 'CHANGELOG.md')),
    _tags: tags,
  });
}

const byName = new Map(plugins.map((p) => [p.name, p]));
for (const p of plugins) {
  for (const d of p.dependencies) {
    const target = byName.get(d.name);
    if (!target) fail(`${p.name}: depends on "${d.name}", which is not in this marketplace`);
    else target.dependents.push(p.name);
  }
}

const releases = [];
for (const p of plugins) {
  for (const tag of p._tags) {
    const version = tag.slice(`${p.name}--v`.length);
    releases.push({
      plugin: p.name,
      version,
      tag,
      date: git('log', '-1', '--format=%cI', tag) || null,
      changes: changelogSection(p._changelog, version),
    });
  }
  delete p._changelog;
  delete p._tags;
}
releases.sort((a, b) => String(b.date).localeCompare(String(a.date)));

if (errors.length) {
  console.error(errors.map((e) => `✗ ${e}`).join('\n'));
  console.error(`\nIndex not written: ${errors.length} problem(s).`);
  process.exit(1);
}

rmSync(BODIES, { recursive: true, force: true });
mkdirSync(BODIES, { recursive: true });
for (const [file, text] of bodies) writeFileSync(join(BODIES, file), text);

const index = {
  generatedAt: new Date().toISOString(),
  commit: git('rev-parse', '--short', 'HEAD') || null,
  marketplace: {
    name: marketplace.name,
    description: marketplace.description ?? '',
    owner: marketplace.owner?.name ?? '',
  },
  plugins,
  artifacts,
};
const stats = {
  plugins: plugins.length,
  agents: artifacts.filter((a) => a.kind === 'agent').length,
  skills: artifacts.filter((a) => a.kind === 'skill').length,
  dependencyEdges: plugins.reduce((n, p) => n + p.dependencies.length, 0),
  perPlugin: Object.fromEntries(
    plugins.map((p) => [
      p.name,
      {
        agents: artifacts.filter((a) => a.plugin === p.name && a.kind === 'agent').length,
        skills: artifacts.filter((a) => a.plugin === p.name && a.kind === 'skill').length,
      },
    ]),
  ),
};

writeFileSync(join(OUT, 'index.json'), JSON.stringify(index, null, 2));
writeFileSync(join(OUT, 'releases.json'), JSON.stringify(releases, null, 2));
writeFileSync(join(OUT, 'stats.json'), JSON.stringify(stats, null, 2));
console.log(
  `Index written: ${stats.plugins} plugins, ${stats.agents} agents, ${stats.skills} skills, ${releases.length} releases.`,
);

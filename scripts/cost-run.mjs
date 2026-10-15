#!/usr/bin/env node
// Measures what one run of the fixed SDD scenario costs (docs/COST-BASELINE.md).
//
// Each run: a fresh temp workspace built by the spec-and-plan eval fixture, one
// headless `claude -p` session with the four plugins loaded from this checkout,
// and the scenario prompt from that eval case. Usage comes from the session's
// own stream-json output; quality is checked on the files the run wrote.
//
//   node scripts/cost-run.mjs --label baseline --runs 3 [--model claude-sonnet-5-5]
//
// Writes .eval-runs/cost-<label>.json (git-ignored) and prints a summary.
import { spawnSync, spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const CASE = join(ROOT, 'plugins/sdd-engineering/evals/spec-and-plan');
const PLUGINS = ['sdd-engineering', 'engineering-paved-path', 'research-tools', 'architecture-review'];
const TOOLS = ['Read', 'Glob', 'Grep', 'Agent', 'Skill', 'TodoWrite', 'Write', 'Edit'];

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const label = args.label ?? 'run';
const runs = Number(args.runs ?? 3);
const model = args.model ?? 'claude-sonnet-5-5';
const keep = 'keep' in args;

const prompt = readFileSync(join(CASE, 'prompt.md'), 'utf8').replace(/^---[\s\S]*?---\s*/, '').trim();
const git = (...a) => spawnSync('git', a, { cwd: ROOT, encoding: 'utf8' }).stdout.trim();

function runOnce(n) {
  const ws = mkdtempSync(join(tmpdir(), `sdd-cost-${label}-`));
  const scaffold = spawnSync('bash', [join(CASE, 'fixture.sh')], { cwd: ws, encoding: 'utf8' });
  if (scaffold.status !== 0) throw new Error(`fixture failed: ${scaffold.stderr}`);

  const cli = [
    '-p', prompt,
    '--model', model,
    '--output-format', 'stream-json', '--verbose',
    '--setting-sources', 'project,local',
    '--strict-mcp-config',
    '--no-session-persistence',
    '--allowedTools', ...TOOLS,
    ...PLUGINS.flatMap((p) => ['--plugin-dir', join(ROOT, 'plugins', p)]),
  ];

  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn('claude', cli, { cwd: ws, stdio: ['ignore', 'pipe', 'pipe'] });
    let buf = '';
    const events = [];
    child.stdout.on('data', (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (line) try { events.push(JSON.parse(line)); } catch { /* partial or non-JSON line */ }
      }
    });
    child.on('close', () => {
      const result = events.findLast((e) => e.type === 'result') ?? {};
      const messageIds = new Set();
      const tools = {};
      const agents = [];
      for (const e of events.filter((e) => e.type === 'assistant')) {
        messageIds.add(e.message?.id);
        for (const c of e.message?.content ?? []) {
          if (c.type !== 'tool_use') continue;
          tools[c.name] = (tools[c.name] ?? 0) + 1;
          if (c.name === 'Agent' || c.name === 'Task') agents.push(c.input?.subagent_type ?? '?');
        }
      }
      const tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
      for (const m of Object.values(result.modelUsage ?? {})) {
        tokens.input += m.inputTokens ?? 0;
        tokens.output += m.outputTokens ?? 0;
        tokens.cacheRead += m.cacheReadInputTokens ?? 0;
        tokens.cacheWrite += m.cacheCreationInputTokens ?? 0;
      }

      // Quality gate on what the run actually wrote.
      const specDir = join(ws, '.context/specs');
      let files = [];
      try { files = readdirSync(specDir); } catch { /* no spec dir: gate fails below */ }
      const read = (f) => readFileSync(join(specDir, f), 'utf8');
      const plan = files.find((f) => f.endsWith('.plan.md'));
      const spec = files.find((f) => f.endsWith('.md') && !f.endsWith('.plan.md'));
      const specText = spec ? read(spec) : '';
      const planText = plan ? read(plan) : '';
      const touchedSrc = spawnSync('git', ['status', '--porcelain', '--', 'src', 'test'], { cwd: ws, encoding: 'utf8' }).stdout.trim();
      const checks = {
        specWritten: Boolean(spec),
        specHasId: /Spec ID:\s*SPEC-\d+/.test(specText),
        specHasCriteria: /\bAC-1\b/.test(specText),
        planWritten: Boolean(plan),
        planCitesCriteria: /\bAC-\d+\b/.test(planText),
        sourceUntouched: touchedSrc === '',
      };
      const critical = [];
      if (result.is_error || result.subtype !== 'success') critical.push(`session ended: ${result.subtype ?? 'no result'}`);
      if (!checks.sourceUntouched) critical.push('edited source or tests');

      const out = {
        run: n,
        passed: Object.values(checks).every(Boolean) && critical.length === 0,
        checks,
        critical,
        costUsd: result.total_cost_usd ?? null,
        durationMs: result.duration_ms ?? Date.now() - started,
        apiCalls: messageIds.size,
        numTurns: result.num_turns ?? null,
        toolCalls: Object.values(tools).reduce((a, b) => a + b, 0),
        tools,
        agents,
        tokens,
        models: Object.keys(result.modelUsage ?? {}),
        workspace: keep ? ws : null,
      };
      if (!keep) rmSync(ws, { recursive: true, force: true });
      resolve(out);
    });
  });
}

const median = (xs) => {
  const s = xs.filter((x) => x != null).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const results = [];
for (let n = 1; n <= runs; n++) {
  process.stdout.write(`run ${n}/${runs} … `);
  const r = await runOnce(n);
  results.push(r);
  console.log(
    `${r.passed ? 'PASS' : 'FAIL'}  $${r.costUsd?.toFixed(3)}  ${(r.durationMs / 1000).toFixed(0)}s  ` +
      `in ${r.tokens.input} out ${r.tokens.output} cacheR ${r.tokens.cacheRead} cacheW ${r.tokens.cacheWrite}  ` +
      `api ${r.apiCalls} tools ${r.toolCalls}  agents [${r.agents.join(', ')}]` +
      (r.passed ? '' : `  checks ${JSON.stringify(r.checks)} ${r.critical.join('; ')}`),
  );
}

const summary = {
  label,
  commit: git('rev-parse', '--short', 'HEAD'),
  dirty: git('status', '--porcelain', '--', 'plugins') !== '',
  pluginVersion: JSON.parse(readFileSync(join(ROOT, 'plugins/sdd-engineering/.claude-plugin/plugin.json'), 'utf8')).version,
  model,
  claudeVersion: spawnSync('claude', ['--version'], { encoding: 'utf8' }).stdout.trim(),
  date: new Date().toISOString(),
  runs: results.length,
  passRate: results.filter((r) => r.passed).length / results.length,
  median: {
    costUsd: median(results.map((r) => r.costUsd)),
    durationMs: median(results.map((r) => r.durationMs)),
    inputTokens: median(results.map((r) => r.tokens.input)),
    outputTokens: median(results.map((r) => r.tokens.output)),
    cacheReadTokens: median(results.map((r) => r.tokens.cacheRead)),
    cacheWriteTokens: median(results.map((r) => r.tokens.cacheWrite)),
    apiCalls: median(results.map((r) => r.apiCalls)),
    toolCalls: median(results.map((r) => r.toolCalls)),
  },
  critical: results.flatMap((r) => r.critical.map((c) => `run ${r.run}: ${c}`)),
  results,
};

mkdirSync(join(ROOT, '.eval-runs'), { recursive: true });
const file = join(ROOT, '.eval-runs', `cost-${label}.json`);
writeFileSync(file, JSON.stringify(summary, null, 2));
console.log(`\n${label}: pass ${summary.passRate * 100}% · median $${summary.median.costUsd?.toFixed(3)} · ` +
  `${(summary.median.durationMs / 1000).toFixed(0)}s · written ${file}`);

/**
 * Tests for the Codex app hook surface.
 *
 * Run with: node tests/codex/codex-hooks.test.js
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..', '..');
const sourcePath = path.join(repoRoot, 'docs', 'upstream', 'claude-code-hooks.json');
const codexHooksPath = path.join(repoRoot, 'hooks', 'hooks.json');
const buildScriptPath = path.join(repoRoot, 'scripts', 'codex', 'build-codex-hooks.js');

const {
  adaptHookCommandForCodex,
  buildCodexHooks,
  countAsyncHooks,
} = require(buildScriptPath);

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
    failed++;
  }
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function collectHookIds(data) {
  const ids = [];
  for (const entries of Object.values(data.hooks || {})) {
    for (const entry of entries || []) {
      if (entry.id) {
        ids.push(entry.id);
      }
    }
  }
  return ids.sort();
}

console.log('\n=== Testing Codex hook adaptation ===\n');

const claudeHooks = loadJson(sourcePath);
const codexHooks = loadJson(codexHooksPath);

test('preserved Claude Code hook graph still contains async entries', () => {
  assert.strictEqual(countAsyncHooks(claudeHooks), 9);
});

test('active Codex hook graph contains no async properties', () => {
  assert.strictEqual(countAsyncHooks(codexHooks), 0);
  assert.ok(!fs.readFileSync(codexHooksPath, 'utf8').includes('"async"'));
});

test('active Codex hook graph is generated from the preserved Claude graph', () => {
  assert.deepStrictEqual(codexHooks, buildCodexHooks(claudeHooks));
});

test('Codex hook graph converts async-only Claude capabilities into supported sync hooks', () => {
  const ids = collectHookIds(codexHooks);
  assert.ok(ids.includes('pre:bash:dispatcher'));
  assert.ok(ids.includes('pre:edit-write:gateguard-fact-force'));
  assert.ok(ids.includes('session:start'));
  assert.ok(ids.includes('pre:compact'));

  for (const id of [
    'pre:observe:continuous-learning',
    'post:bash:dispatcher',
    'post:quality-gate',
    'post:observe:continuous-learning',
    'stop:session-end',
    'stop:evaluate-session',
    'stop:cost-tracker',
    'stop:desktop-notify',
    'session:end:marker',
  ]) {
    assert.ok(ids.includes(id), `expected ${id} in the Codex hook graph`);
  }
});

test('generated Codex hook commands resolve Codex plugin roots natively', () => {
  const commandTexts = Object.values(codexHooks.hooks)
    .flat()
    .flatMap(entry => entry.hooks || [])
    .map(hook => hook.command)
    .filter(command => typeof command === 'string');

  assert.ok(commandTexts.length > 0);
  for (const command of commandTexts) {
    assert.ok(command.includes("ECC_HOOK_RUNTIME='codex'"), 'command should mark Codex runtime');
    assert.ok(command.includes('CODEX_PLUGIN_ROOT'), 'command should expose CODEX_PLUGIN_ROOT');
    assert.ok(command.includes("'.codex'"), 'command should search the Codex home/cache');
    assert.ok(!command.includes('${CLAUDE_PLUGIN_ROOT}'), 'command should not depend on shell placeholder expansion');
  }
});

test('Codex command adapter rewrites Stop hook inline spawns to plugin bootstrap form', () => {
  const stopHook = claudeHooks.hooks.Stop.find(entry => entry.id === 'stop:cost-tracker').hooks[0];
  const adapted = adaptHookCommandForCodex(stopHook.command);
  assert.ok(adapted.includes('plugin-hook-bootstrap.js'));
  assert.ok(adapted.includes('scripts/hooks/run-with-flags.js stop:cost-tracker scripts/hooks/cost-tracker.js minimal,standard,strict'));
});

test('codex hook generator check mode passes against the checked-in output', () => {
  const result = spawnSync(process.execPath, [buildScriptPath, '--check'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.strictEqual(
    result.status,
    0,
    `expected check mode to pass\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
});

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);

process.exit(failed > 0 ? 1 : 0);

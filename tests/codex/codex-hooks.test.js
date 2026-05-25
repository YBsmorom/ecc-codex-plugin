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

test('Codex hook graph keeps synchronous safety hooks and omits async-only hooks', () => {
  const ids = collectHookIds(codexHooks);
  assert.ok(ids.includes('pre:bash:dispatcher'));
  assert.ok(ids.includes('pre:edit-write:gateguard-fact-force'));
  assert.ok(ids.includes('session:start'));
  assert.ok(ids.includes('pre:compact'));
  assert.ok(!ids.includes('post:quality-gate'));
  assert.ok(!ids.includes('stop:cost-tracker'));
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

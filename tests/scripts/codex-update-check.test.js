/**
 * Tests for the read-only Codex adapter update checker.
 */

'use strict';

const assert = require('assert');

const {
  determineStatus,
  githubRawUrlFor,
  normalizeGithubRepoUrl,
  parseArgs,
} = require('../../scripts/codex/check-plugin-update');

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS ${name}`);
    return true;
  } catch (error) {
    console.log(`  FAIL ${name}`);
    console.log(`    Error: ${error.message}`);
    return false;
  }
}

let passed = 0;
let failed = 0;

if (test('normalizes GitHub HTTPS repository URLs', () => {
  assert.deepStrictEqual(
    normalizeGithubRepoUrl('https://github.com/YBsmorom/ecc-codex-plugin.git'),
    {
      owner: 'YBsmorom',
      repo: 'ecc-codex-plugin',
      httpsUrl: 'https://github.com/YBsmorom/ecc-codex-plugin.git',
    },
  );
  assert.deepStrictEqual(
    normalizeGithubRepoUrl('https://github.com/affaan-m/ECC'),
    {
      owner: 'affaan-m',
      repo: 'ECC',
      httpsUrl: 'https://github.com/affaan-m/ECC.git',
    },
  );
  assert.strictEqual(normalizeGithubRepoUrl('git@github.com:affaan-m/ECC.git'), null);
})) passed++; else failed++;

if (test('builds raw manifest URLs for GitHub repos', () => {
  assert.strictEqual(
    githubRawUrlFor('https://github.com/YBsmorom/ecc-codex-plugin.git', 'main', '.codex-plugin/plugin.json'),
    'https://raw.githubusercontent.com/YBsmorom/ecc-codex-plugin/main/.codex-plugin/plugin.json',
  );
  assert.strictEqual(
    githubRawUrlFor('https://github.com/YBsmorom/ecc-codex-plugin', 'release/v2', 'a\\b.json'),
    'https://raw.githubusercontent.com/YBsmorom/ecc-codex-plugin/release/v2/a/b.json',
  );
})) passed++; else failed++;

if (test('detects current, available, and unknown update states', () => {
  const same = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const different = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

  assert.strictEqual(
    determineStatus(
      { gitCommit: same, version: '1.0.0' },
      { remoteCommit: same, remoteManifestVersion: '1.0.0' },
      { remoteCommit: same, syncedCommit: same },
    ).status,
    'current',
  );

  const available = determineStatus(
    { gitCommit: same, version: '1.0.0' },
    { remoteCommit: different, remoteManifestVersion: '1.0.0' },
    { remoteCommit: different },
  );
  assert.strictEqual(available.status, 'update_available');
  assert.strictEqual(available.adapterBehind, true);

  const upstreamChanged = determineStatus(
    { gitCommit: same, version: '1.0.0' },
    { remoteCommit: same, remoteManifestVersion: '1.0.0' },
    { remoteCommit: different, syncedCommit: same },
  );
  assert.strictEqual(upstreamChanged.status, 'upstream_changed');
  assert.strictEqual(upstreamChanged.upstreamChangedSinceSync, true);

  assert.strictEqual(
    determineStatus(
      { gitCommit: same, version: '1.0.0' },
      { remoteCommit: same, remoteManifestVersion: '1.0.0' },
      { remoteCommit: different, syncedCommit: different },
    ).status,
    'current',
  );

  assert.strictEqual(
    determineStatus(
      { gitCommit: null, version: null },
      { remoteCommit: null, remoteManifestVersion: null },
      { remoteCommit: null },
    ).status,
    'unknown',
  );
})) passed++; else failed++;

if (test('parses command line options without side effects', () => {
  const options = parseArgs(['--json', '--plugin-root', 'C:/tmp/ecc', '--repo-url', 'https://github.com/a/b', '--ref', 'main']);
  assert.strictEqual(options.json, true);
  assert.ok(options.pluginRoot.endsWith('C:\\tmp\\ecc') || options.pluginRoot.endsWith('C:/tmp/ecc'));
  assert.strictEqual(options.repoUrl, 'https://github.com/a/b');
  assert.strictEqual(options.ref, 'main');
})) passed++; else failed++;

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);

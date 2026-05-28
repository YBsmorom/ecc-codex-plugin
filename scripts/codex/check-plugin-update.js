#!/usr/bin/env node
'use strict';

/**
 * Read-only update checker for the ECC Codex adapter.
 *
 * This script intentionally does not pull, write, reinstall, mutate Codex
 * cache directories, or trust hooks. It reports whether the local adapter
 * checkout appears behind the adapter repository and whether canonical
 * upstream differs from the adapter repository.
 */

const fs = require('fs');
const https = require('https');
const path = require('path');
const { spawnSync } = require('child_process');

const DEFAULT_TIMEOUT_MS = 10000;
const REPO_ROOT = path.resolve(__dirname, '..', '..');

function parseArgs(argv) {
  const options = {
    pluginRoot: REPO_ROOT,
    json: false,
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') {
      options.json = true;
    } else if (arg === '--plugin-root') {
      options.pluginRoot = path.resolve(argv[++index] || '');
    } else if (arg === '--repo-url') {
      options.repoUrl = argv[++index] || '';
    } else if (arg === '--ref') {
      options.ref = argv[++index] || '';
    } else if (arg === '--timeout-ms') {
      options.timeoutMs = Number(argv[++index] || DEFAULT_TIMEOUT_MS);
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
    options.timeoutMs = DEFAULT_TIMEOUT_MS;
  }

  return options;
}

function usage() {
  return [
    'Usage: node scripts/codex/check-plugin-update.js [options]',
    '',
    'Options:',
    '  --plugin-root <path>  Plugin checkout/root to inspect (default: repo root)',
    '  --repo-url <url>      Override adapter repository URL',
    '  --ref <ref>           Override adapter ref (default from .codex-plugin/update.json)',
    '  --json                Print machine-readable JSON',
    '  --timeout-ms <n>      Network timeout for remote manifest fetch',
  ].join('\n');
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeGithubRepoUrl(repoUrl) {
  const text = String(repoUrl || '').trim();
  const match = text.match(/^https:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+?)(?:\.git)?(?:[/?#].*)?$/i);
  if (!match) {
    return null;
  }
  return {
    owner: match[1],
    repo: match[2],
    httpsUrl: `https://github.com/${match[1]}/${match[2]}.git`,
  };
}

function githubRawUrlFor(repoUrl, ref, relativePath) {
  const normalized = normalizeGithubRepoUrl(repoUrl);
  if (!normalized) {
    return null;
  }
  const safeRef = encodeURIComponent(ref || 'main').replace(/%2F/g, '/');
  const safePath = String(relativePath || '').split(path.sep).join('/').replace(/^\/+/, '');
  return `https://raw.githubusercontent.com/${normalized.owner}/${normalized.repo}/${safeRef}/${safePath}`;
}

function runGit(args, cwd) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status !== 0) {
    return null;
  }

  return String(result.stdout || '').trim();
}

function readLocalGitCommit(pluginRoot) {
  const commit = runGit(['rev-parse', 'HEAD'], pluginRoot);
  return /^[0-9a-f]{40}$/i.test(commit || '') ? commit : null;
}

function isGitDirty(pluginRoot) {
  const status = runGit(['status', '--porcelain'], pluginRoot);
  return typeof status === 'string' && status.length > 0;
}

function readRemoteGitCommit(repoUrl, ref) {
  const output = runGit(['ls-remote', repoUrl, ref || 'main'], REPO_ROOT);
  const firstLine = output ? output.split(/\r?\n/)[0] : '';
  const sha = firstLine.split(/\s+/)[0];
  return /^[0-9a-f]{40}$/i.test(sha || '') ? sha : null;
}

function fetchJson(url, timeoutMs) {
  return new Promise(resolve => {
    if (!url) {
      resolve(null);
      return;
    }

    const request = https.get(url, { timeout: timeoutMs }, response => {
      if (response.statusCode !== 200) {
        response.resume();
        resolve(null);
        return;
      }

      let raw = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { raw += chunk; });
      response.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          resolve(null);
        }
      });
    });

    request.on('timeout', () => {
      request.destroy();
      resolve(null);
    });
    request.on('error', () => resolve(null));
  });
}

function determineStatus(local, adapter, upstream) {
  const commitComparable = Boolean(local.gitCommit && adapter.remoteCommit);
  const versionComparable = Boolean(local.version && adapter.remoteManifestVersion);
  const adapterBehind = commitComparable
    ? local.gitCommit !== adapter.remoteCommit
    : null;
  const versionBehind = versionComparable
    ? local.version !== adapter.remoteManifestVersion
    : null;
  const upstreamComparable = Boolean(upstream.remoteCommit && upstream.syncedCommit);
  const upstreamChangedSinceSync = upstreamComparable
    ? upstream.remoteCommit !== upstream.syncedCommit
    : adapter.remoteCommit && upstream.remoteCommit
      ? adapter.remoteCommit !== upstream.remoteCommit
      : null;

  let status = 'unknown';
  if (adapterBehind === true || versionBehind === true) {
    status = 'update_available';
  } else if (local.dirty) {
    status = 'local_changes_present';
  } else if (upstreamChangedSinceSync === true) {
    status = 'upstream_changed';
  } else if (
    (adapterBehind === false || adapterBehind === null)
    && versionBehind === false
    && upstreamChangedSinceSync !== true
  ) {
    status = 'current';
  }

  return {
    status,
    adapterBehind,
    versionBehind,
    upstreamChangedSinceSync,
  };
}

async function buildReport(options) {
  const pluginRoot = path.resolve(options.pluginRoot || REPO_ROOT);
  const manifestPath = path.join(pluginRoot, '.codex-plugin', 'plugin.json');
  const updatePath = path.join(pluginRoot, '.codex-plugin', 'update.json');
  const manifest = readJsonIfExists(manifestPath) || {};
  const update = readJsonIfExists(updatePath) || {};

  const adapterRepo = options.repoUrl || update.adapterRepo || manifest.repository || 'https://github.com/YBsmorom/ecc-codex-plugin.git';
  const adapterRef = options.ref || update.adapterRef || 'main';
  const upstreamRepo = update.canonicalUpstream || 'https://github.com/affaan-m/ECC.git';
  const upstreamRef = update.upstreamRef || 'main';

  const local = {
    pluginRoot,
    manifestPath,
    name: manifest.name || null,
    version: manifest.version || null,
    displayName: manifest.interface && manifest.interface.displayName || null,
    repository: manifest.repository || null,
    gitCommit: readLocalGitCommit(pluginRoot),
    dirty: isGitDirty(pluginRoot),
  };

  const adapter = {
    repo: adapterRepo,
    ref: adapterRef,
    remoteCommit: readRemoteGitCommit(adapterRepo, adapterRef),
    remoteManifestVersion: null,
  };

  const upstream = {
    repo: upstreamRepo,
    ref: upstreamRef,
    syncedCommit: update.syncedUpstreamCommit || null,
    remoteCommit: readRemoteGitCommit(upstreamRepo, upstreamRef),
  };

  const remoteManifestUrl = githubRawUrlFor(adapterRepo, adapterRef, '.codex-plugin/plugin.json');
  const remoteManifest = await fetchJson(remoteManifestUrl, options.timeoutMs);
  if (remoteManifest && remoteManifest.version) {
    adapter.remoteManifestVersion = remoteManifest.version;
  }

  const decision = determineStatus(local, adapter, upstream);

  return {
    status: decision.status,
    official: Boolean(update.official),
    safety: {
      checkOnly: true,
      mutatesCodexCache: false,
      trustsHooks: false,
      applyUpdates: false,
    },
    local,
    adapter,
    upstream,
    decision,
    recommendedNextSteps: [
      'If using a git checkout, run git pull or ask Codex to update the checkout, then rerun validation.',
      'If using a Codex marketplace source, prefer codex plugin marketplace upgrade followed by reinstall/enable in a new Codex session.',
      'Do not edit ~/.codex/plugins/cache directly; treat it as an installed copy.',
      'Re-run npm run codex:hooks:check and plugin validation after any applied update.',
    ],
  };
}

function printText(report) {
  console.log('ECC Codex adapter update check');
  console.log('');
  console.log(`Status: ${report.status}`);
  console.log(`Official upstream package: ${report.official ? 'yes' : 'no, adapter/fork only'}`);
  console.log('');
  console.log('Local:');
  console.log(`- root: ${report.local.pluginRoot}`);
  console.log(`- manifest: ${report.local.manifestPath}`);
  console.log(`- version: ${report.local.version || 'unknown'}`);
  console.log(`- commit: ${report.local.gitCommit || 'unknown'}`);
  console.log(`- dirty working tree: ${report.local.dirty ? 'yes' : 'no'}`);
  console.log('');
  console.log('Adapter repo:');
  console.log(`- repo: ${report.adapter.repo}`);
  console.log(`- ref: ${report.adapter.ref}`);
  console.log(`- remote commit: ${report.adapter.remoteCommit || 'unknown'}`);
  console.log(`- remote manifest version: ${report.adapter.remoteManifestVersion || 'unknown'}`);
  console.log('');
  console.log('Canonical upstream:');
  console.log(`- repo: ${report.upstream.repo}`);
  console.log(`- ref: ${report.upstream.ref}`);
  console.log(`- remote commit: ${report.upstream.remoteCommit || 'unknown'}`);
  console.log('');
  console.log('Safety: check-only; no cache writes; no hook trust changes; no automatic update.');
  console.log('');
  console.log('Recommended next steps:');
  for (const step of report.recommendedNextSteps) {
    console.log(`- ${step}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const report = await buildReport(options);
  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printText(report);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(`[ecc-codex] update check failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  buildReport,
  determineStatus,
  githubRawUrlFor,
  normalizeGithubRepoUrl,
  parseArgs,
};

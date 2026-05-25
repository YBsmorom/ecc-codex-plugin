#!/usr/bin/env node
/**
 * Build the Codex app hook surface from the upstream Claude Code hook graph.
 *
 * Codex currently skips command hooks that declare `async: true`. For the Codex
 * adapter fork, the active hooks/hooks.json must therefore omit async hooks
 * instead of letting the app repeatedly warn at runtime.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const defaultSource = path.join(repoRoot, 'docs', 'upstream', 'claude-code-hooks.json');
const defaultOutput = path.join(repoRoot, 'hooks', 'hooks.json');

function parseArgs(argv) {
  const options = {
    check: false,
    source: defaultSource,
    output: defaultOutput,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') {
      options.check = true;
    } else if (arg === '--source') {
      options.source = path.resolve(argv[++i] || '');
    } else if (arg === '--output') {
      options.output = path.resolve(argv[++i] || '');
    } else if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function usage() {
  return [
    'Usage: node scripts/codex/build-codex-hooks.js [--check] [--source <file>] [--output <file>]',
    '',
    'Builds hooks/hooks.json from docs/upstream/claude-code-hooks.json by removing',
    'command hooks that require async execution and omitting all async properties.',
  ].join('\n');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sanitizeHook(hook) {
  if (hook && hook.async === true) {
    return null;
  }

  const next = { ...hook };
  delete next.async;
  return next;
}

function sanitizeMatcherEntry(entry) {
  const hooks = Array.isArray(entry.hooks)
    ? entry.hooks.map(sanitizeHook).filter(Boolean)
    : [];

  if (hooks.length === 0) {
    return null;
  }

  return {
    ...entry,
    hooks,
  };
}

function buildCodexHooks(source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    throw new Error('Expected wrapped hooks object');
  }

  if (!source.hooks || typeof source.hooks !== 'object' || Array.isArray(source.hooks)) {
    throw new Error('Expected source.hooks object');
  }

  const next = {
    ...source,
    hooks: {},
  };

  for (const [eventName, entries] of Object.entries(source.hooks)) {
    if (!Array.isArray(entries)) {
      throw new Error(`Expected hooks.${eventName} to be an array`);
    }

    const filteredEntries = entries
      .map(sanitizeMatcherEntry)
      .filter(Boolean);

    if (filteredEntries.length > 0) {
      next.hooks[eventName] = filteredEntries;
    }
  }

  return next;
}

function countAsyncHooks(data) {
  let count = 0;
  for (const entries of Object.values(data.hooks || {})) {
    for (const entry of entries || []) {
      for (const hook of entry.hooks || []) {
        if (hook && Object.prototype.hasOwnProperty.call(hook, 'async')) {
          count++;
        }
      }
    }
  }
  return count;
}

function countMatchers(data) {
  return Object.values(data.hooks || {})
    .reduce((total, entries) => total + (Array.isArray(entries) ? entries.length : 0), 0);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const source = readJson(options.source);
  const codexHooks = buildCodexHooks(source);
  const output = stableJson(codexHooks);

  if (countAsyncHooks(codexHooks) !== 0) {
    throw new Error('Codex hook output still contains async properties');
  }

  if (options.check) {
    const existing = fs.existsSync(options.output) ? fs.readFileSync(options.output, 'utf8') : '';
    if (existing !== output) {
      console.error(`${path.relative(repoRoot, options.output)} is out of date; run npm run codex:hooks:build`);
      process.exit(1);
    }
  } else {
    fs.mkdirSync(path.dirname(options.output), { recursive: true });
    fs.writeFileSync(options.output, output);
  }

  console.log(
    `Codex hooks ${options.check ? 'checked' : 'built'}: ` +
    `${countMatchers(source)} Claude matchers -> ${countMatchers(codexHooks)} Codex matchers; ` +
    `${countAsyncHooks(source)} async hook entries omitted.`,
  );
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = {
  buildCodexHooks,
  countAsyncHooks,
  countMatchers,
};

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CURRENT_PLUGIN_SLUG = 'ecc';
const LEGACY_PLUGIN_SLUG = 'everything-claude-code';
const CURRENT_PLUGIN_HANDLE = `${CURRENT_PLUGIN_SLUG}@${CURRENT_PLUGIN_SLUG}`;
const LEGACY_PLUGIN_HANDLE = `${LEGACY_PLUGIN_SLUG}@${LEGACY_PLUGIN_SLUG}`;
const PLUGIN_CACHE_SLUGS = [CURRENT_PLUGIN_SLUG, LEGACY_PLUGIN_SLUG];
const CODEX_CACHE_SOURCES = ['local-user-plugins', 'openai-curated', 'openai-bundled'];
const PLUGIN_ROOT_SEGMENTS = [
  [CURRENT_PLUGIN_SLUG],
  [CURRENT_PLUGIN_HANDLE],
  ['marketplaces', CURRENT_PLUGIN_SLUG],
  [LEGACY_PLUGIN_SLUG],
  [LEGACY_PLUGIN_HANDLE],
  ['marketplaces', LEGACY_PLUGIN_SLUG],
];

/**
 * Resolve the ECC source root directory.
 *
 * Tries, in order:
 *   1. ECC_PLUGIN_ROOT / CODEX_PLUGIN_ROOT / CLAUDE_PLUGIN_ROOT env vars
 *   2. Standard install locations (~/.codex or ~/.claude) when scripts exist there
 *   3. Known plugin roots under ~/.codex/plugins/ or ~/.claude/plugins/
 *   4. Plugin cache auto-detection for Codex and Claude plugin cache layouts
 *   5. Fallback to the active harness root (.codex for Codex, otherwise .claude)
 *
 * @param {object} [options]
 * @param {string} [options.homeDir]  Override home directory (for testing)
 * @param {string} [options.envRoot]  Override plugin root env var chain (for testing)
 * @param {string} [options.runtime]  Override active harness runtime (for testing)
 * @param {string} [options.probe]    Relative path used to verify a candidate root
 *                                    contains ECC scripts. Default: 'scripts/lib/utils.js'
 * @returns {string} Resolved ECC root path
 */
function resolveEccRoot(options = {}) {
  const envRoot = options.envRoot !== undefined
    ? options.envRoot
    : (
      process.env.ECC_PLUGIN_ROOT ||
      process.env.CODEX_PLUGIN_ROOT ||
      process.env.CLAUDE_PLUGIN_ROOT ||
      ''
    );

  if (envRoot && envRoot.trim()) {
    return envRoot.trim();
  }

  const homeDir = options.homeDir || os.homedir();
  const runtime = String(options.runtime || process.env.ECC_HOOK_RUNTIME || process.env.ECC_HARNESS || '').trim().toLowerCase();
  const codexDir = path.join(homeDir, '.codex');
  const claudeDir = path.join(homeDir, '.claude');
  const probe = options.probe || path.join('scripts', 'lib', 'utils.js');

  const baseDirs = runtime === 'codex'
    ? [codexDir, claudeDir]
    : [claudeDir, codexDir];

  for (const baseDir of baseDirs) {
    if (fs.existsSync(path.join(baseDir, probe))) {
      return baseDir;
    }
  }

  // Exact plugin install locations. These preserve backwards
  // compatibility without scanning arbitrary plugin trees.
  for (const baseDir of baseDirs) {
    const exactPluginRoots = PLUGIN_ROOT_SEGMENTS.map((segments) =>
      path.join(baseDir, 'plugins', ...segments)
    );

    for (const candidate of exactPluginRoots) {
      if (fs.existsSync(path.join(candidate, probe))) {
        return candidate;
      }
    }
  }

  // Codex plugin cache — current app cache shape is:
  // ~/.codex/plugins/cache/<source>/<plugin-name>/<version>/
  try {
    const codexCacheRoot = path.join(codexDir, 'plugins', 'cache');
    const sourceDirs = fs.readdirSync(codexCacheRoot, { withFileTypes: true });
    for (const sourceEntry of sourceDirs) {
      if (!sourceEntry.isDirectory()) continue;
      if (
        CODEX_CACHE_SOURCES.length > 0 &&
        !CODEX_CACHE_SOURCES.includes(sourceEntry.name) &&
        !sourceEntry.name.includes('plugins')
      ) {
        continue;
      }

      const sourcePath = path.join(codexCacheRoot, sourceEntry.name);
      let pluginDirs;
      try {
        pluginDirs = fs.readdirSync(sourcePath, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const pluginEntry of pluginDirs) {
        if (!pluginEntry.isDirectory() || !PLUGIN_CACHE_SLUGS.includes(pluginEntry.name)) continue;
        const pluginPath = path.join(sourcePath, pluginEntry.name);
        let versionDirs;
        try {
          versionDirs = fs.readdirSync(pluginPath, { withFileTypes: true });
        } catch {
          continue;
        }

        for (const verEntry of versionDirs) {
          if (!verEntry.isDirectory()) continue;
          const candidate = path.join(pluginPath, verEntry.name);
          if (fs.existsSync(path.join(candidate, probe))) {
            return candidate;
          }
        }
      }
    }
  } catch {
    // Codex plugin cache doesn't exist or isn't readable — continue.
  }

  // Claude plugin cache — Claude Code stores marketplace plugins under
  // ~/.claude/plugins/cache/<plugin-name>/<org>/<version>/
  try {
    for (const slug of PLUGIN_CACHE_SLUGS) {
      const cacheBase = path.join(claudeDir, 'plugins', 'cache', slug);
      const orgDirs = fs.readdirSync(cacheBase, { withFileTypes: true });

      for (const orgEntry of orgDirs) {
        if (!orgEntry.isDirectory()) continue;
        const orgPath = path.join(cacheBase, orgEntry.name);

        let versionDirs;
        try {
          versionDirs = fs.readdirSync(orgPath, { withFileTypes: true });
        } catch {
          continue;
        }

        for (const verEntry of versionDirs) {
          if (!verEntry.isDirectory()) continue;
          const candidate = path.join(orgPath, verEntry.name);
          if (fs.existsSync(path.join(candidate, probe))) {
            return candidate;
          }
        }
      }
    }
  } catch {
    // Plugin cache doesn't exist or isn't readable — continue to fallback
  }

  return runtime === 'codex' ? codexDir : claudeDir;
}

/**
 * Compact inline version for embedding in command .md code blocks.
 *
 * This is the minified form of resolveEccRoot() suitable for use in
 * node -e "..." scripts where require() is not available before the
 * root is known.
 *
 * Usage in commands:
 *   const _r = <paste INLINE_RESOLVE>;
 *   const sm = require(_r + '/scripts/lib/session-manager');
 */
function inlineSingleQuote(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function inlineArray(values) {
  return `[${values.map(inlineSingleQuote).join(',')}]`;
}

function inlineNestedArray(values) {
  return `[${values.map(inlineArray).join(',')}]`;
}

const INLINE_PLUGIN_ROOT_SEGMENTS = inlineNestedArray(PLUGIN_ROOT_SEGMENTS);
const INLINE_PLUGIN_CACHE_SLUGS = inlineArray(PLUGIN_CACHE_SLUGS);

const INLINE_CODEX_CACHE_SOURCES = inlineArray(CODEX_CACHE_SOURCES);

const INLINE_RESOLVE = `(()=>{var p=require('path'),f=require('fs'),h=require('os').homedir(),q=p.join('scripts','lib','utils.js'),rt=String(process.env.ECC_HOOK_RUNTIME||process.env.ECC_HARNESS||'').toLowerCase(),cd=p.join(h,'.codex'),cl=p.join(h,'.claude'),ds=rt==='codex'?[cd,cl]:[cl,cd];for(var e of [process.env.ECC_PLUGIN_ROOT,process.env.CODEX_PLUGIN_ROOT,process.env.CLAUDE_PLUGIN_ROOT]){if(e&&String(e).trim())return String(e).trim()}for(var d of ds){if(f.existsSync(p.join(d,q)))return d;for(var s of ${INLINE_PLUGIN_ROOT_SEGMENTS}){var l=p.join(d,'plugins',...s);if(f.existsSync(p.join(l,q)))return l}}try{var cr=p.join(cd,'plugins','cache');for(var so of f.readdirSync(cr,{withFileTypes:true})){if(!so.isDirectory())continue;if(!${INLINE_CODEX_CACHE_SOURCES}.includes(so.name)&&!so.name.includes('plugins'))continue;for(var pl of f.readdirSync(p.join(cr,so.name),{withFileTypes:true})){if(!pl.isDirectory()||!${INLINE_PLUGIN_CACHE_SLUGS}.includes(pl.name))continue;for(var ve of f.readdirSync(p.join(cr,so.name,pl.name),{withFileTypes:true})){if(!ve.isDirectory())continue;var cc=p.join(cr,so.name,pl.name,ve.name);if(f.existsSync(p.join(cc,q)))return cc}}}}catch(x){}try{for(var g of ${INLINE_PLUGIN_CACHE_SLUGS}){var b=p.join(cl,'plugins','cache',g);for(var o of f.readdirSync(b,{withFileTypes:true})){if(!o.isDirectory())continue;for(var v of f.readdirSync(p.join(b,o.name),{withFileTypes:true})){if(!v.isDirectory())continue;var c=p.join(b,o.name,v.name);if(f.existsSync(p.join(c,q)))return c}}}}catch(x){}return rt==='codex'?cd:cl})()`;

module.exports = {
  resolveEccRoot,
  INLINE_RESOLVE,
};

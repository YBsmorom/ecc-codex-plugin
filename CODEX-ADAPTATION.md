# Codex Adaptation Notes

This document explains how ECC is adapted for Codex.

## Design Goal

ECC is large: it contains many skills, rules, commands, scripts, docs, examples, and MCP configurations. A useful Codex adaptation must not push all of that into context at once. It needs a router that can select the smallest relevant surface for the current task.

The adaptation goal is:

```text
Use ECC as a lazy-loaded Codex plugin where task routing, MCP selection,
and verification are explicit.
```

## Codex Plugin Surface

The plugin root exposes:

- `.codex-plugin/plugin.json` for Codex plugin metadata.
- `skills/` for Codex-discoverable skills.
- `.mcp.json` for optional MCP server definitions.
- `assets/` for plugin presentation assets.
- the original ECC folders for reference and reusable implementation material.

The package keeps the plugin root installable so users can hand Codex the repository URL and ask it to install the plugin.

## Orchestration Router

The key Codex-specific file is:

```text
skills/ecc-codex-orchestrator/SKILL.md
```

It tells Codex to:

- classify the task;
- check available native Codex tools/plugins first;
- read lightweight indexes before skill bodies;
- choose a small set of ECC skills;
- add verification/security companions for risky work;
- treat Claude-specific commands, agents, hooks, and rules as references unless Codex exposes an equivalent mechanism.

## Lightweight Routing Data

The router uses three lightweight references:

- `references/skill-index.json`: generated metadata for ECC skills, including domains, tool needs, companions, keywords, and paths.
- `references/routing-map.json`: candidate counts, task classes, framework routes, and risk companions.
- `references/mcp-routing-policy.md`: how to choose between ECC MCP servers and Codex-native/official tools.

Regenerate the skill index after editing ECC skills:

```powershell
python skills/ecc-codex-orchestrator/scripts/rebuild-skill-index.py
```

## MCP Handling

ECC includes MCP servers for GitHub, Context7, Exa, Memory, Playwright, and Sequential Thinking. Codex may already have official plugins or user-level MCP tools with overlapping capabilities.

Default rule:

```text
Prefer the most native, least duplicative surface that satisfies the task.
```

Examples:

- Use the official GitHub plugin when it is available and authenticated.
- Use Context7 for third-party library documentation.
- Use official OpenAI docs for OpenAI product behavior.
- Use Codex Browser for local interactive inspection.
- Use Playwright MCP for scripted browser tests and screenshots.
- Use ECC Memory MCP only for explicit graph-memory tasks.

## Safety Boundary

The adaptation does not automatically install global hooks, merge credentials into Codex config, or enable duplicate MCP servers. Scripts are executable assets, but Codex should read them before running them.

Credentials remain user-private runtime configuration. They must not be written into prompts, events, logs, artifacts, repository files, or MCP config.

## Verification

Use the Codex plugin validator before publishing or sharing:

```powershell
python <codex-home>\skills\.system\plugin-creator\scripts\validate_plugin.py .
```

Also scan the repository for real secrets before public release. Fake secret-like strings in test fixtures are expected because ECC includes security scanner tests.

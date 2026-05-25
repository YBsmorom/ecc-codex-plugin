# ECC MCP Routing Policy For Codex

Use this policy when ECC exposes an MCP server that overlaps with a Codex-native tool, official plugin, connector, or user-level MCP server.

## Core Rule

Prefer the most native, least duplicative surface that satisfies the task. Enable or call an ECC MCP server only when it adds a capability that is not already available, or when its tool is better suited for the current workflow.

## Priority Table

| Capability | Preferred Surface | ECC MCP Role | Use ECC MCP When | Avoid ECC MCP When |
| --- | --- | --- | --- | --- |
| GitHub repos, issues, PRs | Official GitHub plugin or connector | Backup/general MCP | The official GitHub plugin is unavailable or lacks a needed action | Official GitHub tools are active and authenticated |
| Current web research | System web search for general facts; Exa for semantic search | Specialized semantic web search/fetch | Need semantic company/person/web search or Exa-specific fetch behavior | A direct official source or normal web search is enough |
| Third-party library docs | Context7 MCP | Primary docs lookup | Need current package/framework examples | OpenAI product docs are involved; use official OpenAI docs first |
| Browser/frontend verification | Codex Browser plugin for local interactive checks; Playwright MCP for scripted E2E | Scriptable browser automation | Need repeatable navigation, screenshots, DOM snapshots, form interactions | The task is only to open/inspect a local app visually |
| Memory/knowledge graph | Codex memory for user/project preferences; MCP memory for explicit graph operations | Optional structured graph store | User asks to create/search graph entities or relations | Normal conversation memory or repo files are enough |
| Stepwise reasoning | Model reasoning first | Optional explicit reasoning tool | Complex planning needs an external scratchpad-like decomposition | Simple tasks or private chain-of-thought would be exposed unnecessarily |

## Duplicate Handling

1. Inventory active surfaces before choosing a tool:
   - active plugins and connectors;
   - user-level `mcp_servers`;
   - ECC bundled MCP servers;
   - local scripts and project tools.
2. If two tools provide the same capability, choose one and say which one was skipped when it matters.
3. Prefer official managed plugins/connectors for authenticated SaaS operations.
4. Prefer ECC MCPs for portable, task-scoped workflows that the official plugin does not cover.
5. Never call both duplicate tools to do the same write operation.

## Suggested Defaults For This Machine

These are policy recommendations, not automatic edits:

```toml
[plugins."ecc@local-user-plugins".mcp_servers.github]
enabled = false

[plugins."ecc@local-user-plugins".mcp_servers.context7]
enabled = true

[plugins."ecc@local-user-plugins".mcp_servers.exa]
enabled = true

[plugins."ecc@local-user-plugins".mcp_servers.memory]
enabled = false

[plugins."ecc@local-user-plugins".mcp_servers.playwright]
enabled = true
default_tools_approval_mode = "prompt"

[plugins."ecc@local-user-plugins".mcp_servers.sequential-thinking]
enabled = true
```

Rationale:

- GitHub overlaps with the official GitHub plugin in this workspace.
- Memory overlaps conceptually with Codex memory and should be explicit, not ambient.
- Playwright is still valuable for scripted E2E even when the Browser plugin exists.
- Context7 and Exa provide distinct docs/search behavior.

## Reporting Requirement

For non-trivial tasks, the orchestrator should report:

- selected MCP/tool surface;
- skipped duplicate surface, when relevant;
- authentication or credential caveats;
- whether the tool was actually called or only considered.

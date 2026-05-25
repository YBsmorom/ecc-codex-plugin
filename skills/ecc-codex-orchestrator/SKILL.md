---
name: ecc-codex-orchestrator
description: Use when a task asks to use ECC, an ECC plugin, Codex plugin orchestration, or when non-trivial work needs choosing among ECC skills, MCP servers, scripts, commands, hooks, rules, agents, docs, or examples.
origin: ECC-Codex-Adapter
---

# ECC Codex Orchestrator

This is the Codex-facing router for ECC. It selects and combines ECC skills, MCP servers, scripts, commands, hooks, rules, agents, docs, and examples without assuming Claude Code slash commands, Claude agents, or hooks are available in the active harness.

Use progressive disclosure: load the index and routing rules first, then read only the best matching skill bodies and policy files needed for the task.

## Operating Rules

1. Classify the task first: `simple`, `serial`, `parallel`, `broad-context`, or `high-risk`.
2. Check available Codex skills/plugins/tools/MCP servers before proposing custom work.
3. Build a candidate set before choosing a skill. Do not rely on a single keyword match for non-trivial tasks.
4. Prefer the smallest ECC surface set that solves the task:
   - direct `skills/*/SKILL.md` for reusable workflow guidance;
   - `.mcp.json` or `mcp-configs/*` when an external tool bridge is needed;
   - `scripts/*` only after reading the script and confirming it is safe for the current workspace;
   - `commands/*`, `hooks/*`, `rules/*`, `agents/*`, `docs/*`, and `examples/*` as reference material unless the active Codex harness exposes an equivalent execution mechanism.
5. Translate Claude-specific instructions into Codex-native actions. Do not invent unavailable slash commands, agent names, hooks, or MCP tools.
6. For substantial implementation, pair the task skill with review/verification skills such as `tdd-workflow`, `security-review`, `verification-loop`, `ai-regression-testing`, or language/framework-specific review skills.
7. Never put secrets into prompts, events, artifacts, logs, or generated config. Treat MCP/API credentials as user-private runtime configuration.

## Required References

Read these lightweight references before routing a non-trivial task:

- `references/skill-index.json` — generated index of all ECC skills, with domains, tool needs, companions, and paths.
- `references/routing-map.json` — task classification, candidate counts, risk additions, and companion rules.
- `references/mcp-routing-policy.md` — duplicate MCP/tool handling and default priority rules.

Use `scripts/rebuild-skill-index.py` after adding, removing, or editing skills so the index remains accurate.

## Routing Pass

Run this quick pass before acting on any non-trivial ECC-backed task:

1. Identify task domain: engineering, security, testing, docs, research, frontend, data, ops, content, media, business, or automation.
2. Generate candidates from `skill-index.json` and `routing-map.json`:
   - simple: 3 candidates, read 1 body;
   - serial: 5 candidates, read 2 bodies;
   - parallel: 8 candidates, read 3 bodies;
   - broad-context: 10 candidates, read 4 bodies;
   - high-risk: 12 candidates, read 4 bodies plus required companions.
3. Expand the candidate set when confidence is low:
   - task wording is broad or ambiguous;
   - multiple domains match;
   - no candidate has a strong direct description match;
   - a risk term appears: auth, credentials, secrets, payment, PII/PHI, destructive write, migration, production, legal, medical, financial.
4. Read only the top candidate skill bodies and required companion skill bodies. Use frontmatter and the index for the rest.
5. Add companion skills by rule:
   - implementation -> `tdd-workflow` and `verification-loop`;
   - security/auth/secrets/payments/PII -> `security-review`;
   - UI/browser/frontend -> `browser-qa` or `e2e-testing`;
   - current docs/research -> `search-first`;
   - large planning/orchestration -> `agentic-engineering` or `workspace-surface-audit`.
6. Check whether a helper surface exists:
   - `scripts/` for local automation;
   - `mcp-configs/` and `.mcp.json` for tool bridges;
   - `commands/` for reusable workflow prompts;
   - `hooks/` for enforcement ideas;
   - `rules/` for policy text;
   - `agents/` for role prompts that can be adapted to Codex subagents when the user explicitly asks for delegation.
7. Resolve duplicate MCP/tool surfaces with `references/mcp-routing-policy.md`.
8. Decide execution shape:
   - `simple`: use the matched skill directly.
   - `serial`: keep the critical path in the main agent and load only the next needed ECC reference.
   - `parallel` or `broad-context`: if Codex subagents are available and the user has authorized delegation, assign disjoint bounded lanes.
   - `high-risk`: add independent review or verification, even if the implementation is local.
9. State skipped surfaces briefly when they are unavailable, duplicated, lower priority, or unsafe to use.

## Common Routes

| User intent | Start with | Common companions |
| --- | --- | --- |
| Build or fix code | `tdd-workflow`, language/framework skill | `verification-loop`, `code-review`, `ai-regression-testing` |
| Security review | `security-review` or framework security skill | `security-scan`, `secrets-management`, `owasp`-related references |
| Plan or decompose work | `agentic-engineering`, `plan-orchestrate` | `architecture-decision-records`, `verification-loop` |
| Audit available capabilities | `workspace-surface-audit` | `automation-audit-ops`, `skill-scout` |
| Search before building | `search-first` | `iterative-retrieval`, `deep-research`, relevant MCP configs |
| Frontend work | `frontend-design-direction`, framework/UI skill | `browser-qa`, `e2e-testing`, accessibility skills |
| Documentation/content | `article-writing`, `content-engine`, `doc-updater`-style references | `brand-voice`, `market-research` |

## MCP Duplicate Policy

ECC bundles MCP servers, but Codex may already expose official plugins, connectors, or user-level MCP servers with the same capability.

Default priorities:

- GitHub: prefer the official GitHub plugin when it is available and authenticated; use ECC GitHub MCP only as fallback or for missing actions.
- Web/current research: use official/source-specific docs first; use Exa for semantic web search or fetch when useful.
- Library docs: use Context7 for third-party package docs; use official OpenAI docs for OpenAI products.
- Browser: use Codex Browser for local interactive inspection; use Playwright MCP for scripted E2E, screenshots, DOM snapshots, or repeatable flows.
- Memory: use Codex memory for user/project preferences; use MCP memory only when the user asks for explicit graph entities/relations.
- Sequential Thinking: use only for complex planning or decomposition, not routine tasks.

Never run duplicate write-capable tools for the same operation.

## Safety Checks

- Read any script before running it.
- Treat hook files as design/reference unless the user explicitly asks to install hooks.
- Do not merge ECC config into global Codex config unless the user explicitly asks.
- Prefer project-local changes over global changes when both satisfy the request.
- For MCP servers installed through `npx`, expect first-run network/package activity and disclose it before relying on the server.

## Output

For non-trivial tasks, report:

- candidate count and selected ECC surfaces;
- why selected surfaces won over skipped near-matches;
- serial vs parallel execution shape;
- files/scripts/MCP servers used;
- duplicate MCP/tool decisions;
- verification performed;
- any unavailable or skipped ECC surfaces.

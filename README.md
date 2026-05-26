# ECC for Codex

[中文说明](README.zh-CN.md) | [Upstream ECC README](docs/upstream/README.affaan-m-ECC.md) | [Codex adaptation notes](CODEX-ADAPTATION.md)

![ECC - the harness-native operator system for agentic work](assets/hero.png)

[affaan-m/ECC](https://github.com/affaan-m/ECC) is the canonical upstream for ECC. This repository is a Codex-oriented adapter/fork for users who want a repository-URL Codex install path today. It keeps the original ECC content intact and adds the Codex plugin metadata, routing skill, MCP duplicate policy, and installation notes needed for Codex to use ECC as a lazy-loaded plugin.

ECC itself is a harness-native operator system for agentic work: skills, rules, commands, MCP configs, security workflows, TDD workflows, review loops, and verification patterns. This adaptation makes that surface usable from Codex without assuming Claude Code slash commands, hooks, or agent names are available.

## ECC For Codex Flow

The rendered diagram below is committed as a static image so readers see the same flow without depending on their Markdown renderer's Mermaid version.

![ECC for Codex workflow](assets/diagrams/ecc-for-codex-flow.en.png)

[Mermaid source](assets/diagrams/ecc-for-codex-flow.en.mmd) | [SVG export](assets/diagrams/ecc-for-codex-flow.en.svg) | [PNG export](assets/diagrams/ecc-for-codex-flow.en.png)

## What This Is

This is a practical packaging layer for Codex users:

- a fork that preserves upstream ECC attribution and the MIT license;
- a Codex plugin surface that can be installed from a repository URL;
- a router-first way for Codex to select the smallest useful ECC skill/tool surface for each task;
- a Codex-safe hook adapter that removes unsupported `async` declarations while preserving bounded hook behavior where possible.

Do not present this repository as the canonical ECC package or as an upstream ECC release unless `affaan-m/ECC` merges or links it. Upstream ECC remains the source project. This fork focuses on Codex installation, routing, duplicate-tool policy, and runtime fit; it does not claim true Claude Code background-async hook parity.

## Install With Codex

Give Codex this repository URL and ask it to install the plugin. Users should not need to clone this repository by hand:

```text
Install the ECC Codex plugin adapter from https://github.com/YBsmorom/ecc-codex-plugin.
Use the repository root as the plugin root, validate .codex-plugin/plugin.json,
enable it as a local/user plugin, and then show me how to use ecc-codex-orchestrator.
```

That is the intended user flow: paste the repo URL into Codex, tell it to install, and let Codex copy/enable the plugin in the local plugin marketplace.

For the Codex agent doing the installation, the expected contract is:

1. Clone `https://github.com/YBsmorom/ecc-codex-plugin` into the local plugin workspace.
2. Treat the cloned repository root as the plugin root.
3. Validate `.codex-plugin/plugin.json` with the local Codex plugin validator when available.
4. Register or enable the folder as a local/user Codex plugin.
5. Confirm the plugin exposes `ecc-codex-orchestrator`, then show the user a short usage example.

Manual fallback:

```powershell
git clone https://github.com/YBsmorom/ecc-codex-plugin.git
# Then ask Codex to install or register the cloned folder as a local plugin.
```

## Upstream ECC Install Notes

The Codex plugin path above is the default for this repository. The following upstream ECC notes are kept so operators who also install ECC into Claude Code, Cursor, or raw rule folders do not accidentally stack incompatible install methods.

### Pick one path only

**Recommended default:** install the Claude Code plugin when you are using upstream ECC directly in Claude Code. For this Codex adaptation, install the Codex plugin from the GitHub URL above instead.

**Do not stack install methods.** If you choose this path, stop there. Do not also run `/plugin install`.

### Find the right components first

Use consult before copying broad sets of rules, hooks, or skills:

```bash
npx ecc consult "security reviews" --target claude
```

It returns matching components, related profiles, and preview/install commands.

### Low-context / no-hooks path

For a smaller upstream ECC install without hook runtime:

```bash
./install.sh --profile minimal --target claude
npx ecc-install --profile minimal --target claude
./install.sh --profile core --without baseline:hooks --target claude
```

This profile intentionally excludes `hooks-runtime`.

### Manual hook install safety

Do not copy the raw repo `hooks/hooks.json` into `~/.claude/settings.json` or `~/.claude/hooks/hooks.json`. Use the supported installer paths instead:

```bash
bash ./install.sh --target claude --modules hooks-runtime
```

```powershell
pwsh -File .\install.ps1 --target claude --modules hooks-runtime
```

On Windows, the Claude config root is `%USERPROFILE%\\.claude`.

### Cursor and rules scope

Cursor agent files live under `.cursor/agents/ecc-*.md`. Cursor-native loading behavior can vary by Cursor build. ECC does not install root `AGENTS.md` into `.cursor/`.

Start with `rules/common` plus one language or framework pack you actually use. Keep plugin-path rules namespaced under `~/.claude/rules/ecc/`.

### Reset / Uninstall ECC

Before reinstalling or switching install paths, inspect the current state:

```bash
node scripts/ecc.js list-installed
node scripts/ecc.js doctor
node scripts/uninstall.js --dry-run
```

ECC only removes files recorded in its install-state. If you installed through the Claude Code plugin path, remove the plugin from Claude Code first, then run the dry-run uninstall before deleting any remaining copied files.

## What This Adaptation Adds

| Added surface | Why it exists | Compared with upstream ECC |
| --- | --- | --- |
| `.codex-plugin/plugin.json` | Lets Codex discover this repository as a plugin. | Upstream ECC is not packaged primarily as this fork's Codex repo-URL adapter. |
| `skills/ecc-codex-orchestrator/` | Gives Codex one routing entrypoint instead of loading the whole ECC surface. | Upstream skills remain intact; this adds a Codex-facing selector. |
| `skill-index.json` and `routing-map.json` | Keeps 233 skills searchable through lightweight metadata. | Avoids dumping every skill body into context up front. |
| `mcp-routing-policy.md` | Handles overlap between ECC MCP servers and Codex-native or official plugins. | Prefers the most native, least duplicative tool for each task. |
| `hooks/hooks.json` | Provides a Codex-safe hook graph with no `async` declarations. | Preserves the Claude source hook graph separately and adapts former async entries into bounded Codex hook entries. |
| Bilingual docs | Makes install, boundaries, attribution, and validation clear in English and Chinese. | Adds Codex-specific onboarding without removing upstream documentation. |

## Why This Fork Exists

ECC is useful, but it is large. A direct all-at-once import into Codex would be noisy, expensive in context, and likely to route poorly. This fork makes the integration explicit:

1. Codex starts from one orchestration skill.
2. The router reads small indexes before opening skill bodies.
3. Native Codex tools and official plugins win when they overlap with ECC MCP servers.
4. Risky work can add verification, security, or review companions.
5. Hooks use the Codex-supported lifecycle instead of unsupported async declarations.

## Upstream Contribution Path

Fork-local changes should stay focused on the Codex repository-URL install path. Generally useful routing, MCP duplicate-selection, or Codex-safe hook improvements should be split into focused PRs against [affaan-m/ECC](https://github.com/affaan-m/ECC) so the canonical upstream can adopt them.

## Version And Compatibility

### v2.0.0-rc.1

| Surface | Status in this fork |
| --- | --- |
| Codex plugin manifest | Present |
| Skill router | `ecc-codex-orchestrator` |
| MCP config | Optional reference config with duplicate-routing policy |
| Hooks | Codex-safe graph with 28 matchers and no `async` declarations |
| Claude Code assets | Preserved as upstream/reference material |
| npm package identity | Preserved but marked private in this fork; Codex users should install from the repository URL, not treat this fork as a new npm package |

Codex installs this adaptation from `https://github.com/YBsmorom/ecc-codex-plugin`. Upstream Claude Code marketplace installs use the short identifier `ecc@ecc`; if you install upstream ECC with `/plugin install ecc@ecc`, do not run the full installer afterwards with `--profile full`.

The canonical upstream plugin command namespace is `/ecc:plan`. In Codex, prefer natural-language requests routed through `ecc-codex-orchestrator`; command shims are reference material unless the active harness supports them.

GitHub Copilot prompt files are available under `.github/prompts/`, and `.vscode/settings.json` enables `chat.promptFiles` for compatible VS Code builds.

Release and harness references:

- [Hermes setup](docs/HERMES-SETUP.md)
- [ECC 2.0.0-rc.1 release notes](docs/releases/2.0.0-rc.1/release-notes.md)

MCP management note: Use `/mcp` for Claude Code runtime disables; Claude Code persists those choices in `~/.claude.json`. `ECC_DISABLED_MCPS` is an ECC install/sync filter, not a live Claude Code toggle.

## How Codex Uses ECC

Codex should not load the whole ECC surface at once. The router follows progressive disclosure:

1. Classify the task as simple, serial, parallel, broad-context, or high-risk.
2. Read the lightweight skill index, routing map, and MCP policy.
3. Select the smallest relevant ECC skill set for the task.
4. Load only the matching skill bodies and companion verification/security skills.
5. Prefer Codex-native tools or official plugins when they overlap with ECC MCP servers.
6. Use ECC scripts and hooks only after inspecting them and confirming they are safe for the current workspace.

This makes ECC practical as a large Codex plugin: routing stays explicit, context stays small, and duplicate tools are handled deliberately.

## Licensing And Attribution

The original ECC project is MIT licensed by Affaan Mustafa. This repository preserves the upstream `LICENSE` file and includes adaptation notices in [NOTICE.md](NOTICE.md).

Original upstream:

- Source: https://github.com/affaan-m/ECC
- Website: https://ecc.tools
- Original README: [docs/upstream/README.affaan-m-ECC.md](docs/upstream/README.affaan-m-ECC.md)
- Archived upstream GitHub Actions workflows: [docs/upstream/github-workflows/](docs/upstream/github-workflows/)

This repository is a Codex-oriented adaptation and packaging layer for upstream ECC; it should not be described as the canonical ECC package or an upstream ECC release unless upstream merges or links it.

## Verification

Before publishing, the plugin should pass:

```powershell
python <codex-home>\skills\.system\plugin-creator\scripts\validate_plugin.py <repo-path>
npm run codex:hooks:check
npm test
```

The repository should also be scanned for real credentials before public push. Test fixtures may contain fake secret-like strings for security scanners; real `.env` files must not be committed.

## Upstream Catalog Snapshot

This Codex adaptation keeps the upstream ECC catalog available. After installation, Codex can route access to 60 agents, 233 skills, and 75 legacy command shims through the Codex-facing router and reference material.

The rc.1 public surface is preserved and extended for Codex: actual OSS surface: 60 agents, 233 skills, and 75 legacy command shims.

Project tree snapshot:

```text
| -- agents/ # 60 specialized subagents for delegation
```

Catalog comparison:

| Surface | Count |
| --- | --- |
| Agents | 60 agents |
| Commands | 75 commands |
| Skills | 233 skills |

Harness parity:

| Surface | Total | Claude Code | Codex | Other |
| --- | ---: | --- | --- | ---: |
| Agents | 60 | Shared (AGENTS.md) | Shared (AGENTS.md) | 12 |
| Commands | 75 | Shared | Instruction-based | 75 |
| Skills | 233 | Shared | Routed through ecc-codex-orchestrator | 37 |

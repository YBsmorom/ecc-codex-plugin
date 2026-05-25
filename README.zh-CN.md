# ECC for Codex（非官方 Fork）

[English](README.md) | [上游 ECC README](docs/upstream/README.zh-CN.affaan-m-ECC.md) | [Codex 适配说明](CODEX-ADAPTATION.zh-CN.md)

![ECC - 面向智能体工作的 harness-native operator system](assets/hero.png)

这个仓库是 [affaan-m/ECC](https://github.com/affaan-m/ECC) 的非官方 Codex 插件适配 fork。它保留原 ECC 内容，并补齐 Codex 插件元数据、路由技能、MCP 去重策略和安装说明，让 Codex 可以把 ECC 当作按任务懒加载的大型插件来使用。

ECC 本身是一套面向 agentic work 的 harness-native operator system，包含技能、规则、命令、MCP 配置、安全工作流、TDD 工作流、代码评审和验证模式。本适配版的重点是：让这些能力可以在 Codex 里使用，而不假设 Claude Code 的 slash command、hook 或 agent 名称一定存在。

## 用 Codex 安装

把下面这段话直接发给 Codex。使用者不需要手动 clone 仓库：

```text
请从 https://github.com/YBsmorom/ecc-codex-plugin 安装这个非官方 Codex 插件适配版。
把仓库根目录作为插件根目录，校验 .codex-plugin/plugin.json，
注册并启用为本地/用户插件，然后告诉我如何使用 ecc-codex-orchestrator。
```

这就是目标用户流程：把仓库 URL 粘贴给 Codex，再让 Codex 完成安装、校验和启用。

对负责安装的 Codex agent 来说，预期安装契约是：

1. 把 `https://github.com/YBsmorom/ecc-codex-plugin` 克隆到本机插件工作区。
2. 把克隆出来的仓库根目录当作插件根目录。
3. 优先用本机 Codex 插件校验器校验 `.codex-plugin/plugin.json`。
4. 把该目录注册或启用为本地/用户 Codex 插件。
5. 确认插件暴露 `ecc-codex-orchestrator`，再给用户一个简短使用示例。

手动兜底方式：

```powershell
git clone https://github.com/YBsmorom/ecc-codex-plugin.git
# 然后让 Codex 把这个克隆目录注册为本地插件。
```

## 本适配版新增了什么

- `.codex-plugin/plugin.json`：Codex 插件发现和 UI 元数据。
- `skills/ecc-codex-orchestrator/`：面向 Codex 的 ECC 路由技能。
- `skills/ecc-codex-orchestrator/references/skill-index.json`：ECC 技能生成索引。
- `skills/ecc-codex-orchestrator/references/routing-map.json`：任务分类、候选技能和伴随验证规则。
- `skills/ecc-codex-orchestrator/references/mcp-routing-policy.md`：Codex 环境下的 MCP/工具重复处理策略。
- `hooks/hooks.json`：从保留的 Claude Code hooks 生成的 Codex-safe hook 图，不包含 `async` 声明；原 async 条目会适配为有界的 Codex hook 条目。
- `.mcp.json`：GitHub、Context7、Exa、Memory、Playwright、Sequential Thinking 的便携 MCP 配置。
- 中英文安装和适配说明。

## 版本和兼容性

### v2.0.0-rc.1 Codex 适配版

| **版本** | 插件 | 插件 | 参考配置 | 2.0.0-rc.1 |
| --- | --- | --- | --- | --- |

Codex 安装本适配版时使用 `https://github.com/YBsmorom/ecc-codex-plugin`。上游 Claude Code marketplace 安装使用短标识 `ecc@ecc`；如果已经通过 `/plugin install ecc@ecc` 安装上游 ECC，之后不要再运行 `--profile full` 完整安装器。

上游插件命令的规范命名空间是 `/ecc:plan`。在 Codex 里，优先用自然语言任务触发 `ecc-codex-orchestrator` 路由；command shim 只作为兼容参考，除非当前 harness 明确支持。

GitHub Copilot prompt 文件位于 `.github/prompts/`，`.vscode/settings.json` 中启用了 `chat.promptFiles`，供兼容的 VS Code 版本读取。

发布和 harness 参考：

- [Hermes setup](docs/HERMES-SETUP.md)
- [ECC 2.0.0-rc.1 release notes](docs/releases/2.0.0-rc.1/release-notes.md)

MCP 管理说明：Claude Code 运行时禁用 MCP 应使用 `/mcp`，Claude Code 会把这些选择保存在 `~/.claude.json`。`ECC_DISABLED_MCPS` 只是 ECC 安装/同步过滤器，不是 live Claude Code toggle。

## Codex 如何使用 ECC

Codex 不应该一次性加载完整 ECC 内容。路由器采用渐进披露：

1. 先把任务分类为 simple、serial、parallel、broad-context 或 high-risk。
2. 读取轻量的技能索引、路由表和 MCP 策略。
3. 为当前任务选择最小相关 ECC 能力集合。
4. 只加载匹配技能正文，以及必要的验证/安全伴随技能。
5. 当 ECC MCP 与 Codex 原生工具或官方插件重复时，优先使用更原生、更少重复的工具。
6. 只有在读过脚本并确认适合当前工作区后，才运行 ECC 的脚本或参考 hook。

这样 ECC 作为一个较大的 Codex 插件仍然可控：路由明确、上下文占用小、重复工具不会乱用。

## 开源协议和署名

原 ECC 项目由 Affaan Mustafa 以 MIT 协议开源。这个仓库保留了上游 `LICENSE` 文件，并在 [NOTICE.md](NOTICE.md) 中说明本适配版的来源和改动边界。

上游项目：

- 源码：https://github.com/affaan-m/ECC
- 官网：https://ecc.tools
- 原中文 README：[docs/upstream/README.zh-CN.affaan-m-ECC.md](docs/upstream/README.zh-CN.affaan-m-ECC.md)
- 已归档的上游 GitHub Actions 工作流：[docs/upstream/github-workflows/](docs/upstream/github-workflows/)

这个仓库是非官方 Codex 适配和打包层，不是官方上游 ECC 仓库。

## 校验

发布前应通过插件校验：

```powershell
python <codex-home>\skills\.system\plugin-creator\scripts\validate_plugin.py <repo-path>
```

公开推送前还应扫描真实凭据。安全测试夹具里可能包含模拟 token/API key 字符串；真实 `.env` 文件不能提交。

## 上游 Catalog 快照

这个 Codex 适配版继续保留上游 ECC catalog。安装后，你现在可以使用 60 个代理、233 个技能和 75 个命令。

该快照用于保留上游校验脚本对 root README 的计数约束；Codex 实际使用时仍通过 `ecc-codex-orchestrator` 按任务懒加载。

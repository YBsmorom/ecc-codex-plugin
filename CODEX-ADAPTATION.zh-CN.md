# Codex 适配说明

本文说明 ECC 是如何适配 Codex 的。

## 设计目标

ECC 体量较大，包含大量技能、规则、命令、脚本、文档、示例和 MCP 配置。直接把所有内容塞进 Codex 上下文并不现实，也容易让路由失控。因此 Codex 适配版的核心是一个显式路由层。

适配目标是：

```text
把 ECC 作为一个按任务懒加载的 Codex 插件使用；
任务路由、MCP 选择和验证策略都要显式可追踪。
```

## Codex 插件表面

插件根目录暴露以下内容：

- `.codex-plugin/plugin.json`：Codex 插件元数据。
- `skills/`：Codex 可发现的技能目录。
- `.mcp.json`：可选 MCP 服务定义。
- `assets/`：插件展示资产。
- 原 ECC 目录：作为参考材料和可复用实现材料继续保留。

仓库根目录本身就是插件根目录，因此用户可以把仓库 URL 发给 Codex，并要求 Codex 安装。

## 编排路由器

Codex 适配的关键文件是：

```text
skills/ecc-codex-orchestrator/SKILL.md
```

它要求 Codex：

- 先判断任务类型；
- 优先检查 Codex 原生工具、官方插件和已有 MCP；
- 先读轻量索引，再读具体技能正文；
- 为当前任务选择最小相关 ECC 技能集合；
- 对高风险任务补充验证/安全伴随技能；
- 把 Claude 专属命令、agent、hook、rule 当作参考，除非当前 Codex 环境有等价执行机制。

## 轻量路由数据

路由器使用三个轻量参考：

- `references/skill-index.json`：生成的 ECC 技能索引，包含领域、工具需求、伴随技能、关键词和路径。
- `references/routing-map.json`：候选数量、任务类型、框架路由和风险伴随规则。
- `references/mcp-routing-policy.md`：ECC MCP 与 Codex 原生/官方工具重复时如何选择。

修改 ECC 技能后重新生成索引：

```powershell
python skills/ecc-codex-orchestrator/scripts/rebuild-skill-index.py
```

## MCP 处理

ECC 包含 GitHub、Context7、Exa、Memory、Playwright、Sequential Thinking 等 MCP 服务。Codex 环境中可能已经有官方插件或用户级 MCP 提供类似能力。

默认规则是：

```text
优先选择最原生、最少重复、足以完成任务的工具表面。
```

示例：

- GitHub 官方插件可用且已认证时，优先使用官方 GitHub 插件。
- 第三方库文档优先用 Context7。
- OpenAI 产品行为优先查官方 OpenAI 文档。
- 本地交互式网页检查优先用 Codex Browser。
- 可重复浏览器测试、截图、DOM 快照用 Playwright MCP。
- ECC Memory MCP 只在用户明确要求图谱实体/关系记忆时使用。

## 安全边界

本适配版不会自动安装全局 hook、不会把凭据写入 Codex 配置、也不会默认启用重复 MCP。脚本是可执行资产，但 Codex 应该先阅读脚本，再决定是否运行。

凭据属于用户私有运行时配置，不得写入 prompt、事件、日志、artifact、仓库文件或 MCP 配置。

## 校验

发布或分享前运行 Codex 插件校验：

```powershell
python <codex-home>\skills\.system\plugin-creator\scripts\validate_plugin.py .
```

公开发布前还要扫描真实密钥。ECC 包含安全扫描测试，所以测试夹具里出现模拟 token/API key 字符串是正常的。

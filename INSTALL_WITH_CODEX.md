# Install With Codex

Copy this prompt into Codex. The user-facing flow is intentionally just repo URL plus install instruction:

```text
Install the ECC Codex plugin adapter from https://github.com/YBsmorom/ecc-codex-plugin.
Use the repository root as the plugin root, validate .codex-plugin/plugin.json,
enable it as a local/user plugin, and then show me how to use ecc-codex-orchestrator.
```

Installer contract for Codex:

1. Clone `https://github.com/YBsmorom/ecc-codex-plugin` into the local plugin workspace.
2. Use the cloned repository root as the plugin root.
3. Validate `.codex-plugin/plugin.json` with the local Codex plugin validator when available.
4. Register or enable the folder as a local/user Codex plugin.
5. Verify that the `ecc-codex-orchestrator` skill is available.
6. Show the user one short task-oriented usage example.

中文：

```text
请从 https://github.com/YBsmorom/ecc-codex-plugin 安装这个 ECC Codex 插件适配版。
把仓库根目录作为插件根目录，校验 .codex-plugin/plugin.json，
注册并启用为本地/用户插件，然后告诉我如何使用 ecc-codex-orchestrator。
```

给 Codex 的安装契约：

1. 把 `https://github.com/YBsmorom/ecc-codex-plugin` 克隆到本机插件工作区。
2. 把克隆出的仓库根目录作为插件根目录。
3. 优先用本机 Codex 插件校验器校验 `.codex-plugin/plugin.json`。
4. 把该目录注册或启用为本地/用户 Codex 插件。
5. 确认 `ecc-codex-orchestrator` 技能可用。
6. 给用户一个简短的按任务使用示例。

# Notice

This repository is a Codex-oriented adapter/fork and packaging layer for ECC. `affaan-m/ECC` remains the canonical upstream.

## Upstream ECC

- Upstream source: https://github.com/affaan-m/ECC
- Upstream website: https://ecc.tools
- Upstream author: Affaan Mustafa
- Upstream license: MIT
- Preserved license file: `LICENSE`
- Preserved upstream README files:
  - `docs/upstream/README.affaan-m-ECC.md`
  - `docs/upstream/README.zh-CN.affaan-m-ECC.md`
- Preserved upstream GitHub Actions workflows:
  - `docs/upstream/github-workflows/`

The original ECC license text states:

```text
MIT License

Copyright (c) 2026 Affaan Mustafa
```

The upstream README states that ECC OSS stays free and MIT-licensed. This repository preserves the MIT license and keeps original attribution.

## Codex Adaptation

Codex-specific adaptation work in this repository includes:

- `.codex-plugin/plugin.json`
- `skills/ecc-codex-orchestrator/`
- generated routing references under `skills/ecc-codex-orchestrator/references/`
- MCP duplicate routing policy for Codex environments
- Codex-safe hook graph under `hooks/hooks.json` with unsupported `async` declarations removed
- Codex-oriented installation and adaptation documentation in English and Chinese

This repository is a public Codex plugin packaging of ECC for users who want to install ECC by giving a repository URL to Codex. It should not be presented as the canonical ECC package or as an upstream ECC release unless `affaan-m/ECC` merges or links it.

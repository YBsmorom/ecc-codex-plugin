# Notice

This repository is an unofficial Codex adaptation fork and packaging layer for ECC.

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
- Codex-oriented installation and adaptation documentation
- MCP duplicate routing policy for Codex environments

This repository is not the official upstream ECC repository. It is an unofficial public Codex plugin packaging of ECC for users who want to install ECC by giving a repository URL to Codex.

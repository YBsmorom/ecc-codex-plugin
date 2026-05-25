#!/usr/bin/env python3
"""Build a compact ECC skill index for the Codex orchestrator.

The index is generated from each skill's YAML frontmatter plus lightweight
heuristics. It intentionally does not copy skill bodies into the router context.
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any

import yaml


ROOT = Path(__file__).resolve().parents[3]
SKILLS_DIR = ROOT / "skills"
OUT_PATH = (
    ROOT
    / "skills"
    / "ecc-codex-orchestrator"
    / "references"
    / "skill-index.json"
)


DOMAIN_PATTERNS: dict[str, list[str]] = {
    "security": [
        "security",
        "auth",
        "oauth",
        "secret",
        "owasp",
        "vulnerab",
        "csrf",
        "xss",
        "injection",
        "compliance",
        "hipaa",
        "phi",
        "payment",
    ],
    "testing": [
        "tdd",
        "test",
        "coverage",
        "e2e",
        "verification",
        "regression",
        "qa",
        "evaluation",
        "snapshot",
    ],
    "frontend": [
        "frontend",
        "react",
        "vue",
        "angular",
        "ui",
        "css",
        "tailwind",
        "accessibility",
        "browser",
        "storybook",
        "design",
    ],
    "backend": [
        "backend",
        "api",
        "server",
        "database",
        "postgres",
        "django",
        "fastapi",
        "laravel",
        "spring",
        "quarkus",
        "node",
        "go",
        "rust",
    ],
    "research": [
        "research",
        "search",
        "literature",
        "market",
        "exa",
        "source",
        "citation",
        "deep",
    ],
    "orchestration": [
        "orchestr",
        "agent",
        "workflow",
        "parallel",
        "decompos",
        "plan",
        "council",
        "loop",
        "autonomous",
    ],
    "ops": [
        "deployment",
        "docker",
        "ci",
        "build",
        "release",
        "monitor",
        "audit",
        "terminal",
        "cloud",
    ],
    "content": [
        "article",
        "content",
        "brand",
        "video",
        "slides",
        "social",
        "email",
        "writing",
    ],
    "business": [
        "billing",
        "carrier",
        "customs",
        "finance",
        "freight",
        "investor",
        "procurement",
        "inventory",
        "logistics",
        "nonconformance",
        "scheduling",
        "supply chain",
        "trade",
        "customer",
        "crm",
    ],
}

TOOL_PATTERNS: dict[str, list[str]] = {
    "github": ["github", "pull request", "issue", "repository", "repo", "ci"],
    "context7": ["docs", "documentation", "library", "api usage", "framework"],
    "exa": ["web search", "exa", "research", "market", "company"],
    "memory": ["memory", "knowledge graph", "persistent"],
    "playwright": ["browser", "playwright", "e2e", "screenshot", "visual", "ui"],
    "sequential-thinking": ["reasoning", "decompose", "complex", "plan"],
}

COMPANION_RULES: list[tuple[str, list[str]]] = [
    ("security", ["security-review"]),
    ("testing", ["verification-loop"]),
    ("frontend", ["browser-qa", "e2e-testing"]),
    ("research", ["search-first"]),
    ("orchestration", ["agentic-engineering"]),
]


def parse_frontmatter(text: str) -> dict[str, Any]:
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n?", text, flags=re.S)
    if not match:
        return {}
    payload = yaml.safe_load(match.group(1))
    return payload if isinstance(payload, dict) else {}


def keywords(value: str) -> set[str]:
    return set(re.findall(r"[a-z0-9][a-z0-9+.#_-]{1,}", value.lower()))


def positive_route_text(value: str) -> str:
    return re.split(r"\bDO NOT TRIGGER\b|\bSkip when\b", value, maxsplit=1, flags=re.I)[0]


def pattern_matches(blob: str, pattern: str) -> bool:
    lower = blob.lower()
    normalized = pattern.lower()
    if " " in normalized:
        return normalized in lower
    if len(normalized) <= 3:
        return re.search(rf"(?<![a-z0-9]){re.escape(normalized)}(?![a-z0-9])", lower) is not None
    return re.search(rf"(?<![a-z0-9]){re.escape(normalized)}[a-z0-9_-]*", lower) is not None


def matching_domains(blob: str) -> list[str]:
    domains = [
        domain
        for domain, patterns in DOMAIN_PATTERNS.items()
        if any(pattern_matches(blob, pattern) for pattern in patterns)
    ]
    return domains or ["general"]


def matching_tools(blob: str) -> list[str]:
    return [
        tool
        for tool, patterns in TOOL_PATTERNS.items()
        if any(pattern_matches(blob, pattern) for pattern in patterns)
    ]


def companions(domains: list[str], skill_id: str) -> list[str]:
    result: list[str] = []
    for domain, candidates in COMPANION_RULES:
        if domain in domains:
            for candidate in candidates:
                if candidate != skill_id and candidate not in result:
                    result.append(candidate)
    if skill_id not in {"verification-loop", "tdd-workflow"} and (
        "testing" in domains or "backend" in domains or "frontend" in domains
    ):
        result.append("tdd-workflow")
    return result


def main() -> None:
    items: list[dict[str, Any]] = []
    for skill_dir in sorted(p for p in SKILLS_DIR.iterdir() if p.is_dir()):
        skill_file = skill_dir / "SKILL.md"
        if not skill_file.is_file():
            continue
        text = skill_file.read_text(encoding="utf-8", errors="replace")
        fm = parse_frontmatter(text)
        name = str(fm.get("name") or skill_dir.name).strip()
        description = str(fm.get("description") or "").strip()
        origin = str(fm.get("origin") or "").strip()
        title_match = re.search(r"^#\s+(.+)$", text, flags=re.M)
        title = title_match.group(1).strip() if title_match else name
        route_description = positive_route_text(description)
        blob = " ".join([skill_dir.name, name, title, route_description, origin])
        domains = matching_domains(blob)
        items.append(
            {
                "id": skill_dir.name,
                "name": name,
                "title": title,
                "description": description,
                "origin": origin,
                "domains": domains,
                "tool_needs": matching_tools(blob),
                "companion_skills": companions(domains, skill_dir.name),
                "keywords": sorted(keywords(blob))[:40],
                "path": f"skills/{skill_dir.name}/SKILL.md",
            }
        )

    index = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "generator": "skills/ecc-codex-orchestrator/scripts/rebuild-skill-index.py",
        "skill_count": len(items),
        "selection_guidance": {
            "default_candidate_count": 8,
            "minimum_candidate_count_for_non_trivial_tasks": 5,
            "read_body_count": "2-4 top candidates, plus required companion skills",
            "low_confidence_action": "expand candidates and inspect frontmatter before executing",
        },
        "surfaces": {
            "skills": "skills/*/SKILL.md",
            "mcp": ".mcp.json and mcp-configs/*",
            "scripts": "scripts/*",
            "commands": "commands/*",
            "hooks": "hooks/*",
            "rules": "rules/*",
            "agents": "agents/*",
            "docs": "docs/*",
            "examples": "examples/*",
        },
        "skills": items,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT_PATH} with {len(items)} skills")


if __name__ == "__main__":
    main()

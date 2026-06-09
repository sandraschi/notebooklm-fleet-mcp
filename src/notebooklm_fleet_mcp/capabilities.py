"""Runtime capability introspection."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from notebooklm_fleet_mcp import __version__
from notebooklm_fleet_mcp.config import Settings, load_settings
from notebooklm_fleet_mcp.nlm_client import doctor_text, nlm_version, resolve_nlm_binary
from notebooklm_fleet_mcp.tools_manifest import MCP_TOOLS


def _list_skills() -> list[dict[str, str]]:
    skills_root = Path(__file__).resolve().parent.parent.parent / "skills"
    out: list[dict[str, str]] = []
    if not skills_root.is_dir():
        return out
    for skill_dir in sorted(skills_root.iterdir()):
        skill_md = skill_dir / "SKILL.md"
        if skill_dir.is_dir() and skill_md.is_file():
            out.append({"id": skill_dir.name, "path": str(skill_md)})
    return out


async def build_capabilities(settings: Settings | None = None) -> dict[str, Any]:
    settings = settings or load_settings()
    version_info = await nlm_version(settings)
    doctor = await doctor_text(settings)
    return {
        "service": "notebooklm-fleet-mcp",
        "version": __version__,
        "transports": ["stdio", "http"],
        "mcp_http_path": "/mcp",
        "backend_port": settings.port,
        "frontend_port": settings.port + 1,
        "upstream": "notebooklm-mcp-cli",
        "nlm": version_info,
        "authenticated": doctor.get("authenticated", False),
        "tool_count": len(MCP_TOOLS),
        "tools": MCP_TOOLS,
        "skills": _list_skills(),
        "features": {
            "delegation": True,
            "fleet_pipelines": True,
            "glass_dashboard": True,
            "arxiv_ingest": True,
        },
        "nlm_installed": resolve_nlm_binary(settings) is not None,
    }

"""FastMCP server — fleet tools delegating to nlm."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Literal

from fastmcp import FastMCP
from fastmcp.server.providers.skills import SkillsDirectoryProvider

from notebooklm_fleet_mcp import fleet_pipelines
from notebooklm_fleet_mcp import nlm_client as nlm
from notebooklm_fleet_mcp.help_content import get_help_topic, list_help_topics
from notebooklm_fleet_mcp.pipeline_liveness_service import build_pipeline_liveness

log = logging.getLogger(__name__)

mcp = FastMCP(
    "notebooklm-fleet-mcp",
    instructions=(
        "Fleet orchestration layer for Google NotebookLM. "
        "Delegates core API work to notebooklm-mcp-cli (`nlm`). "
        "Use fleet_* tools for arXiv ingest, repo tagging, and research pipelines. "
        "Requires `nlm login` before mutating calls."
    ),
)

_skills_dir = Path(__file__).resolve().parent.parent.parent / "skills"
if _skills_dir.is_dir():
    mcp.add_provider(SkillsDirectoryProvider(roots=[_skills_dir]))


@mcp.tool()
def notebooklm_fleet_help() -> dict[str, str]:
    """Overview of notebooklm-fleet-mcp vs upstream notebooklm-mcp-cli."""
    return {
        "package": "notebooklm-fleet-mcp",
        "upstream": "notebooklm-mcp-cli (PyPI) — nlm + notebooklm-mcp",
        "role": "Fleet glass dashboard, MCP tools, arXiv/repo pipelines",
        "auth": "Run `nlm login` once on this machine",
        "ports": "Backend 10783, frontend 10784",
    }


@mcp.tool()
async def notebook_list() -> dict[str, Any]:
    """List NotebookLM notebooks."""
    return await nlm.notebook_list()


@mcp.tool()
async def notebook_create(title: str) -> dict[str, Any]:
    """Create a NotebookLM notebook."""
    return await nlm.notebook_create(title)


@mcp.tool()
async def notebook_query(notebook_id: str, question: str) -> dict[str, Any]:
    """Ask a grounded question against notebook sources."""
    return await nlm.notebook_query(notebook_id, question)


@mcp.tool()
async def source_list(notebook_id: str) -> dict[str, Any]:
    """List sources in a notebook."""
    return await nlm.source_list(notebook_id)


@mcp.tool()
async def source_add_url(notebook_id: str, url: str, wait: bool = False) -> dict[str, Any]:
    """Add a URL source to a notebook."""
    return await nlm.source_add_url(notebook_id, url, wait=wait)


@mcp.tool()
async def source_add_text(notebook_id: str, text: str, title: str = "Fleet ingest") -> dict[str, Any]:
    """Add text content as a notebook source."""
    return await nlm.source_add_text(notebook_id, text, title=title)


@mcp.tool()
async def studio_status(notebook_id: str) -> dict[str, Any]:
    """List studio artifacts (audio, slides, etc.) for a notebook."""
    return await nlm.studio_status(notebook_id)


@mcp.tool()
async def audio_create(
    notebook_id: str,
    format: Literal["deep_dive", "brief", "critique", "debate"] = "deep_dive",
    length: Literal["short", "default", "long"] = "default",
) -> dict[str, Any]:
    """Generate an audio overview from notebook sources."""
    return await nlm.audio_create(notebook_id, format=format, length=length)


@mcp.tool()
async def slides_create(
    notebook_id: str,
    format: Literal["detailed_deck", "presenter_slides"] = "detailed_deck",
    length: Literal["short", "default"] = "default",
) -> dict[str, Any]:
    """Generate a slide deck from notebook sources."""
    return await nlm.slides_create(notebook_id, format=format, length=length)


@mcp.tool()
async def slides_revise(artifact_id: str, slide_instruction: str) -> dict[str, Any]:
    """Revise slides — format: '1 Make the title larger'."""
    return await nlm.slides_revise(artifact_id, slide_instruction)


@mcp.tool()
async def research_start(
    query: str,
    notebook_id: str = "",
    mode: Literal["fast", "deep"] = "fast",
    source: Literal["web", "drive"] = "web",
) -> dict[str, Any]:
    """Start NotebookLM research to discover sources."""
    nb = notebook_id or None
    return await nlm.research_start(query, notebook_id=nb, mode=mode, source=source)


@mcp.tool()
async def tag_list() -> dict[str, Any]:
    """List tagged notebooks."""
    return await nlm.tag_list()


@mcp.tool()
async def tag_add(notebook_id: str, tags: str) -> dict[str, Any]:
    """Add comma-separated tags to a notebook."""
    return await nlm.tag_add(tags, notebook_id)


@mcp.tool()
async def fleet_ingest_arxiv(notebook_id: str, paper_id: str, wait: bool = True, tag: str = "") -> dict[str, Any]:
    """Add arXiv abs URL as notebook source; optional tag."""
    return await fleet_pipelines.fleet_ingest_arxiv(
        notebook_id,
        paper_id,
        wait=wait,
        tag=tag or None,
    )


@mcp.tool()
async def fleet_ingest_url(notebook_id: str, url: str, tag: str = "", wait: bool = False) -> dict[str, Any]:
    """Add arbitrary URL; optional fleet tag."""
    return await fleet_pipelines.fleet_ingest_url(notebook_id, url, tag=tag or None, wait=wait)


@mcp.tool()
async def fleet_link_repo(notebook_id: str, repo_id: str) -> dict[str, Any]:
    """Tag notebook with fleet:{repo_id} for fleet-registry linkage."""
    return await fleet_pipelines.fleet_link_repo(notebook_id, repo_id)


@mcp.tool()
async def fleet_pipeline_research(
    title: str,
    query: str,
    mode: Literal["fast", "deep"] = "fast",
    create_slides: bool = False,
    repo_id: str = "",
) -> dict[str, Any]:
    """Create notebook, run research, optionally slides + fleet repo tag."""
    return await fleet_pipelines.fleet_pipeline_research(
        title,
        query,
        mode=mode,
        create_slides=create_slides,
        repo_id=repo_id or None,
    )


@mcp.tool()
async def nlm_doctor() -> dict[str, Any]:
    """Run nlm doctor — installation and auth diagnostics."""
    return await nlm.doctor_text()


@mcp.tool()
async def pipeline_liveness() -> dict[str, Any]:
    """Supervisor liveness probe (auth, nlm CLI, alerts)."""
    return await build_pipeline_liveness()


@mcp.tool()
def notebooklm_help_topics() -> list[dict[str, str]]:
    """List onboard help topics."""
    return list_help_topics()


@mcp.tool()
def notebooklm_help(topic: str = "index") -> str:
    """Return markdown help for a topic id."""
    body = get_help_topic(topic)
    return body or f"Unknown topic: {topic}"

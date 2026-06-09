"""Fleet-specific orchestration over nlm."""

from __future__ import annotations

from typing import Any

from notebooklm_fleet_mcp import nlm_client as nlm
from notebooklm_fleet_mcp.config import Settings


def arxiv_abs_url(paper_id: str) -> str:
    pid = paper_id.strip().replace("arXiv:", "")
    return f"https://arxiv.org/abs/{pid}"


async def fleet_ingest_arxiv(
    notebook_id: str,
    paper_id: str,
    *,
    wait: bool = True,
    tag: str | None = None,
    settings: Settings | None = None,
) -> dict[str, Any]:
    url = arxiv_abs_url(paper_id)
    result = await nlm.source_add_url(notebook_id, url, wait=wait, settings=settings)
    if tag:
        await nlm.tag_add(tag, notebook_id, settings=settings)
    return {"paper_id": paper_id, "url": url, **result}


async def fleet_ingest_url(
    notebook_id: str,
    url: str,
    *,
    tag: str | None = None,
    wait: bool = False,
    settings: Settings | None = None,
) -> dict[str, Any]:
    result = await nlm.source_add_url(notebook_id, url, wait=wait, settings=settings)
    if tag:
        await nlm.tag_add(tag, notebook_id, settings=settings)
    return result


async def fleet_link_repo(notebook_id: str, repo_id: str, settings: Settings | None = None) -> dict[str, Any]:
    tag = f"fleet:{repo_id}"
    return await nlm.tag_add(tag, notebook_id, settings=settings)


async def fleet_pipeline_research(
    title: str,
    query: str,
    *,
    mode: str = "fast",
    create_slides: bool = False,
    repo_id: str | None = None,
    settings: Settings | None = None,
) -> dict[str, Any]:
    created = await nlm.notebook_create(title, settings=settings)
    notebook = created.get("notebook") or {}
    notebook_id = (
        notebook.get("id")
        or notebook.get("notebook_id")
        or (notebook.get("raw") if isinstance(notebook.get("raw"), str) else None)
    )
    if not notebook_id and isinstance(created.get("notebook"), dict):
        notebook_id = created["notebook"].get("uuid")
    if not notebook_id:
        raise ValueError("Could not determine notebook id from nlm create response")

    research = await nlm.research_start(query, notebook_id=notebook_id, mode=mode, settings=settings)
    if repo_id:
        await fleet_link_repo(notebook_id, repo_id, settings=settings)

    slides = None
    if create_slides:
        slides = await nlm.slides_create(notebook_id, settings=settings)

    return {
        "notebook_id": notebook_id,
        "title": title,
        "query": query,
        "create": created,
        "research": research,
        "slides": slides,
    }

"""FastAPI: REST dashboard + mounted MCP HTTP."""

from __future__ import annotations

import json
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Literal

import httpx
from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from notebooklm_fleet_mcp import __version__, fleet_pipelines
from notebooklm_fleet_mcp import nlm_client as nlm
from notebooklm_fleet_mcp.capabilities import build_capabilities
from notebooklm_fleet_mcp.config import load_settings
from notebooklm_fleet_mcp.help_content import get_help_topic, list_help_topics
from notebooklm_fleet_mcp.pipeline_liveness_service import build_pipeline_liveness
from notebooklm_fleet_mcp.server import mcp
from notebooklm_fleet_mcp.startup_probe import run_startup_probes
from notebooklm_fleet_mcp.tools_manifest import MCP_TOOLS

mcp_http = mcp.http_app(path="/mcp")
router = APIRouter(prefix="/api")
_FLEET_PATH = Path(__file__).resolve().parent / "data" / "fleet_default.json"


class NotebookCreateIn(BaseModel):
    title: str = Field(..., min_length=1)


class SourceUrlIn(BaseModel):
    url: str = Field(..., min_length=8)
    wait: bool = False
    tag: str = ""


class QueryIn(BaseModel):
    question: str = Field(..., min_length=1)


class ResearchIn(BaseModel):
    query: str = Field(..., min_length=1)
    mode: Literal["fast", "deep"] = "fast"
    source: Literal["web", "drive"] = "web"


class FleetPipelineIn(BaseModel):
    title: str = Field(..., min_length=1)
    query: str = Field(..., min_length=1)
    mode: Literal["fast", "deep"] = "fast"
    create_slides: bool = False
    repo_id: str = ""


class ArxivIngestIn(BaseModel):
    paper_id: str = Field(..., min_length=4)
    wait: bool = True
    tag: str = ""


def _http_from_nlm(exc: nlm.NlmError) -> HTTPException:
    if "authenticated" in str(exc).lower():
        return HTTPException(status_code=401, detail=str(exc))
    if "not found" in str(exc).lower():
        return HTTPException(status_code=503, detail=str(exc))
    return HTTPException(status_code=502, detail=str(exc))


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "notebooklm-fleet-mcp"}


@router.get("/stats")
async def stats() -> dict[str, Any]:
    try:
        notebooks = await nlm.notebook_list()
        count = notebooks.get("count", 0)
    except nlm.NlmError:
        count = 0
    doctor = await nlm.doctor_text()
    version = await nlm.nlm_version()
    return {
        "notebooks": count,
        "authenticated": doctor.get("authenticated", False),
        "nlm_installed": version.get("installed", False),
        "nlm_version": version.get("version"),
    }


@router.get("/capabilities")
async def api_capabilities() -> dict[str, Any]:
    return await build_capabilities()


@router.get("/tools")
async def api_tools() -> dict[str, Any]:
    return {"tools": MCP_TOOLS, "tool_count": len(MCP_TOOLS), "mcp_http_path": "/mcp"}


@router.get("/fleet")
async def api_fleet() -> dict[str, Any]:
    if _FLEET_PATH.is_file():
        hubs = json.loads(_FLEET_PATH.read_text(encoding="utf-8"))
    else:
        hubs = []
    return {"hubs": hubs}


@router.get("/llm/providers")
async def llm_providers():
    providers = []
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get("http://127.0.0.1:11434/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m["name"] for m in data.get("models", [])]
                providers.append({
                    "id": "ollama", "label": "Ollama",
                    "base_url": "http://127.0.0.1:11434/v1",
                    "models": models, "needs_key": False,
                })
    except Exception:
        providers.append({
                    "id": "ollama", "label": "Ollama",
                    "base_url": "http://127.0.0.1:11434/v1",
                    "models": [], "needs_key": False,
                })
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get("http://127.0.0.1:1234/v1/models")
            if resp.status_code == 200:
                data = resp.json()
                models = [m["id"] for m in data.get("models", [])]
                providers.append({
                    "id": "lmstudio", "label": "LM Studio",
                    "base_url": "http://127.0.0.1:1234/v1",
                    "models": models, "needs_key": False,
                })
    except Exception:
        providers.append({
                    "id": "lmstudio", "label": "LM Studio",
                    "base_url": "http://127.0.0.1:1234/v1",
                    "models": [], "needs_key": False,
                })
    return {"providers": providers}


@router.post("/llm/chat")
async def llm_chat(body: dict):
    provider = body.get("provider", "ollama")
    model = body.get("model", "llama3.2:3b")
    prompt = body.get("prompt") or body.get("message", "")
    base = "http://127.0.0.1:1234/v1" if provider == "lmstudio" else "http://127.0.0.1:11434/v1"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(f"{base}/chat/completions", json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
            })
            if resp.status_code == 200:
                data = resp.json()
                return {"response": data["choices"][0]["message"]["content"]}
            return {"response": f"HTTP {resp.status_code}"}
    except Exception as e:
        return {"response": f"Error: {e}"}


@router.get("/v1/diagnostics")
async def api_diagnostics() -> dict[str, Any]:
    try:
        notebooks = await nlm.notebook_list()
        count = notebooks.get("count", 0)
    except nlm.NlmError:
        count = 0
    doctor = await nlm.doctor_text()
    version = await nlm.nlm_version()
    return {
        "status": "ok",
        "server": "notebooklm-fleet-mcp",
        "version": __version__,
        "uptime_seconds": 0,
        "tool_count": len(MCP_TOOLS),
        "tools": [{"name": t["name"]} for t in MCP_TOOLS],
        "system": {"windows": True},
        "providers": {"nlm": {"installed": version.get("installed", False), "version": version.get("version")}},
        "notebooks": count,
        "authenticated": doctor.get("authenticated", False),
        "errors": [],
    }


@router.get("/help")
async def api_help_index() -> dict[str, Any]:
    return {"topics": list_help_topics()}


@router.get("/help/{topic}")
async def api_help_topic(topic: str) -> dict[str, str]:
    body = get_help_topic(topic)
    if body is None:
        raise HTTPException(status_code=404, detail=f"Unknown topic: {topic}")
    return {"topic": topic, "markdown": body}


@router.get("/pipeline/liveness")
async def api_pipeline_liveness() -> dict[str, Any]:
    return await build_pipeline_liveness()


@router.get("/auth/status")
async def auth_status() -> dict[str, Any]:
    doctor = await nlm.doctor_text()
    version = await nlm.nlm_version()
    return {"doctor": doctor, "nlm": version}


@router.get("/notebooks")
async def api_notebooks() -> dict[str, Any]:
    try:
        return await nlm.notebook_list()
    except nlm.NlmError as exc:
        raise _http_from_nlm(exc) from exc


@router.post("/notebooks")
async def api_notebook_create(body: NotebookCreateIn) -> dict[str, Any]:
    try:
        return await nlm.notebook_create(body.title)
    except nlm.NlmError as exc:
        raise _http_from_nlm(exc) from exc


@router.get("/notebooks/{notebook_id}/sources")
async def api_sources(notebook_id: str) -> dict[str, Any]:
    try:
        return await nlm.source_list(notebook_id)
    except nlm.NlmError as exc:
        raise _http_from_nlm(exc) from exc


@router.post("/notebooks/{notebook_id}/sources")
async def api_source_add(notebook_id: str, body: SourceUrlIn) -> dict[str, Any]:
    try:
        result = await fleet_pipelines.fleet_ingest_url(
            notebook_id,
            body.url,
            tag=body.tag or None,
            wait=body.wait,
        )
        return result
    except nlm.NlmError as exc:
        raise _http_from_nlm(exc) from exc


@router.post("/notebooks/{notebook_id}/query")
async def api_query(notebook_id: str, body: QueryIn) -> dict[str, Any]:
    try:
        return await nlm.notebook_query(notebook_id, body.question)
    except nlm.NlmError as exc:
        raise _http_from_nlm(exc) from exc


@router.get("/notebooks/{notebook_id}/studio")
async def api_studio(notebook_id: str) -> dict[str, Any]:
    try:
        return await nlm.studio_status(notebook_id)
    except nlm.NlmError as exc:
        raise _http_from_nlm(exc) from exc


@router.post("/notebooks/{notebook_id}/research")
async def api_research(notebook_id: str, body: ResearchIn) -> dict[str, Any]:
    try:
        return await nlm.research_start(
            body.query,
            notebook_id=notebook_id,
            mode=body.mode,
            source=body.source,
        )
    except nlm.NlmError as exc:
        raise _http_from_nlm(exc) from exc


@router.post("/fleet/pipeline/research")
async def api_fleet_pipeline(body: FleetPipelineIn) -> dict[str, Any]:
    try:
        return await fleet_pipelines.fleet_pipeline_research(
            body.title,
            body.query,
            mode=body.mode,
            create_slides=body.create_slides,
            repo_id=body.repo_id or None,
        )
    except (nlm.NlmError, ValueError) as exc:
        if isinstance(exc, nlm.NlmError):
            raise _http_from_nlm(exc) from exc
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/fleet/ingest/arxiv")
async def api_fleet_arxiv(notebook_id: str, body: ArxivIngestIn) -> dict[str, Any]:
    try:
        return await fleet_pipelines.fleet_ingest_arxiv(
            notebook_id,
            body.paper_id,
            wait=body.wait,
            tag=body.tag or None,
        )
    except nlm.NlmError as exc:
        raise _http_from_nlm(exc) from exc


def build_app() -> FastAPI:
    settings = load_settings()
    _tauri = os.environ.get("NOTEBOOKLM_FLEET_MCP_TAURI", "").lower() in ("1", "true", "yes")

    @asynccontextmanager
    async def app_lifespan(app: FastAPI):
        await run_startup_probes(settings)
        async with mcp_http.lifespan(app):
            yield

    app = FastAPI(
        title="notebooklm-fleet-mcp",
        version=__version__,
        lifespan=app_lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            f"http://127.0.0.1:{settings.port + 1}",
            f"http://localhost:{settings.port + 1}",
            "http://tauri.localhost",
            "https://tauri.localhost",
            "tauri://localhost",
        ] + ([f"http://127.0.0.1:{settings.port}"] if _tauri else []),
        allow_origin_regex=r"https?://tauri\.localhost(:\d+)?" if _tauri else None,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)
    app.mount("/mcp", mcp_http)

    @app.get("/")
    async def root() -> dict[str, Any]:
        return {
            "service": "notebooklm-fleet-mcp",
            "version": __version__,
            "mcp_http": f"http://{settings.host}:{settings.port}/mcp",
            "api": f"http://{settings.host}:{settings.port}/api",
            "webapp": f"http://127.0.0.1:{settings.port + 1}",
            "upstream": "notebooklm-mcp-cli",
        }

    return app


app = build_app()

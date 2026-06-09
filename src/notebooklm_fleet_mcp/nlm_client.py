"""Delegate NotebookLM operations to notebooklm-mcp-cli (`nlm`)."""

from __future__ import annotations

import asyncio
import json
import logging
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from notebooklm_fleet_mcp.config import Settings, load_settings

log = logging.getLogger(__name__)


class NlmError(Exception):
    def __init__(self, message: str, *, exit_code: int = 1, stderr: str = "") -> None:
        super().__init__(message)
        self.exit_code = exit_code
        self.stderr = stderr


@dataclass
class NlmResult:
    success: bool
    data: Any
    stdout: str
    stderr: str
    exit_code: int


def resolve_nlm_binary(settings: Settings | None = None) -> str | None:
    settings = settings or load_settings()
    candidate = settings.resolved_nlm()
    p = Path(candidate)
    if p.is_file():
        return str(p)
    return shutil.which(candidate)


def _run_nlm_sync(args: list[str], *, timeout: float, nlm_bin: str) -> NlmResult:
    import subprocess

    cmd = [nlm_bin, *args]
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding="utf-8",
            errors="replace",
        )
    except subprocess.TimeoutExpired as exc:
        raise NlmError(f"nlm timed out after {timeout}s: {' '.join(args)}") from exc
    except FileNotFoundError as exc:
        raise NlmError(f"nlm binary not found: {nlm_bin}") from exc

    stdout = (proc.stdout or "").strip()
    stderr = (proc.stderr or "").strip()
    data: Any = None
    if stdout:
        try:
            data = json.loads(stdout)
        except json.JSONDecodeError:
            data = {"raw": stdout}

    success = proc.returncode == 0
    if not success and "not authenticated" in (stdout + stderr).lower():
        raise NlmError("NotebookLM not authenticated — run `nlm login`", exit_code=proc.returncode, stderr=stderr)

    return NlmResult(
        success=success,
        data=data,
        stdout=stdout,
        stderr=stderr,
        exit_code=proc.returncode,
    )


async def run_nlm(args: list[str], *, timeout: float | None = None, settings: Settings | None = None) -> NlmResult:
    settings = settings or load_settings()
    nlm_bin = resolve_nlm_binary(settings)
    if not nlm_bin:
        raise NlmError("nlm CLI not on PATH — install: uv tool install notebooklm-mcp-cli")
    effective_timeout = timeout or settings.query_timeout_seconds
    result = await asyncio.to_thread(_run_nlm_sync, args, timeout=effective_timeout, nlm_bin=nlm_bin)
    if not result.success:
        detail = result.stderr or result.stdout or "nlm command failed"
        raise NlmError(detail, exit_code=result.exit_code, stderr=result.stderr)
    return result


async def nlm_version(settings: Settings | None = None) -> dict[str, Any]:
    settings = settings or load_settings()
    nlm_bin = resolve_nlm_binary(settings)
    if not nlm_bin:
        return {"installed": False, "path": None, "version": None}
    result = await asyncio.to_thread(_run_nlm_sync, ["--version"], timeout=30.0, nlm_bin=nlm_bin)
    version = result.stdout or (result.data.get("raw") if isinstance(result.data, dict) else None)
    return {"installed": True, "path": nlm_bin, "version": version}


async def doctor_text(settings: Settings | None = None) -> dict[str, Any]:
    settings = settings or load_settings()
    nlm_bin = resolve_nlm_binary(settings)
    if not nlm_bin:
        return {"ok": False, "text": "nlm not found", "authenticated": False}
    result = await asyncio.to_thread(_run_nlm_sync, ["doctor"], timeout=60.0, nlm_bin=nlm_bin)
    text = result.stdout or result.stderr or "nlm doctor produced no output"
    authenticated = "profiles: none" not in text.lower() and "run nlm login" not in text.lower()
    return {"ok": result.success, "text": text, "authenticated": authenticated}


async def notebook_list(settings: Settings | None = None) -> dict[str, Any]:
    result = await run_nlm(["notebook", "list", "--json"], settings=settings)
    data = result.data
    if isinstance(data, list):
        notebooks = data
    elif isinstance(data, dict):
        notebooks = data.get("notebooks") or data.get("items") or [data]
    else:
        notebooks = []
    return {"count": len(notebooks), "notebooks": notebooks}


async def notebook_create(title: str, settings: Settings | None = None) -> dict[str, Any]:
    result = await run_nlm(["notebook", "create", title, "--json"], settings=settings)
    return {"notebook": result.data}


async def source_list(notebook_id: str, settings: Settings | None = None) -> dict[str, Any]:
    result = await run_nlm(["source", "list", notebook_id, "--json"], settings=settings)
    sources = result.data
    return {"notebook_id": notebook_id, "sources": sources}


async def source_add_url(
    notebook_id: str,
    url: str,
    *,
    wait: bool = False,
    settings: Settings | None = None,
) -> dict[str, Any]:
    args = ["source", "add", notebook_id, "--url", url]
    if wait:
        args.append("--wait")
    result = await run_nlm(args, settings=settings)
    return {"notebook_id": notebook_id, "url": url, "result": result.data}


async def source_add_text(
    notebook_id: str,
    text: str,
    *,
    title: str = "Fleet ingest",
    settings: Settings | None = None,
) -> dict[str, Any]:
    result = await run_nlm(
        ["source", "add", notebook_id, "--text", text, "--title", title],
        settings=settings,
    )
    return {"notebook_id": notebook_id, "result": result.data}


async def notebook_query(notebook_id: str, question: str, settings: Settings | None = None) -> dict[str, Any]:
    result = await run_nlm(["notebook", "query", notebook_id, question, "--json"], settings=settings)
    return {"notebook_id": notebook_id, "question": question, "answer": result.data}


async def studio_status(notebook_id: str, settings: Settings | None = None) -> dict[str, Any]:
    result = await run_nlm(["studio", "status", notebook_id, "--json"], settings=settings)
    return {"notebook_id": notebook_id, "artifacts": result.data}


async def audio_create(
    notebook_id: str,
    *,
    format: str = "deep_dive",
    length: str = "default",
    confirm: bool = True,
    settings: Settings | None = None,
) -> dict[str, Any]:
    args = ["audio", "create", notebook_id, "-f", format, "-l", length]
    if confirm:
        args.append("-y")
    result = await run_nlm(args, settings=settings)
    return {"notebook_id": notebook_id, "type": "audio", "output": result.data}


async def slides_create(
    notebook_id: str,
    *,
    format: str = "detailed_deck",
    length: str = "default",
    confirm: bool = True,
    settings: Settings | None = None,
) -> dict[str, Any]:
    args = ["slides", "create", notebook_id, "-f", format, "-l", length]
    if confirm:
        args.append("-y")
    result = await run_nlm(args, settings=settings)
    return {"notebook_id": notebook_id, "type": "slides", "output": result.data}


async def slides_revise(
    artifact_id: str,
    slide_instruction: str,
    *,
    settings: Settings | None = None,
) -> dict[str, Any]:
    result = await run_nlm(
        ["slides", "revise", artifact_id, "--slide", slide_instruction, "-y"],
        settings=settings,
    )
    return {"artifact_id": artifact_id, "slide_instruction": slide_instruction, "output": result.data}


async def tag_list(settings: Settings | None = None) -> dict[str, Any]:
    result = await run_nlm(["tag", "list"], settings=settings)
    return {"tags": result.data}


async def tag_add(tags: str, notebook_id: str, settings: Settings | None = None) -> dict[str, Any]:
    result = await run_nlm(["tag", "add", notebook_id, "-t", tags], settings=settings)
    return {"tags": tags, "notebook_id": notebook_id, "result": result.data}


async def research_start(
    query: str,
    *,
    notebook_id: str | None = None,
    mode: str = "fast",
    source: str = "web",
    settings: Settings | None = None,
) -> dict[str, Any]:
    args = ["research", "start", query, "-m", mode, "-s", source]
    if notebook_id:
        args.extend(["-n", notebook_id])
    result = await run_nlm(args, settings=settings)
    return {"notebook_id": notebook_id, "query": query, "result": result.data}


def parse_version_number(text: str) -> str | None:
    match = re.search(r"(\d+\.\d+\.\d+)", text)
    return match.group(1) if match else None

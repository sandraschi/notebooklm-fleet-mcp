"""Warn-only startup probes."""

from __future__ import annotations

import logging

import httpx

from notebooklm_fleet_mcp.config import Settings, load_settings
from notebooklm_fleet_mcp.nlm_client import doctor_text, resolve_nlm_binary

log = logging.getLogger(__name__)


async def run_startup_probes(settings: Settings | None = None) -> dict[str, object]:
    settings = settings or load_settings()
    nlm = resolve_nlm_binary(settings)
    if not nlm:
        log.warning("STARTUP PROBE: nlm CLI missing — uv tool install notebooklm-mcp-cli")

    doctor = await doctor_text(settings)
    if not doctor.get("authenticated"):
        log.warning("STARTUP PROBE: NotebookLM not authenticated — run nlm login")

    reachable = False
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.head("https://notebooklm.google.com")
            reachable = r.status_code < 500
    except httpx.HTTPError:
        log.warning("STARTUP PROBE: notebooklm.google.com unreachable")

    if not settings.fleet_registry_path.exists():
        log.warning("STARTUP PROBE: fleet registry not found at %s", settings.fleet_registry_path)

    return {
        "ok": True,
        "nlm_on_path": nlm is not None,
        "authenticated": doctor.get("authenticated", False),
        "notebooklm_reachable": reachable,
        "registry_exists": settings.fleet_registry_path.exists(),
    }

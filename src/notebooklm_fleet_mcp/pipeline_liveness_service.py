"""Structured liveness for fleet supervisors."""

from __future__ import annotations

from typing import Any

from notebooklm_fleet_mcp.config import Settings, load_settings
from notebooklm_fleet_mcp.nlm_client import doctor_text, nlm_version, resolve_nlm_binary


async def build_pipeline_liveness(settings: Settings | None = None) -> dict[str, Any]:
    settings = settings or load_settings()
    checks: list[dict[str, Any]] = []
    alerts: list[str] = []

    nlm_bin = resolve_nlm_binary(settings)
    checks.append({"id": "nlm_cli", "ok": nlm_bin is not None, "detail": nlm_bin or "missing"})
    if not nlm_bin:
        alerts.append("NLM_CLI_MISSING")

    version = await nlm_version(settings)
    checks.append({"id": "nlm_version", "ok": version.get("installed", False), "detail": version.get("version")})

    doctor = await doctor_text(settings)
    auth_ok = bool(doctor.get("authenticated"))
    checks.append({"id": "nlm_auth", "ok": auth_ok, "detail": "authenticated" if auth_ok else "run nlm login"})
    if not auth_ok:
        alerts.append("NLM_AUTH_REQUIRED")

    healthy = nlm_bin is not None and auth_ok
    return {
        "success": True,
        "healthy": healthy,
        "service": "notebooklm-fleet-mcp",
        "upstream": "notebooklm-mcp-cli",
        "checks": checks,
        "alerts": alerts,
    }

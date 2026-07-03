# Status — notebooklm-fleet-mcp

**Version:** 0.1.0  
**Last updated:** 2026-07-03  
**Maturity:** Scaffold — fleet-integrated; 8 critical NSIS build bugs fixed; MCPB 3-4-100 done

## Working

- FastMCP server (22 tools) delegating to `nlm`
- FastAPI backend :10783 with `/mcp`
- Glass dashboard shell :10784
- Fleet pipelines (arXiv ingest, repo tags, research pipeline)
- `pipeline_liveness` + `nlm_doctor`
- Tests: health, liveness, fleet pipelines
- MCPB manifest + assets + SOTA 3-4-100 prompts + `just mcpb-pack`
- Fleet registry + MCD project page
- Cursor install via `install-mcp.ps1`
- `start.bat` double-click wrapper
- Fleet starts launcher (`mcp-central-docs/starts/notebooklm-start.bat`)
- Session context injection (`.cursorrules`)
- Tauri NSIS wrapper scaffold (8 critical port/CSP/backend bugs fixed)
- PyInstaller entry (`run_server.py` + spec)
- `GET /api/v1/diagnostics` endpoint
- Dashboard with `data-testid`, backend-status listener, exp backoff
- `useZoom` hook for Ctrl+Scroll zoom
- LLM proxy routes in main backend (port 10783, not 8000)
- `free_port` escalation (240s + UAC) + TCP health poll in backend.rs
- Biome lint clean (30 files auto-fixed)

## Needs user action

- **`nlm login`** — required before mutating NotebookLM calls
- **`npm install`** in `web_sota/` on first dashboard run (handled by `start.ps1`)

## Planned (0.2.0)

- arxiv-mcp one-shot search → notebook tool
- Dashboard inline auth status widget
- GitHub MCPB release artifact
- Live-auth manual E2E checklist
- Full NSIS build certification
- Chat page (per SOTA chat_skills standard)

## Blockers

- None for development; Google session is per-machine only

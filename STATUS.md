# Status — notebooklm-fleet-mcp

**Version:** 0.1.0  
**Last updated:** 2026-06-09  
**Maturity:** Scaffold — fleet-standard docs complete; live Google auth required for E2E

## Working

- FastMCP server (22 tools) delegating to `nlm`
- FastAPI backend :10783 with `/mcp`
- Glass dashboard shell :10784
- Fleet pipelines (arXiv ingest, repo tags, research pipeline)
- `pipeline_liveness` + `nlm_doctor`
- Tests: health, liveness, fleet pipelines
- MCPB manifest + assets + `just mcpb-pack`
- Fleet registry + MCD project page
- Cursor install via `install-mcp.ps1`

## Needs user action

- **`nlm login`** — required before mutating NotebookLM calls
- **`npm install`** in `web_sota/` on first dashboard run (handled by `start.ps1`)

## Planned (0.2.0)

- arxiv-mcp one-shot search → notebook tool
- Dashboard inline auth status widget
- GitHub MCPB release artifact
- Live-auth manual E2E checklist

## Blockers

- None for development; Google session is per-machine only

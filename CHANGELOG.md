# Changelog

All notable changes to **notebooklm-fleet-mcp** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Fleet documentation stack: `INSTALL.md`, `PRD.md`, `CHANGELOG.md`, `llms-full.txt`, `AGENTS.md`, `STATUS.md`.
- MCPB assets: `manifest.json` (full tool list), `assets/icon.png`, `assets/prompts/*`, `.mcpbignore`, `just mcpb-pack`.
- MCD project page: `mcp-central-docs/projects/notebooklm-fleet-mcp/`.
- `docs/FASTMCP_FEATURES.md` — transport, skills, liveness patterns.

### Changed
- `README.md` — fleet short form with TOC and doc table.
- `docs/README.md` — staged index including root docs.
- `operations/WEBAPP_PORTS.md` — ports **10783** / **10784** registered.

## [0.1.0] — 2026-06-09

### Added
- **FastMCP 3.2** server delegating to **notebooklm-mcp-cli** (`nlm` subprocess).
- **22 MCP tools** — notebook CRUD, sources, studio (audio/slides), research, tags, fleet pipelines (`fleet_ingest_arxiv`, `fleet_link_repo`, `fleet_pipeline_research`), `nlm_doctor`, `pipeline_liveness`, onboard help.
- **Glass dashboard** (`web_sota/`) — Dashboard, Notebooks, Studio, Pipeline, Tools, Settings, Help, ApiDocs, Apps, Logs.
- **FastAPI backend** on **10783** — REST + MCP HTTP at `/mcp`.
- **Vite frontend** on **10784**.
- **Fleet integrations** — arXiv ingest bridge, `fleet:{repo_id}` tagging, pipeline liveness for supervisors.
- **Bundled skill** — `skills/notebooklm-fleet/SKILL.md`.
- **Tests** — API health, pipeline liveness, fleet pipelines.
- **Install** — `install-mcp.ps1`, `start.ps1`, Cursor MCP wiring.
- **Registry** — `mcp-central-docs/operations/fleet-registry.json` entry.

### Notes
- **Auth:** run `nlm login` once before mutating NotebookLM calls.
- **Upstream:** keep `notebooklm-mcp-cli` installed via `uv tool install notebooklm-mcp-cli`.
- **Not a rewrite** of Google's NotebookLM API — wrapper + orchestration only.

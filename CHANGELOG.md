# Changelog

All notable changes to **notebooklm-fleet-mcp** are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Fleet documentation stack: `INSTALL.md`, `PRD.md`, `CHANGELOG.md`, `llms-full.txt`, `AGENTS.md`, `STATUS.md`.
- MCPB assets: `manifest.json` (full tool list), `assets/icon.png`, `assets/prompts/*`, `.mcpbignore`, `just mcpb-pack`.
- MCD project page: `mcp-central-docs/projects/notebooklm-fleet-mcp/`.
- `docs/FASTMCP_FEATURES.md` — transport, skills, liveness patterns.
- `run_server.py` + `notebooklm-fleet-mcp-backend.spec` — PyInstaller dual-transport entry.
- `start.bat` — double-click wrapper.
- `mcp-central-docs/starts/notebooklm-start.bat` — fleet starts launcher.
- `.cursorrules` — session context injection for Cursor/IDE tool awareness.
- `useZoom` hook — Ctrl+Scroll zoom with localStorage persistence.
- `GET /api/v1/diagnostics` — CUA smoke test diagnostics endpoint.
- `GET /api/llm/providers` + `POST /api/llm/chat` — LLM proxy routes in main backend.
- Tauri CORS origins for WebView2 (`tauri://localhost`, `http://tauri.localhost`, `https://tauri.localhost`).
- `NOTEBOOKLM_FLEET_MCP_TAURI` env var for runtime CORS relaxation.
- Backend TCP health poll — 30 attempts x 2s after spawn.
- `free_port()` escalation — 240s poll with re-kill at 5s, UAC elevation at 15s.
- Inline backend status indicator with exponential backoff retry (1s, 2s, 4s, 8s, 16s).
- Tauri `backend-status` event listener for instant connection updates.
- `data-testid` attributes on dashboard KPIs and status badges.

### Changed
- `README.md` — fleet short form with TOC and doc table.
- `docs/README.md` — staged index including root docs.
- `operations/WEBAPP_PORTS.md` — ports **10783** / **10784** registered.
- `native/src/backend.rs` — `BACKEND_PORT` 10700 → 10783 (was dead on arrival).
- `native/tauri.conf.json` — `frontendDist` → `../web_sota/dist`, CSP port 10700 → 10783, resources `.env` → `.env.example`.
- `native/build.ps1` — bundles `.env.example` not `.env`.
- `src/notebooklm_fleet_mcp/app.py` — Tauri CORS origins, LLM proxy routes, diagnostics endpoint.
- `web_sota/playwright.config.ts` — full rewrite (was a stale arxiv-mcp copy with wrong ports/command).
- `web_sota/backend/server.py` — port 8000 (forbidden) → 10785, configurable via `LLM_CHAT_PORT`.
- `scripts/cua-nsis-config.json` — `backend_port` 10700 → 10783, `health_path` → `/api/health`.
- `assets/prompts/` — expanded to SOTA 3-4-100 rule: system.md 3,015 words, user.md 4,093 words, examples.json 112 entries.
- `mcp-central-docs/standards/VERIFICATION_STANDARDS.md` — added §3.4 Lint & Format Gates (ruff + biome + tsc table).
- `web_sota/package.json` — added `@tauri-apps/api` dependency.

### Fixed
- Pre-existing TypeScript errors: 10 errors fixed (unused imports, `unknown` state types).
- Biome lint: 30 files auto-fixed (import ordering, template literals, formatting).
- `vite.config.ts` — import `node:path` protocol.
- `ag-agent-flow-1` — removed unused `Layers` icon import in `AppLayout.tsx`.
- `CardTitle` — removed unused imports in `PipelinePage.tsx` and `StudioPage.tsx`.

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

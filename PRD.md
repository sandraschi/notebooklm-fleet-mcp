# notebooklm-fleet-mcp — Product Requirements Document

**Status:** ACTIVE (v0.1.0 scaffold — fleet-integrated)  
**Package version:** **0.1.0** (`pyproject.toml`)  
**Owner:** Sandra Schieder  
**Ports:** **10783** (HTTP: REST + MCP at `/mcp`) / **10784** (Vite glass frontend) / **10785** (LLM chat proxy)  
**Upstream:** [notebooklm-mcp-cli](https://pypi.org/project/notebooklm-mcp-cli/) v0.7.x (`nlm`)

---

## Overview

Fleet orchestration wrapper around Google NotebookLM. Agents and humans get MCP tools, a glass dashboard, arXiv ingest pipelines, and fleet-registry tagging — without maintaining a fork of Google's undocumented API.

## Problem Statement

NotebookLM is powerful for grounded research, but:

1. **No fleet integration** — hard to tie notebooks to repo IDs, arXiv papers, or supervisor liveness probes.
2. **Split surfaces** — upstream CLI (`nlm`) and MCP (`notebooklm-mcp`) exist separately; Cursor/agy need one fleet-standard entry.
3. **Auth friction** — Google session is machine-local; agents need clear diagnostics (`nlm doctor`) not silent failures.

## Target Audience

- **Sandra's MCP fleet** — research pipelines chaining arxiv-mcp → NotebookLM → slides/audio.
- **AI agents** (Cursor, Claude Desktop, agy) — stdio or HTTP MCP with structured dict responses.
- **Humans** — glass dashboard for notebooks, studio artifacts, pipeline health.

## Success Metrics

| Metric | Target |
|--------|--------|
| `nlm_doctor` + `pipeline_liveness` green after `nlm login` | 100% on dev machine |
| Fleet ingest: arXiv abs → notebook source | < 60s with `wait=true` |
| MCP tool coverage vs upstream notebook ops | Parity on list/create/query/sources/studio/research |
| Dashboard loads on 10784 when `start.ps1` runs | No manual npm steps after first sync |
| Zero Google API code in this repo | Maintained — subprocess only |

## Requirements

### Functional — ✅ Tested and Working

- **REQ-001:** Delegate notebook CRUD/query to `nlm` (`notebook_list`, `notebook_create`, `notebook_query`).
- **REQ-002:** Source management (`source_list`, `source_add_url`, `source_add_text`).
- **REQ-003:** Studio artifacts (`studio_status`, `audio_create`, `slides_create`, `slides_revise`).
- **REQ-004:** Research (`research_start` — fast/deep, web/drive).
- **REQ-005:** Tags (`tag_list`, `tag_add`).
- **REQ-006:** Fleet pipelines — `fleet_ingest_arxiv`, `fleet_ingest_url`, `fleet_link_repo`, `fleet_pipeline_research`.
- **REQ-007:** Health — `nlm_doctor`, `pipeline_liveness`.
- **REQ-008:** Onboard help — `notebooklm_help`, `notebooklm_help_topics`, `notebooklm_fleet_help`.
- **REQ-009:** HTTP backend with `/api/health`, `/api/pipeline/liveness`, MCP at `/mcp`.
- **REQ-010:** Glass dashboard pages (Dashboard, Notebooks, Studio, Pipeline, Tools, Settings, Help).
- **REQ-011:** Cursor install via `install-mcp.ps1`.
- **REQ-012:** Bundled skill `skill://notebooklm-fleet`.

### Functional — 🟡 Implemented, needs live auth testing

- End-to-end `fleet_pipeline_research` with slides + repo tag on production Google account.
- Dashboard Studio actions against live notebooks (depends on `nlm login`).

### Functional — 🔄 Planned

- **REQ-020:** Deep arxiv-mcp chain — auto-ingest top papers from search into new notebook.
- **REQ-021:** aiwatcher-mcp digest → notebook source pipeline.
- **REQ-022:** memops / advanced-memory notebook export sync.
- **REQ-023:** Windows desktop installer (Tauri) — scaffolded and port-bug-fixed; full certification pending.
- **REQ-024:** Prefab MCP Apps for slide preview cards.

### Completed in 0.1.0

- **REQ-030:** `GET /api/v1/diagnostics` endpoint for CUA smoke test.
- **REQ-031:** LLM proxy routes (`/api/llm/providers`, `/api/llm/chat`) integrated into main backend (not port 8000).
- **REQ-032:** `data-testid` attributes on dashboard KPIs and status badges.
- **REQ-033:** Exponential backoff retry on health check (1s, 2s, 4s, 8s, 16s).
- **REQ-034:** Tauri `backend-status` event listener for instant connection state.
- **REQ-035:** `.cursorrules` session context injection.
- **REQ-036:** `start.bat` double-click wrapper.
- **REQ-037:** Fleet starts launcher in `mcp-central-docs/starts/`.
- **REQ-038:** MCPB 3-4-100 rule: system.md 3k+, user.md 4k+, examples.json 100+.
- **REQ-039:** `useZoom` hook for Tauri Ctrl+Scroll zoom.
- **REQ-040:** Biome lint gate (30 files auto-fixed, 0 errors).

### Non-Functional

| Area | Requirement |
|------|-------------|
| **Performance** | Subprocess `nlm` calls async; no blocking event loop |
| **Security** | Bind 127.0.0.1 by default; no credential storage in repo |
| **Reliability** | `pipeline_liveness` reports auth + CLI presence for fleet-agent probes |
| **Maintainability** | Upstream version bumps = dependency pin only, not API rewrite |

## Technical Architecture

```
Cursor / Claude / agy
        │
        ▼
notebooklm-fleet-mcp (FastMCP + FastAPI :10783)
        │ subprocess
        ▼
nlm / notebooklm-mcp-cli ──► Google NotebookLM (browser session)
        │
web_sota glass (:10784) ──REST proxy──► backend
```

Fleet bridges:

| Partner | Integration |
|---------|-------------|
| arxiv-mcp | `fleet_ingest_arxiv` — abs URLs |
| fleet-registry | `fleet_link_repo` — `fleet:{repo_id}` tags |
| fleet-agent-mcp | `pipeline_liveness` coworker task |
| agy-fleet-mcp | Shared MCP config paths (optional) |

## API Surface

- **MCP:** 22 tools (see [docs/TOOLS.md](docs/TOOLS.md))
- **REST:** `/api/health`, `/api/pipeline/liveness`, notebook proxy routes (see [docs/WEBAPP.md](docs/WEBAPP.md))
- **Transports:** stdio (`--stdio`), streamable HTTP (`--serve` / `start.ps1`)

## Implementation Plan

### Phase 1 — Shipped (0.1.0)

Scaffold, delegation layer, dashboard shell, fleet pipelines, tests, registry entry.

### Phase 2 — Next (0.2.0)

- Live-auth CI smoke (mocked `nlm` + optional manual checklist)
- Dashboard polish: inline `nlm doctor` status widget
- arxiv-mcp one-shot "search → notebook" tool
- MCPB release on GitHub

### Phase 3 — Future (0.3.0+)

- Intel hub publish of slide decks
- Multi-notebook fleet dashboards in MCD
- Optional Tauri desktop bundle

## Out of Scope

- Reimplementing NotebookLM HTTP API
- Replacing `notebooklm-mcp-cli` — always depend on upstream
- Hosting Google OAuth tokens in fleet secrets store (stays local to `nlm`)

## References

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/FLEET_INTEGRATION.md](docs/FLEET_INTEGRATION.md)
- [mcp-central-docs/projects/notebooklm-fleet-mcp/README.md](../mcp-central-docs/projects/notebooklm-fleet-mcp/README.md)

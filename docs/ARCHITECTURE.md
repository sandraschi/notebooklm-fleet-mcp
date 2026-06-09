# Architecture

## Layers

1. **MCP / REST** — `notebooklm_fleet_mcp` FastMCP + FastAPI
2. **Delegation** — `nlm_client.py` spawns `nlm` subprocess
3. **Upstream** — `notebooklm-mcp-cli` talks to NotebookLM

## Why not rewrite upstream?

- Undocumented Google API + cookie auth
- 35+ tools, active maintenance (v0.7.x)
- Fleet value is orchestration, not API reverse-engineering

## Fleet additions

- `fleet_pipelines.py` — arXiv ingest, repo tags, research pipeline
- `web_sota/` — React glass (10784)
- `pipeline_liveness` — supervisor probe

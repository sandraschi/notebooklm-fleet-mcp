# notebooklm-fleet skill

Use **notebooklm-fleet-mcp** for fleet orchestration over Google NotebookLM.

## Prerequisites

- `uv tool install notebooklm-mcp-cli`
- `nlm login`

## When to use

- Grounded research notebooks tied to fleet repos
- arXiv → NotebookLM ingest (`fleet_ingest_arxiv`)
- Research pipeline with optional slides (`fleet_pipeline_research`)
- Studio status polling (`studio_status`)

## Do not confuse

- **notebooklm-mcp-cli** — upstream API + auth (consume, don't fork)
- **notebooklm-fleet-mcp** — fleet glass + pipelines + MCP wrapper

## Flow

1. `nlm_doctor` or `pipeline_liveness`
2. `fleet_pipeline_research` or `notebook_create` + `source_add_url`
3. `notebook_query` for grounded answers
4. `slides_create` / `slides_revise` for deck workflows

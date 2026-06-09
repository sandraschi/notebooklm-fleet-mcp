# MCP tools

All tools delegate to `nlm` unless noted.

## Core

- `notebook_list`, `notebook_create`, `notebook_query`
- `source_list`, `source_add_url`, `source_add_text`
- `studio_status`, `audio_create`, `slides_create`, `slides_revise`
- `research_start`, `tag_list`, `tag_add`

## Fleet

- `fleet_ingest_arxiv` — paper id → abs URL → source
- `fleet_ingest_url` — URL + optional tag
- `fleet_link_repo` — tag `fleet:{repo_id}`
- `fleet_pipeline_research` — create + research + optional slides

## Ops

- `nlm_doctor`, `pipeline_liveness`, `notebooklm_fleet_help`

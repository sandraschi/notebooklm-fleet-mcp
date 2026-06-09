# Fleet integration

## Registry entry

```json
{
  "id": "notebooklm-fleet-mcp",
  "port": 10783,
  "repo_path": "D:/Dev/repos/notebooklm-fleet-mcp",
  "fastmcp": "3.2.0"
}
```

## Bridges

| Fleet server | Integration |
|--------------|-------------|
| arxiv-mcp | `fleet_ingest_arxiv` adds abs URL |
| aiwatcher-mcp | Digest URLs → `source_add_url` (manual/agent) |
| advanced-memory-mcp | Store `notebook_query` answers |
| agy-fleet-mcp | Sync MCP configs for Antigravity |

## Upstream

Keep `notebooklm-mcp-cli` installed via `uv tool` — do not vendor into `external/` unless patching.

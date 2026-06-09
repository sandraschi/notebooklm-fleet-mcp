# notebooklm-fleet-mcp — user tutorials (Claude Desktop)

## First-time setup

1. Install upstream CLI:
   ```powershell
   uv tool install notebooklm-mcp-cli
   ```
2. Authenticate once:
   ```powershell
   nlm login
   ```
3. Verify:
   ```powershell
   nlm doctor
   ```
4. In Claude, ask: *"Run nlm_doctor and pipeline_liveness"* — both should report healthy auth.

## Quick wins

### Create a research notebook

> Create a notebook titled "Transformer Scaling 2024" and run fast web research on "Chinchilla scaling laws follow-up papers".

Tool chain: `fleet_pipeline_research` with `title`, `query`, `mode="fast"`.

### Ingest an arXiv paper

> Add arXiv 2401.00001 to notebook `{id}` and tag it `arxiv:cs.LG`.

Tool: `fleet_ingest_arxiv` with `paper_id`, optional `tag`.

### Ask grounded questions

> In notebook `{id}`, what methods do the sources disagree on?

Tool: `notebook_query` with `notebook_id` and `question`.

### Generate slides

> Create a detailed slide deck for notebook `{id}`, then revise slide 1 to enlarge the title.

Tools: `slides_create` → `slides_revise` with `artifact_id` from `studio_status`.

### Link to a fleet repo

> Tag notebook `{id}` with fleet registry id `arxiv-mcp`.

Tool: `fleet_link_repo` — writes tag `fleet:arxiv-mcp`.

## Dashboard (full stack)

From repo root:

```powershell
.\start.ps1
```

Open http://127.0.0.1:10784 — Notebooks, Studio, Pipeline health, API docs.

Backend API: http://127.0.0.1:10783/api/health

## Cursor install

```powershell
.\install-mcp.ps1 cursor
```

Reload Cursor MCP. Entry: `notebooklm-fleet-mcp`.

## MCPB bundle

Build Claude Desktop bundle:

```powershell
uv sync
just mcpb-pack
```

Output: `dist/notebooklm-fleet-mcp-v0.1.0.mcpb`

Requires `nlm` on PATH and `nlm login` — bundle does not include upstream CLI.

## Troubleshooting

| Issue | Action |
|-------|--------|
| "not authenticated" | `nlm login` in PowerShell |
| `nlm` not found | Add `%USERPROFILE%\.local\bin` to PATH |
| Tool timeout | Retry with `wait=false` on URL ingest; poll `source_list` |
| Port conflict | Set `NOTEBOOKLM_FLEET_PORT` |

See [docs/TROUBLESHOOTING.md](../../docs/TROUBLESHOOTING.md).

## Fleet integrations

- **arxiv-mcp** — ingest abs URLs after paper discovery
- **fleet-agent-mcp** — `pipeline_liveness` in coworker health loops
- **agy-fleet-mcp** — optional MCP config sync for Antigravity

Details: [docs/FLEET_INTEGRATION.md](../../docs/FLEET_INTEGRATION.md).

---

*Expand toward fleet 4k-word tutorial bar with slide revision transcripts and multi-notebook workflows.*

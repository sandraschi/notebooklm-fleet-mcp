# Agent guide — notebooklm-fleet-mcp

## Role

Fleet wrapper over **notebooklm-mcp-cli**. Do not reimplement Google NotebookLM API calls — use `nlm_client.py` subprocess paths only.

## Before coding

1. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — delegation boundary.
2. Run `nlm doctor` locally — mutating tools need auth.
3. Match fleet patterns: FastMCP 3.2, `pipeline_liveness`, port **10783/10784**.

## Key files

| Path | Purpose |
|------|---------|
| `src/notebooklm_fleet_mcp/server.py` | MCP tools |
| `src/notebooklm_fleet_mcp/nlm_client.py` | `nlm` subprocess |
| `src/notebooklm_fleet_mcp/fleet_pipelines.py` | arXiv/repo pipelines |
| `src/notebooklm_fleet_mcp/app.py` | FastAPI + `/mcp` mount |
| `web_sota/` | Glass dashboard |
| `manifest.json` | MCPB + install-mcp identity |

## Adding a tool

1. Implement in `nlm_client.py` or `fleet_pipelines.py`.
2. Register `@mcp.tool()` in `server.py`.
3. Document in `docs/TOOLS.md`.
4. Add to `manifest.json` tools array.
5. Add example in `assets/prompts/examples.json`.

## Tests

```powershell
just test
just lint
```

## Docs

Follow [mcp-central-docs/standards/README_STRUCTURE.md](../mcp-central-docs/standards/README_STRUCTURE.md). Short README; staged detail in `docs/` + root `INSTALL.md`, `PRD.md`, `CHANGELOG.md`.

## Out of scope

- Forking notebooklm-mcp-cli
- Storing Google OAuth in repo or fleet secrets

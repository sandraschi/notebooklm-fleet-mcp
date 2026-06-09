# FastMCP features — notebooklm-fleet-mcp

## Server identity

```python
mcp = FastMCP("notebooklm-fleet-mcp", instructions="...")
```

Instructions tell agents: delegate to `nlm`, use `fleet_*` for pipelines, run `nlm login` first.

## Transports

| Mode | Command | Use |
|------|---------|-----|
| stdio | `uv run python -m notebooklm_fleet_mcp --stdio` | Cursor, Claude Desktop (via install-mcp) |
| HTTP | `.\start.ps1` or `--serve` | Dashboard + `POST /mcp` |

## Skills provider

```python
mcp.add_provider(SkillsDirectoryProvider(roots=[skills/]))
```

Exposes **`skill://notebooklm-fleet`**.

## Tool design

- All tools return structured `dict` (or `str` for help markdown).
- Async subprocess in `nlm_client.py` — no blocking sync I/O on event loop.
- `nlm_doctor` uses non-raising subprocess — always returns diagnostic text.

## Liveness pattern

`pipeline_liveness` follows fleet standard:

- Auth state (via `nlm` probe)
- CLI presence
- Alert strings for supervisors

Consumed by **fleet-agent-mcp** coworker health tasks.

## HTTP app

`app.py` mounts FastMCP `http_app` at `/mcp` alongside REST routes. Same process as dashboard API.

## MCPB

`manifest.json` v0.2 — stdio entry via `uv run python -m notebooklm_fleet_mcp --stdio`.

Pack with `just mcpb-pack` — see [MCPB standards](https://github.com/sandraschi/mcp-central-docs/blob/main/standards/MCPB_PACKAGING_STANDARDS.md).

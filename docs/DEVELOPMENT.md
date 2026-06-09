# Development

```powershell
uv sync --extra dev
uv run pytest
just lint
just serve
```

## Layout

- `src/notebooklm_fleet_mcp/` — Python package
- `web_sota/` — React dashboard
- `scripts/FleetStartMode.ps1` — vendored launcher

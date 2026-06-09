# Troubleshooting

## `nlm` not found

```powershell
uv tool install notebooklm-mcp-cli
```

## Not authenticated

```powershell
nlm login
nlm doctor
```

## Port 10783/10784 in use

```powershell
.\start.ps1
```

FleetStartMode clears squatters automatically.

## Upstream bug

Track [notebooklm-mcp-cli issues](https://github.com/jacob-bd/notebooklm-mcp-cli/issues). Patch in `external/` only if needed.

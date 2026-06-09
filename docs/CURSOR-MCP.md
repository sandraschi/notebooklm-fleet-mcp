# Cursor MCP install

```powershell
.\install-mcp.ps1 cursor
```

Or add manually to `~/.cursor/mcp.json`:

```json
"notebooklm-fleet-mcp": {
  "command": "C:/Users/sandr/.local/bin/uv.exe",
  "args": ["--directory", "D:/Dev/repos/notebooklm-fleet-mcp", "run", "python", "-m", "notebooklm_fleet_mcp", "--stdio"],
  "env": { "PYTHONUNBUFFERED": "1", "FASTMCP_BANNER": "0" }
}
```

Keep upstream `notebooklm-mcp` entry for direct nlm MCP if desired — fleet wrapper adds pipelines + dashboard.

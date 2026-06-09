# Installing notebooklm-fleet-mcp

Fleet orchestration layer for **Google NotebookLM** — glass dashboard, MCP tools, and arXiv/repo pipelines. Core API work delegates to **[notebooklm-mcp-cli](https://pypi.org/project/notebooklm-mcp-cli/)** (`nlm`); this repo does **not** reimplement Google's undocumented API.

---

## Prerequisites

| Tool | Required for | Windows | Notes |
|------|-------------|---------|-------|
| **notebooklm-mcp-cli** | All options | `uv tool install notebooklm-mcp-cli` | Provides `nlm` + `notebooklm-mcp` |
| **Google NotebookLM auth** | Mutating tools | `nlm login` | One-time browser OAuth on this machine |
| **uv** | Options C–D | `winget install astral-sh.uv` | Python + deps |
| **git** | Clone (C/D) | `winget install Git.Git` | |
| **Node.js LTS** | Dashboard (C/D) | `winget install OpenJS.NodeJS` | `web_sota/` only |

> **Windows:** After winget installs, **close and reopen PowerShell** so PATH updates apply.

Verify upstream CLI:

```powershell
nlm --version
nlm doctor
```

Pass criteria for auth: `nlm doctor` reports logged-in state (not "no auth").

---

## Option A — Drag and Drop (Claude Desktop)

No manual JSON editing. MCP tools only (no glass dashboard in the bundle).

1. Go to [Releases](https://github.com/sandraschi/notebooklm-fleet-mcp/releases/latest)
2. Download `notebooklm-fleet-mcp*.mcpb` (or build with `just mcpb-pack`)
3. Open Claude Desktop → drag `.mcpb` onto the window → accept install
4. Ensure `nlm` is on PATH and run `nlm login` once

**Pass criteria:** server appears in MCP list; `nlm_doctor` tool returns healthy auth.

---

## Option B — mcpb CLI

`mcpb` is **not** on PyPI. Requires Node.js:

```powershell
winget install OpenJS.NodeJS --accept-source-agreements --accept-package-agreements
# Close and reopen terminal, then:
npx @anthropic-ai/mcpb install https://github.com/sandraschi/notebooklm-fleet-mcp
```

Or pack locally after `uv sync`:

```powershell
just mcpb-pack
```

---

## Option C — Fastest from source (dashboard + MCP)

```powershell
git clone https://github.com/sandraschi/notebooklm-fleet-mcp
cd notebooklm-fleet-mcp
uv tool install notebooklm-mcp-cli
nlm login
.\start.ps1
```

`start.ps1` runs `uv sync --extra dev`, installs `web_sota` deps if needed, starts:

| Service | URL |
|---------|-----|
| Backend (FastAPI + MCP `/mcp`) | http://127.0.0.1:10783 |
| Glass dashboard (Vite) | http://127.0.0.1:10784 |

---

## Option D — MCP client only (stdio)

For Cursor, Windsurf, Zed, Antigravity, etc.:

```powershell
git clone https://github.com/sandraschi/notebooklm-fleet-mcp
cd notebooklm-fleet-mcp
uv sync
uv tool install notebooklm-mcp-cli
nlm login
.\install-mcp.ps1 cursor
```

Or print JSON without writing:

```powershell
.\install-mcp.ps1 print
```

Stdio entry:

```powershell
uv run python -m notebooklm_fleet_mcp --stdio
```

HTTP MCP (when backend is running):

```
POST http://127.0.0.1:10783/mcp
```

Claude Desktop manual JSON (`%APPDATA%\Claude\claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "notebooklm-fleet-mcp": {
      "command": "uv",
      "args": ["run", "--directory", "C:\\path\\to\\notebooklm-fleet-mcp", "python", "-m", "notebooklm_fleet_mcp", "--stdio"],
      "env": { "PYTHONUNBUFFERED": "1", "FASTMCP_BANNER": "0" }
    }
  }
}
```

macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

Cursor and HTTP MCP: [docs/CURSOR-MCP.md](docs/CURSOR-MCP.md)

---

## Cursor / fleet coexistence

You may keep **both**:

| MCP id | Role |
|--------|------|
| `notebooklm-mcp` | Upstream `notebooklm-mcp.exe` (direct Google API tools) |
| `notebooklm-fleet-mcp` | Fleet wrapper + pipelines + dashboard |

Prefer **fleet** tools when you need arXiv ingest, `fleet:{repo_id}` tags, glass UI, or `pipeline_liveness` for supervisors.

---

## Environment

Prefix **`NOTEBOOKLM_FLEET_`** (see [docs/CONFIGURATION.md](docs/CONFIGURATION.md)):

| Variable | Default | Purpose |
|----------|---------|---------|
| `HOST` | `127.0.0.1` | HTTP bind |
| `PORT` | `10783` | Backend port |
| `NLM_BIN` | `nlm` | Path to upstream CLI |

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `nlm` not found | `uv tool install notebooklm-mcp-cli`; ensure `%USERPROFILE%\.local\bin` on PATH |
| Auth errors on mutate | `nlm login` |
| Port in use | Change `NOTEBOOKLM_FLEET_PORT` or stop conflicting process |
| Dashboard blank | `cd web_sota; npm install`; rerun `.\start.ps1` |

Full guide: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

## Development recipes

```powershell
just test
just lint
just serve      # backend only
just dev        # full stack
just mcpb-pack  # Claude Desktop bundle
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

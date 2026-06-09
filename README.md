# notebooklm-fleet-mcp

<p align="center">
  <a href="https://github.com/astral-sh/uv"><img src="https://img.shields.io/badge/uv-ready-7c5cfc?style=flat-square" alt="uv"></a>
  <a href="https://github.com/astral-sh/ruff"><img src="https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json" alt="Ruff"></a>
  <a href="https://python.org"><img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python"></a>
  <a href="https://github.com/PrefectHQ/fastmcp"><img src="https://img.shields.io/badge/FastMCP-3.2-7c5cfc?style=flat-square" alt="FastMCP"></a>
</p>

Fleet orchestration for **Google NotebookLM** — MCP tools, glass dashboard, arXiv ingest, and repo tagging. Delegates to [notebooklm-mcp-cli](https://pypi.org/project/notebooklm-mcp-cli/) (`nlm`); **not** an API rewrite.

**v0.1.0** · FastMCP 3.2 · [CHANGELOG](CHANGELOG.md)

---

## Contents

- [Features](#features)
- [Quick start](#quick-start)
- [What you can do](#what-you-can-do)
- [Ports](#ports)
- [Documentation](#documentation)
- [Requirements](#requirements)
- [License](#license)

---

## Features

- **Upstream delegation** — all Google API work via `nlm` subprocess
- **Fleet pipelines** — arXiv ingest, `fleet:{repo_id}` tags, one-shot research + slides
- **Glass dashboard** — notebooks, studio, pipeline health, API docs
- **Dual transport** — stdio for IDEs, HTTP MCP at `/mcp` on **10783**
- **Supervisor probes** — `pipeline_liveness` + `nlm_doctor` for fleet-agent health loops
- **Bundled skill** — `skill://notebooklm-fleet`

---

## Quick start

```powershell
git clone https://github.com/sandraschi/notebooklm-fleet-mcp
cd notebooklm-fleet-mcp
uv tool install notebooklm-mcp-cli
nlm login
uv sync --extra dev
.\start.ps1
.\install-mcp.ps1 cursor
```

Dashboard **http://127.0.0.1:10784** · backend **http://127.0.0.1:10783** · MCP **/mcp**

All install paths: **[INSTALL.md](INSTALL.md)**

---

## What you can do

**Research pipeline**

> Create a notebook on "MCP fleet patterns", run fast web research, and generate slides.

**arXiv bridge**

> Ingest arXiv 2401.00001 into notebook `{id}` and ask what methods the sources disagree on.

**Fleet linkage**

> Tag this notebook with `fleet:arxiv-mcp` so registry supervisors can find it.

---

## Ports

| Service | Port |
|---------|------|
| Backend (FastAPI + MCP `/mcp`) | **10783** |
| Frontend (Vite glass) | **10784** |

---

## Documentation

| Doc | Topic |
|-----|-------|
| [INSTALL.md](INSTALL.md) | Options A–D (MCPB, source, Cursor) |
| [PRD.md](PRD.md) | Product requirements |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [llms-full.txt](llms-full.txt) | Agent reference |
| [docs/README.md](docs/README.md) | Staged doc index |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Delegation model |
| [docs/TOOLS.md](docs/TOOLS.md) | MCP tool reference |
| [docs/FLEET_INTEGRATION.md](docs/FLEET_INTEGRATION.md) | arxiv, fleet-agent bridges |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Auth, ports |

MCD project page: [mcp-central-docs/projects/notebooklm-fleet-mcp](https://github.com/sandraschi/mcp-central-docs/tree/main/projects/notebooklm-fleet-mcp)

---

## Requirements

- **notebooklm-mcp-cli** — `uv tool install notebooklm-mcp-cli`
- **Auth** — `nlm login` (one-time per machine)
- **uv** — Python deps
- **Node.js** — dashboard dev only

---

## Related

- [notebooklm-mcp-cli](https://pypi.org/project/notebooklm-mcp-cli/) — upstream (keep installed)
- [agy-fleet-mcp](https://github.com/sandraschi/agy-fleet-mcp) — Antigravity MCP config sync
- [arxiv-mcp](https://github.com/sandraschi/arxiv-mcp) — paper discovery → fleet ingest

---

## License

MIT — see [LICENSE](LICENSE)

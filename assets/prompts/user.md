# notebooklm-fleet-mcp — user tutorials (Claude Desktop)

## First-time setup

### 1. Install the upstream CLI

The fleet wrapper delegates all Google API work to `notebooklm-mcp-cli`. Install it with uv:

```powershell
uv tool install notebooklm-mcp-cli
```

This installs the `nlm` command to your uv tools directory (typically `%USERPROFILE%\.local\bin`).

### 2. Authenticate with Google

NotebookLM requires Google OAuth. Run once:

```powershell
nlm login
```

This opens your default browser. Sign in with your Google account, authorize the app, and close the browser. The token is cached locally — you won't need to log in again unless you revoke it.

### 3. Verify the setup

```powershell
nlm doctor
```

You should see: `authenticated: true`, `nlm version: x.y.z`, `Google API: reachable`.

### 4. Verify the fleet server

In Claude Desktop, ask:

> Run nlm_doctor and pipeline_liveness

Both should report healthy auth and no alerts.

### 5. Start the dashboard (optional)

From the repo root:

```powershell
.\start.ps1
```

Or double-click `start.bat`. Open http://127.0.0.1:10784 for the glass UI.

## Tutorial: Create a research notebook

**Goal:** Set up a notebook on "Chinchilla scaling laws follow-up papers" with web research and a slide deck.

**Step 1 — One-shot pipeline (recommended):**

```
fleet_pipeline_research(
    title="Transformer Scaling 2024",
    query="Chinchilla scaling laws follow-up papers",
    mode="deep",
    create_slides=True
)
```

This creates the notebook, runs deep research, generates a detailed slide deck, and returns the notebook_id and artifact_id.

**Step 2 — Ask grounded questions:**

```
notebook_query(
    notebook_id="<returned_id>",
    question="What methods do the sources disagree on?"
)
```

Returns an answer with citations from the ingested sources.

**Step 3 — Revise slides:**

First check what artifacts exist:
```
studio_status(notebook_id="<id>")
```

Then revise:
```
slides_revise(artifact_id="<id>", slide_instruction="1 Make the title larger")
```

## Tutorial: Ingest an arXiv paper

**Goal:** Add arXiv paper 2401.00001 to an existing notebook with a category tag.

**One-step:**
```
fleet_ingest_arxiv(
    notebook_id="<existing_id>",
    paper_id="2401.00001",
    wait=True,
    tag="arxiv:cs.LG"
)
```

With `wait=True`, the tool blocks until NotebookLM finishes processing the source. For long papers, set `wait=False` and poll:

```
source_list(notebook_id="<id>")
```

## Tutorial: Multi-source literature review

**Goal:** Ingest multiple papers, ask cross-source questions, generate an audio overview.

1. Create a notebook:
   ```
   notebook_create(title="LLM Safety 2025 Review")
   ```

2. Ingest papers:
   ```
   fleet_ingest_arxiv(nb, "2401.00001", wait=True)
   fleet_ingest_arxiv(nb, "2401.00002", wait=True)
   fleet_ingest_url(nb, "https://example.com/survey.pdf", wait=True)
   ```

3. Cross-source analysis:
   ```
   notebook_query(nb, "What safety evaluation methods do these papers share?")
   notebook_query(nb, "Which approaches diverge and why?")
   ```

4. Generate audio overview:
   ```
   audio_create(nb, format="deep_dive", length="long")
   ```

## Tutorial: Link research to a fleet repository

**Goal:** Tag a notebook so other fleet tools can find it by repo ID.

After creating a notebook for repo research:
```
fleet_link_repo(notebook_id="<id>", repo_id="arxiv-mcp")
```

This writes tag `fleet:arxiv-mcp`. The fleet discovery system can now find this notebook when looking for arxiv-mcp related research.

## Tutorial: Debug auth issues

When tools return "not authenticated":

1. Run diagnostics:
   ```
   nlm_doctor()
   pipeline_liveness()
   ```

2. If doctor shows `authenticated: false`, tell the user:
   ```
   nlm login
   ```

3. If `nlm` is not found, install:
   ```
   uv tool install notebooklm-mcp-cli
   ```

4. If PATH is wrong, add:
   ```
   $env:PATH += ";$env:USERPROFILE\.local\bin"
   ```

5. Re-verify:
   ```
   nlm_doctor()
   ```

## Tutorial: Batch paper ingest workflow

**Goal:** Ingest multiple arXiv papers from a reading list and run a comparative analysis.

**Step 1 — Create a master notebook:**
```
notebook_create(title="Summer Reading List 2025")
```

**Step 2 — Batch ingest papers with tags:**
```
fleet_ingest_arxiv(nb, "2401.00001", wait=True, tag="arxiv:cs.LG")
fleet_ingest_arxiv(nb, "2401.00002", wait=True, tag="arxiv:cs.AI")
fleet_ingest_arxiv(nb, "2401.00003", wait=True, tag="arxiv:cs.LG")
```

With `wait=True`, each ingest blocks until NotebookLM finishes. For large batches, omit wait and poll later:
```
source_list(notebook_id="<id>")
```

**Step 3 — Cross-paper synthesis:**
```
notebook_query(nb, "What methodologies are common across all papers?")
notebook_query(nb, "Which findings contradict each other?")
```

**Step 4 — Generate a literature survey deck:**
```
slides_create(nb, format="detailed_deck", length="long")
```

## Tutorial: Local LLM chat via dashboard

The dashboard includes a floating chat bubble that connects to local LLM providers via the `/api/llm/` endpoints. This lets you ask questions about your research without leaving the webapp.

**Setup:** Ensure Ollama (port 11434) or LM Studio (port 1234) is running. The dashboard auto-detects available providers on mount.

**Usage:** Click the chat bubble (bottom-right), select a model from the dropdown, type your question. The chat sends requests to the local LLM and displays responses inline. Chat history is preserved during the session.

The LLM proxy runs on port 10785 (integrated into the main backend) and supports any OpenAI-compatible local endpoint.

## Tutorial: Using the REST API programmatically

The REST API at port 10783 can be used from scripts, curl, or any HTTP client. All endpoints return JSON.

**List notebooks with curl:**
```powershell
curl.exe http://127.0.0.1:10783/api/notebooks
```

**Create a notebook:**
```powershell
curl.exe -X POST http://127.0.0.1:10783/api/notebooks -H "Content-Type: application/json" -d '{"title": "API Test"}'
```

**Query a notebook:**
```powershell
curl.exe -X POST http://127.0.0.1:10783/api/notebooks/{id}/query -H "Content-Type: application/json" -d '{"question": "Summarize key findings"}'
```

**Run a fleet pipeline:**
```powershell
curl.exe -X POST http://127.0.0.1:10783/api/fleet/pipeline/research -H "Content-Type: application/json" -d '{"title":"Survey","query":"MCP 2025","mode":"fast"}'
```

**Check diagnostics:**
```powershell
curl.exe http://127.0.0.1:10783/api/v1/diagnostics
```

The OpenAPI spec is available at `http://127.0.0.1:10783/openapi.json`.

## Tutorial: Build a research corpus

**Goal:** Create a dedicated notebook for each project area and link them via fleet tags.

**Phase 1 — Create project notebooks:**
```
notebook_create(title="LLM Safety Research")
notebook_create(title="Robotics Planning")
notebook_create(title="Chip Design Tools")
```

**Phase 2 — Ingest per-project papers:**
```
fleet_ingest_arxiv(nb_safety, "2401.00100", tag="safety")
fleet_ingest_arxiv(nb_robotics, "2401.00200", tag="robotics")
fleet_ingest_arxiv(nb_chip, "2401.00300", tag="chip-design")
```

**Phase 3 — Link to fleet repos:**
```
fleet_link_repo(nb_safety, "safety-mcp")
fleet_link_repo(nb_robotics, "robotics-mcp")
fleet_link_repo(nb_chip, "chip-design-mcp")
```

**Phase 4 — Cross-corpus query:** Run `tag_list()` to see all project tags, then `notebook_query()` on any notebook for grounded answers.

## Tutorial: Automated daily research with fleet agent

**Goal:** Combine notebooklm-fleet-mcp with fleet-agent-mcp for daily research on a tracked topic.

**Setup:** Ensure fleet-agent-mcp (port 10996) is running and configured to accept fleet events.

**Workflow:**

1. Run `fleet_pipeline_research(title="Daily Briefing", query="Latest in MCP ecosystem", mode="fast")`
2. The pipeline tags the notebook with `fleet:daily-brief`
3. `pipeline_liveness` reports the notebook as active
4. fleet-agent-mcp can query this notebook via `notebook_query` for daily summaries

This enables persistent research notebooks that accumulate knowledge over time. Each day's research adds new sources to the same notebook, building a comprehensive knowledge base.

## Tutorial: Debugging nlm subprocess errors

When an MCP tool fails, the error response includes `stderr` from the `nlm` subprocess. Common patterns:

**"nlm is not recognized"**: The `nlm` binary is not on PATH. Check with `nlm_doctor()` which reports binary location.

**"Error: not authenticated"**: Google OAuth token expired. Run `nlm login` to refresh.

**"Error: notebook not found"**: The notebook_id is invalid or the notebook was deleted. Run `notebook_list()` to discover valid IDs.

**"HTTP 429"**: Google API rate limit hit. Wait 30-60 seconds before retrying.

**"Timeout"**: The operation took longer than `QUERY_TIMEOUT_SECONDS` (default 180s). For large ingest or research operations, increase the timeout:
```
set NOTEBOOKLM_FLEET_MCP_QUERY_TIMEOUT_SECONDS=300
```

**"Source processing"**: The URL was added but NotebookLM is still processing. Set `wait=True` for blocking ingest, or poll `source_list()`.

## Advanced configuration

### Custom nlm path

If `nlm` is installed to a non-standard location:
```
set NOTEBOOKLM_FLEET_MCP_NLM_PATH=C:\tools\nlm.exe
```

### Alternative arxiv-mcp server

If arxiv-mcp runs on a different host or port:
```
set NOTEBOOKLM_FLEET_MCP_ARXIV_MCP_BASE=http://other-host:10770
```

### Data directory

Pipeline state and caches can be redirected:
```
set NOTEBOOKLM_FLEET_MCP_DATA_DIR=D:\research\notebooklm-data
```

### Disable fleet registry

Set to an empty path to disable fleet discovery:
```
set NOTEBOOKLM_FLEET_MCP_FLEET_REGISTRY_PATH=
```

## Best practices

1. **Always run nlm_doctor first** when resuming a session — auth state can change between sessions
2. **Capture notebook IDs** — notebook_create returns a notebook_id you must store for subsequent calls
3. **Use wait=True for critical ingest** — ensures the source is processed before you query
4. **Tag aggressively** — tags are the primary organization mechanism; use fleet: prefix for cross-repo discovery
5. **Chain tools** — fleet_pipeline_research collapses create + research + slides + tagging into one call
6. **Poll don't guess** — use source_list and studio_status to check processing instead of retrying tools
7. **Set timeouts for long operations** — research and studio generation can take 2-5 minutes
8. **Monitor pipeline_liveness** — catch auth failures early before they waste time

## Tutorial: Start a web research session

**Goal:** Have NotebookLM discover sources on a topic you know nothing about.

```
research_start(
    query="Latest advances in neuromorphic computing 2025",
    mode="deep",
    source="web"
)
```

NotebookLM searches the web, evaluates sources, and ingests the most relevant ones. With `mode="deep"`, the research takes 2-5 minutes but finds higher-quality sources.

After research completes, check what was ingested:
```
source_list(notebook_id="<returned_id>")
```

Then ask questions:
```
notebook_query(notebook_id, "What are the key challenges?")
```

## Tutorial: Manage notebooks with tags

**Goal:** Organize notebooks by project and status.

List all tags:
```
tag_list()
```

Add status tags:
```
tag_add(notebook_id="<id>", tags="fleet,review,arxiv:cs.LG")
```

Tags are comma-separated strings. The fleet system uses the `fleet:` prefix for registry-linked tags, but you can use any tag format.

## Tutorial: Monitor pipeline health

**Goal:** Check if everything is working before starting research.

```
pipeline_liveness()
```

Returns:
- `healthy: true` if all checks pass
- `alerts: [...]` listing any issues
- `checks: [{id, ok, detail}]` per check

Checks include:
- Auth status (is nlm logged in?)
- nlm CLI presence (is it installed?)
- Upstream connectivity (can we reach arxiv-mcp?)
- Stale pipelines (any long-running operations?)

## Tutorial: Use the glass dashboard

The webapp at http://127.0.0.1:10784 provides a visual interface:

1. **Dashboard** — health KPIs, pipeline liveness, quick-nav tiles
2. **Notebooks** — list, create, add sources, grounded Q&A
3. **Studio** — check audio/slides artifact status
4. **Pipeline** — run fleet research pipelines via form
5. **Tools** — inspect MCP tool capabilities
6. **Apps** — discover other fleet webapps
7. **Settings** — view nlm doctor output and upstream version
8. **API Docs** — Swagger UI for the REST API

The dashboard requires the backend on port 10783 and starts via:
```powershell
.\start.ps1
```

## MCPB bundle for Claude Desktop

Build a distributable bundle for Claude Desktop:
```powershell
uv sync
just mcpb-pack
```

Output: `dist/notebooklm-fleet-mcp-v0.1.0.mcpb`

The bundle includes:
- `manifest.json` — MCPB v0.2 manifest
- `src/` — self-contained Python source
- `assets/icon.png` + `assets/prompts/system.md`, `user.md`, `examples.json`
- `README.md` and `CHANGELOG.md`

The bundle does NOT include the upstream `nlm` CLI — the user must still install `notebooklm-mcp-cli` separately and authenticate.

## Dashboard operation modes

### Full stack (default)
```powershell
.\start.ps1
```
Starts backend (10783) + frontend (10784) + opens browser.

### Backend only
```powershell
.\start.ps1 -BackendOnly
```
Useful for Claude Desktop MCP HTTP transport. No browser opens.

### Headless
```powershell
.\start.ps1 -Headless -BackendOnly
```
Starts backend in a hidden console window. For automated/probe workflows.

### Debug mode
```powershell
.\start.ps1 -Verbose
```
Shows detailed startup logs including port clearing and health check timings.

## Dashboard stop

Gracefully stop the stack:
```powershell
.\stop.bat
```
Or from `web_sota\`:
```powershell
.\stop.ps1 10783,10784
```

## Cursor IDE setup

Register with Cursor's MCP system:
```powershell
.\install-mcp.ps1 cursor
```

This adds the server to `~/.cursor/mcp.json`. Entry: `notebooklm-fleet-mcp`.

Reload Cursor MCP (Command Palette: "Reload MCP Servers"). The tools appear in Cursor's MCP tool list.

## Claude Desktop setup

### Stdio mode

Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "notebooklm-fleet-mcp": {
      "command": "uv",
      "args": ["run", "--directory", "D:/Dev/repos/notebooklm-fleet-mcp", "python", "-m", "notebooklm_fleet_mcp", "--stdio"]
    }
  }
}
```

### HTTP mode (requires backend running)
```json
{
  "mcpServers": {
    "notebooklm-fleet-mcp": {
      "url": "http://127.0.0.1:10783/mcp"
    }
  }
}
```

## Troubleshooting

| Issue | Symptom | Action |
|-------|---------|--------|
| Not authenticated | All mutate tools fail | `nlm login` |
| nlm not found | `FileNotFoundError` | Add `%USERPROFILE%\.local\bin` to PATH; install with `uv tool install notebooklm-mcp-cli` |
| Tool times out | No response for 3+ min | Increase `NOTEBOOKLM_FLEET_MCP_QUERY_TIMEOUT_SECONDS` |
| Port in use (10783) | Backend fails to bind | `.\stop.bat` then retry; or kill zombie process with `Stop-FleetPortSquatters` |
| Port in use (10784) | Vite fails to start | Check for other webapps on same port |
| Sources not appearing | `source_add_url(wait=True)` completed but no sources | Poll `source_list` — processing continues asynchronously |
| Slides look wrong | `slides_create` generated poor output | Use `slides_revise` with targeted instructions |
| Audio not generating | `audio_create` returns error | Try `format="brief"` instead of `"deep_dive"` for shorter output |
| Pipeline partially fails | Notebook created but research failed | Check `notebook_query` for what was ingested; re-run research |
| MCPB validation fails | `mcpb validate` reports errors | Check manifest.json v0.2 format and tool list completeness |
| Corpus search returns nothing | `notebook_query` finds no relevant sources | Check that sources are processed via `source_list` |
| Cursor can't find tools | Tools don't appear in list | Reload MCP servers; check `<profile>\.cursor\mcp.json` |
| Claude Desktop hangs | Server not responding | Restart Claude Desktop or check server logs |

## Fleet integration guide

### arxiv-mcp handoff

When arxiv-mcp (port 10770) is running, the fleet pipeline can construct accurate arXiv abs URLs for ingest. This is automatic — no configuration needed. The handoff happens in `fleet_pipelines.py`:

```
arxiv-mcp search → user picks papers → fleet_ingest_arxiv(nb, paper_id) → nlm adds source
```

### fleet-agent-mcp integration

When fleet-agent-mcp (port 10996) is running, `pipeline_liveness` can POST health events. This enables:
- Cross-server health monitoring
- Stale pipeline alerts
- Time-based pipeline restarts

Configure `AIWATCHER_MCP_BASE` in env if fleet-agent-mcp runs on a non-default port.

### MCP-to-MCP workflows

The server participates in these cross-server chains:

1. **Research → NotebookLM:** any-mcp → arxiv-mcp → notebooklm-fleet-mcp → slides
2. **Health monitoring:** notebooklm-fleet-mcp → fleet-agent-mcp (POST /api/fleet/ingest)
3. **Dashboard federation:** notebooklm-fleet-mcp dashboard → Fleet Starts UI (port 10791)

## Quick reference

All MCP tools (22 total):
- Help: 4 tools (fleet_help, help_topics, help, doctor)
- Notebooks: 3 tools (list, create, query)
- Sources: 2 tools (list, add_url, add_text)
- Studio: 4 tools (status, audio, slides, revise)
- Research: 1 tool (start)
- Tags: 2 tools (list, add)
- Fleet: 4 tools (ingest_arxiv, ingest_url, link_repo, pipeline_research)
- Health: 1 tool (liveness)

REST endpoints:
- `GET /api/health` — service status
- `GET /api/v1/diagnostics` — detailed diagnostics
- `GET /api/stats` — notebook count, auth, nlm version
- `GET /api/tools` — tool manifest
- `GET /api/fleet` — hub discovery list
- `GET /api/help` — help topics
- `GET /api/help/{topic}` — help content
- `GET /api/pipeline/liveness` — supervisor probe
- `GET /api/auth/status` — nlm doctor info
- `GET /api/notebooks` — list notebooks
- `POST /api/notebooks` — create notebook
- `GET /api/notebooks/{id}/sources` — list sources
- `POST /api/notebooks/{id}/sources` — add URL source
- `POST /api/notebooks/{id}/query` — grounded Q&A
- `GET /api/notebooks/{id}/studio` — artifact status
- `POST /api/notebooks/{id}/research` — start research
- `POST /api/fleet/pipeline/research` — fleet pipeline
- `POST /api/fleet/ingest/arxiv` — arXiv ingest
- `GET /api/llm/providers` — local LLM discovery
- `POST /api/llm/chat` — local LLM chat proxy

Ports:
- Backend: 10783 (REST + MCP HTTP at `/mcp`)
- Frontend: 10784 (Vite dev server proxying to 10783)
- LLM chat: 10785 (optional, local Ollama/LM Studio proxy)

## Tutorial: Integrating with the fleet starts system

The Fleet Starts UI at http://127.0.0.1:10791 provides a visual launcher for all fleet webapps. notebooklm-fleet-mcp is registered as `notebooklm-start.bat` in the starts directory.

**From the Fleet Starts UI:** Open http://127.0.0.1:10791, search for "notebooklm", click the card. The launcher starts the backend and frontend automatically.

**Direct launch from the starts directory:**
```powershell
cd D:\Dev\repos\mcp-central-docs
.\starts\notebooklm-start.bat
```

**From the just recipe system:**
The just-starts directory provides just recipe shortcuts:
```powershell
cd D:\Dev\repos\mcp-central-docs
.\just-starts\notebooklm-fleet-mcp-start.bat
```

## Tutorial: Multi-session research campaign

**Goal:** Run daily research sessions on the same topic, building a growing knowledge base.

**Day 1 — Set up the master notebook:**
```
fleet_pipeline_research(
    title="MCP Ecosystem Tracker",
    query="Model Context Protocol developments 2025",
    mode="deep",
    repo_id="mcp-central-docs"
)
```
Run notebook_query to get your first findings.

**Day 2 — Add new research:**
```
research_start(
    query="Latest MCP server implementations",
    notebook_id="<master_nb_id>",
    mode="fast",
    source="web"
)
```
Then ask: `notebook_query(nb_id, "What new MCP servers appeared since last session?")`

**Day 7 — Generate a weekly summary deck:**
```
slides_create(nb_id, format="detailed_deck", length="default")
slides_revise(artifact_id, "1 Add date range: July 2025")
```

**Day 30 — Archive and restart:** Tag the notebook as completed, create a fresh one for the next month:
```
tag_add(nb_id, "completed,2025-Q3")
fleet_pipeline_research(...)  # fresh notebook
```

## Tutorial: Using the dashboard for pipeline management

The Pipeline page (http://127.0.0.1:10784/pipeline) provides a form interface for the fleet pipeline:

1. Enter a **title** for the notebook
2. Enter a **research query** (the topic to research)
3. Select **mode** (fast or deep)
4. Check **"Create slides"** to auto-generate a deck
5. Optionally enter a **repo ID** for fleet tag linkage
6. Click **"Run pipeline"**

The page shows the raw JSON result, including notebook_id and artifact_id. Use these IDs in subsequent Chat or Notebooks page operations.

This is useful when you prefer a visual form over typing tool commands.

## Tutorial: Using the Notebooks page

The Notebooks page (http://127.0.0.1:10784/notebooks) provides a visual interface for core notebook operations:

1. **List notebooks** — shows all notebooks with IDs
2. **Create** — enter a title and click Create
3. **Select** — click a notebook to make it the active target
4. **Add URL source** — paste a URL (e.g. arXiv abs, blog post, PDF) and click "Add URL source"
5. **Query** — type a question and click "Query" for grounded Q&A
6. **Sources** — view all sources for the active notebook

The page auto-fetches the notebook list on mount and updates the source list when you select a notebook.

## Tutorial: Debugging with the Settings page

The Settings page (http://127.0.0.1:10784/settings) displays:

- **nlm doctor output** — shows auth status, environment info, Python version
- **nlm version** — the installed version of the upstream CLI
- **Backend version** — the notebooklm-fleet-mcp server version

Use this page to verify that nlm is installed, authenticated, and at the correct version. If the dashboard shows "Login" in the Auth KPI, open Settings to see the full doctor output and guide the user through auth.

## Tutorial: Creating a research brief

**Goal:** Generate a structured research brief from a notebook for sharing with colleagues.

**Step 1 — Gather all findings:**
```
notebook_query(nb, "Summarize all key findings in 5 bullet points")
notebook_query(nb, "What are the open questions?")
notebook_query(nb, "List all cited sources with URLs")
```

**Step 2 — Generate slides as a brief:**
```
slides_create(nb, format="detailed_deck", length="short")
```

**Step 3 — Revise slides to include the brief structure:**
```
studio_status(nb)  # get artifact_id
slides_revise(artifact_id, "1 Add title 'Research Brief'")
slides_revise(artifact_id, "2 List key findings as bullets")
slides_revise(artifact_id, "3 Add open questions section")
slides_revise(artifact_id, "4 Add references section")
```

**Step 4 — Export:** Download the slides from the NotebookLM web interface (not available via API).

## Tutorial: Quick reference card

For power users who prefer minimal prompts:

| If you want this | Say this to Claude |
|-----------------|-------------------|
| Check everything works | "Run nlm_doctor and pipeline_liveness" |
| Quick research | "Research topic X and create slides" |
| Add a paper | "Add arXiv 2401.00001 to my safety notebook" |
| Compare sources | "What do my sources disagree on?" |
| Generate podcast | "Create a deep dive audio for my notebook" |
| Organize | "Tag my notebook as fleet:review" |
| Link to repo | "Link notebook to repo arxiv-mcp" |
| Daily briefing | "Research latest LLM safety news into my tracker" |
| Fix auth | "nlm_doctor says not authenticated" |
| Get a summary | "Summarize my notebook in 3 bullets" |

## Tutorial: Quick tool reference by use case

When you need to accomplish a specific goal, here is the exact tool to call:

| Use case | Tool | Key parameters |
|----------|------|----------------|
| List existing notebooks | `notebook_list` | (none) |
| Create empty notebook | `notebook_create` | `title` |
| Add a web article | `source_add_url` | `notebook_id`, `url`, `wait` |
| Add your own notes | `source_add_text` | `notebook_id`, `text`, `title` |
| Ask about sources | `notebook_query` | `notebook_id`, `question` |
| Generate podcast | `audio_create` | `notebook_id`, `format`, `length` |
| Generate slides | `slides_create` | `notebook_id`, `format`, `length` |
| Fix a slide | `slides_revise` | `artifact_id`, `slide_instruction` |
| Discover sources | `research_start` | `query`, `mode`, `source` |
| Tag a notebook | `tag_add` | `notebook_id`, `tags` |
| Ingest an arXiv paper | `fleet_ingest_arxiv` | `notebook_id`, `paper_id` |
| Full pipeline | `fleet_pipeline_research` | `title`, `query` |
| Check health | `nlm_doctor` | (none) |
| Check fleet health | `pipeline_liveness` | (none) |

## Tutorial: Using the Apps Hub for fleet discovery

The Apps page (http://127.0.0.1:10784/apps) displays other fleet webapps discovered via the fleet registry. Each card shows the app name, description, and a link to its dashboard.

This page reads from the fleet registry at `mcp-central-docs/operations/fleet-registry.json`. If an app is running, you can click its card to open its dashboard in a new tab. This is useful for discovering what other fleet servers are available and navigating between them without remembering port numbers.

The fleet registry is configured via `NOTEBOOKLM_FLEET_MCP_FLEET_REGISTRY_PATH` environment variable.

## Tutorial: Creating a fleet event pipeline

**Goal:** Automatically notify fleet-agent-mcp when a research pipeline completes.

**Prerequisites:** fleet-agent-mcp running on port 10946.

**Setup:**
1. Ensure `AIWATCHER_MCP_BASE=http://127.0.0.1:10946` is set in the environment
2. Run a fleet pipeline with a repo_id:
```
fleet_pipeline_research(
    title="Monitored Research",
    query="Topic of interest",
    repo_id="my-tracked-repo"
)
```
3. fleet-agent-mcp receives a `pipeline_complete` event with the repo_id and timestamp
4. Check pipeline_liveness() to see the event was sent

This creates a feedback loop where completed research is visible to the fleet monitoring system.

## Tutorial: Working with the Floating Chat LLM

The dashboard includes a floating chat bubble (bottom-right) that connects to local LLMs via the `/api/llm/providers` and `/api/llm/chat` endpoints:

1. **Auto-discovery:** On mount, the chat probes Ollama (port 11434) and LM Studio (port 1234)
2. **Model selection:** A dropdown lets you pick any discovered model
3. **Chat:** Type a question and press Enter or click Go
4. **Contextual help:** The chat is useful for asking questions about your current research without switching tools

The LLM proxy endpoints are integrated into the main backend at port 10783, so no separate server needs to be started.

## Advanced: Using environment profiles

For different usage scenarios, create `.env` files with different configurations:

**Research workstation (full stack):**
```
NOTEBOOKLM_FLEET_MCP_PORT=10783
NOTEBOOKLM_FLEET_MCP_NLM_PATH=C:\Users\sandr\.local\bin\nlm.exe
NOTEBOOKLM_FLEET_MCP_QUERY_TIMEOUT_SECONDS=300
```

**Headless server (backend only):**
```
NOTEBOOKLM_FLEET_MCP_PORT=10783
NOTEBOOKLM_FLEET_MCP_NLM_PATH=C:\tools\nlm.exe
NOTEBOOKLM_FLEET_MCP_DATA_DIR=D:\research\data
NOTEBOOKLM_FLEET_MCP_FLEET_REGISTRY_PATH=
```

**CI/CD pipeline:**
```
NOTEBOOKLM_FLEET_MCP_PORT=10783
NOTEBOOKLM_FLEET_MCP_QUERY_TIMEOUT_SECONDS=60
NOTEBOOKLM_FLEET_MCP_ARXIV_MCP_BASE=http://arxiv-mcp:10770
```

Load a profile by copying it to `.env` in the repo root before running `start.ps1`.

## Tutorial: Using MCP over HTTP from scripts

The streamable HTTP transport at `/mcp` follows the MCP JSON-RPC protocol. Call any tool via HTTP POST:

```powershell
# List all tools
$body = '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
Invoke-RestMethod -Uri http://127.0.0.1:10783/mcp -Method Post -Body $body -ContentType "application/json"

# Call notebook_list
$body = '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"notebook_list","arguments":{}}}'
Invoke-RestMethod -Uri http://127.0.0.1:10783/mcp -Method Post -Body $body -ContentType "application/json"

# Call notebook_query
$body = '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"notebook_query","arguments":{"notebook_id":"<id>","question":"Summarize"}}}'
Invoke-RestMethod -Uri http://127.0.0.1:10783/mcp -Method Post -Body $body -ContentType "application/json"
```

## Advanced: Performance tuning

Several factors affect tool performance:

**Network latency:** All `nlm` calls go through the Google NotebookLM API. Response times depend on network quality. On a 100 Mbps connection, expect 2-5s baseline latency. On slower connections, increase `QUERY_TIMEOUT_SECONDS`.

**Source complexity:** A simple text source processes in seconds. A 50-page PDF with embedded images can take 30-60s. A URL with heavy JavaScript rendering may timeout. Use `wait=False` for complex sources and poll with `source_list`.

**Research depth:** `mode="fast"` returns within 30s but finds fewer sources. `mode="deep"` takes 2-5 minutes but finds higher-quality, more diverse sources and ingests them automatically. For literature surveys, always use `mode="deep"`.

**Concurrent requests:** The server uses asynchronous Python (`asyncio`) but the `nlm` subprocess is synchronous per call. Multiple concurrent MCP requests will queue behind the running subprocess. For batch operations, serialize `wait=True` calls.

**GPU acceleration:** The server does not directly use GPU. NotebookLM's AI features (audio generation, slide creation, grounded Q&A) run on Google's infrastructure, not locally. The local LLM chat proxy (Ollama/LM Studio) can use your RTX 4090.

## Advanced: Logging and debugging

The server logs to stderr with configurable verbosity:

**Normal mode:** `start.ps1` — shows INFO level: startup messages, tool calls, errors.

**Debug mode:** `start.ps1 -Verbose` or `uv run python -m notebooklm_fleet_mcp --serve --debug` — shows DEBUG level: subprocess stdout/stderr, HTTP request details, timing information.

**Log files:** In Tauri mode, logs are written to `%LOCALAPPDATA%\com.sandraschi.notebooklm-fleet-mcp\backend-spawn.log`.

**Common debug commands:**

```powershell
# Test nlm directly
nlm doctor

# Test server health
curl.exe http://127.0.0.1:10783/api/health

# Test tool discovery via HTTP
$body = '{"jsonrpc":"2.0","method":"tools/list","id":1}'
Invoke-RestMethod http://127.0.0.1:10783/mcp -Method Post -Body $body -ContentType "application/json"
```

## Advanced: WSL and cross-platform considerations

The server is designed for Windows (the `nlm` CLI and fleet scripts assume Windows paths). For WSL or Linux:

1. Use stdio mode (not HTTP mode — no systemd or supervisor)
2. Ensure `nlm` is on PATH
3. Set `FLEET_REGISTRY_PATH` to a valid path or empty string
4. Start with: `uv run python -m notebooklm_fleet_mcp --stdio`
5. The glass dashboard (web_sota/) requires Node.js and Vite — not available on WSL without additional setup


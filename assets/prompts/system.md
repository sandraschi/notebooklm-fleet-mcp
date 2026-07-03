# notebooklm-fleet-mcp — system instructions for Claude Desktop

You are assisting with **notebooklm-fleet-mcp**, a FastMCP 3.2 fleet orchestration wrapper for Google NotebookLM. All Google API work is delegated to **notebooklm-mcp-cli** via the `nlm` subprocess. This server adds fleet orchestration: arXiv ingest, repo tagging, glass dashboard, supervisor liveness, and research pipelines. It operates on backend port **10783** (REST + `/mcp`) and frontend port **10784** (glass dashboard).

## Architecture

The server acts as a thin orchestration layer. Every tool that touches NotebookLM data goes through `nlm_client.py`, which wraps `nlm <subcommand>` as an async subprocess. Fleet-specific tools (arXiv ingest, pipeline research, liveness) operate either through `nlm` or through direct HTTP calls to other fleet servers (arxiv-mcp, fleet-agent-mcp). The server exposes three surfaces:

- **MCP over stdio** — Claude Desktop, Cursor, any MCP client via `--stdio`
- **MCP over HTTP** — any MCP client at `POST http://127.0.0.1:10783/mcp`
- **REST API** — webapp dashboard at `http://127.0.0.1:10784` (proxies to port 10783)

## Prerequisites and auth

Before any mutating tool works, the user must have:

1. **notebooklm-mcp-cli installed**: `uv tool install notebooklm-mcp-cli`
2. **Authenticated with Google**: `nlm login` (opens browser for OAuth, one-time)
3. **nlm on PATH**: typically `%USERPROFILE%\.local\bin\nlm.exe`

Always start work by running `nlm_doctor` to confirm auth status. If auth fails, do not retry mutating tools — guide the user to run `nlm login` in a terminal.

## Tool reference

### Notebook operations (5 tools)

| Tool | Signature | When to use |
|------|-----------|-------------|
| `notebook_list` | `async notebook_list() -> dict` | Discover existing notebooks before creating or querying |
| `notebook_create` | `async notebook_create(title: str) -> dict` | Start a new research notebook; returns notebook_id |
| `notebook_query` | `async notebook_query(notebook_id, question) -> dict` | Grounded Q&A over notebook sources. Returns answer with citations from ingested sources |
| `source_list` | `async source_list(notebook_id) -> dict` | Audit what URLs, text, or PDFs are already ingested |
| `source_add_url` | `async source_add_url(notebook_id, url, wait=False) -> dict` | Add web/PDF/arXiv abs URL. With `wait=True`, blocks until NotebookLM finishes processing |
| `source_add_text` | `async source_add_text(notebook_id, text, title="Fleet ingest") -> dict` | Paste markdown, notes, or raw text as a source |

Key pattern: `notebook_create` returns a `notebook_id` string. You must capture this and pass it to subsequent source/query/studio tools. The notebook_id is opaque (about 24 hex chars).

### Studio operations (4 tools)

Studio tools produce artifacts (audio overviews, slide decks) from notebook sources. These are NotebookLM's Generative AI features.

| Tool | Signature | Notes |
|------|-----------|-------|
| `studio_status` | `async studio_status(notebook_id) -> dict` | Lists all artifacts. Returns artifact_ids needed for revise operations |
| `audio_create` | `async audio_create(notebook_id, format="deep_dive", length="default") -> dict` | Generates AI podcast. Formats: deep_dive (two-host conversation), brief (summary), critique (critical analysis), debate (multi-perspective). Length: short, default, long |
| `slides_create` | `async slides_create(notebook_id, format="detailed_deck", length="default") -> dict` | Generates slide deck. Formats: detailed_deck (content-heavy), presenter_slides (speaker notes). Length: short, default |
| `slides_revise` | `async slides_revise(artifact_id, slide_instruction) -> dict` | Refines an existing slide artifact. Instruction format: `"1 Make the title larger"` or `"3 Add a diagram reference"`. Get artifact_id from studio_status |

Audio and slide generation can take 30-120 seconds. The `nlm` subprocess streams progress to stderr. Set user expectations for wait time.

### Research (1 tool)

| Tool | Signature | Notes |
|------|-----------|-------|
| `research_start` | `async research_start(query, notebook_id="", mode="fast", source="web") -> dict` | Lets NotebookLM discover sources autonomously. Mode: fast (quick web scan, ~15s) or deep (thorough research, ~2-5 min). Source: web (public URLs) or drive (Google Drive files). When notebook_id is empty, creates a temporary notebook |

Research is NotebookLM's most powerful feature — it searches the web, finds relevant sources, and ingests them automatically. Use `mode="deep"` for literature surveys or unfamiliar topics.

### Tags (2 tools)

| Tool | Signature | Notes |
|------|-----------|-------|
| `tag_list` | `async tag_list() -> dict` | Returns all tags across notebooks. Fleet tags use prefix `fleet:{repo_id}` |
| `tag_add` | `async tag_add(notebook_id, tags) -> dict` | Adds comma-separated tags. Multiple tags: `"fleet,review,urgent"`. Tags survive notebook operations |

Tagging is the primary mechanism for fleet registry linkage. The `fleet_link_repo` tool (see Fleet section) is a convenience wrapper for `tag_add`.

### Fleet layer (4 tools)

| Tool | Signature | Notes |
|------|-----------|-------|
| `fleet_ingest_arxiv` | `async fleet_ingest_arxiv(notebook_id, paper_id, wait=True, tag="") -> dict` | Constructs arxiv.org abs URL and ingests as source. Optional tag applied post-ingest |
| `fleet_ingest_url` | `async fleet_ingest_url(notebook_id, url, tag="", wait=False) -> dict` | Generic URL ingest with optional fleet tag |
| `fleet_link_repo` | `async fleet_link_repo(notebook_id, repo_id) -> dict` | Writes tag `fleet:{repo_id}` for cross-repo discovery |
| `fleet_pipeline_research` | `async fleet_pipeline_research(title, query, mode="fast", create_slides=False, repo_id="") -> dict` | One-shot: creates notebook, runs research, optionally generates slides and tags repo |

The `fleet_pipeline_research` tool is the most complex single tool. It chains: notebook_create → research_start → (optional) slides_create → (optional) fleet_link_repo. All in one call. Use this for Sandra's standard "research a topic and store it" workflow.

### Health and help (4 tools)

| Tool | Signature | Notes |
|------|-----------|-------|
| `nlm_doctor` | `async nlm_doctor() -> dict` | Runs `nlm doctor`. Returns installation status, auth state, and environment info |
| `pipeline_liveness` | `async pipeline_liveness() -> dict` | Supervisor probe. Checks: auth status, nlm CLI presence, stale pipelines, fleet upstream connectivity |
| `notebooklm_fleet_help` | `notebooklm_fleet_help() -> dict` | Quick overview of fleet vs upstream role |
| `notebooklm_help_topics` | `notebooklm_help_topics() -> list` | Lists available inline help topics |
| `notebooklm_help` | `notebooklm_help(topic="index") -> str` | Returns markdown help for a topic |

The liveness probe is the first thing to call when resuming a session. It reveals auth state, upstream version, and any fleet-visible alert conditions.

## Decision tree

When the user asks about NotebookLM, follow this priority:

1. **"Check if it works"** → `nlm_doctor()` then `pipeline_liveness()`
2. **"Show my notebooks"** → `notebook_list()`
3. **"Research a topic"** → `fleet_pipeline_research()` (one-shot) or `notebook_create()` → `research_start()`
4. **"Add a paper"** → `fleet_ingest_arxiv()` to an existing notebook
5. **"Ask questions about sources"** → `notebook_query()` after ingesting
6. **"Generate output"** → `audio_create()` or `slides_create()` then `slides_revise()`
7. **"Tag or organize"** → `tag_add()` or `fleet_link_repo()`

## Response handling

Tools return `dict[str, Any]` with this shape:

```json
{"success": true, "data": {...}}    // On success via fleet wrappers
{"success": false, "error": "...", "stderr": "..."}  // On subprocess failure
```

Raw `nlm` responses are proxied verbatim when the upstream CLI returns JSON. If the upstream call fails, the error includes `stderr` from the subprocess for debugging.

Long operations (`wait=true` on ingest, `research_start`, `audio_create`, `slides_create`) may take 30-120 seconds. The underlying `nlm` process blocks until completion. Set user expectations accordingly. If the tool times out (default 180s), retry with a shorter wait or poll `source_list`/`studio_status` to check progress.

## Streamable HTTP transport

The server runs in HTTP mode via `--serve` flag (default for the dashboard stack). MCP clients connect at:

```
POST http://127.0.0.1:10783/mcp
Content-Type: application/json
```

The `/mcp` endpoint follows the FastMCP streamable HTTP protocol. Health check at `GET /api/health`. All REST endpoints under `/api/` are documented via OpenAPI at `GET /docs` or `GET /openapi.json`.

## Environment variables

All settings use the prefix `NOTEBOOKLM_FLEET_MCP_`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `HOST` | `127.0.0.1` | Bind address |
| `PORT` | `10783` | Backend listen port |
| `NLM_PATH` | `""` (use PATH) | Path to nlm binary |
| `DATA_DIR` | `data/notebooklm_fleet_mcp/` | Pipeline state, caches |
| `FLEET_REGISTRY_PATH` | `D:/Dev/repos/mcp-central-docs/operations/fleet-registry.json` | Fleet hub path for discovery |
| `ARXIV_MCP_BASE` | `http://127.0.0.1:10770` | Upstream arxiv-mcp for ingest |
| `AIWATCHER_MCP_BASE` | `http://127.0.0.1:10946` | Upstream aiwatcher for fleet events |
| `QUERY_TIMEOUT_SECONDS` | `180.0` | Max wait for nlm subprocess |

## Skills

Bundled skill: `skill://notebooklm-fleet` — workflow guide on how to use notebooklm-fleet-mcp effectively. Available as an MCP resource. Discover via `resources/list`, read via `resources/read`.

## Coexistence with upstream MCP

The user may also have the direct upstream **`notebooklm-mcp`** server installed. Use fleet tools when you need:
- Research pipelines (create + research + slides in one call)
- arXiv ingest with automatic tagging
- Supervisor liveness and fleet event push
- Dashboard visibility via REST API

Use the upstream `notebooklm-mcp` only if the fleet server is offline.

## Ports

- Backend 10783 — REST API + MCP streamable HTTP at `/mcp`
- Frontend 10784 — glass React dashboard
- Fleet registry: `mcp-central-docs/operations/WEBAPP_PORTS.md`

## Fleet integration

- **arxiv-mcp** (10770) — `fleet_ingest_arxiv` constructs abs URLs and delegates source addition
- **fleet-agent-mcp** (10996) — `pipeline_liveness` can POST fleet events when upstream is configured
- **mcp-central-docs** — fleet registry for repo linkage and discovery

## Recommended chains

1. **Literature notebook:** `fleet_pipeline_research(title="Survey", query="topic", mode="deep")` → `notebook_query(notebook_id, "Summarize")` → `slides_create(notebook_id)`
2. **arXiv paper deep-dive:** `fleet_ingest_arxiv(notebook_id, "2401.00001")` → `source_list(notebook_id)` → `audio_create(notebook_id, format="deep_dive")`
3. **Repo-linked research:** `fleet_pipeline_research(title="...", query="...", repo_id="my-repo", create_slides=True)`
4. **Debug auth:** `nlm_doctor()` → `pipeline_liveness()` → user runs `nlm login`
5. **Batch web ingest:** `notebook_create()` → `fleet_ingest_url(nb, url1)` → `fleet_ingest_url(nb, url2)` → `notebook_query(nb, "cross-source analysis")`

## Security

All Google NotebookLM data is accessed through authenticated subprocess calls. The server does not store Google credentials — OAuth tokens are managed by `nlm` in the user's browser session. Fleet registry paths assume a local Windows environment under `D:\Dev\repos\`. No external network calls are made except to:
- arxiv.org (via arxiv-mcp for abs URL construction)
- Google NotebookLM (via nlm subprocess)
- Optional: fleet-agent-mcp for liveness event push

## Error handling patterns

Every tool has an error recovery path. The most common failure modes:

| Failure | Symptom | Recovery |
|---------|---------|----------|
| Not authenticated | `nlm_doctor` returns `authenticated: false` | User runs `nlm login` |
| nlm not found | Subprocess error: `FileNotFoundError` | Install with `uv tool install notebooklm-mcp-cli`; ensure PATH includes `%USERPROFILE%\.local\bin` |
| Notebook not found | `notebook_query` or `source_list` returns error with "not found" | Run `notebook_list` to discover valid IDs |
| Source processing timeout | `source_add_url(wait=True)` hangs | Set `wait=False` and poll `source_list` until the source appears |
| Studio generation timeout | `audio_create` or `slides_create` hangs | Check `studio_status` for partial artifacts; retry with shorter settings |
| Pipeline partially fails | `fleet_pipeline_research` reports notebook created but research failed | Use `notebook_query` to see what was ingested; re-run research separately |
| Port conflict (HTTP mode) | Server fails to bind | Free port with `Stop-FleetPortSquatters` from the launcher scripts |
| Fleet upstream unreachable | Pipeline liveness shows arxiv-mcp or aiwatcher as unhealthy | Non-fatal — fleet-specific tools degrade gracefully |

## Parallelism and rate limiting

The `nlm` subprocess runs synchronously per call. Calling multiple tools concurrently will spawn multiple `nlm` processes. This is generally safe for read operations (list, query, status) but mutating operations (create, ingest, research, studio) should be serialized to avoid Google-side rate limits. NotebookLM does not document specific rate limits, but empirically:
- Up to 3 concurrent reads: fine
- More than 1 concurrent create/research: may return 429 or timeout
- Studio generation is single-threaded per notebook

## Modes of operation

The server runs in two modes:

**stdio mode** (`--stdio`): For Claude Desktop and MCP clients that spawn subprocesses. Communication over stdin/stdout. No HTTP port needed. Use this for MCP-focused workflows without the dashboard.

**HTTP mode** (`--serve`): For the full dashboard experience. Starts uvicorn on the configured port. FastMCP HTTP at `/mcp`, REST API at `/api/*`, OpenAPI docs at `/docs`. Use this when the user wants the glass UI at port 10784.

The entry point `__main__.py` auto-detects `MCP_TRANSPORT` environment variable:
- `MCP_TRANSPORT=http` or `MCP_TRANSPORT=streamable` → HTTP mode
- `--serve` flag → HTTP mode
- `--stdio` flag → stdio mode
- Neither → stdio mode (default)

## Fleet event push

When `fleet_pipeline_research` completes successfully and a `repo_id` is provided, the server can push a fleet event to `aiwatcher-mcp` at `POST /api/fleet/ingest`. This requires:
- `AIWATCHER_MCP_BASE` configured (default `http://127.0.0.1:10946`)
- aiwatcher-mcp server running
- The event includes: `event_type: "pipeline_complete"`, `repo_id`, `timestamp`, `tool_calls` summary

This is an optional integration — pipeline research works without aiwatcher.

## Internal architecture

```
server.py ──► FastMCP(instructions=...) ──► @mcp.tool() registrations (22 tools)
    │
    ├── nlm_client.py ──► async subprocess ──► nlm (notebooklm-mcp-cli)
    │       │
    │       ├── notebook_list / create / query
    │       ├── source_list / add_url / add_text
    │       ├── studio_status / audio_create / slides_create / slides_revise
    │       ├── research_start / tag_list / tag_add
    │       └── doctor_text / nlm_version
    │
    ├── fleet_pipelines.py ──► arxiv_abs_url + nlm_client
    │       │
    │       ├── fleet_ingest_arxiv ──► source_add_url(abs_url)
    │       ├── fleet_ingest_url ──► source_add_url(url) + optional tag_add
    │       ├── fleet_link_repo ──► tag_add("fleet:{repo_id}")
    │       └── fleet_pipeline_research ──► create + research + slides + tag
    │
    ├── pipeline_liveness_service.py ──► nlm + arxiv_mcp + aiwatcher health
    │
    ├── help_content.py ──► static markdown topics
    │
    ├── app.py ──► FastAPI(router + CORS + lifespan)
    │       │
    │       ├── GET /api/health
    │       ├── GET /api/v1/diagnostics
    │       ├── GET /api/llm/providers
    │       ├── POST /api/llm/chat
    │       └── mount mcp_http at /mcp
    │
    ├── config.py ──► Pydantic Settings (env_prefix NOTEBOOKLM_FLEET_MCP_)
    │
    ├── capabilities.py ──► tool capability discovery
    │
    ├── tools_manifest.py ──► statically declared tool list
    │
    └── startup_probe.py ──► shallow connectivity checks on boot
```

The `/mcp` ASGI mount is produced via `mcp.http_app(path="/mcp")` which creates a Starlette ASGI app wrapping the FastMCP server with streamable HTTP transport. CORS is applied at the FastAPI level before the mount.

## CLI reference

The `nlm` upstream CLI supports these subcommands. All output is JSON which the fleet wrapper parses and returns.

| nlm subcommand | Fleet MCP tool | Description |
|----------------|----------------|-------------|
| `nlm list` | `notebook_list` | List all notebooks |
| `nlm create <title>` | `notebook_create` | Create a new notebook |
| `nlm query <id> <question>` | `notebook_query` | Grounded Q&A with citations |
| `nlm sources <id>` | `source_list` | List sources in notebook |
| `nlm source-url <id> <url>` | `source_add_url` | Add URL as source |
| `nlm source-text <id>` | `source_add_text` | Add text as source |
| `nlm studio <id>` | `studio_status` | List studio artifacts |
| `nlm audio <id>` | `audio_create` | Generate audio overview |
| `nlm slides <id>` | `slides_create` | Generate slide deck |
| `nlm revise <aid> <instr>` | `slides_revise` | Revise a slide artifact |
| `nlm research <query>` | `research_start` | Start research discovery |
| `nlm tags` | `tag_list` | List all tags |
| `nlm tag <id> <tags>` | `tag_add` | Add tags to notebook |
| `nlm doctor` | `nlm_doctor` | Auth and installation diagnostics |

## Tauri native wrapper

The repo includes a Tauri 2.0 NSIS native wrapper at `native/`. When built, it bundles the PyInstaller-frozen Python backend and serves the React webapp in a WebView2 window. The Rust shell spawns `notebooklm-fleet-mcp-backend.exe` as a hidden child process with `NOTEBOOKLM_FLEET_MCP_TAURI=1` for CORS relaxation. The frontend listens for `backend-status` Tauri events showing live connection state, and supports Ctrl+Scroll wheel zoom with localStorage persistence.

Build locally:
```powershell
just build-native
just cua-nsis-test
```

The NSIS installer is a single `.exe` containing the Rust shell, React dist, and embedded Python backend. No Python, Node, or uv required on the target machine. The installer also bundles `.env.example` for first-run configuration.

## MCPB distribution

For Claude Desktop, ship as `.mcpb`:
```powershell
uv sync
just mcpb-pack
```

Output: `dist/notebooklm-fleet-mcp-v0.1.0.mcpb`

The bundle includes `manifest.json` (v0.2), `src/` source, `assets/icon.png`, `assets/prompts/`, `README.md`, and `CHANGELOG.md`. Excluded via `.mcpbignore`: `.venv`, `node_modules`, `web_sota/`, `glama.json`, `llms.txt`, `llms-full.txt`, `tests/`, `docs/`, `justfile`. The MCPB does NOT include the upstream `nlm` CLI.

## Session context injection

The repo ships `.cursorrules` for session-start tool awareness in Cursor and compatible IDEs. The fleet starts launcher at `mcp-central-docs/starts/notebooklm-start.bat` provides one-click launch from the Fleet Starts UI (port 10791).

## Version compatibility

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Python | 3.11 | 3.13 |
| FastMCP | 3.2.0 | 3.4.2+ |
| notebooklm-mcp-cli | 1.0.0 | latest |
| Tauri (native build) | 2.0 | 2.x |
| uv | 0.4 | 0.5+ |

## Glossary

| Term | Definition |
|------|------------|
| NotebookLM | Google's AI-powered notebook and research tool with grounded Q&A |
| nlm | CLI client for NotebookLM (`notebooklm-mcp-cli`). All fleet tools delegate to this |
| Fleet pipeline | A composed workflow (create notebook → research → slides → tag) executed as a single MCP call |
| fleet: tag | A tag prefixed with `fleet:` used for cross-repo discovery (e.g. `fleet:arxiv-mcp`) |
| Pipeline liveness | A supervisor probe checking auth, CLI presence, and upstream fleet connectivity |
| Studio | NotebookLM's generative AI feature producing audio overviews, slide decks, and reports |
| Grounded Q&A | NotebookLM's ability to answer questions based only on ingested sources with citations |
| Depot | Local cache of ingested paper content (not directly exposed — use through tools) |
| Glass dashboard | React webapp at port 10784 for visual management |
| MCPB | Anthropic's bundle format for Claude Desktop distribution |
| Streamable HTTP | FastMCP transport mode where the server listens on an HTTP port for MCP JSON-RPC |

## Quick start (one-liner)

```python
# Check health then create a research notebook with slides
pipeline_liveness()  # verify everything is working
fleet_pipeline_research(title="Quick Test", query="MCP server architecture", create_slides=True)
```

## Performance characteristics

Operation times vary significantly by workload:

| Operation | Typical time | Notes |
|-----------|-------------|-------|
| notebook_list | < 2s | Fast — just a REST call to NotebookLM |
| notebook_create | 2-5s | Creates a new notebook server-side |
| source_add_url(url, wait=True) | 5-30s | Depends on URL content length |
| source_add_url(url, wait=False) | < 2s | Queues the source, returns immediately |
| source_add_text | < 2s | Text processing is near-instant |
| notebook_query | 5-20s | Depends on source quantity and question complexity |
| research_start(mode="fast") | 10-30s | Searches web, evaluates, ingests |
| research_start(mode="deep") | 2-5 min | Thorough research — set user expectations |
| audio_create | 30-120s | Audio generation is compute-intensive |
| slides_create | 15-60s | Slide deck generation |
| slides_revise | 10-30s | Regenerates affected slides |
| fleet_pipeline_research | 2-6 min | Full chain: create + research + optional slides |

The `QUERY_TIMEOUT_SECONDS` setting (default 180s) caps the maximum wait for any single `nlm` subprocess call. Increase for deep research on slow connections.


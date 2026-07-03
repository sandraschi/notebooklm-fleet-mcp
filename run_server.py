"""PyInstaller entry point — dual transport (stdio / HTTP).

Detects MCP_PORT (set by Tauri Rust spawner) and switches modes.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

port = os.environ.get("MCP_PORT") or os.environ.get("NOTEBOOKLM_FLEET_MCP_PORT") or os.environ.get("PORT")
if port:
    host = os.environ.get("MCP_HOST", "127.0.0.1")
    tauri_flag = os.environ.get("NOTEBOOKLM_FLEET_MCP_TAURI", "").lower() in ("1", "true", "yes")
    sys.argv = ["run_server.py", "--serve", "--host", host, "--port", str(port)]
    if tauri_flag:
        os.environ["NOTEBOOKLM_FLEET_MCP_TAURI"] = "1"

from notebooklm_fleet_mcp.__main__ import main
main()
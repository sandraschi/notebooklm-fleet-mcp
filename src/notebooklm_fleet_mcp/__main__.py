"""CLI entry: stdio MCP or HTTP server."""

from __future__ import annotations

import argparse
import asyncio
import logging
import os
import sys

import uvicorn

from notebooklm_fleet_mcp.config import load_settings
from notebooklm_fleet_mcp.server import mcp


def _configure_logging(*, debug: bool) -> None:
    level = logging.DEBUG if debug else logging.INFO
    logging.basicConfig(level=level, format="%(message)s", stream=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(description="notebooklm-fleet-mcp (FastMCP 3.2)")
    parser.add_argument("--serve", action="store_true", help="Run HTTP server with MCP at /mcp")
    parser.add_argument("--stdio", action="store_true", help="Run MCP over stdio")
    parser.add_argument("--debug", action="store_true", help="Verbose stderr logs")
    args = parser.parse_args()
    _configure_logging(debug=args.debug)

    transport = os.getenv("MCP_TRANSPORT", "").lower()
    use_http = args.serve or transport in {"http", "streamable"}
    if use_http and args.stdio:
        parser.error("Choose either --serve or --stdio")

    settings = load_settings()
    if use_http:
        uvicorn.run(
            "notebooklm_fleet_mcp.app:app",
            host=settings.host,
            port=settings.port,
            log_level="debug" if args.debug else "info",
        )
        return

    asyncio.run(mcp.run_stdio_async(show_banner=False))


if __name__ == "__main__":
    main()

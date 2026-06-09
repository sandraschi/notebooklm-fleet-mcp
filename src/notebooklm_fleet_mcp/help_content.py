"""Help topics served at /api/help."""

from pathlib import Path

_DOCS = Path(__file__).resolve().parent.parent.parent / "docs"

TOPICS: dict[str, str] = {
    "index": "README.md",
    "configuration": "CONFIGURATION.md",
    "development": "DEVELOPMENT.md",
    "webapp": "WEBAPP.md",
    "troubleshooting": "TROUBLESHOOTING.md",
    "architecture": "ARCHITECTURE.md",
    "fleet": "FLEET_INTEGRATION.md",
    "tools": "TOOLS.md",
    "cursor": "CURSOR-MCP.md",
}


def list_help_topics() -> list[dict[str, str]]:
    return [{"id": key, "file": rel} for key, rel in TOPICS.items()]


def get_help_topic(topic: str) -> str | None:
    rel = TOPICS.get(topic)
    if not rel:
        return None
    path = _DOCS / rel
    if path.is_file():
        return path.read_text(encoding="utf-8")
    return f"# {topic}\n\nDocumentation file not found: {rel}\n"

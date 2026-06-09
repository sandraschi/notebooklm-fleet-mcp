"""Runtime settings."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="NOTEBOOKLM_FLEET_MCP_",
        env_file=".env",
        extra="ignore",
    )

    host: str = "127.0.0.1"
    port: int = 10783
    nlm_path: str = ""
    data_dir: Path | None = None
    fleet_registry_path: Path = Path("D:/Dev/repos/mcp-central-docs/operations/fleet-registry.json")
    arxiv_mcp_base: str = "http://127.0.0.1:10770"
    aiwatcher_mcp_base: str = "http://127.0.0.1:10946"
    query_timeout_seconds: float = 180.0

    def resolved_nlm(self) -> str:
        if self.nlm_path:
            return self.nlm_path
        return "nlm"

    def resolved_data_dir(self) -> Path:
        base = self.data_dir or (Path.cwd() / "data" / "notebooklm_fleet_mcp")
        base.mkdir(parents=True, exist_ok=True)
        return base


def load_settings() -> Settings:
    return Settings()

from fastapi.testclient import TestClient

from notebooklm_fleet_mcp.app import build_app


def test_health():
    client = TestClient(build_app())
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["service"] == "notebooklm-fleet-mcp"

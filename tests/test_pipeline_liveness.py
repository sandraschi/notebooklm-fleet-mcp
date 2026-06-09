import pytest

from notebooklm_fleet_mcp.pipeline_liveness_service import build_pipeline_liveness


@pytest.mark.asyncio
async def test_pipeline_liveness_shape():
    data = await build_pipeline_liveness()
    assert "healthy" in data
    assert "checks" in data
    assert data["service"] == "notebooklm-fleet-mcp"

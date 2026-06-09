from notebooklm_fleet_mcp.fleet_pipelines import arxiv_abs_url


def test_arxiv_abs_url():
    assert arxiv_abs_url("2401.12345") == "https://arxiv.org/abs/2401.12345"
    assert arxiv_abs_url("arXiv:2401.12345") == "https://arxiv.org/abs/2401.12345"

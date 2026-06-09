"""Static MCP tool manifest for dashboard."""

MCP_TOOLS: list[dict[str, str]] = [
    {"name": "notebooklm_fleet_help", "description": "Package overview and upstream delegation model"},
    {"name": "notebook_list", "description": "List NotebookLM notebooks via nlm"},
    {"name": "notebook_create", "description": "Create a notebook"},
    {"name": "notebook_query", "description": "Grounded Q&A against notebook sources"},
    {"name": "source_list", "description": "List sources in a notebook"},
    {"name": "source_add_url", "description": "Add URL source to notebook"},
    {"name": "source_add_text", "description": "Add text source to notebook"},
    {"name": "studio_status", "description": "List studio artifacts and job status"},
    {"name": "audio_create", "description": "Generate audio overview"},
    {"name": "slides_create", "description": "Generate slide deck"},
    {"name": "slides_revise", "description": "Revise slide deck artifact"},
    {"name": "research_start", "description": "Start web/drive research for sources"},
    {"name": "tag_list", "description": "List tagged notebooks"},
    {"name": "tag_add", "description": "Tag notebook for fleet organization"},
    {"name": "fleet_ingest_arxiv", "description": "Add arXiv paper URL as notebook source"},
    {"name": "fleet_ingest_url", "description": "Add any URL with optional fleet-repo tag"},
    {"name": "fleet_link_repo", "description": "Tag notebook with fleet-registry repo id"},
    {"name": "fleet_pipeline_research", "description": "Create notebook, research, optional slides"},
    {"name": "nlm_doctor", "description": "Run nlm doctor diagnostics"},
    {"name": "pipeline_liveness", "description": "Supervisor health probe"},
]

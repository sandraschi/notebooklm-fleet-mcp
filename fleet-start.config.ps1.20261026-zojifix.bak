# Per-repo fleet start config for notebooklm-fleet-mcp
# Edit ports/backend target here - start.ps1 is fleet-standard.
@{
    Name         = 'notebooklm-fleet-mcp'
    BackendPort  = 10783
    FrontendPort = 10784
    HealthPath   = '/health'
    WebRoot      = 'web_sota'
    Backend = @{
        Kind = 'none'
    }
    Frontend = @{
        Kind = 'none'
    }
}

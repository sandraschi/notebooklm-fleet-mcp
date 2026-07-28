# Per-repo fleet start config for notebooklm-fleet-mcp
# Edit ports/backend target here - start.ps1 is fleet-standard.
@{
    Name         = 'notebooklm-fleet-mcp'
    BackendPort  = 0
    FrontendPort = 0
    HealthPath   = '/health'
    WebRoot      = 'D:\Dev\repos\notebooklm-fleet-mcp\web_sota'
    Backend = @{
        Kind = 'none'
    }
    Frontend = @{
        Kind = 'none'
    }
}

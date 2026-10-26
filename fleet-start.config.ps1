# Per-repo fleet start config for notebooklm-fleet-mcp
# Edit ports/backend target here - start.ps1 is fleet-standard.
@{
    Name         = 'notebooklm-fleet-mcp'
    BackendPort  = 10783
    FrontendPort = 10784
    HealthPath   = '/api/health'
    WebRoot      = 'web_sota'
    Backend = @{
        Kind          = 'uvicorn'
        UvicornTarget = 'notebooklm_fleet_mcp.app:app'
        SyncExtras    = @('dev')
        SyncOnStart   = $true
        Env           = @{ WEB_PORT = '10783' }
    }
    Frontend = @{
        Kind           = 'vite-npm'
        PackageManager = 'npm'
    }
}

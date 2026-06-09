param([string]$Client = "print")

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ManifestPath = Join-Path $RepoRoot "manifest.json"
$mf = Get-Content $ManifestPath -Raw | ConvertFrom-Json
$Name = $mf.name
$Args = $mf.server.mcp_config.args

$Entry = @{
    command = "C:\Users\sandr\.local\bin\uv.exe"
    args = @("--directory", $RepoRoot) + $Args
}
if ($mf.server.mcp_config.env.PSObject.Properties.Name) {
    $envTable = @{}
    $mf.server.mcp_config.env.PSObject.Properties | ForEach-Object { $envTable[$_.Name] = $_.Value }
    $Entry["env"] = $envTable
}

$Paths = @{
    cursor      = @{ Path = "$env:USERPROFILE\.cursor\mcp.json"; Key = "mcpServers" }
    gemini      = @{ Path = "$env:USERPROFILE\.gemini\config\mcp_config.json"; Key = "mcpServers" }
    antigravity = @{ Path = "$env:USERPROFILE\.gemini\antigravity\mcp_config.json"; Key = "mcpServers" }
    claude      = @{ Path = "$env:APPDATA\Claude\claude_desktop_config.json"; Key = "mcpServers" }
}

switch -Wildcard ($Client) {
    "print" { ($Entry | ConvertTo-Json -Depth 4) }
    default {
        $c = $Paths[$Client]
        if (-not $c) { Write-Host "Unknown client: $Client"; exit 1 }
        $cfgDir = Split-Path -Parent $c.Path
        if (-not (Test-Path $cfgDir)) { New-Item -ItemType Directory -Path $cfgDir -Force | Out-Null }
        $existing = @{}
        if (Test-Path $c.Path) { $existing = Get-Content $c.Path -Raw | ConvertFrom-Json -AsHashtable }
        if (-not $existing.ContainsKey($c.Key)) { $existing[$c.Key] = @{} }
        $existing[$c.Key][$Name] = $Entry
        $existing | ConvertTo-Json -Depth 10 | Set-Content $c.Path
        Write-Host "Installed $Name into $($c.Path)" -ForegroundColor Green
    }
}

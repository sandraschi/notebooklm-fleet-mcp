param(
    [switch]$Headless,
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [switch]$NoBrowser
)

$RepoRoot = Split-Path -Parent $PSScriptRoot
$FleetStartPath = Join-Path $RepoRoot "scripts\FleetStartMode.ps1"
if (-not (Test-Path -LiteralPath $FleetStartPath)) {
    Write-Host "ERROR: Missing vendored launcher helper: $FleetStartPath" -ForegroundColor Red
    exit 1
}
. $FleetStartPath
$FleetStart = Initialize-FleetStartMode @PSBoundParameters
Enter-FleetHeadlessConsole -Headless:$Headless -BackendOnly:$BackendOnly
$WindowStyle = $FleetStart.WindowStyle
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("PATH","User")

$BackendPort  = 10783
$FrontendPort = 10784
$ApiHealth    = "http://127.0.0.1:$BackendPort/api/health"
$WebRoot      = $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    $nodeDir = "C:\Program Files\nodejs"
    if (Test-Path "$nodeDir\node.exe") {
        $env:PATH = "$nodeDir;" + $env:PATH
    } else {
        Write-Host "ERROR: node not found. Install Node.js LTS from https://nodejs.org/" -ForegroundColor Red
        exit 1
    }
}

$uvExe = "C:\Users\sandr\.local\bin\uv.exe"
if (-not (Test-Path $uvExe)) {
    $uvCmd = Get-Command uv -ErrorAction SilentlyContinue
    $uvExe = if ($uvCmd) { $uvCmd.Source } else { $null }
    if (-not $uvExe) {
        Write-Host "ERROR: uv not found." -ForegroundColor Red
        exit 1
    }
}
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmCmd) { Write-Host "ERROR: npm not found." -ForegroundColor Red; exit 1 }
$npmExe = if ($npmCmd.Source -match '\.ps1$') { $npmCmd.Source -replace '\.ps1$', '.cmd' } else { $npmCmd.Source }

$LASTEXITCODE = 0
Write-Host "Syncing Python deps (uv sync) ..." -ForegroundColor Cyan
& $uvExe sync --project $RepoRoot --extra dev
if ($LASTEXITCODE -ne 0) { Write-Host "ERROR: uv sync failed." -ForegroundColor Red; exit 1 }

if ($FleetStart.RunFrontend) {
    if (-not (Test-Path (Join-Path $WebRoot "node_modules"))) {
        Write-Host "Installing frontend deps (npm install) ..." -ForegroundColor Cyan
        Push-Location $WebRoot
        & $npmExe install --prefer-offline 2>&1
        if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
        Pop-Location
    }
}

Stop-FleetPortSquatters -Ports @($BackendPort, $FrontendPort) -Label "notebooklm-fleet-mcp"
if (-not (Assert-FleetPortsAvailable -Ports @($BackendPort, $FrontendPort) -Label "notebooklm-fleet-mcp")) { exit 1 }

Start-Sleep -Milliseconds 500

$backendProc = $null
if ($FleetStart.RunBackend) {
    Write-Host "Starting notebooklm-fleet-mcp backend on :$BackendPort ..." -ForegroundColor Cyan
    $backendArgs = if ($env:FLEET_PROBE_RUN -eq '1') {
        @("-NoProfile", "-Command", "& '$uvExe' run --project '$RepoRoot' python -m notebooklm_fleet_mcp --serve")
    } else {
        @("-NoProfile", "-NoExit", "-Command", "& '$uvExe' run --project '$RepoRoot' python -m notebooklm_fleet_mcp --serve")
    }
    $backendProc = Start-FleetDetachedShell -Label "backend" -Exe "powershell.exe" `
        -Args $backendArgs -WorkingDirectory $RepoRoot -WindowStyle $WindowStyle

    $waited = 0
    $ok = $false
    while ($waited -lt 60) {
        try {
            $r = Invoke-WebRequest -Uri $ApiHealth -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($r.StatusCode -eq 200) { $ok = $true; break }
        } catch {}
        Start-Sleep -Seconds 1
        $waited++
    }
    if (-not $ok) { Write-Host "WARN: backend health not ready after ${waited}s." -ForegroundColor Yellow }
    Write-Host "Backend   $ApiHealth" -ForegroundColor Green
}

if ($FleetStart.RunFrontend) {
    Write-Host "Starting Vite on :$FrontendPort ..." -ForegroundColor Cyan
    $null = Start-FleetDetachedShell -Label "frontend" -Exe "cmd.exe" `
        -Args @("/c", "npm run dev") -WorkingDirectory $WebRoot -WindowStyle $WindowStyle

    if (-not $FleetStart.SkipBrowser -and $env:FLEET_PROBE_RUN -ne '1') {
        $frontendUrl = "http://127.0.0.1:$FrontendPort/"
        $pollAndOpen = "for (`$i=0;`$i -lt 60;`$i++) { try { `$null=Invoke-WebRequest -Uri '$frontendUrl' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; Start-Process '$frontendUrl'; exit } catch { Start-Sleep 1 } }"
        Start-Process powershell.exe -ArgumentList "-NoProfile","-WindowStyle","Hidden","-Command",$pollAndOpen
    }
    Write-Host "Frontend  http://127.0.0.1:$FrontendPort" -ForegroundColor Green
}

if ($BackendOnly -and $null -ne $backendProc) {
    Write-Host "Backend-only mode." -ForegroundColor DarkGray
}

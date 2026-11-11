<#
.SYNOPSIS
    MORS Full-Stack Local Launcher (Docker, Supabase, Next.js Web)
#>

$ErrorActionPreference = "Stop"
$RepoDir = "C:\Users\mukes\OneDrive\Desktop\MORS"
Set-Location $RepoDir

Write-Host "====================================================" -ForegroundColor Green
Write-Host "             MORS - Social Food Journal            " -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Green

# 1. Ensure Docker is in PATH
$DockerBin = "C:\Users\mukes\AppData\Local\Programs\DockerDesktop\resources\bin"
if (Test-Path $DockerBin) {
    if ($env:Path -notlike "*$DockerBin*") {
        $env:Path = "$DockerBin;$env:Path"
    }
}

# 2. Check Docker Daemon
Write-Host "[1/4] Checking Docker status..." -ForegroundColor Cyan
$dockerRunning = $false
try {
    $res = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
    }
} catch {
    $dockerRunning = $false
}

if (-not $dockerRunning) {
    Write-Host "Docker daemon is not running. Starting Docker Desktop..." -ForegroundColor Yellow
    $DockerApp = "C:\Users\mukes\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe"
    if (Test-Path $DockerApp) {
        Start-Process $DockerApp
        Write-Host "Waiting for Docker daemon to become responsive..." -ForegroundColor Cyan
        $retries = 0
        while (-not $dockerRunning -and $retries -lt 30) {
            Start-Sleep -Seconds 2
            $retries++
            try {
                $res = docker info 2>&1
                if ($LASTEXITCODE -eq 0) { $dockerRunning = $true }
            } catch {}
            Write-Host -NoNewline "."
        }
        Write-Host ""
    }
}

if (-not $dockerRunning) {
    Write-Host "ERROR: Could not communicate with Docker. Please ensure Docker Desktop is running." -ForegroundColor Red
    pause
    exit 1
}
Write-Host "Docker is operational." -ForegroundColor Green

# 3. Check Supabase Stack
Write-Host "[2/4] Verifying Supabase containers..." -ForegroundColor Cyan
$supabaseRunning = (docker ps --format "{{.Names}}" | Select-String "supabase_db_MORS")
if (-not $supabaseRunning) {
    Write-Host "Starting Supabase local stack..." -ForegroundColor Yellow
    npx supabase start
} else {
    Write-Host "Supabase local stack is already running." -ForegroundColor Green
}

# 4. Check Web App Dev Server
Write-Host "[3/4] Checking MORS Web server on port 3000..." -ForegroundColor Cyan
$webConn = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if (-not $webConn) {
    Write-Host "Starting MORS Web dev server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RepoDir'; npx pnpm --filter web dev" -WindowStyle Normal
    Start-Sleep -Seconds 4
} else {
    Write-Host "MORS Web dev server is already running on http://localhost:3000." -ForegroundColor Green
}

# 5. Open Browser
Write-Host "[4/4] Opening MORS in your browser..." -ForegroundColor Cyan
Start-Process "http://localhost:3000"

Write-Host "====================================================" -ForegroundColor Green
Write-Host "  MORS is Ready!                                    " -ForegroundColor Green
Write-Host "  Web App:         http://localhost:3000            " -ForegroundColor White
Write-Host "  Supabase Studio: http://localhost:54323           " -ForegroundColor White
Write-Host "  Local Mailpit:   http://localhost:54324           " -ForegroundColor White
Write-Host "----------------------------------------------------" -ForegroundColor Gray
Write-Host "  Beta Invite Code: HYDERABAD-BETA-2026             " -ForegroundColor Yellow
Write-Host "  Test Login:       owner_public@mors.food          " -ForegroundColor Yellow
Write-Host "  Password:         MorsTastePassword2026!          " -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Green

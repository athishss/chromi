# Chromi Platform - Start Script
# Just right-click → "Run with PowerShell" or run: .\start.ps1

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host "         CHROMI PLATFORM LAUNCHER         " -ForegroundColor Cyan
Write-Host "  ========================================" -ForegroundColor Cyan
Write-Host ""

# ── Kill any existing processes on ports 3001 and 5173 ──
Write-Host "  [1/4] Cleaning up old processes..." -ForegroundColor Yellow
$port3001 = netstat -ano 2>$null | Select-String ":3001\s" | Select-String "LISTENING"
if ($port3001) {
    $pid3001 = ($port3001 -split '\s+')[-1]
    try { Stop-Process -Id $pid3001 -Force -ErrorAction SilentlyContinue } catch {}
    Write-Host "        Killed old backend on port 3001" -ForegroundColor DarkGray
}
$port5173 = netstat -ano 2>$null | Select-String ":5173\s" | Select-String "LISTENING"
if ($port5173) {
    $pid5173 = ($port5173 -split '\s+')[-1]
    try { Stop-Process -Id $pid5173 -Force -ErrorAction SilentlyContinue } catch {}
    Write-Host "        Killed old frontend on port 5173" -ForegroundColor DarkGray
}
Start-Sleep -Seconds 1

# ── Start Backend Server ──
Write-Host "  [2/4] Starting backend API server..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PSScriptRoot\server
    node src/index.js 2>&1
}
Start-Sleep -Seconds 3

# Verify backend is running
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "        Backend is LIVE on port 3001" -ForegroundColor Green
} catch {
    Write-Host "        WARNING: Backend may not have started. Check for errors." -ForegroundColor Red
    Receive-Job $backendJob 2>&1 | Write-Host -ForegroundColor Red
}

# ── Start Frontend Dev Server ──
Write-Host "  [3/4] Starting frontend dev server..." -ForegroundColor Yellow
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PSScriptRoot\buildify-reactjs
    npm run dev 2>&1
}
Start-Sleep -Seconds 4

# ── Open browser ──
Write-Host "  [4/4] Opening browser..." -ForegroundColor Yellow
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "  ========================================" -ForegroundColor Green
Write-Host "       CHROMI IS RUNNING!                 " -ForegroundColor Green
Write-Host "  ========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend  →  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend   →  http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "  Press Ctrl+C to stop everything." -ForegroundColor DarkGray
Write-Host ""

# ── Keep alive and stream logs ──
try {
    while ($true) {
        # Stream any new backend output
        $output = Receive-Job $backendJob 2>&1
        if ($output) { $output | ForEach-Object { Write-Host "  [API] $_" -ForegroundColor DarkCyan } }

        # Stream any new frontend output  
        $output = Receive-Job $frontendJob 2>&1
        if ($output) { $output | ForEach-Object { Write-Host "  [WEB] $_" -ForegroundColor DarkMagenta } }

        Start-Sleep -Seconds 2
    }
} finally {
    # Cleanup on Ctrl+C
    Write-Host "`n  Shutting down..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $frontendJob -ErrorAction SilentlyContinue

    # Kill the actual node/npm processes on those ports
    $port3001 = netstat -ano 2>$null | Select-String ":3001\s" | Select-String "LISTENING"
    if ($port3001) { $pid3001 = ($port3001 -split '\s+')[-1]; Stop-Process -Id $pid3001 -Force -ErrorAction SilentlyContinue }
    $port5173 = netstat -ano 2>$null | Select-String ":5173\s" | Select-String "LISTENING"
    if ($port5173) { $pid5173 = ($port5173 -split '\s+')[-1]; Stop-Process -Id $pid5173 -Force -ErrorAction SilentlyContinue }

    Write-Host "  Chromi stopped. Goodbye!" -ForegroundColor Cyan
}

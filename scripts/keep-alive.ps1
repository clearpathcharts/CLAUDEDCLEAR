# Keep ClearPath healthy while founder rests.
# Usage: powershell -ExecutionPolicy Bypass -File scripts\keep-alive.ps1

$ErrorActionPreference = 'Continue'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
$log = Join-Path $root 'data\keep-alive.log'
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null

function Write-Log([string]$msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format 's'), $msg
  Add-Content -Path $log -Value $line
  Write-Host $line
}

function Test-Health {
  try {
    $r = curl.exe -s --max-time 5 http://localhost:3000/api/health
    if ($r -match '"status"\s*:\s*"healthy"') { return $true }
  } catch {}
  return $false
}

function Start-App {
  Write-Log 'Starting npm run dev...'
  Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -WorkingDirectory $root -WindowStyle Hidden
  Start-Sleep -Seconds 12
}

Write-Log 'Keep-alive started.'
if (-not (Test-Health)) { Start-App }

while ($true) {
  if (Test-Health) {
    Write-Log 'OK healthy'
  } else {
    Write-Log 'UNHEALTHY — restarting'
    Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue |
      ForEach-Object { try { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } catch {} }
    Start-Sleep -Seconds 2
    Start-App
  }
  Start-Sleep -Seconds 180
}

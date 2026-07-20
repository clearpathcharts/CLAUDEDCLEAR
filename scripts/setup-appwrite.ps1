# ClearPath Appwrite one-shot setup (run when awake — needs browser login)
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\setup-appwrite.ps1

$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "=== ClearPath Appwrite setup ===" -ForegroundColor Cyan
Write-Host "1) Browser login (required once)"
npx --yes appwrite-cli login

Write-Host "2) Ensure appwrite.config.json projectId is set (not YOUR_PROJECT_ID)"
$configPath = Join-Path (Get-Location) 'appwrite.config.json'
$config = Get-Content $configPath -Raw | ConvertFrom-Json
if (-not $config.projectId -or $config.projectId -eq 'YOUR_PROJECT_ID') {
  Write-Host "Open https://cloud.appwrite.io , create project 'clearpath-trader', then paste IDs:" -ForegroundColor Yellow
  $pid = Read-Host 'VITE_APPWRITE_PROJECT_ID'
  $endpoint = Read-Host 'VITE_APPWRITE_ENDPOINT (e.g. https://nyc.cloud.appwrite.io/v1)'
  if (-not $pid) { throw 'Project ID required' }
  if (-not $endpoint) { $endpoint = 'https://cloud.appwrite.io/v1' }
  $config.projectId = $pid
  $config.endpoint = $endpoint
  ($config | ConvertTo-Json -Depth 40) | Set-Content $configPath -Encoding utf8

  $envPath = Join-Path (Get-Location) '.env'
  if (-not (Test-Path $envPath)) { Copy-Item '.env.example' $envPath }
  $envText = Get-Content $envPath -Raw
  $envText = $envText -replace '(?m)^VITE_APPWRITE_PROJECT_ID=.*$', "VITE_APPWRITE_PROJECT_ID=$pid"
  $envText = $envText -replace '(?m)^VITE_APPWRITE_ENDPOINT=.*$', "VITE_APPWRITE_ENDPOINT=$endpoint"
  if ($envText -notmatch '(?m)^VITE_APPWRITE_PROJECT_ID=') { $envText += "`nVITE_APPWRITE_PROJECT_ID=$pid`n" }
  if ($envText -notmatch '(?m)^VITE_APPWRITE_ENDPOINT=') { $envText += "`nVITE_APPWRITE_ENDPOINT=$endpoint`n" }
  [System.IO.File]::WriteAllText($envPath, $envText)
}

Write-Host "3) Push TablesDB schema (clearpath / waitlist)"
npx --yes appwrite-cli push tables --all --force

Write-Host "Done. Restart: npm.cmd run dev" -ForegroundColor Green
Write-Host "Waitlist will prefer Appwrite; API/Firestore remains fallback."

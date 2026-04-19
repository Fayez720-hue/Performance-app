# Cloudflare Pages Deployment Orchestrator
# Handles asset mapping and _worker.js setup

Write-Host "Building for Cloudflare..." -ForegroundColor Cyan
$env:STATIC_BUILD="false"
npm run build:cf

Write-Host "Mapping Assets and Preparing Worker..." -ForegroundColor Cyan
# 1. Map assets to root (Safely)
if (Test-Path ".open-next/assets") {
    Copy-Item -Path ".open-next/assets/*" -Destination ".open-next/" -Recurse -Force
} else {
    Write-Host "Warning: .open-next/assets not found. Skipping asset mapping." -ForegroundColor Yellow
}

# 2. Find and Prepare Worker for Pages
$workerSource = Get-ChildItem -Path ".open-next" -Filter "worker.js" -Recurse | Select-Object -First 1 -ExpandProperty FullName
if ($null -eq $workerSource) {
    Write-Host "Searching for alternative worker entry points..." -ForegroundColor Yellow
    $workerSource = Get-ChildItem -Path ".open-next" -Filter "*.mjs" -Recurse | Where-Object { $_.Name -match "handler|worker|index" } | Select-Object -First 1 -ExpandProperty FullName
}

if ($workerSource) {
    Write-Host "Found worker at: $workerSource" -ForegroundColor Gray
    Copy-Item -Path "$workerSource" -Destination ".open-next/_worker.js" -Force
} else {
    Write-Host "Warning: Could not locate worker bundle in .open-next. Using default build if available." -ForegroundColor Yellow
}

# 3. Restore routes config
if (Test-Path "_routes.json") {
    Copy-Item -Path "_routes.json" -Destination ".open-next/_routes.json" -Force
}

Write-Host "Deploying to Cloudflare Pages..." -ForegroundColor Green
npx wrangler pages deploy .open-next --project-name=performance-app --branch=main

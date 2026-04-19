# Android APK Build Orchestrator
# Handles the temporary removal of "force-dynamic" for static export.

Write-Host "Starting Android APK Build Flow..." -ForegroundColor Cyan

# 1. Strip force-dynamic from layout for static export
(Get-Content app/layout.tsx) -replace 'export const dynamic = "force-dynamic"', '' | Set-Content app/layout.tsx

# 2. Prepare Auth Route for Static Export
(Get-Content app/api/auth/[...nextauth]/route.ts) -replace '/\* APK_BUILD_ONLY', '' -replace 'APK_BUILD_ONLY \*/', '' | Set-Content app/api/auth/[...nextauth]/route.ts

# 3. Execute Build
$env:STATIC_BUILD="true"
npm run build

# 4. Restore Auth Route
(Get-Content app/api/auth/[...nextauth]/route.ts) -replace 'export function generateStaticParams', '/* APK_BUILD_ONLY`nexport function generateStaticParams' -replace 'providers\] \}' , 'providers\] }`nAPK_BUILD_ONLY */' | Set-Content app/api/auth/[...nextauth]/route.ts

# 5. Restore layout
$layoutContent = Get-Content app/layout.tsx
if ($layoutContent -notmatch 'export const dynamic = "force-dynamic"') {
    $newContent = "export const dynamic = `"force-dynamic`"`n`n" + ($layoutContent -join "`n")
    Set-Content app/layout.tsx $newContent
}

Write-Host "APK Build Prepared. Syncing with Capacitor..." -ForegroundColor Green
npx cap copy android

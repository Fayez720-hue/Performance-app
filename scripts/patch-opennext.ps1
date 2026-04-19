# This script fixes the "Could not resolve @panva/hkdf" error on Windows
# by making the package structure easier for the OpenNext tracer to follow.

Write-Host "Pre-patching node_modules for Windows compatibility..."

$pkgs = @("@panva/hkdf", "jose", "openid-client")

foreach ($pkg in $pkgs) {
    $pkgPath = "node_modules/$pkg"
    if (Test-Path $pkgPath) {
        Write-Host "Patching $pkg..."
        # Copy everything from dist to root of the package so relative paths work better
        if (Test-Path "$pkgPath/dist") {
            Copy-Item -Path "$pkgPath/dist/*" -Destination "$pkgPath/" -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "Node modules patched."

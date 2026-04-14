const fs = require('fs');
const path = require('path');

const authRoutePath = path.join(__dirname, '..', 'app', 'api', 'auth', '[...nextauth]', 'route.ts');

function prepare() {
  let content = fs.readFileSync(authRoutePath, 'utf8');

  // 1. Change force-dynamic to force-static
  content = content.replace(/export const dynamic = "force-dynamic"/, 'export const dynamic = "force-static"');

  // 2. Uncomment APK_BUILD_ONLY block
  content = content.replace(/\/\* APK_BUILD_ONLY/g, '// APK_BUILD_ONLY_UNCOMMENTED');
  content = content.replace(/APK_BUILD_ONLY \*\//g, '// APK_BUILD_ONLY_UNCOMMENTED_END');

  fs.writeFileSync(authRoutePath, content);
  console.log('Prepared app/api/auth/[...nextauth]/route.ts for APK build.');
}

function restore() {
  let content = fs.readFileSync(authRoutePath, 'utf8');

  // 1. Change force-static back to force-dynamic
  content = content.replace(/export const dynamic = "force-static"/, 'export const dynamic = "force-dynamic"');

  // 2. Re-comment APK_BUILD_ONLY block
  content = content.replace(/\/\/ APK_BUILD_ONLY_UNCOMMENTED/, '/* APK_BUILD_ONLY');
  content = content.replace(/\/\/ APK_BUILD_ONLY_UNCOMMENTED_END/, 'APK_BUILD_ONLY */');

  fs.writeFileSync(authRoutePath, content);
  console.log('Restored app/api/auth/[...nextauth]/route.ts after APK build.');
}

const mode = process.argv[2];
if (mode === 'prepare') {
  prepare();
} else if (mode === 'restore') {
  restore();
} else {
  console.error('Usage: node prepare-apk-build.js [prepare|restore]');
  process.exit(1);
}

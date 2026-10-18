const path = require('node:path');
const { spawnSync } = require('node:child_process');

for (const filename of ['context.cjs', 'forms.cjs', 'pages.cjs', 'content.cjs', 'appearance.cjs', 'images.cjs', 'uploads.cjs']) {
  const result = spawnSync(process.execPath, [path.join(__dirname, filename)], { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exitCode = result.status || 1;
    break;
  }
}

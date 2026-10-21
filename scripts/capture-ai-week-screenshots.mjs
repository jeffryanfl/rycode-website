import fs from 'node:fs';
import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';

const OUT_DIR = '/opt/cursor/artifacts/screenshots';
const ROOT = '/workspace';
const PORT = 4322;
const HISTORY = `${ROOT}/public/ai-feed-history.json`;

function runBuild() {
  const r = spawnSync('npm', ['run', 'build'], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr || r.stdout);
}

async function withPreview(fn) {
  spawnSync('npx', ['astro', 'preview', 'stop'], { cwd: ROOT, stdio: 'ignore' });
  const preview = spawn('npm', ['run', 'preview', '--', '--port', String(PORT), '--host', '127.0.0.1', '--force'], {
    cwd: ROOT,
    stdio: 'ignore',
  });
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORT}/ai/`)).ok) break;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  try {
    await fn();
  } finally {
    preview.kill('SIGTERM');
  }
}

const backup = fs.readFileSync(HISTORY, 'utf8');

runBuild();
await withPreview(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`http://127.0.0.1:${PORT}/ai/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${OUT_DIR}/ai-week-news-desktop-1280.png` });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`http://127.0.0.1:${PORT}/ai/`, { waitUntil: 'networkidle' });
  await page.locator('#ai-week-news').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT_DIR}/ai-week-news-mobile-390.png` });
  await browser.close();
});

const empty = JSON.parse(backup);
empty.items = [];
fs.writeFileSync(HISTORY, `${JSON.stringify(empty, null, 2)}\n`);
runBuild();
await withPreview(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto(`http://127.0.0.1:${PORT}/ai/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${OUT_DIR}/ai-week-news-empty.png` });
  await browser.close();
});

fs.writeFileSync(HISTORY, backup);
runBuild();
console.log('screenshots saved to', OUT_DIR);

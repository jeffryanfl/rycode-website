import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';

const OUT_DIR = '/opt/cursor/artifacts/screenshots';
const PORT = 4322;

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORT}/ai/`)).ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('preview server did not start');
}

spawnSync('npx', ['astro', 'preview', 'stop'], { cwd: '/workspace', stdio: 'ignore' });
const preview = spawn('npm', ['run', 'preview', '--', '--port', String(PORT), '--host', '127.0.0.1', '--force'], {
  cwd: '/workspace',
  stdio: 'ignore',
});

try {
  await waitForServer();
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`http://127.0.0.1:${PORT}/ai/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${OUT_DIR}/ai-week-news-desktop-1280.png` });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`http://127.0.0.1:${PORT}/ai/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${OUT_DIR}/ai-week-news-mobile-390.png` });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`http://127.0.0.1:${PORT}/ai/`, { waitUntil: 'networkidle' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${OUT_DIR}/ai-week-news-paused-readable.png` });

  await browser.close();
} finally {
  preview.kill('SIGTERM');
}

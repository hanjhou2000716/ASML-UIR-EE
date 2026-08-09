import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = http.createServer(async (request, response) => {
  const requested = decodeURIComponent((request.url || '/').split('?')[0]);
  if (requested === '/axe.js') { response.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' }); response.end(await fs.readFile(path.join(root, 'node_modules/axe-core/axe.min.js'))); return; }
  const target = path.resolve(root, `.${requested === '/' ? '/index.html' : requested}`);
  if (!target.startsWith(root) || !(await fs.stat(target).catch(() => null))) { response.writeHead(404); response.end(); return; }
  response.writeHead(200, { 'content-type': mime[path.extname(target)] || 'application/octet-stream' });
  response.end(await fs.readFile(target));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
try {
  for (const width of [360, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle' });
    await page.addScriptTag({ url: `http://127.0.0.1:${port}/axe.js` });
    const result = await page.evaluate(async () => window.axe.run(document, { resultTypes: ['violations'] }));
    const severe = result.violations.filter(item => item.impact === 'critical' || item.impact === 'serious');
    assert.equal(severe.length, 0, `${width}px axe violations: ${severe.map(item => `${item.id} (${item.impact})`).join(', ')}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.closeAllConnections?.();
  await new Promise(resolve => server.close(resolve));
}
console.log('Axe accessibility smoke passed.');

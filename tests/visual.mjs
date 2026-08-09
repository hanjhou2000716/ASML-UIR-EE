import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, '.tmp-visual');
const manifest = JSON.parse(await fs.readFile(path.join(root, 'tests/visual-baselines.json'), 'utf8'));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = http.createServer(async (request, response) => {
  const requested = decodeURIComponent((request.url || '/').split('?')[0]);
  const relative = requested === '/' ? '/index.html' : requested;
  const target = path.resolve(root, `.${relative}`);
  if (!target.startsWith(root) || !(await fs.stat(target).catch(() => null))) { response.writeHead(404); response.end(); return; }
  response.writeHead(200, { 'content-type': mime[path.extname(target)] || 'application/octet-stream' });
  response.end(await fs.readFile(target));
});
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
const viewports = [{ name: '360', width: 360, height: 800 }, { name: '390', width: 390, height: 844 }, { name: '768', width: 768, height: 900 }, { name: '1024', width: 1024, height: 900 }, { name: '1440', width: 1440, height: 1000 }];
assert.deepEqual(viewports.map(viewport => Number(viewport.name)), manifest.viewports, 'visual viewport matrix matches baseline manifest');
try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#section-asml .qa-card');
    const idAudit = await page.evaluate(() => {
      const ids = Object.values(window.InterviewQuestionIds || {}).flatMap(company => Object.values(company).flat());
      const roleQuestions = Object.values(window.InterviewQuestionBanks || {}).flatMap(company => Object.entries(company).filter(([, value]) => Array.isArray(value)).flatMap(([category, entries]) => entries.map((_, index) => `${category}:${index}`)));
      return { unique: new Set(ids).size === ids.length, explicit: ids.every(id => !/supplement|unregistered/.test(id)), expected: roleQuestions.length, actual: ids.length };
    });
    assert.equal(idAudit.unique, true, `${viewport.name}px role question IDs are unique`);
    assert.equal(idAudit.explicit, true, `${viewport.name}px role question IDs are explicit`);
    assert.equal(idAudit.actual, idAudit.expected, `${viewport.name}px role question ID coverage matches registry`);
    const baseline = await page.evaluate(() => {
      const icons = [...document.querySelectorAll('.app-icon')];
      const tabs = [...document.querySelectorAll('.sub-tab-btn')];
      const rect = node => { const box = node.getBoundingClientRect(); return { width: box.width, height: box.height, top: box.top, bottom: box.bottom }; };
      return {
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        iconCount: icons.filter(icon => icon.offsetParent !== null && icon.getBoundingClientRect().width > 0).length,
        legacyIconCount: document.querySelectorAll('i.fas, i.far, i.fab').length,
        zeroSizedIcons: icons.filter(icon => { const box = icon.getBoundingClientRect(); return icon.offsetParent !== null && box.top < window.innerHeight && box.bottom > 0 && (box.width < 1 || box.height < 1); }).length,
        tabMinHeight: tabs.filter(tab => tab.offsetParent !== null).length ? Math.min(...tabs.filter(tab => tab.offsetParent !== null).map(tab => rect(tab).height)) : 0,
        tabRects: tabs.filter(tab => tab.offsetParent !== null).slice(0, 7).map(rect),
        stickyTop: document.querySelector('.section-nav')?.getBoundingClientRect().top ?? -1
      };
    });
    assert.equal(baseline.innerWidth, viewport.width, `${viewport.name}px viewport applied`);
    assert.ok(baseline.iconCount > 0, `${viewport.name}px has SVG icons`);
    assert.equal(baseline.legacyIconCount, 0, `${viewport.name}px has no runtime FontAwesome nodes`);
    assert.equal(baseline.zeroSizedIcons, 0, `${viewport.name}px has no zero-sized icons`);
    assert.ok(baseline.tabMinHeight >= 36, `${viewport.name}px category tabs retain touch height`);
    assert.ok(baseline.scrollWidth <= viewport.width, `${viewport.name}px has no horizontal overflow`);
    await page.screenshot({ path: path.join(output, `main-${viewport.name}.png`), fullPage: true });
    await page.locator('#comp-benq').click();
    await page.waitForSelector('#section-benq .sub-tab-btn');
    await page.screenshot({ path: path.join(output, `benq-${viewport.name}.png`), fullPage: true });
    const benq = await page.evaluate(() => ({ active: document.querySelector('#comp-benq')?.classList.contains('active'), icons: document.querySelectorAll('#section-benq .app-icon').length, overflow: document.documentElement.scrollWidth > window.innerWidth }));
    assert.equal(benq.active, true, `${viewport.name}px BenQ navigation works`);
    assert.ok(benq.icons > 0, `${viewport.name}px BenQ has SVG category icons`);
    assert.equal(benq.overflow, false, `${viewport.name}px BenQ has no overflow`);
    await page.locator('[data-practice-mode="random"]').click();
    await page.waitForSelector('#practice-session[role="dialog"]');
    await page.screenshot({ path: path.join(output, `practice-${viewport.name}.png`), fullPage: true });
    await page.keyboard.press('Escape');
    await page.locator('[data-action="toggle-archive"][aria-controls="archive-drawer"]').click();
    await page.waitForSelector('#archive-drawer:not(.hidden)');
    await page.screenshot({ path: path.join(output, `archive-${viewport.name}.png`), fullPage: true });
    await page.close();
  }
  const screenshots = await fs.readdir(output);
  for (const viewport of viewports) for (const state of manifest.states) assert.ok(screenshots.includes(`${state}-${viewport.name}.png`), `visual baseline capture exists: ${state}-${viewport.name}`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
console.log(`Chromium visual smoke passed; screenshots written to ${output}`);

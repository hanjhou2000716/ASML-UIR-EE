import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, '.tmp-visual');
const baselineOutput = path.join(root, 'tests', 'visual-baselines');
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
  const compareScreenshot = async (page, state, viewportName) => {
    const filename = `${state}-${viewportName}.png`;
    await page.evaluate(async () => {
      let previous = -1;
      for (let attempt = 0; attempt < 8; attempt += 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const current = document.documentElement.scrollHeight;
        if (current === previous) return;
        previous = current;
      }
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    const screenshot = await page.screenshot({ fullPage: false });
    const localPath = path.join(output, filename);
    await fs.writeFile(localPath, screenshot);
    const baselinePath = path.join(baselineOutput, filename);
    if (process.env.UPDATE_VISUAL_BASELINES === '1') {
      await fs.mkdir(baselineOutput, { recursive: true });
      await fs.writeFile(baselinePath, screenshot);
      return;
    }
    assert.ok(await fs.stat(baselinePath).catch(() => null), `visual baseline exists: ${filename}`);
    const actual = PNG.sync.read(screenshot);
    const expected = PNG.sync.read(await fs.readFile(baselinePath));
    assert.equal(actual.width, expected.width, `${filename} screenshot width matches baseline`);
    assert.equal(actual.height, expected.height, `${filename} screenshot height matches baseline`);
    let changed = 0;
    for (let index = 0; index < actual.data.length; index += 4) {
      const distance = Math.abs(actual.data[index] - expected.data[index]) + Math.abs(actual.data[index + 1] - expected.data[index + 1]) + Math.abs(actual.data[index + 2] - expected.data[index + 2]) + Math.abs(actual.data[index + 3] - expected.data[index + 3]);
      if (distance > 48) changed += 1;
    }
    const ratio = changed / (actual.width * actual.height);
    assert.ok(ratio <= 0.2, `${filename} pixel difference ${ratio.toFixed(3)} exceeds 0.2 threshold`);
  };
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#section-lam .qa-card');
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
      const visible = node => node.offsetParent !== null && getComputedStyle(node).visibility !== 'hidden';
      const primaryNavs = [...document.querySelectorAll('[data-primary-company-nav]')];
      const visiblePrimaryNavs = primaryNavs.filter(visible);
      const categoryStyles = tabs.filter(visible).map(tab => ({ radius: parseFloat(getComputedStyle(tab).borderTopLeftRadius), height: rect(tab).height, paddingLeft: parseFloat(getComputedStyle(tab).paddingLeft), icon: rect(tab.querySelector('.app-icon')).width }));
      return {
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        iconCount: icons.filter(icon => icon.offsetParent !== null && icon.getBoundingClientRect().width > 0).length,
        legacyIconCount: document.querySelectorAll('i.fas, i.far, i.fab').length,
        zeroSizedIcons: icons.filter(icon => { const box = icon.getBoundingClientRect(); return icon.offsetParent !== null && box.top < window.innerHeight && box.bottom > 0 && (box.width < 1 || box.height < 1); }).length,
        tabMinHeight: tabs.filter(tab => tab.offsetParent !== null).length ? Math.min(...tabs.filter(tab => tab.offsetParent !== null).map(tab => rect(tab).height)) : 0,
        tabRects: tabs.filter(tab => tab.offsetParent !== null).slice(0, 7).map(rect),
        stickyTop: document.querySelector('.section-nav')?.getBoundingClientRect().top ?? -1,
        primaryNavCount: primaryNavs.length,
        visiblePrimaryNavCount: visiblePrimaryNavs.length,
        categoryStyles
      };
    });
    assert.equal(baseline.innerWidth, viewport.width, `${viewport.name}px viewport applied`);
    assert.ok(baseline.iconCount > 0, `${viewport.name}px has SVG icons`);
    assert.equal(baseline.legacyIconCount, 0, `${viewport.name}px has no runtime FontAwesome nodes`);
    assert.equal(baseline.zeroSizedIcons, 0, `${viewport.name}px has no zero-sized icons`);
    assert.ok(baseline.tabMinHeight >= 36, `${viewport.name}px category tabs retain touch height`);
    assert.equal(baseline.primaryNavCount, 2, `${viewport.name}px has explicit mobile/desktop navigation contracts`);
    assert.equal(baseline.visiblePrimaryNavCount, 1, `${viewport.name}px exposes exactly one primary company navigation`);
    assert.ok(baseline.categoryStyles.every(style => style.radius >= 999 || style.radius >= 18), `${viewport.name}px category navigation uses pill geometry`);
    assert.ok(baseline.categoryStyles.every(style => style.paddingLeft >= 12 && style.icon >= 14), `${viewport.name}px category navigation has spacing and icon tokens`);
    assert.ok(baseline.scrollWidth <= viewport.width, `${viewport.name}px has no horizontal overflow`);
    const clickCompany = async company => {
      const headerTab = page.locator(`.company-tab[data-company="${company}"]`);
      if (await headerTab.isVisible()) await headerTab.click({ force: true });
      else await page.locator(`.company-nav-card[data-rail-company="${company}"]`).click({ force: true });
      await page.waitForFunction(id => document.querySelector(`#section-${id}`)?.classList.contains('block'), company);
    };
    await compareScreenshot(page, 'main', viewport.name);
    await page.locator('#workspace-insights').waitFor({ state: 'visible' });
    await compareScreenshot(page, 'analytics', viewport.name);
    await clickCompany('lam');
    await page.waitForSelector('#section-lam .sub-tab-btn');
    await compareScreenshot(page, 'lam', viewport.name);
    await clickCompany('asml');
    await page.waitForSelector('#section-asml .sub-tab-btn');
    await compareScreenshot(page, 'asml', viewport.name);
    await clickCompany('fstech');
    await page.waitForSelector('#section-fstech .sub-tab-btn');
    await compareScreenshot(page, 'fstech', viewport.name);
    await clickCompany('benq');
    await page.waitForSelector('#section-benq .sub-tab-btn');
    await compareScreenshot(page, 'benq', viewport.name);
    const benq = await page.evaluate(() => ({ active: document.querySelector('#comp-benq')?.classList.contains('active'), icons: document.querySelectorAll('#section-benq .app-icon').length, overflow: document.documentElement.scrollWidth > window.innerWidth }));
    assert.equal(benq.active, true, `${viewport.name}px BenQ navigation works`);
    assert.ok(benq.icons > 0, `${viewport.name}px BenQ has SVG category icons`);
    assert.equal(benq.overflow, false, `${viewport.name}px BenQ has no overflow`);
    const globalSearch = page.locator('#global-search');
    await globalSearch.fill('SPC');
    await page.waitForSelector('#global-search-results:not([hidden]) .global-search-result');
    await compareScreenshot(page, 'search', viewport.name);
    await globalSearch.fill('zzzz-no-match');
    await page.waitForSelector('#global-search-results:not([hidden]) .global-search-empty');
    await compareScreenshot(page, 'empty-search', viewport.name);
    await globalSearch.fill('');
    const masteredCard = page.locator('#section-benq .qa-card:visible').first();
    await masteredCard.locator('[data-action="toggle-card"]').click();
    await masteredCard.locator('[data-action="mastered"]').click();
    await compareScreenshot(page, 'mastered', viewport.name);
    await page.locator('[data-practice-mode="random"]').click();
    await page.waitForSelector('#practice-session[role="dialog"]');
    await compareScreenshot(page, 'practice', viewport.name);
    await page.keyboard.press('Escape');
    await page.locator('[data-action="toggle-archive"][aria-controls="archive-drawer"]').click();
    await page.waitForSelector('#archive-drawer:not(.hidden)');
    await compareScreenshot(page, 'archive', viewport.name);
    await page.locator('#archive-drawer [data-company="assembly"]').click();
    await page.waitForSelector('#section-assembly .sub-tab-btn');
    await compareScreenshot(page, 'archive-assembly', viewport.name);
    await clickCompany('benq');
    await page.waitForSelector('#section-benq .sub-tab-btn');
    await page.close();
  }
  const screenshots = await fs.readdir(output);
  for (const viewport of viewports) for (const state of manifest.states) assert.ok(screenshots.includes(`${state}-${viewport.name}.png`), `visual baseline capture exists: ${state}-${viewport.name}`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
console.log(`Chromium visual smoke passed; screenshots written to ${output}`);

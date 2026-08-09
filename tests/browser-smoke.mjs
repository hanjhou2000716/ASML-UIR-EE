import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import assert from 'node:assert/strict';

const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', error => { if (!/Could not load link/.test(error.message)) console.error(error.message); });
const dom = await JSDOM.fromFile(fileURLToPath(new URL('../index.html', import.meta.url)), { runScripts: 'dangerously', resources: 'usable', virtualConsole });
await new Promise(resolve => dom.window.addEventListener('load', () => setTimeout(resolve, 250), { once: true }));
const { document } = dom.window;
assert.ok(document.querySelector('#workspace-rail'), 'workspace rail mounted');
assert.ok(document.querySelector('#workspace-context'), 'workspace context mounted');
for (const id of ['asml', 'micron', 'swancor', 'skyeuv']) assert.ok(document.querySelectorAll(`#section-${id} .qa-card`).length > 0, `${id} questions rendered`);
assert.equal(document.querySelectorAll('[onclick],[oninput]').length, 0, 'no inline handlers');
const ids = [...document.querySelectorAll('.qa-card[data-question-id]')].map(card => card.dataset.questionId);
assert.equal(ids.length, new Set(ids).size, 'runtime question IDs unique');
assert.equal(dom.window.InterviewState?.state.schemaVersion, 2);
dom.window.close();
console.log('Browser smoke passed.');

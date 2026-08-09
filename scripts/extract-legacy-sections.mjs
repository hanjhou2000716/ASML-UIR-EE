import fs from 'node:fs';

const file = new URL('../index.html', import.meta.url);
let html = fs.readFileSync(file, 'utf8');
const ids = ['asml', 'micron', 'swancor', 'skyeuv'];
const sections = {};
for (const id of ids) {
  const start = html.indexOf(`        <div id="section-${id}"`);
  if (start < 0) throw new Error(`Missing section ${id}`);
  const end = html.indexOf('        <div id="section-', start + 10);
  const stop = end < 0 ? html.indexOf('\n    </main>', start) : end;
  sections[id] = html.slice(start, stop);
  const className = id === 'asml' ? 'company-section block' : 'company-section hidden';
  html = html.slice(0, start) + `        <div id="section-${id}" class="${className}"></div>\n` + html.slice(stop);
}
fs.writeFileSync(file, html);
const output = `window.LegacySections = ${JSON.stringify(sections)};\nObject.entries(window.LegacySections).forEach(([id, markup]) => { const target = document.getElementById('section-' + id); if (target) target.outerHTML = markup; });\n`;
fs.writeFileSync(new URL('../js/legacy-sections.js', import.meta.url), output);

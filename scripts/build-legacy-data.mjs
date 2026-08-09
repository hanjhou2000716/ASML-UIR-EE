import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

if (fs.existsSync(new URL('../js/legacy-data.js', import.meta.url))) {
  console.log('legacy-data.js is the canonical source; skipping one-time migration rebuild.');
  process.exit(0);
}

const legacySource = fs.readFileSync(new URL('../js/legacy-sections.js', import.meta.url), 'utf8');
const context = { window: {}, document: { getElementById: () => ({ set outerHTML(_) {} }) } };
vm.runInNewContext(legacySource, context);
const sections = context.window.LegacySections;
const digest = value => Math.abs(Array.from(value).reduce((hash, ch) => ((hash << 5) - hash + ch.charCodeAt(0)) | 0, 0)).toString(36);
const companies = {};
for (const [companyId, markup] of Object.entries(sections)) {
  const document = new JSDOM(markup).window.document;
  const tabs = [...document.querySelectorAll('.sub-tab-btn')];
  const categories = [...document.querySelectorAll('.sub-content')].map((content, index) => {
    const categoryId = content.id.replace(`content-${companyId}-`, '');
    const tab = tabs[index];
    const label = tab?.textContent?.replace(/\s+/g, ' ').trim() || categoryId;
    const intro = [...content.children].filter(node => !node.classList.contains('qa-card') && !node.classList.contains('study-toolbar')).map(node => node.outerHTML).join('');
    const questions = [...content.querySelectorAll('.qa-card')].map((card, questionIndex) => {
      const button = card.querySelector(':scope > button');
      const question = button?.textContent?.replace(/\s+/g, ' ').trim() || `Question ${questionIndex + 1}`;
      const answer = card.querySelector('.accordion-inner')?.innerHTML?.trim() || '';
      const priority = card.querySelector('.tag')?.textContent?.includes('必考') ? 'must' : card.querySelector('.tag')?.textContent?.includes('高頻') ? 'high' : 'standard';
      const language = /[A-Za-z]/.test(question) && !/[\u4e00-\u9fff]/.test(question) ? 'en' : 'zh-TW';
      return { id: `${companyId}.${categoryId}.${digest(question)}`, question, answerHtml: answer, tip: '', priority, language, tags: [] };
    });
    return { id: categoryId, label, icon: tab?.querySelector('i')?.className || '', description: '', introHtml: intro, questions };
  });
  companies[companyId] = { id: companyId, name: companyId, shortName: companyId, status: ['micron', 'swancor', 'skyeuv'].includes(companyId) ? 'archived' : 'active', role: '', eyebrow: '', title: '', summary: '', accent: 'navy', categories };
}
const output = `window.LegacyQuestionData = ${JSON.stringify({ schemaVersion: 1, companies })};\n`;
fs.writeFileSync(new URL('../js/legacy-data.js', import.meta.url), output);
const renderer = `(function () {
  const data = window.LegacyQuestionData?.companies || {};
  const escapeHtml = value => String(value).replace(/[&<>\"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[ch]));
  const renderCompany = companyId => {
    const company = data[companyId];
    const section = document.getElementById('section-' + companyId);
    if (!section) return;
    const nav = company.categories.map((category, index) => '<button data-action="switch-subtab" data-company="' + companyId + '" data-category="' + category.id + '" id="tab-' + companyId + '-' + category.id + '" role="tab" class="btn-press sub-tab-btn ' + companyId + '-theme ' + (index === 0 ? 'active' : '') + '" aria-controls="content-' + companyId + '-' + category.id + '" aria-selected="' + (index === 0 ? 'true' : 'false') + '">' + escapeHtml(category.label) + '</button>').join('');
    const contents = company.categories.map((category, index) => '<div id="content-' + companyId + '-' + category.id + '" class="sub-content ' + (index === 0 ? 'block' : 'hidden') + ' space-y-3">' + category.introHtml + category.questions.map(question => '<article class="qa-card bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" data-question-id="' + question.id + '"><button data-action="toggle-card" class="btn-press w-full p-4 text-left flex justify-between gap-3 items-center" aria-expanded="false"><span class="font-bold text-[14px] text-slate-700"><span class="tag tag-' + question.priority + '">' + question.priority.toUpperCase() + '</span><br>' + escapeHtml(question.question) + '</span><i class="fas fa-chevron-down text-slate-400"></i></button><div class="accordion-wrapper"><div class="accordion-inner"><div class="px-4 pb-4 text-[13px] text-slate-600 border-t pt-3 leading-relaxed">' + question.answerHtml + '</div></div></div></article>').join('') + '</div>').join('');
    section.innerHTML = '<nav class="section-nav flex overflow-x-auto hide-scrollbar pb-4 gap-2" role="tablist" aria-label="' + escapeHtml(company.name) + '">' + nav + '</nav>' + contents;
    section.dataset.rendered = 'true';
  };
  window.renderLegacyCompany = renderCompany;
  renderCompany('asml');
})();
`;
fs.writeFileSync(new URL('../js/legacy-sections.js', import.meta.url), renderer);
console.log(`Built structured legacy data: ${Object.keys(companies).length} companies.`);

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
  const cardHtml = question => '<article class="qa-card bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" data-question-id="' + question.id + '"><button data-action="toggle-card" class="btn-press w-full p-4 text-left flex justify-between gap-3 items-center" aria-expanded="false"><span class="font-bold text-[14px] text-slate-700"><span class="tag tag-' + question.priority + '">' + question.priority.toUpperCase() + '</span><br>' + escapeHtml(question.question) + '</span><i class="fas fa-chevron-down"></i></button><div class="accordion-wrapper"><div class="accordion-inner"><div class="px-4 pb-4 text-[13px] text-slate-600 border-t pt-3 leading-relaxed">' + question.answerHtml + '</div></div></div></article>';
  const categoryHtml = (companyId, category, index) => '<div id="content-' + companyId + '-' + category.id + '" class="sub-content ' + (index === 0 ? 'block' : 'hidden') + ' space-y-3">' + category.introHtml + '<div class="study-toolbar flex items-center gap-2"><div class="search-box-wrapper"><i class="fas fa-search"></i><input type="search" class="study-search" aria-label="搜尋本分組題庫" placeholder="搜尋本分組題目、關鍵字或案例..." data-action="filter" data-content="content-' + companyId + '-' + category.id + '"></div><select class="status-filter" aria-label="篩選練習狀態" data-action="status-filter" data-content="content-' + companyId + '-' + category.id + '"><option value="all">全部</option><option value="unmastered">未掌握</option><option value="practiced">練習過</option><option value="mastered">已掌握</option></select><span class="question-count" data-result-count>' + category.questions.length + ' 題</span><button data-action="random" data-content="content-' + companyId + '-' + category.id + '" aria-label="隨機抽一題練習" class="btn-press flex-shrink-0 bg-[#d9823b] text-white px-3 py-2 rounded-lg text-xs font-black"><i class="fas fa-dice"></i><span class="hidden sm:inline ml-1">抽題</span></button></div>' + category.questions.map(cardHtml).join('') + '</div>';
  const renderCategory = (companyId, categoryId) => {
    const company = data[companyId];
    const section = document.getElementById('section-' + companyId);
    const category = company?.categories.find(item => item.id === categoryId);
    if (!section || !category || document.getElementById('content-' + companyId + '-' + categoryId)) return;
    section.insertAdjacentHTML('beforeend', categoryHtml(companyId, category, 1));
    window.InterviewState?.migrateLegacy?.();
    window.enhanceInterviewA11y?.();
  };
  const renderCompany = companyId => {
    const company = data[companyId];
    const section = document.getElementById('section-' + companyId);
    if (!section || !company || section.dataset.rendered === 'true') return;
    const firstCategory = company.categories.find(category => category.questions.length) || company.categories[0];
    const nav = company.categories.map(category => '<button data-action="switch-subtab" data-company="' + companyId + '" data-category="' + category.id + '" id="tab-' + companyId + '-' + category.id + '" role="tab" class="btn-press sub-tab-btn ' + companyId + '-theme ' + (category.id === firstCategory.id ? 'active' : '') + '" aria-controls="content-' + companyId + '-' + category.id + '" aria-selected="' + (category.id === firstCategory.id ? 'true' : 'false') + '">' + escapeHtml(category.label) + '</button>').join('');
    section.innerHTML = '<nav class="section-nav flex overflow-x-auto hide-scrollbar pb-4 gap-2" role="tablist" aria-label="' + escapeHtml(company.name) + '">' + nav + '</nav>' + categoryHtml(companyId, firstCategory, 0);
    section.dataset.rendered = 'true';
    section.dataset.renderedCategories = firstCategory.id;
  };
  window.renderLegacyCategory = renderCategory;
  window.renderLegacyCompany = renderCompany;
  renderCompany('asml');
})();
`;
fs.writeFileSync(new URL('../js/legacy-sections.js', import.meta.url), renderer);
console.log(`Built structured legacy data: ${Object.keys(companies).length} companies.`);

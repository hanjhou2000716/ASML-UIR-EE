(() => {
  'use strict';

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const normalizeQuestion = question => Array.isArray(question)
    ? { question: question[0], answerHtml: `<p>${question[1] || ''}</p><p class="answer-tip">${question[2] || ''}</p>`, priority: 'standard' }
    : question;

  const renderCard = question => {
    const item = normalizeQuestion(question);
    const priority = item.priority || 'standard';
    return `<article class="qa-card bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" data-question-id="${escapeHtml(item.id)}"><button data-action="toggle-card" class="btn-press w-full p-4 text-left flex justify-between gap-3 items-center" aria-expanded="false"><span class="font-bold text-[14px] text-slate-700"><span class="tag tag-${escapeHtml(priority)}">${escapeHtml(priority.toUpperCase())}</span><br>${escapeHtml(item.question)}</span>${window.AppIcons?.render('chevron', { className: 'text-slate-400' }) || ''}</button><div class="accordion-wrapper"><div class="accordion-inner"><div class="px-4 pb-4 text-[13px] text-slate-600 border-t pt-3 leading-relaxed">${item.answerHtml || '<p>請準備自己的案例。</p>'}</div></div></div></article>`;
  };

  const renderToolbar = (companyId, category) => `<div class="study-toolbar flex items-center gap-2"><div class="search-box-wrapper">${window.AppIcons?.render('search') || ''}<input type="search" class="study-search" aria-label="搜尋本分組題庫" placeholder="搜尋本分組題目、關鍵字或案例..." data-action="filter" data-content="content-${companyId}-${category.id}"></div><select class="status-filter" aria-label="篩選練習狀態" data-action="status-filter" data-content="content-${companyId}-${category.id}"><option value="all">全部</option><option value="unmastered">未掌握</option><option value="practiced">練習過</option><option value="mastered">已掌握</option></select><span class="question-count" data-result-count>${category.questions.length} 題</span><button data-action="random" data-content="content-${companyId}-${category.id}" aria-label="隨機抽一題練習" class="btn-press flex-shrink-0 bg-[#d9823b] text-white px-3 py-2 rounded-lg text-xs font-black">${window.AppIcons?.render('random') || ''}<span class="hidden sm:inline ml-1">抽題</span></button></div>`;

  const renderCategory = (companyId, category, index) => `<div id="content-${companyId}-${category.id}" class="sub-content ${index === 0 ? 'block' : 'hidden'} space-y-3">${category.introHtml || ''}${renderToolbar(companyId, category)}${category.questions.map(renderCard).join('')}</div>`;

  const renderCompanySection = ({ section, companyId, company, theme = `${companyId}-theme`, firstCategoryId }) => {
    const categories = company.categories || [];
    const first = firstCategoryId || categories.find(category => category.questions?.length)?.id || categories[0]?.id;
    const nav = categories.map(category => `<button data-action="switch-subtab" data-company="${escapeHtml(companyId)}" data-category="${escapeHtml(category.id)}" id="tab-${escapeHtml(companyId)}-${escapeHtml(category.id)}" role="tab" class="btn-press sub-tab-btn ${escapeHtml(theme)} ${category.id === first ? 'active' : ''}" aria-controls="content-${escapeHtml(companyId)}-${escapeHtml(category.id)}" aria-selected="${category.id === first ? 'true' : 'false'}">${window.AppIcons?.render(category.icon || 'grid', { className: 'mr-1' }) || ''}${escapeHtml(category.label)}</button>`).join('');
    section.innerHTML = `<nav class="section-nav flex overflow-x-auto hide-scrollbar pb-4 gap-2" role="tablist" aria-label="${escapeHtml(company.name)} 題庫分類">${nav}</nav>${categories.map((category, index) => renderCategory(companyId, category, index)).join('')}`;
    window.AppIcons?.hydrate(section);
    section.dataset.rendered = 'true';
    section.dataset.renderedCategories = first || '';
    window.InterviewState?.migrateLegacy?.();
    window.enhanceInterviewA11y?.();
  };

  window.InterviewRenderer = Object.freeze({ renderCard, renderCategory, renderCompanySection });
})();

(function () {
  const data = window.LegacyQuestionData?.companies || {};
  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const cardHtml = question => '<article class="qa-card bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" data-question-id="' + question.id + '"><button data-action="toggle-card" class="btn-press w-full p-4 text-left flex justify-between gap-3 items-center" aria-expanded="false"><span class="font-bold text-[14px] text-slate-700"><span class="tag tag-' + question.priority + '">' + question.priority.toUpperCase() + '</span><br>' + escapeHtml(question.question) + '</span><i class="fas fa-chevron-down"></i></button><div class="accordion-wrapper"><div class="accordion-inner"><div class="px-4 pb-4 text-[13px] text-slate-600 border-t pt-3 leading-relaxed">' + question.answerHtml + '</div></div></div></article>';
  const categoryHtml = (companyId, category, index) => '<div id="content-' + companyId + '-' + category.id + '" class="sub-content ' + (index === 0 ? 'block' : 'hidden') + ' space-y-3">' + category.introHtml + category.questions.map(cardHtml).join('') + '</div>';
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

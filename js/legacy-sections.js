(function () {
  const data = window.LegacyQuestionData?.companies || {};
  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  Object.entries(data).forEach(([companyId, company]) => {
    const section = document.getElementById('section-' + companyId);
    if (!section) return;
    const nav = company.categories.map((category, index) => '<button data-action="switch-subtab" data-company="' + companyId + '" data-category="' + category.id + '" id="tab-' + companyId + '-' + category.id + '" class="btn-press sub-tab-btn ' + companyId + '-theme ' + (index === 0 ? 'active' : '') + '" aria-controls="content-' + companyId + '-' + category.id + '">' + escapeHtml(category.label) + '</button>').join('');
    const contents = company.categories.map((category, index) => '<div id="content-' + companyId + '-' + category.id + '" class="sub-content ' + (index === 0 ? 'block' : 'hidden') + ' space-y-3">' + category.introHtml + category.questions.map(question => '<article class="qa-card bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" data-question-id="' + question.id + '"><button data-action="toggle-card" class="btn-press w-full p-4 text-left flex justify-between gap-3 items-center" aria-expanded="false"><span class="font-bold text-[14px] text-slate-700"><span class="tag tag-' + question.priority + '">' + question.priority.toUpperCase() + '</span><br>' + escapeHtml(question.question) + '</span><i class="fas fa-chevron-down text-slate-400"></i></button><div class="accordion-wrapper"><div class="accordion-inner"><div class="px-4 pb-4 text-[13px] text-slate-600 border-t pt-3 leading-relaxed">' + question.answerHtml + '</div></div></div></article>').join('') + '</div>').join('');
    section.innerHTML = '<nav class="section-nav flex overflow-x-auto hide-scrollbar pb-4 gap-2" aria-label="' + escapeHtml(company.name) + '">' + nav + '</nav>' + contents;
  });
})();

// Compatibility adapter: legacy data is normalized by the shared renderer.
(() => {
  'use strict';
  const data = window.LegacyQuestionData?.companies || {};
  const renderCompany = companyId => {
    const company = data[companyId];
    const section = document.getElementById(`section-${companyId}`);
    if (!section || !company || section.dataset.rendered === 'true') return;
    window.InterviewRenderer?.renderCompanySection({ section, companyId, company, theme: `${companyId}-theme` });
  };
  const renderCategory = (companyId, categoryId) => {
    const company = data[companyId];
    const section = document.getElementById(`section-${companyId}`);
    const category = company?.categories.find(item => item.id === categoryId);
    if (!section || !category || document.getElementById(`content-${companyId}-${categoryId}`)) return;
    section.insertAdjacentHTML('beforeend', window.InterviewRenderer?.renderCategory(companyId, category, 1) || '');
    window.AppIcons?.hydrate(section);
    window.InterviewState?.migrateLegacy?.();
    window.enhanceInterviewA11y?.();
  };
  window.renderLegacyCategory = renderCategory;
  window.renderLegacyCompany = renderCompany;
  window.addEventListener('DOMContentLoaded', () => renderCompany('asml'), { once: true });
})();

(() => {
  'use strict';
  const KEY = 'interview-workspace-state';
  const LEGACY_ACTIVE = 'interview-active-company';
  const LEGACY_PREFIX = 'interview-mastered-';
  const state = {
    schemaVersion: 2,
    activeCompanyId: 'asml',
    activeCategoryByCompany: {},
    questions: {}
  };

  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { return null; }
  };
  const normalise = (candidate) => {
    const next = { ...state, ...(candidate && typeof candidate === 'object' ? candidate : {}) };
    next.schemaVersion = 2;
    next.activeCompanyId = typeof next.activeCompanyId === 'string' ? next.activeCompanyId : 'asml';
    next.activeCategoryByCompany = next.activeCategoryByCompany && typeof next.activeCategoryByCompany === 'object' ? next.activeCategoryByCompany : {};
    next.questions = next.questions && typeof next.questions === 'object' ? next.questions : {};
    Object.keys(next.questions).forEach(id => {
      const q = next.questions[id] || {};
      next.questions[id] = {
        mastered: Boolean(q.mastered),
        attemptedCount: Number.isFinite(q.attemptedCount) ? q.attemptedCount : 0,
        practiceCount: Number.isFinite(q.practiceCount) ? q.practiceCount : 0,
        lastPracticedAt: q.lastPracticedAt || null
      };
    });
    return next;
  };
  const save = () => { localStorage.setItem(KEY, JSON.stringify(state)); window.dispatchEvent(new CustomEvent('interview-state-change')); };
  const migrateLegacy = () => {
    const candidate = read();
    Object.assign(state, normalise(candidate));
    const legacyActive = localStorage.getItem(LEGACY_ACTIVE);
    if (!candidate && legacyActive) state.activeCompanyId = legacyActive;
    document.querySelectorAll('.qa-card').forEach((card, index) => {
      const id = card.dataset.questionId || `legacy.card.${index + 1}`;
      card.dataset.questionId = id;
      if (!candidate) {
        const old = localStorage.getItem(`${LEGACY_PREFIX}${index}`) === 'true';
        if (old) state.questions[id] = { mastered: true, attemptedCount: 0, practiceCount: 0, lastPracticedAt: null };
      }
    });
    save();
  };
  const getQuestion = id => state.questions[id] || (state.questions[id] = { mastered: false, attemptedCount: 0, practiceCount: 0, lastPracticedAt: null });
  const mark = (id, patch = {}) => { Object.assign(getQuestion(id), patch); save(); return getQuestion(id); };
  const toggle = id => { const q = getQuestion(id); q.mastered = !q.mastered; q.attemptedCount += 1; q.lastPracticedAt = new Date().toISOString(); q.practiceCount += 1; save(); return q; };
  const renderInsights = () => {
    const dashboard = document.getElementById('dashboard');
    if (!dashboard) return;
    let panel = document.getElementById('workspace-insights');
    if (!panel) { panel = document.createElement('section'); panel.id = 'workspace-insights'; panel.className = 'focus-card rounded-2xl p-4 mt-4'; dashboard.appendChild(panel); }
    const cards = [...document.querySelectorAll('.qa-card')];
    const mastered = cards.filter(card => state.questions[card.dataset.questionId]?.mastered).length;
    const attempted = Object.values(state.questions).filter(q => q.attemptedCount > 0).length;
    const pending = Math.max(cards.length - mastered, 0);
    panel.innerHTML = `<div class="flex items-center justify-between gap-3"><div><p class="text-xs font-black tracking-widest text-slate-500">實際練習洞察</p><h3 class="text-lg font-black text-slate-800 mt-1">進度與弱項</h3></div><span class="status-dot ${pending === 0 ? 'done' : ''}" aria-label="${pending === 0 ? '全部掌握' : '尚有未掌握題目'}"></span></div><div class="grid grid-cols-3 gap-2 mt-4 text-center"><div class="rounded-xl bg-slate-50 p-3"><b class="block text-xl text-slate-800">${mastered}</b><span class="text-[11px] text-slate-500">已掌握</span></div><div class="rounded-xl bg-slate-50 p-3"><b class="block text-xl text-slate-800">${attempted}</b><span class="text-[11px] text-slate-500">練習過</span></div><div class="rounded-xl bg-slate-50 p-3"><b class="block text-xl text-slate-800">${pending}</b><span class="text-[11px] text-slate-500">待複習</span></div></div><p class="text-xs text-slate-500 mt-3">數據來自本機實際操作，不推估分數或錄取機率。</p>`;
  };
  const api = { KEY, state, migrateLegacy, getQuestion, mark, toggle, save };
  window.InterviewState = api;
  window.toggleMastered = (button, legacyIndex = 0) => {
    const card = button && button.closest('.qa-card');
    const id = card?.dataset.questionId || `legacy.card.${legacyIndex + 1}`;
    const record = toggle(id);
    if (card) card.classList.toggle('mastered', record.mastered);
    if (button) {
      button.classList.toggle('mastered-badge', record.mastered);
      button.classList.toggle('text-slate-600', !record.mastered);
      button.innerHTML = `<i class="fas fa-check"></i> ${record.mastered ? '已掌握' : '標記掌握'}`;
    }
  };
  window.addEventListener('DOMContentLoaded', () => { migrateLegacy(); renderInsights(); }, { once: true });
  window.addEventListener('interview-state-change', renderInsights);
})();

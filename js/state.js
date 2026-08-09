(() => {
  'use strict';
  const KEY = 'interview-workspace-state';
  const LEGACY_ACTIVE = 'interview-active-company';
  const LEGACY_PREFIX = 'interview-mastered-';
  const VALID_COMPANIES = new Set(['asml', 'assembly', 'fstech', 'benq', 'micron', 'swancor', 'skyeuv']);
  const memoryStore = new Map();
  const state = {
    schemaVersion: 2,
    activeCompanyId: 'asml',
    activeCategoryByCompany: {},
    questions: {}
  };

  const storageGet = key => { try { return localStorage.getItem(key); } catch (_) { return memoryStore.get(key) || null; } };
  const storageSet = (key, value) => { try { localStorage.setItem(key, value); } catch (_) { memoryStore.set(key, value); } };
  const read = () => { try { return JSON.parse(storageGet(KEY) || 'null'); } catch (_) { return null; } };
  const normalise = (candidate) => {
    const next = { ...state, ...(candidate && typeof candidate === 'object' ? candidate : {}) };
    next.schemaVersion = 2;
    next.activeCompanyId = VALID_COMPANIES.has(next.activeCompanyId) ? next.activeCompanyId : 'asml';
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
  const save = () => { storageSet(KEY, JSON.stringify(state)); window.dispatchEvent(new CustomEvent('interview-state-change')); };
  const migrateLegacy = () => {
    const candidate = read();
    Object.assign(state, normalise(candidate));
    const legacyActive = storageGet(LEGACY_ACTIVE);
    if (!candidate && VALID_COMPANIES.has(legacyActive)) state.activeCompanyId = legacyActive;
    document.querySelectorAll('.qa-card').forEach((card, index) => {
      const prompt = card.querySelector('button span')?.textContent?.replace(/\s+/g, ' ').trim() || '';
      const digest = Array.from(prompt).reduce((hash, ch) => ((hash << 5) - hash + ch.charCodeAt(0)) | 0, 0).toString(36).replace('-', 'n');
      const content = card.closest('.sub-content')?.id?.replace(/^content-/, '').split('-') || [];
      const company = content.shift() || 'legacy';
      const category = content.join('-') || 'general';
      const id = card.dataset.questionId || `${company}.${category}.${digest || index + 1}`;
      card.dataset.questionId = id;
      if (!candidate) {
        const old = storageGet(`${LEGACY_PREFIX}${index}`) === 'true';
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
    if (!panel) { panel = document.createElement('section'); panel.id = 'workspace-insights'; panel.className = 'focus-card rounded-2xl p-4'; (document.getElementById('workspace-context') || dashboard).appendChild(panel); }
    const cards = [...document.querySelectorAll('.qa-card')];
    const mastered = cards.filter(card => state.questions[card.dataset.questionId]?.mastered).length;
    const attempted = Object.values(state.questions).filter(q => q.attemptedCount > 0).length;
    const pending = Math.max(cards.length - mastered, 0);
    const groups = {};
    cards.forEach(card => {
      const id = card.dataset.questionId || 'question.unknown';
      const category = id.split('.')[1] || 'general';
      groups[category] ||= { total: 0, mastered: 0, attempted: 0 };
      groups[category].total += 1;
      const q = state.questions[id];
      if (q?.mastered) groups[category].mastered += 1;
      if (q?.attemptedCount) groups[category].attempted += 1;
    });
    const weakest = Object.entries(groups).sort((a, b) => (a[1].mastered / a[1].total) - (b[1].mastered / b[1].total))[0];
    const categoryRows = Object.entries(groups).slice(0, 6).map(([name, value]) => {
      const percent = Math.round((value.mastered / value.total) * 100);
      return `<div class="insight-row"><div class="flex justify-between text-[11px] text-slate-600"><span>${name}</span><b>${value.mastered}/${value.total}</b></div><div class="insight-track"><span style="width:${percent}%"></span></div></div>`;
    }).join('');
    panel.innerHTML = `<div class="flex items-center justify-between gap-3"><div><p class="text-xs font-black tracking-widest text-slate-500">實際練習洞察</p><h3 class="text-lg font-black text-slate-800 mt-1">進度與弱項</h3></div><span class="status-dot ${pending === 0 ? 'done' : ''}" aria-label="${pending === 0 ? '全部掌握' : '尚有未掌握題目'}"></span></div><div class="grid grid-cols-3 gap-2 mt-4 text-center"><div class="rounded-xl bg-slate-50 p-3"><b class="block text-xl text-slate-800">${mastered}</b><span class="text-[11px] text-slate-500">已掌握</span></div><div class="rounded-xl bg-slate-50 p-3"><b class="block text-xl text-slate-800">${attempted}</b><span class="text-[11px] text-slate-500">練習過</span></div><div class="rounded-xl bg-slate-50 p-3"><b class="block text-xl text-slate-800">${pending}</b><span class="text-[11px] text-slate-500">待複習</span></div></div><div class="mt-4 space-y-2"><p class="text-xs font-black text-slate-700">分類掌握</p>${categoryRows || '<p class="text-xs text-slate-500">尚未建立練習紀錄</p>'}</div><p class="text-xs text-slate-500 mt-3">目前弱項：${weakest ? weakest[0] : '尚無資料'}。數據來自本機實際操作，不推估分數或錄取機率。</p><div class="quick-practice"><button data-practice-mode="random">隨機一題</button><button data-practice-mode="unmastered">先練未掌握</button><button data-practice-mode="unpracticed">先練未練習</button></div>`;
    panel.querySelectorAll('[data-practice-mode]').forEach(button => button.addEventListener('click', () => quickPractice(button.dataset.practiceMode)));
  };
  const quickPractice = mode => {
    const active = document.querySelector('.company-section.block') || document.querySelector('.company-section:not(.hidden)');
    if (!active) return;
    let cards = [...active.querySelectorAll('.qa-card:not(.search-hidden)')];
    if (mode === 'unmastered') cards = cards.filter(card => !getQuestion(card.dataset.questionId).mastered);
    if (mode === 'unpracticed') cards = cards.filter(card => !getQuestion(card.dataset.questionId).attemptedCount);
    if (!cards.length) { active.querySelector('.qa-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    const card = cards[Math.floor(Math.random() * cards.length)];
    const button = card.querySelector(':scope > button');
    if (button && !button.nextElementSibling?.classList.contains('open')) window.toggleCard?.(button);
    card.classList.add('practice-highlight');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => card.classList.remove('practice-highlight'), 2200);
  };
  const mountWorkspaceShell = () => {
    const main = document.getElementById('main-container');
    if (!main || document.getElementById('workspace-rail')) return;
    main.classList.add('workspace-main');
    const rail = document.createElement('aside');
    rail.id = 'workspace-rail'; rail.className = 'workspace-rail'; rail.setAttribute('aria-label', '面試職缺導覽');
    rail.innerHTML = `<div class="rail-brand"><span class="rail-mark">LZ</span><div><b>Interview<br>Workspace</b><small>local-first</small></div></div><p class="rail-label">準備中</p><nav class="rail-links">${[['asml','ASML UIR'],['assembly','ASML Assembly'],['fstech','台塑勝高'],['benq','明基材料｜塗佈']].map(([id, label]) => `<button data-rail-company="${id}">${label}</button>`).join('')}</nav><p class="rail-label">已完成面試</p><button class="rail-archive" data-rail-archive>美光・上緯・天虹</button>`;
    main.parentNode.insertBefore(rail, main);
    rail.querySelectorAll('[data-rail-company]').forEach(button => button.addEventListener('click', () => window.switchCompany(button.dataset.railCompany)));
    rail.querySelector('[data-rail-archive]').addEventListener('click', () => window.toggleArchive());
    const style = document.createElement('style');
    style.textContent = `.workspace-layout{display:grid;grid-template-columns:220px minmax(0,1fr) 280px;gap:24px;max-width:1440px;margin:0 auto;padding:24px}.workspace-rail{position:sticky;top:92px;height:max-content;background:#fbfaf6;border:1px solid #dfddd6;border-radius:20px;padding:18px;box-shadow:0 8px 24px rgba(38,52,66,.05)}.rail-brand{display:flex;gap:10px;align-items:center;color:#1f3654}.rail-mark{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:#1f3654;color:#fff;font-weight:900}.rail-brand small{display:block;color:#71866e;font-size:10px;margin-top:3px}.rail-label{margin:20px 0 8px;color:#8a918a;font-size:10px;font-weight:900;letter-spacing:.14em}.rail-links{display:grid;gap:5px}.rail-links button,.rail-archive{width:100%;text-align:left;border:0;background:transparent;border-radius:10px;padding:10px;color:#536170;font-size:12px;font-weight:800;cursor:pointer}.rail-links button:hover,.rail-links button:focus-visible,.rail-archive:hover,.rail-archive:focus-visible{background:#edf2ea;color:#1f3654}.workspace-main{max-width:none;margin:0;padding:0}.workspace-insights{min-height:100px}.insight-row{display:grid;gap:4px}.insight-track{height:6px;border-radius:99px;background:#e8e8e2;overflow:hidden}.insight-track span{display:block;height:100%;background:#91a48e;border-radius:inherit;transition:width .3s ease}.quick-practice{display:grid;gap:7px;margin-top:14px}.quick-practice button{border:1px solid #d8ddd5;background:#fff;border-radius:10px;padding:9px;text-align:left;color:#1f3654;font-size:11px;font-weight:800;cursor:pointer}.quick-practice button:hover,.quick-practice button:focus-visible{border-color:#d9823b;background:#fffaf5}@media(max-width:1100px){.workspace-layout{grid-template-columns:190px minmax(0,1fr)}.workspace-layout>#workspace-insights{grid-column:2}.workspace-rail{padding:14px}}@media(max-width:760px){.workspace-layout{display:block;padding:12px}.workspace-rail{position:static;margin-bottom:12px;display:flex;align-items:center;gap:8px;overflow:auto}.rail-brand,.rail-label,.rail-archive{display:none}.rail-links{display:flex;min-width:max-content}.rail-links button{white-space:nowrap;padding:9px 12px}.workspace-main{width:100%}}@media(prefers-reduced-motion:reduce){.insight-track span{transition:none}}`;
    document.head.appendChild(style);
    const shell = document.createElement('div'); shell.className = 'workspace-layout';
    main.parentNode.insertBefore(shell, rail); shell.appendChild(rail); shell.appendChild(main);
    const context = document.createElement('aside'); context.id = 'workspace-context'; context.className = 'workspace-context'; context.setAttribute('aria-label', '練習進度與快速操作'); shell.appendChild(context);
  };
  const api = { KEY, state, migrateLegacy, getQuestion, mark, toggle, save };
  window.InterviewState = api;
  window.toggleMastered = (button, legacyIndex = 0) => {
    const card = button && button.closest('.qa-card');
    const content = card?.closest('.sub-content')?.id?.replace(/^content-/, '').split('-') || [];
    const company = content.shift() || 'legacy';
    const category = content.join('-') || 'general';
    const id = card?.dataset.questionId || `${company}.${category}.${legacyIndex + 1}`;
    const record = toggle(id);
    if (card) card.classList.toggle('mastered', record.mastered);
    if (button) {
      button.classList.toggle('mastered-badge', record.mastered);
      button.classList.toggle('text-slate-600', !record.mastered);
      button.innerHTML = `<i class="fas fa-check"></i> ${record.mastered ? '已掌握' : '標記掌握'}`;
    }
  };
  window.addEventListener('DOMContentLoaded', () => { migrateLegacy(); mountWorkspaceShell(); renderInsights(); }, { once: true });
  window.addEventListener('interview-state-change', renderInsights);
})();

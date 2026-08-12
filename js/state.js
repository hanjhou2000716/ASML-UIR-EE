(() => {
  'use strict';
  const KEY = 'interview-workspace-state';
  const LEGACY_ACTIVE = 'interview-active-company';
  const LEGACY_PREFIX = 'interview-mastered-';
  const VALID_COMPANIES = new Set(['asml', 'assembly', 'fstech', 'benq', 'micron', 'swancor', 'skyeuv']);
  const memoryStore = new Map();
  let practiceSession = null;
  let practiceTrigger = null;
  const state = {
    schemaVersion: 2,
    activeCompanyId: 'asml',
    activeCategoryByCompany: {},
    questions: {},
    practiceHistory: []
  };

  const storageGet = key => { try { return localStorage.getItem(key); } catch (_) { return memoryStore.get(key) || null; } };
  const storageSet = (key, value) => { try { localStorage.setItem(key, value); } catch (_) { memoryStore.set(key, value); } };
  const read = () => { try { return JSON.parse(storageGet(KEY) || 'null'); } catch (_) { return null; } };
  const normalise = (candidate) => {
    const next = { ...state, ...(candidate && typeof candidate === 'object' ? candidate : {}) };
    next.schemaVersion = 2;
    next.activeCompanyId = VALID_COMPANIES.has(next.activeCompanyId) ? next.activeCompanyId : 'asml';
    next.activeCategoryByCompany = next.activeCategoryByCompany && typeof next.activeCategoryByCompany === 'object' ? next.activeCategoryByCompany : {};
    const questionMap = window.LegacyQuestionIdMap || {};
    const rawQuestions = next.questions && typeof next.questions === 'object' ? next.questions : {};
    next.questions = Object.fromEntries(Object.entries(rawQuestions).map(([id, value]) => [questionMap[id] || id, value]));
    next.practiceHistory = Array.isArray(next.practiceHistory) ? next.practiceHistory.filter(item => item && item.questionId && item.at).map(item => ({ ...item, questionId: questionMap[item.questionId] || item.questionId })).slice(-30) : [];
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
    document.querySelectorAll('.qa-card').forEach(card => {
      const id = card.dataset.questionId;
      if (!id) return;
      if (!candidate) {
        const old = storageGet(`${LEGACY_PREFIX}${id}`) === 'true';
        if (old) state.questions[id] = { mastered: true, attemptedCount: 0, practiceCount: 0, lastPracticedAt: null };
      }
    });
    save();
  };
  const getQuestion = id => state.questions[id] || (state.questions[id] = { mastered: false, attemptedCount: 0, practiceCount: 0, lastPracticedAt: null });
  const mark = (id, patch = {}) => { Object.assign(getQuestion(id), patch); save(); return getQuestion(id); };
  const toggle = id => { const q = getQuestion(id); q.mastered = !q.mastered; q.attemptedCount += 1; q.lastPracticedAt = new Date().toISOString(); q.practiceCount += 1; state.practiceHistory.push({ questionId: id, at: q.lastPracticedAt }); state.practiceHistory = state.practiceHistory.slice(-30); save(); return q; };
  const renderInsights = () => {
    const dashboard = document.getElementById('dashboard');
    if (!dashboard) return;
    let panel = document.getElementById('workspace-insights');
    if (!panel) { panel = document.createElement('section'); panel.id = 'workspace-insights'; panel.className = 'focus-card rounded-2xl p-4'; (document.getElementById('workspace-context') || dashboard).appendChild(panel); }
    const registry = window.InterviewQuestionRegistry?.companies || {};
    const questions = Object.values(registry).flatMap(company => company.categories.flatMap(category => category.questions.map(question => ({ ...question, categoryId: category.id, categoryLabel: category.label }))));
    const mastered = questions.filter(question => state.questions[question.id]?.mastered).length;
    const attempted = Object.values(state.questions).filter(q => q.attemptedCount > 0).length;
    const pending = Math.max(questions.length - mastered, 0);
    const groups = {};
    questions.forEach(question => {
      const category = question.categoryLabel || question.categoryId || 'general';
      groups[category] ||= { total: 0, mastered: 0, attempted: 0 };
      groups[category].total += 1;
      const q = state.questions[question.id];
      if (q?.mastered) groups[category].mastered += 1;
      if (q?.attemptedCount) groups[category].attempted += 1;
    });
    const weakest = Object.entries(groups).sort((a, b) => (a[1].mastered / a[1].total) - (b[1].mastered / b[1].total))[0];
    const completion = questions.length ? Math.round((mastered / questions.length) * 100) : 0;
    const categoryRows = Object.entries(groups).slice(0, 6).map(([name, value]) => {
      const percent = Math.round((value.mastered / value.total) * 100);
      return `<div class="insight-row"><div class="flex justify-between text-[11px] text-slate-600"><span>${name}</span><b>${value.mastered}/${value.total}</b></div><div class="insight-track"><span class="progress-${Math.round(percent)}"></span></div></div>`;
    }).join('');
    const companyRows = Object.values(registry).filter(company => company.status === 'active').slice(0, 7).map(company => {
      const total = company.categories.reduce((sum, category) => sum + category.questions.length, 0);
      const done = company.categories.reduce((sum, category) => sum + category.questions.filter(question => state.questions[question.id]?.mastered).length, 0);
      const percent = total ? Math.round(done / total * 100) : 0;
      return `<div class="heatmap-cell" tabindex="0" aria-label="${company.name} ${done}/${total} 題已掌握"><span>${company.shortName || company.id}</span><b>${percent}%</b></div>`;
    }).join('');
    const historyDays = Array.from({ length: 7 }, (_, index) => { const day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - (6 - index)); const nextDay = new Date(day); nextDay.setDate(day.getDate() + 1); const count = state.practiceHistory.filter(item => { const at = new Date(item.at); return at >= day && at < nextDay; }).length; return `<div class="history-bar" title="${day.toLocaleDateString('zh-TW')}：${count} 次練習" aria-label="${day.toLocaleDateString('zh-TW')} ${count} 次練習"><span class="activity-${Math.min(4, count)}"></span><small>${day.getDate()}</small></div>`; }).join('');
    panel.innerHTML = `<div class="flex items-center justify-between gap-3"><div><p class="text-xs font-black tracking-widest text-slate-500">實際練習洞察</p><h3 class="text-lg font-black text-slate-800 mt-1">進度與弱項</h3></div><span class="status-dot ${pending === 0 ? 'done' : ''}" aria-label="${pending === 0 ? '全部掌握' : '尚有未掌握題目'}"></span></div><div class="grid grid-cols-4 gap-2 mt-4 text-center"><div class="rounded-xl bg-slate-50 p-3"><b class="block text-xl text-slate-800">${completion}%</b><span class="text-[11px] text-slate-500">完成度</span></div><div class="rounded-xl bg-slate-50 p-3"><b class="block text-xl text-slate-800">${mastered}</b><span class="text-[11px] text-slate-500">已掌握</span></div><div class="rounded-xl bg-slate-50 p-3"><b class="block text-xl text-slate-800">${attempted}</b><span class="text-[11px] text-slate-500">練習過</span></div><div class="rounded-xl bg-slate-50 p-3"><b class="block text-xl text-slate-800">${pending}</b><span class="text-[11px] text-slate-500">待複習</span></div></div><div class="mt-4 space-y-2"><p class="text-xs font-black text-slate-700">分類掌握</p>${categoryRows || '<p class="text-xs text-slate-500">尚未建立練習紀錄</p>'}</div><div class="mt-4"><p class="text-xs font-black text-slate-700">公司 × 題庫掌握</p><div class="heatmap-grid mt-2">${companyRows || '<p class="text-xs text-slate-500">題庫載入後顯示</p>'}</div></div><div class="mt-4"><p class="text-xs font-black text-slate-700">近 7 日練習</p><div class="history-chart mt-2">${historyDays}</div></div><p class="text-xs text-slate-500 mt-3">目前弱項：${weakest ? weakest[0] : '尚無資料'}。數據來自本機實際操作，不推估分數或錄取機率。</p><div class="quick-practice"><button data-practice-mode="random">隨機一題</button><button data-practice-mode="unmastered">先練未掌握</button><button data-practice-mode="unpracticed">先練未練習</button><button data-practice-mode="current">目前分組</button></div>`;
    panel.querySelector('.status-dot')?.removeAttribute('aria-label');
    panel.querySelectorAll('[data-practice-mode]').forEach(button => button.addEventListener('click', () => quickPractice(button.dataset.practiceMode)));
  };
  const practiceCards = mode => {
    const active = document.querySelector('.company-section.block') || document.querySelector('.company-section:not(.hidden)');
    const current = active?.querySelector('.sub-content.block') || active?.querySelector('.sub-content:not(.hidden)');
    if (!active) return [];
    let cards = [...(mode === 'current' ? current || active : active).querySelectorAll('.qa-card:not(.search-hidden)')];
    if (mode === 'unmastered') cards = cards.filter(card => !getQuestion(card.dataset.questionId).mastered);
    if (mode === 'unpracticed') cards = cards.filter(card => !getQuestion(card.dataset.questionId).attemptedCount);
    return cards;
  };
  const renderPracticeSession = () => {
    if (!practiceSession?.cards.length) return;
    let panel = document.getElementById('practice-session');
    if (!panel) { panel = document.createElement('section'); panel.id = 'practice-session'; panel.className = 'practice-session'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); document.body.appendChild(panel); }
    const card = practiceSession.cards[practiceSession.index];
    const question = card.querySelector(':scope > button span')?.textContent?.replace(/必練\s*\d+\s*/, '').trim() || '面試題目';
    const answer = card.querySelector('.accordion-inner')?.innerHTML || '<p>請回到題卡查看參考答案。</p>';
    panel.innerHTML = `<div class="practice-session-card"><div class="flex items-center justify-between gap-3"><span class="text-xs font-black tracking-widest text-slate-500">連續練習 · ${practiceSession.index + 1}/${practiceSession.cards.length}</span><button data-action="practice" data-practice-action="close" class="practice-session-close" aria-label="關閉練習">×</button></div><h2 class="mt-4 text-xl font-black text-slate-800">${question}</h2><div class="practice-session-answer ${practiceSession.revealed ? '' : 'hidden'} mt-4">${answer}</div><div class="practice-session-actions"><button data-action="practice" data-practice-action="reveal">${practiceSession.revealed ? '收合答案' : '揭露參考答案'}</button><button data-action="practice" data-practice-action="master">${getQuestion(card.dataset.questionId).mastered ? '取消已掌握' : '標記已掌握'}</button><button data-action="practice" data-practice-action="next" class="primary">下一題</button></div><p class="mt-3 text-xs text-slate-500">快捷鍵：Space／Enter 揭露答案 · M 標記掌握 · N 下一題 · T 計時 · Esc 關閉</p></div>`;
    panel.querySelector('[data-practice-action="reveal"]')?.focus();
  };
  const closePractice = () => { document.getElementById('practice-session')?.remove(); practiceSession = null; practiceTrigger?.focus?.(); practiceTrigger = null; };
  const quickPractice = mode => { const cards = practiceCards(mode); if (!cards.length) return; practiceTrigger = document.activeElement; practiceSession = { mode, cards, index: Math.floor(Math.random() * cards.length), revealed: false }; renderPracticeSession(); };
  const renderGlobalResults = term => {
    const results = document.getElementById('global-search-results');
    if (!results) return;
    const query = String(term || '').trim().toLocaleLowerCase();
    results.replaceChildren();
    if (!query) { results.hidden = true; return; }
    window.ensureRoleBanks?.();
    const legacyCompanies = window.LegacyQuestionData?.companies || {};
    Object.keys(legacyCompanies).forEach(companyId => legacyCompanies[companyId].categories?.forEach(category => window.renderLegacyCategory?.(companyId, category.id)));
    const cards = [...document.querySelectorAll('.qa-card')].filter(card => (card.textContent || '').toLocaleLowerCase().includes(query));
    const summary = document.createElement('p');
    summary.className = 'global-search-summary';
    summary.textContent = `${cards.length} 筆結果`;
    results.appendChild(summary);
    cards.slice(0, 20).forEach(card => {
      const content = card.closest('.sub-content');
      const [companyId, ...categoryParts] = (content?.id || '').replace(/^content-/, '').split('-');
      const result = document.createElement('button');
      result.type = 'button';
      result.className = 'global-search-result';
      result.dataset.company = companyId || '';
      result.dataset.category = categoryParts.join('-');
      result.dataset.questionId = card.dataset.questionId || '';
      result.textContent = (card.querySelector('button span')?.textContent || card.textContent || '').replace(/\s+/g, ' ').trim();
      results.appendChild(result);
    });
    if (!cards.length) {
      const empty = document.createElement('p');
      empty.className = 'global-search-empty';
      empty.textContent = '找不到符合的題目';
      results.appendChild(empty);
    }
    results.hidden = false;
  };
  const resetProgress = () => {
    if (!window.confirm?.('確定要清除本機所有練習進度嗎？')) return;
    Object.keys(state.questions).forEach(id => delete state.questions[id]);
    state.practiceHistory = [];
    save();
    document.querySelectorAll('.qa-card').forEach(card => card.classList.remove('mastered'));
    renderInsights();
  };
  const practiceAction = action => {
    if (!practiceSession) return;
    const card = practiceSession.cards[practiceSession.index];
    if (action === 'close') return closePractice();
    if (action === 'reveal') { practiceSession.revealed = !practiceSession.revealed; return renderPracticeSession(); }
    if (action === 'master') { toggle(card.dataset.questionId); return renderPracticeSession(); }
    if (action === 'next') { practiceSession.index = (practiceSession.index + 1) % practiceSession.cards.length; practiceSession.revealed = false; return renderPracticeSession(); }
  };
  const mountWorkspaceShell = () => {
    const main = document.getElementById('main-container');
    if (!main || document.getElementById('workspace-rail')) return;
    main.classList.add('workspace-main');
    const rail = document.createElement('aside');
    rail.id = 'workspace-rail'; rail.className = 'workspace-rail'; rail.setAttribute('aria-label', '面試職缺導覽');
    rail.innerHTML = `<div class="rail-brand"><span class="rail-mark">LZ</span><div><b>Interview<br>Workspace</b><small>local-first</small></div></div><p class="rail-label">準備中</p><nav class="rail-links" data-primary-company-nav="desktop" aria-label="公司導覽" role="tablist">${[['asml','ASML UIR','microchip'],['assembly','ASML Assembly','screwdriver-wrench'],['fstech','台塑勝高','chart-line'],['benq','明基材料｜塗佈','layer-group']].map(([id, label, icon]) => `<button class="company-nav-card" data-rail-company="${id}" data-company="${id}" role="tab" aria-selected="${id === state.activeCompanyId}"${id === state.activeCompanyId ? ' aria-current="page"' : ''}><span data-icon="${icon}" aria-hidden="true"></span><span>${label}</span></button>`).join('')}</nav><p class="rail-label">已完成面試</p><button class="rail-archive" data-rail-archive>美光・上緯・天虹</button>`;
    window.AppIcons?.hydrate(rail);
    main.parentNode.insertBefore(rail, main);
    rail.querySelectorAll('[data-rail-company]').forEach(button => button.addEventListener('click', () => window.switchCompany(button.dataset.railCompany)));
    rail.querySelector('[data-rail-archive]').addEventListener('click', () => window.toggleArchive());
    const shell = document.createElement('div'); shell.className = 'workspace-layout';
    main.parentNode.insertBefore(shell, rail); shell.appendChild(rail); shell.appendChild(main);
    const context = document.createElement('aside'); context.id = 'workspace-context'; context.className = 'workspace-context'; context.setAttribute('aria-label', '練習進度與快速操作');
    context.innerHTML = '<section class="context-card"><label class="context-label" for="global-search">全域搜尋</label><input id="global-search" class="global-search-input" type="search" placeholder="搜尋所有公司、分類與答案" autocomplete="off" data-action="global-search"><div id="global-search-results" class="global-search-results" hidden></div><button type="button" class="reset-progress" data-action="reset-progress">清除練習進度</button></section>';
    context.querySelector('[data-action="global-search"]')?.addEventListener('input', event => renderGlobalResults(event.target.value));
    context.addEventListener('click', event => {
      const result = event.target.closest('.global-search-result');
      if (!result) return;
      window.switchCompany?.(result.dataset.company);
      window.switchSubTab?.(result.dataset.company, result.dataset.category);
      const card = [...document.querySelectorAll('.qa-card')].find(item => item.dataset.questionId === result.dataset.questionId);
      card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card?.classList.add('practice-highlight');
      setTimeout(() => card?.classList.remove('practice-highlight'), 2200);
    });
    shell.appendChild(context);
    const syncRail = () => rail.querySelectorAll('[data-rail-company]').forEach(button => { const active = button.dataset.railCompany === state.activeCompanyId; button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active)); if (active) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current'); });
    syncRail();
    window.addEventListener('interview-state-change', syncRail);
  };
  const enhanceAccordionA11y = () => {
    document.querySelectorAll('.qa-card > button').forEach((button, index) => {
      const wrapper = button.nextElementSibling;
      if (!wrapper?.classList.contains('accordion-wrapper')) return;
      const id = wrapper.id || `accordion-${index + 1}`;
      wrapper.id = id;
      button.setAttribute('aria-controls', id);
      button.setAttribute('aria-expanded', String(wrapper.classList.contains('open')));
      button.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); window.toggleCard?.(button); button.setAttribute('aria-expanded', String(wrapper.classList.contains('open'))); }
      });
    });
    const originalExpandAll = window.expandAll;
    if (typeof originalExpandAll === 'function' && !originalExpandAll.__a11yWrapped) {
      const wrapped = () => { originalExpandAll(); document.querySelectorAll('.company-section.block .qa-card > button').forEach(button => button.setAttribute('aria-expanded', 'true')); };
      wrapped.__a11yWrapped = true;
      window.expandAll = wrapped;
    }
  };
  const buildQuestionRegistry = () => {
    const registry = { schemaVersion: 1, companies: {} };
    const legacy = window.LegacyQuestionData?.companies || {};
    Object.entries(legacy).forEach(([id, company]) => { registry.companies[id] = company; });
    const banks = window.InterviewQuestionBanks || {};
    Object.entries(banks).forEach(([companyId, config]) => {
      const categories = Object.entries(config).filter(([, value]) => Array.isArray(value)).map(([categoryId, entries]) => ({
        id: categoryId,
        label: categoryId,
        icon: '',
        description: '',
        questions: entries.map(([question, answer, tip], index) => {
          const id = window.InterviewQuestionIds?.[companyId]?.[categoryId]?.[index];
          if (!id) throw new Error(`Missing immutable question ID: ${companyId}.${categoryId}[${index}]`);
          return { id, question, answerHtml: `<p>${answer}</p><p>${tip || ''}</p>`, tip: tip || '', priority: 'standard', language: /[A-Za-z]/.test(question) && !/[\u4e00-\u9fff]/.test(question) ? 'en' : 'zh-TW', tags: [] };
        })
      }));
      registry.companies[companyId] = { id: companyId, name: config.name || companyId, shortName: companyId, status: 'active', role: '', eyebrow: config.eyebrow || '', title: config.title || '', summary: config.summary || '', accent: 'navy', categories };
    });
    window.InterviewQuestionRegistry = registry;
    return registry;
  };
  window.enhanceInterviewA11y = enhanceAccordionA11y;
  window.refreshInterviewQuestionRegistry = buildQuestionRegistry;
  const installDelegatedInteractions = () => {
    document.addEventListener('click', event => {
      const target = event.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;
      if (action === 'switch-company') { window.switchCompany?.(target.dataset.company); if (target.dataset.closeArchive) window.toggleArchive?.(); }
      if (action === 'switch-subtab') window.switchSubTab?.(target.dataset.company, target.dataset.category);
      if (action === 'toggle-card') window.toggleCard?.(target);
      if (action === 'toggle-archive') window.toggleArchive?.();
      if (action === 'scroll-top') window.scrollToTop?.();
      if (action === 'expand-all') window.expandAll?.();
      if (action === 'timer') window.startTimer?.(target.dataset.target, Number(target.dataset.seconds || 120));
      if (action === 'speak') window.speakText?.(target);
      if (action === 'mastered') window.toggleMastered?.(target, Number(target.dataset.legacyIndex || 0));
      if (action === 'random') window.randomPractice?.(target.dataset.content);
      if (action === 'reset-progress') resetProgress();
      if (action === 'practice') practiceAction(target.dataset.practiceAction);
    });
    document.addEventListener('click', event => { const target = event.target.closest('[data-practice-mode]'); if (target) quickPractice(target.dataset.practiceMode); });
    document.addEventListener('input', event => {
      const target = event.target.closest('[data-action="filter"]');
      if (target) window.filterInterviewCards?.(target, target.dataset.content);
    });
    document.addEventListener('change', event => {
      const target = event.target.closest('[data-action="status-filter"]');
      if (target) window.filterInterviewCards?.(target, target.dataset.content);
    });
  };
  const api = { KEY, state, migrateLegacy, getQuestion, mark, toggle, save, resetProgress };
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
      button.innerHTML = `${window.AppIcons?.render('check') || ''} ${record.mastered ? '已掌握' : '標記掌握'}`;
    }
  };
  window.addEventListener('DOMContentLoaded', () => { buildQuestionRegistry(); migrateLegacy(); mountWorkspaceShell(); enhanceAccordionA11y(); installDelegatedInteractions(); renderInsights(); }, { once: true });
  window.addEventListener('interview-state-change', renderInsights);
  window.addEventListener('keydown', event => {
    if (practiceSession && !['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
      if (event.key === 'Escape') return closePractice();
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); return practiceAction('reveal'); }
      if (event.key.toLowerCase() === 'm') return practiceAction('master');
      if (event.key.toLowerCase() === 'n') return practiceAction('next');
      if (event.key.toLowerCase() === 't') return practiceSession.cards[practiceSession.index]?.querySelector('[data-action="timer"]')?.click();
    }
    if (event.key !== 'Escape') return;
    const drawer = document.getElementById('archive-drawer');
    if (drawer?.classList.contains('open') && typeof window.toggleArchive === 'function') {
      window.toggleArchive();
      document.querySelector('[aria-controls="archive-drawer"]')?.focus();
    }
  });
})();

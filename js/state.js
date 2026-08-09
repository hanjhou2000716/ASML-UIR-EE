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
    next.questions = next.questions && typeof next.questions === 'object' ? next.questions : {};
    next.practiceHistory = Array.isArray(next.practiceHistory) ? next.practiceHistory.filter(item => item && item.questionId && item.at).slice(-30) : [];
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
    const legacyIds = new Map();
    document.querySelectorAll('.qa-card').forEach(card => {
      const content = card.closest('.sub-content')?.id?.replace(/^content-/, '').split('-') || [];
      const company = content.shift() || 'legacy';
      const category = content.join('-') || 'general';
      const fallback = card.id || card.dataset.legacyKey || `legacy.${company}.${category}.unregistered`;
      const occurrence = legacyIds.get(fallback) || 0;
      legacyIds.set(fallback, occurrence + 1);
      const id = card.dataset.questionId || `${fallback}${occurrence ? `-${occurrence + 1}` : ''}`;
      card.dataset.questionId = id;
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
      return `<div class="insight-row"><div class="flex justify-between text-[11px] text-slate-600"><span>${name}</span><b>${value.mastered}/${value.total}</b></div><div class="insight-track"><span style="width:${percent}%"></span></div></div>`;
    }).join('');
    const companyRows = Object.values(registry).filter(company => company.status === 'active').slice(0, 7).map(company => {
      const total = company.categories.reduce((sum, category) => sum + category.questions.length, 0);
      const done = company.categories.reduce((sum, category) => sum + category.questions.filter(question => state.questions[question.id]?.mastered).length, 0);
      const percent = total ? Math.round(done / total * 100) : 0;
      return `<div class="heatmap-cell" tabindex="0" aria-label="${company.name} ${done}/${total} 題已掌握"><span>${company.shortName || company.id}</span><b>${percent}%</b></div>`;
    }).join('');
    const historyDays = Array.from({ length: 7 }, (_, index) => { const day = new Date(); day.setHours(0, 0, 0, 0); day.setDate(day.getDate() - (6 - index)); const nextDay = new Date(day); nextDay.setDate(day.getDate() + 1); const count = state.practiceHistory.filter(item => { const at = new Date(item.at); return at >= day && at < nextDay; }).length; return `<div class="history-bar" title="${day.toLocaleDateString('zh-TW')}：${count} 次練習" aria-label="${day.toLocaleDateString('zh-TW')} ${count} 次練習"><span style="height:${Math.min(100, count * 25)}%"></span><small>${day.getDate()}</small></div>`; }).join('');
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
    rail.innerHTML = `<div class="rail-brand"><span class="rail-mark">LZ</span><div><b>Interview<br>Workspace</b><small>local-first</small></div></div><p class="rail-label">準備中</p><nav class="rail-links">${[['asml','ASML UIR'],['assembly','ASML Assembly'],['fstech','台塑勝高'],['benq','明基材料｜塗佈']].map(([id, label]) => `<button data-rail-company="${id}">${label}</button>`).join('')}</nav><p class="rail-label">已完成面試</p><button class="rail-archive" data-rail-archive>美光・上緯・天虹</button>`;
    main.parentNode.insertBefore(rail, main);
    rail.querySelectorAll('[data-rail-company]').forEach(button => button.addEventListener('click', () => window.switchCompany(button.dataset.railCompany)));
    rail.querySelector('[data-rail-archive]').addEventListener('click', () => window.toggleArchive());
    const style = document.createElement('style');
    style.textContent = `.workspace-layout{display:grid;grid-template-columns:220px minmax(0,1fr) 280px;gap:24px;max-width:1440px;margin:0 auto;padding:24px}.workspace-rail{position:sticky;top:92px;height:max-content;background:#fbfaf6;border:1px solid #dfddd6;border-radius:20px;padding:18px;box-shadow:0 8px 24px rgba(38,52,66,.05)}.rail-brand{display:flex;gap:10px;align-items:center;color:#1f3654}.rail-mark{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:#1f3654;color:#fff;font-weight:900}.rail-brand small{display:block;color:#71866e;font-size:10px;margin-top:3px}.rail-label{margin:20px 0 8px;color:#8a918a;font-size:10px;font-weight:900;letter-spacing:.14em}.rail-links{display:grid;gap:5px}.rail-links button,.rail-archive{width:100%;text-align:left;border:0;background:transparent;border-radius:10px;padding:10px;color:#536170;font-size:12px;font-weight:800;cursor:pointer}.rail-links button:hover,.rail-links button:focus-visible,.rail-archive:hover,.rail-archive:focus-visible{background:#edf2ea;color:#1f3654}.workspace-main{max-width:none;margin:0;padding:0}.workspace-insights{min-height:100px}.insight-row{display:grid;gap:4px}.insight-track{height:6px;border-radius:99px;background:#e8e8e2;overflow:hidden}.insight-track span{display:block;height:100%;background:#91a48e;border-radius:inherit;transition:width .3s ease}.quick-practice{display:grid;gap:7px;margin-top:14px}.quick-practice button{border:1px solid #d8ddd5;background:#fff;border-radius:10px;padding:9px;text-align:left;color:#1f3654;font-size:11px;font-weight:800;cursor:pointer}.quick-practice button:hover,.quick-practice button:focus-visible{border-color:#d9823b;background:#fffaf5}.heatmap-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.heatmap-cell{display:flex;align-items:center;justify-content:space-between;padding:8px 9px;border-radius:9px;background:#edf2ea;color:#536170;font-size:10px}.heatmap-cell b{color:#1f3654}.history-chart{height:72px;display:flex;align-items:end;gap:6px;padding:8px;border-bottom:1px solid #d8ddd5;background:#fff}.history-bar{height:100%;flex:1;display:flex;flex-direction:column;justify-content:end;align-items:center;gap:3px;color:#8a918a;font-size:9px}.history-bar span{display:block;width:100%;min-height:2px;border-radius:5px 5px 0 0;background:#d9823b}.practice-session{position:fixed;inset:0;z-index:100;background:rgba(31,54,84,.28);display:grid;place-items:center;padding:18px}.practice-session-card{width:min(620px,100%);max-height:90vh;overflow:auto;background:#fcfbf8;border:1px solid #dfddd6;border-radius:22px;padding:24px;box-shadow:0 20px 60px rgba(31,54,84,.25)}.practice-session-close{width:40px;height:40px;border:1px solid #d8ddd5;border-radius:12px;background:#fff;color:#536170;font-size:24px;line-height:1}.practice-session-answer{border-top:1px solid #e4e1da;padding-top:14px;color:#536170;line-height:1.7}.practice-session-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}.practice-session-actions button{border:1px solid #d8ddd5;border-radius:10px;background:#fff;color:#1f3654;padding:10px 14px;font-weight:800;cursor:pointer}.practice-session-actions button.primary{background:#d9823b;color:#fff;border-color:#d9823b}@media(max-width:760px){.workspace-layout{display:block;padding:12px}.workspace-rail{position:static;margin-bottom:12px;display:flex;align-items:center;gap:8px;overflow:auto}.rail-brand,.rail-label,.rail-archive{display:none}.rail-links{display:flex;min-width:max-content}.rail-links button{white-space:nowrap;padding:9px 12px}.workspace-main{width:100%}}@media(prefers-reduced-motion:reduce){.insight-track span{transition:none}.practice-session{transition:none}}`;
    // Workspace shell styles are loaded once from assets/app.css.
    const utilityStyle = document.createElement('style');
    utilityStyle.textContent = `.context-card{background:#fbfaf6;border:1px solid #dfddd6;border-radius:20px;padding:16px;box-shadow:0 8px 24px rgba(38,52,66,.05)}.context-label{display:block;margin-bottom:8px;color:#536170;font-size:11px;font-weight:900}.global-search-input{width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#263442;font-size:12px}.global-search-input:focus{outline:3px solid rgba(217,130,59,.18);border-color:#d9823b}.global-search-results{margin-top:10px;max-height:360px;overflow:auto}.global-search-summary,.global-search-empty{margin:8px 0;color:#71808e;font-size:11px}.global-search-result{display:block;width:100%;padding:9px 8px;border:0;border-bottom:1px solid #edf0eb;background:transparent;color:#1f3654;text-align:left;font-size:11px;line-height:1.45;cursor:pointer}.global-search-result:hover,.global-search-result:focus-visible{background:#edf2ea}.reset-progress{width:100%;margin-top:14px;padding:9px;border:1px solid #e2b09a;border-radius:10px;background:#fff8f4;color:#a34f2d;font-size:11px;font-weight:800;cursor:pointer}.reset-progress:hover,.reset-progress:focus-visible{background:#fce9df}`;
    // Utility styles are loaded once from assets/app.css.
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
        questions: entries.map(([question, answer, tip], index) => ({ id: window.InterviewQuestionIds?.[companyId]?.[categoryId]?.[index] || `${companyId}.${categoryId}.unregistered-${index + 1}`, question, answerHtml: `<p>${answer}</p><p>${tip || ''}</p>`, tip: tip || '', priority: 'standard', language: /[A-Za-z]/.test(question) && !/[\u4e00-\u9fff]/.test(question) ? 'en' : 'zh-TW', tags: [] }))
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

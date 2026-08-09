        let activeTimer = null;
        let speechSynthesisActive = false;
        let roleBanksReady = false;

        window.addEventListener('DOMContentLoaded', () => {
            ensureRoleBanks();
            document.querySelectorAll('.qa-card > button').forEach(button => button.setAttribute('aria-expanded', 'false'));
            switchCompany(window.InterviewState?.state.activeCompanyId || 'asml');
        });

        function ensureRoleBanks() {
            if (roleBanksReady) return;
            deployRoleQuestionBanks();
            roleBanksReady = true;
            injectPracticeTools();
            window.AppIcons?.hydrate(document);
            window.InterviewState?.migrateLegacy?.();
            window.refreshInterviewQuestionRegistry?.();
        }

        function injectPracticeTools() {
            document.querySelectorAll('.accordion-inner > div').forEach((container, index) => {
                if (container.closest('#content-asml-script') || 
                    container.closest('#content-swancor-script') || 
                    container.closest('#content-skyeuv-script') ||
                    container.closest('#content-micron-script') ||
                    container.querySelector('.practice-tools')) {
                    return;
                }
                
                const legacyId = container.closest('.qa-card')?.dataset.questionId || `legacy.card.${index + 1}`;
                const mastered = Boolean(window.InterviewState?.getQuestion(legacyId)?.mastered);
                if (mastered) container.closest('.qa-card')?.classList.add('mastered');
                const toolsHtml = `
                    <div class="practice-tools flex items-center justify-between gap-2 mb-3 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                        <div class="flex gap-2">
                            <button data-action="timer" data-target="timer-${index}" data-seconds="120" class="text-[11px] font-bold bg-white border border-slate-200 shadow-sm px-2 py-1 rounded-md text-slate-600 hover:text-blue-600 transition"><span data-icon="stopwatch" class="text-blue-500"></span> 計時練習</button>
                            <button data-action="speak" class="text-[11px] font-bold bg-white border border-slate-200 shadow-sm px-2 py-1 rounded-md text-slate-600 hover:text-emerald-600 transition"><span data-icon="volume-up" class="text-emerald-500"></span> 語音朗讀</button>
                            <button data-action="mastered" data-legacy-index="${index}" class="text-[11px] font-bold bg-white border border-slate-200 shadow-sm px-2 py-1 rounded-md ${mastered ? 'mastered-badge' : 'text-slate-600'} transition"><span data-icon="check" class=""></span> ${mastered ? '已掌握' : '標記掌握'}</button>
                        </div>
                        <span id="timer-${index}" class="timer-display text-[13px] font-mono font-black text-slate-400 hidden">02:00</span>
                    </div>
                `;
                container.insertAdjacentHTML('afterbegin', toolsHtml);
            });
        }

        function startTimer(elementId, seconds) {
            const display = document.getElementById(elementId);
            if (activeTimer && activeTimer.id === elementId) {
                clearInterval(activeTimer.interval);
                display.classList.add('hidden');
                display.classList.remove('timer-active', 'timer-warning');
                activeTimer = null;
                return;
            }
            if (activeTimer) {
                clearInterval(activeTimer.interval);
                const oldDisplay = document.getElementById(activeTimer.id);
                if(oldDisplay) oldDisplay.classList.add('hidden');
            }

            display.classList.remove('hidden', 'timer-warning');
            display.classList.add('timer-active');
            let remaining = seconds;
            
            const interval = setInterval(() => {
                const m = Math.floor(remaining / 60).toString().padStart(2, '0');
                const s = (remaining % 60).toString().padStart(2, '0');
                display.textContent = `${m}:${s}`;
                
                if (remaining <= 30) {
                    display.classList.remove('timer-active');
                    display.classList.add('timer-warning');
                }
                if (remaining <= 0) {
                    clearInterval(interval);
                    display.textContent = "時間到！";
                    display.classList.remove('timer-warning');
                    setTimeout(() => display.classList.add('hidden'), 3000);
                }
                remaining--;
            }, 1000);

            activeTimer = { id: elementId, interval: interval };
        }

        function speakText(btn) {
            if (!('speechSynthesis' in window)) {
                showInlineNotice('目前瀏覽器不支援語音朗讀功能。', btn);
                return;
            }
            const container = btn.closest('.accordion-inner');
            let text = container.innerText;
            text = text.replace(/計時練習/g, '').replace(/語音朗讀/g, '').replace(/\d{2}:\d{2}/g, '').replace(/時間到！/g, '');

            window.speechSynthesis.cancel();
            
            if (speechSynthesisActive && btn.dataset.playing === 'true') {
                speechSynthesisActive = false;
                btn.dataset.playing = 'false';
                btn.innerHTML = '<span data-icon="volume-up" class="text-emerald-500"></span> 語音朗讀';
                return;
            }

            document.querySelectorAll('.app-icon.text-rose-500').forEach(icon => {
                const b = icon.closest('button');
                if(b){
                    b.dataset.playing = 'false';
                    b.innerHTML = '<span data-icon="volume-up" class="text-emerald-500"></span> 語音朗讀';
                }
            });

            const utterance = new SpeechSynthesisUtterance(text);
            const engCount = (text.match(/[a-zA-Z]/g) || []).length;
            const chiCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
            utterance.lang = engCount > chiCount ? 'en-US' : 'zh-TW';
            utterance.rate = 1.1;

            utterance.onend = () => {
                speechSynthesisActive = false;
                btn.dataset.playing = 'false';
                btn.innerHTML = '<span data-icon="volume-up" class="text-emerald-500"></span> 語音朗讀';
            };

            speechSynthesisActive = true;
            btn.dataset.playing = 'true';
            btn.innerHTML = '<span data-icon="stop" class="text-rose-500"></span> 停止朗讀';
            window.speechSynthesis.speak(utterance);
        }

        function deployRoleQuestionBanks() {
            const tabs = [
                ['script', '專屬劇本', 'script'], ['tech', '專業邏輯', 'wrench'], ['product', '職務速覽', 'microchip'],
                ['motiv', '動機特質', 'motivation'], ['behav', '經歷行為', 'briefcase'], ['sit', '情境應變', 'shield'], ['combat', '實戰攻防', 'combat']
            ];
            const roleQuestionIds = {
                assembly: {
                    script: ['assembly.script.q01', 'assembly.script.q02', 'assembly.script.q03', 'assembly.script.q04', 'assembly.script.q05', 'assembly.script.q06', 'assembly.script.q07', 'assembly.script.q08', 'assembly.script.q09', 'assembly.script.q10', 'assembly.script.q11'],
                    tech: ['assembly.tech.q01', 'assembly.tech.q02', 'assembly.tech.q03', 'assembly.tech.q04', 'assembly.tech.q05', 'assembly.tech.q06', 'assembly.tech.q07', 'assembly.tech.q08', 'assembly.tech.q09', 'assembly.tech.q10', 'assembly.tech.q11'],
                    product: ['assembly.product.q01', 'assembly.product.q02', 'assembly.product.q03', 'assembly.product.q04', 'assembly.product.q05', 'assembly.product.q06', 'assembly.product.q07', 'assembly.product.q08', 'assembly.product.q09', 'assembly.product.q10'],
                    motiv: ['assembly.motiv.q01', 'assembly.motiv.q02', 'assembly.motiv.q03', 'assembly.motiv.q04', 'assembly.motiv.q05', 'assembly.motiv.q06', 'assembly.motiv.q07', 'assembly.motiv.q08', 'assembly.motiv.q09', 'assembly.motiv.q10'],
                    behav: ['assembly.behav.q01', 'assembly.behav.q02', 'assembly.behav.q03', 'assembly.behav.q04', 'assembly.behav.q05', 'assembly.behav.q06', 'assembly.behav.q07', 'assembly.behav.q08', 'assembly.behav.q09', 'assembly.behav.q10'],
                    sit: ['assembly.sit.q01', 'assembly.sit.q02', 'assembly.sit.q03', 'assembly.sit.q04', 'assembly.sit.q05', 'assembly.sit.q06', 'assembly.sit.q07', 'assembly.sit.q08', 'assembly.sit.q09', 'assembly.sit.q10'],
                    combat: ['assembly.combat.q01', 'assembly.combat.q02', 'assembly.combat.q03', 'assembly.combat.q04', 'assembly.combat.q05', 'assembly.combat.q06', 'assembly.combat.q07', 'assembly.combat.q08', 'assembly.combat.q09', 'assembly.combat.q10', 'assembly.combat.q11']
                },
                fstech: {
                    script: ['fstech.script.q01', 'fstech.script.q02', 'fstech.script.q03', 'fstech.script.q04', 'fstech.script.q05', 'fstech.script.q06', 'fstech.script.q07', 'fstech.script.q08', 'fstech.script.q09', 'fstech.script.q10', 'fstech.script.q11'],
                    tech: ['fstech.tech.q01', 'fstech.tech.q02', 'fstech.tech.q03', 'fstech.tech.q04', 'fstech.tech.q05', 'fstech.tech.q06', 'fstech.tech.q07', 'fstech.tech.q08', 'fstech.tech.q09', 'fstech.tech.q10', 'fstech.tech.q11'],
                    product: ['fstech.product.q01', 'fstech.product.q02', 'fstech.product.q03', 'fstech.product.q04', 'fstech.product.q05', 'fstech.product.q06', 'fstech.product.q07', 'fstech.product.q08', 'fstech.product.q09', 'fstech.product.q10'],
                    motiv: ['fstech.motiv.q01', 'fstech.motiv.q02', 'fstech.motiv.q03', 'fstech.motiv.q04', 'fstech.motiv.q05', 'fstech.motiv.q06', 'fstech.motiv.q07', 'fstech.motiv.q08', 'fstech.motiv.q09', 'fstech.motiv.q10'],
                    behav: ['fstech.behav.q01', 'fstech.behav.q02', 'fstech.behav.q03', 'fstech.behav.q04', 'fstech.behav.q05', 'fstech.behav.q06', 'fstech.behav.q07', 'fstech.behav.q08', 'fstech.behav.q09', 'fstech.behav.q10'],
                    sit: ['fstech.sit.q01', 'fstech.sit.q02', 'fstech.sit.q03', 'fstech.sit.q04', 'fstech.sit.q05', 'fstech.sit.q06', 'fstech.sit.q07', 'fstech.sit.q08', 'fstech.sit.q09', 'fstech.sit.q10'],
                    combat: ['fstech.combat.q01', 'fstech.combat.q02', 'fstech.combat.q03', 'fstech.combat.q04', 'fstech.combat.q05', 'fstech.combat.q06', 'fstech.combat.q07', 'fstech.combat.q08', 'fstech.combat.q09', 'fstech.combat.q10']
                },
                benq: {
                    script: ['benq.script.q01', 'benq.script.q02', 'benq.script.q03', 'benq.script.q04', 'benq.script.q05', 'benq.script.q06', 'benq.script.q07', 'benq.script.q08', 'benq.script.q09', 'benq.script.q10', 'benq.script.q11', 'benq.script.q12', 'benq.script.q13'],
                    tech: ['benq.tech.q01', 'benq.tech.q02', 'benq.tech.q03', 'benq.tech.q04', 'benq.tech.q05', 'benq.tech.q06', 'benq.tech.q07', 'benq.tech.q08', 'benq.tech.q09', 'benq.tech.q10', 'benq.tech.q11'],
                    product: ['benq.product.q01', 'benq.product.q02', 'benq.product.q03', 'benq.product.q04', 'benq.product.q05', 'benq.product.q06', 'benq.product.q07', 'benq.product.q08', 'benq.product.q09', 'benq.product.q10'],
                    motiv: ['benq.motiv.q01', 'benq.motiv.q02', 'benq.motiv.q03', 'benq.motiv.q04', 'benq.motiv.q05', 'benq.motiv.q06', 'benq.motiv.q07', 'benq.motiv.q08', 'benq.motiv.q09', 'benq.motiv.q10'],
                    behav: ['benq.behav.q01', 'benq.behav.q02', 'benq.behav.q03', 'benq.behav.q04', 'benq.behav.q05', 'benq.behav.q06', 'benq.behav.q07', 'benq.behav.q08', 'benq.behav.q09', 'benq.behav.q10'],
                    sit: ['benq.sit.q01', 'benq.sit.q02', 'benq.sit.q03', 'benq.sit.q04', 'benq.sit.q05', 'benq.sit.q06', 'benq.sit.q07', 'benq.sit.q08', 'benq.sit.q09', 'benq.sit.q10'],
                    combat: ['benq.combat.q01', 'benq.combat.q02', 'benq.combat.q03', 'benq.combat.q04', 'benq.combat.q05', 'benq.combat.q06', 'benq.combat.q07', 'benq.combat.q08', 'benq.combat.q09', 'benq.combat.q10']
                }
            };
            window.InterviewQuestionIds = roleQuestionIds;
            const banks = {
                assembly: {
                    name: 'ASML Assembly', eyebrow: 'ASML · FINAL ASSEMBLY',
                    title: '從組裝到系統穩定，我對交付結果負責。',
                    summary: '以 PVD 現場實戰、機械背景與跨部門協作，證明自己能把組裝、校正、測試和改善串成可靠的系統交付。',
                    script: [
                        ['為什麼想從設備維護走到 Assembly？', '我喜歡把模組組裝、校正與功能測試串成穩定的整機。PVD 現場讓我理解：設備可用性不只靠修復，更取決於前端裝配品質、測試紀錄與交接；我希望把現場經驗轉為可複製的整合能力。', '先講「整機交付」的吸引力，不要說只是想換工作環境。'],
                        ['為什麼 ASML、為什麼是 E-beam Assembly？', '我重視高精密設備中機構、電控、軟體與測試的連動。這個職位能讓我在無塵室完成組裝與 qualification，也有機會把系統交付延伸到客戶端，符合我想從第一線實務累積系統整合能力的方向。', '用職務內容回答，不空泛地說「公司很有名」。'],
                        ['你能帶給團隊的三個價值？', '第一是無塵室與設備紀律；第二是以 log、現場觀察縮小異常範圍的排障習慣；第三是把問題、處置與交接寫清楚，讓跨班與跨部門協作可追溯。', '三點都要連回職務需求：品質、獨立性、溝通。'],
                        ['為何離開台積電？', '我珍惜台積讓我接觸先進製程設備與高標準維護文化。下一步我想把既有的現場排障能力，往整機組裝、校正與系統整合延伸；這是職涯能力範圍的擴張，不是對前公司的否定。', '避免抱怨工時、制度或主管。'],
                        ['輪班、週末支援與出差 10–30% 可以配合嗎？', '可以。我理解這是產品交付和客戶支援的一部分。我會事先做好交接、紀錄與體力安排，確保高壓時仍能維持檢查品質；並把出差的問題與解法回饋為團隊知識。', '回答要直接、穩定，不要加「但如果太頻繁」。']
                    ],
                    tech: [
                        ['如何處理一個異常 test result？', '我會先確認測試條件、版本與 acceptance criteria，再與 golden data 或前次結果比較。接著從單一模組、介面、參數到系統性偏移建立假設，以紀錄和可重複的測試逐步縮小範圍，必要時帶著完整證據向 TS、PE 或 D&E 升級。', '重點是「驗證假設」，不是立刻猜根因。'],
                        ['系統校正與 qualification 的核心是什麼？', '校正是把系統調整到規格基準，qualification 是透過功能與性能測試證明系統能穩定符合該基準。我的做法會重視前置條件、測試結果可追溯性、異常判定邊界與最終交接資料完整。', '使用規格、基準、可追溯三個字。'],
                        ['若裝配進度落後，你如何處理？', '我先確認品質與安全不能被壓縮，再拆出卡點、受影響工序、可平行工作與需支援資源。當天向 team leader 回報現況、風險與可行的新計畫，確認後逐項追蹤 action，而不是等到最後才報告延誤。', '展現主動管理，而非只通報問題。'],
                        ['如何面對 recurring issue？', '我會整理發生條件、影響、暫行措施和已驗證結果，與相關團隊確認根因；再把改善落到 checklist、SOP、工具防呆或訓練。最後追蹤重複率、工時或測試通過率，確認問題沒有被移到下一站。', '一定要說到防再發與效果追蹤。'],
                        ['你怎麼寫 technical report？', '報告會先讓讀者一眼看懂結論與風險，再依序寫背景、測試條件、現象與數據、已排除事項、根因假設、建議 action 與 owner。這能讓 TS、PE、主管快速決定下一步。', '用條理證明你可以獨立作業。']
                    ],
                    product: [
                        ['你如何理解 Assembly 的工作流程？', '從元件卸載與模組安裝開始，依計畫完成整機整合，接著進行校正、功能測試與 qualification，確認性能後完成紀錄與交接；若在工廠或客戶端執行，還要兼顧現場協作、進度與技術支援。', '回答流程時要帶入品質門檻。'],
                        ['機構、電子與軟體測試如何互相影響？', '整機異常不應先假設只屬於某一領域。機構裝配精度可能影響感測或性能，電子介面與軟體版本也可能改變 test result；我會以測試條件與系統介面為線索，和各領域一起縮小範圍。', '展現 multi-disciplinary team 意識。'],
                        ['為何 workflow logging 很重要？', '它讓每次中斷、處置、等待與恢復都有脈絡，可用來交接、排程、分析重複問題和改善 cycle time。在高精密設備環境，良好紀錄也是品質與責任的基礎。', '不要把紀錄講成行政工作。'],
                        ['Prototype transfer 到工廠時的挑戰？', '原型機的知識常分散在開發團隊與現場。我會特別重視版本、關鍵組裝條件、測試基準、已知風險與回饋機制，讓工廠能穩定複製，而不只靠少數人記憶。', '連回 knowledge transfer。']
                    ],
                    motiv: [
                        ['你對技術的熱情是什麼？', '我最有成就感的是把模糊異常變成可以驗證的問題，再和團隊找到可持續的解法。這種從現場觀察、數據比對到改善落地的過程，正是我願意持續投入設備與整合工作的原因。', '熱情要有具體工作行為支撐。'],
                        ['如何面對高壓與多任務？', '我會先以安全、品質、交期排序，將任務拆成可追蹤 action，主動讓利害關係人知道風險與需求。壓力不能靠硬撐，清楚的優先順序和交接才是穩定交付的方法。', '避免只說「我抗壓性很好」。'],
                        ['怎麼把知識分享給新人？', '先確認對方目前理解，再用實際流程、關鍵檢查點與常見失誤講解，讓他能做一次、我觀察一次。最後以 checklist 或簡短文件留下可重複的版本，避免知識只停在口頭。', '符合 JD 的 train colleagues。'],
                        ['跨文化溝通的原則？', '我會以事實、版本、時間點和下一步 action 溝通，不假設對方理解相同背景；重要議題用書面整理，確認 owner 與 due date。尊重差異，同時讓資訊足夠精準。', '英文不求華麗，求明確。']
                    ],
                    behav: [
                        ['請說一個設備異常排查的經驗。', '可用台積 PVD 維護經驗回答：先描述異常影響與安全確認，再說你如何查看 log、比對狀態、現場觀察硬體，最後如何和資深同仁、PE 或 Vendor 共同驗證。結果請用實際的恢復、風險降低或交接改善說明。', '務必填入你實際遇到的案例細節，不要虛構數字。'],
                        ['你如何和 Vendor 或 PE 合作？', '我不把自己定位成聯絡窗口。我的責任是先準備完整現象、條件、紀錄與初步判斷，讓 PE 能評估製程影響、Vendor 能有效檢修；確認解法後，再追蹤是否真的改善現場維護性與設備穩定。', '這題直接回應天虹主管的回饋。'],
                        ['系統專案經驗如何幫助 Assembly？', '村田的 AS/RS 系統專案讓我理解專案規劃、介面溝通與進度管理；Assembly 也需要把零件、流程、人員和測試串起來。我會把這種全局觀帶進每日工作與問題追蹤。', '不要誇大技術相同，強調可轉移能力。'],
                        ['封裝與材料研究經驗有何價值？', '日月光的產品與封裝經驗、研究所的散熱材料研究，讓我習慣用實驗條件、數據與可靠度來驗證結論。對 Assembly 而言，這能幫助我尊重規格、理解變因，並把測試結果轉成合理判斷。', '連回 test discipline。']
                    ],
                    sit: [
                        ['客戶現場安裝時出現關鍵異常，怎麼做？', '先確保人員與設備安全，依既定 escalation 和客戶溝通機制控制現場。接著保存測試條件與現象、確認可逆的基本檢查，並與遠端專家建立同一份事實基礎；我會定時更新客戶目前狀態與下一次更新時間。', '避免承諾未驗證的修復時間。'],
                        ['資深同仁的做法與你判斷不同？', '我會先理解他的經驗依據與風險考量，再以測試數據、規格或小範圍驗證提出我的看法。決策確定後我會全力執行並記錄結果，重點是讓系統與團隊更好，而不是證明誰對。', '尊重是核心。'],
                        ['同時有品質問題與交期壓力？', '品質和安全是底線。我會提出可行選項，例如平行排查、調整排程、增加支援或分段驗證，讓主管決定資源取捨；不會為了趕交期跳過必要測試。', '展現判斷與升級能力。'],
                        ['交接時發現前一班紀錄不完整？', '先補足目前可取得的事實與狀態，避免帶著未知繼續操作；再和前一班或主管釐清。事後我會建議將關鍵欄位納入 checklist，降低跨班資訊斷裂。', '不責怪個人，聚焦流程。']
                    ],
                    combat: [
                        ['英文自我介紹（90 秒）', 'Good morning, and thank you for the opportunity. My name is Lyor Zhuang. I have a Mechanical Engineering background from NTUT and a Master’s degree in Advanced Semiconductor Packaging from NSYSU. My experience includes system projects, semiconductor packaging, and hands-on PVD equipment support at TSMC’s 2nm fab. I am used to cleanroom discipline, safety procedures, and troubleshooting with data and hardware observations. I am applying for Assembly because I want to grow into system integration, calibration, and high-quality delivery.', '語速放慢；以自然停頓取代背誦感。'],
                        ['What do you enjoy outside work?', 'Outside work, I enjoy road cycling and strength training. They help me build discipline, patience, and focus. I also enjoy learning practical technical tools and organizing complex information into clear steps. These habits help me stay calm and persistent when I face a difficult engineering problem.', '內容以真實興趣為準；不要為了英文硬編。'],
                        ['What was your work situation at TSMC, and why did you leave?', 'At TSMC’s 2nm fab, I supported PVD equipment maintenance and process-related work in a high-pressure cleanroom environment. I learned to follow strict SOPs, review data and equipment conditions, and work with different teams to resolve issues. I am grateful for that experience. I left because I want to move toward the equipment vendor side, where I can focus more on assembly, calibration, and system integration. This is the long-term direction I want to build.', '明確說是職涯方向，不要批評前公司或工時。'],
                        ['Are you considering other equipment companies?', 'I am exploring opportunities that fit my long-term direction in high-precision semiconductor equipment. However, this Assembly role is especially attractive because it combines hands-on build, calibration, functional testing, and ownership of system delivery. These responsibilities strongly match my mechanical background and fab experience.', '承認求職事實，但立即說明此職缺的獨特契合。'],
                        ['如何回答陌生技術題？', '我會先說明我的判斷原則，例如安全、規格、資料與驗證；若沒有直接經驗，我會誠實說明，再連回我在 PVD 排障或專案協作中用過的相同思考流程。', '不硬答；把球導回你的可驗證能力。']
                    ]
                },
                fstech: {
                    name: '台塑勝高｜生產製程工程師', eyebrow: 'FORMOSA SUMCO TECHNOLOGY',
                    title: '把現場問題轉成穩定量產的製程改善。',
                    summary: '以 PVD 設備經驗、封裝與材料研究、產品工程及供應商協作為基礎，建立品質、效率、成本與自動化並重的製程工程師定位。',
                    script: [
                        ['為什麼從設備工程走向生產製程？', '設備現場讓我直接看見異常如何影響產出；我希望下一步不只把設備恢復，更能用數據理解製程條件、良率與量產效率。這是把第一線實務延伸成系統化改善，而不是離開技術現場。', '把轉職說成能力擴張。'],
                        ['為什麼想加入台塑勝高？', '我希望投入與晶圓供應鏈緊密相關、重視量產穩定與製程改善的環境。這個職位同時包含生產管理、異常分析、效率與成本專案、設備及自動化導入，正好能讓我把設備與製程經驗整合起來。', '以 JD 五項工作內容逐一對應。'],
                        ['你能帶來什麼價值？', '我具備無塵室紀律與設備排障觀點，知道現場資料和實際硬體都不能忽略；也有封裝產品、材料研究與供應商協作經驗，能在品質、製程、設備與外部資源之間用共同的問題定義推進改善。', '避免說成自己全都會。'],
                        ['離開台積電的原因？', '台積讓我養成安全、紀律與先進設備維護的標準。現在我希望把這些基礎延伸到製程優化和量產支援，培養對良率、效率與成本更完整的責任範圍。', '正向、具體、不比較公司好壞。'],
                        ['你未來三到五年的規劃？', '短期先熟悉產品、關鍵製程、品質標準與生產節奏，成為能獨立處理異常與改善專案的人；中期希望能主導跨部門效率或品質改善，累積自動化與量產技術整合能力。', '不要急著說轉管理職。']
                    ],
                    tech: [
                        ['製程異常的處理順序？', 'Contain、Analyze、Verify、Standardize。先控制產品與人員風險，再用 SPC 趨勢、批次、機台、材料與作業條件切分問題；用 5 Why 或魚骨圖形成假設，安排驗證，確認有效後更新規格、SOP 和監控點。', '先止血，再找根因。'],
                        ['SPC 異常你會怎麼看？', '先確認量測系統、資料完整性與規格定義，再判斷是單點異常、趨勢、偏移或變異放大。接著對照批次、機台、原料、操作與維護紀錄，將可能因子排序，不會只因一個點超限就直接改參數。', '強調資料品質與變因切分。'],
                        ['什麼時候使用 5 Why，什麼時候使用魚骨圖？', '當問題鏈條相對明確時，5 Why 能一路追到可行的系統原因；當可能因子多且跨人、機、料、法、環境、量測時，我會先用魚骨圖展開，再以數據驗證。兩者都不能代替證據。', '不要把工具當答案。'],
                        ['如何設計製程改善驗證？', '先定義目標、基準、風險與成功指標，選擇小範圍、可回復的試驗；控制其他變因並記錄條件，確認品質無負面影響後再擴大。若涉及多因子，我會和製程團隊規劃適當 DOE。', '說出量產風險意識。'],
                        ['設備異常與製程異常如何切分？', '兩者常互相影響。我會先從製程結果與設備 log、alarm、維護紀錄交叉比對，找時間與條件的關聯；不急著把責任丟給設備或製程，而是先縮小能被驗證的交集。', '這題是你的設備背景優勢。']
                    ],
                    product: [
                        ['你如何理解生產製程工程師的角色？', '不只是調參或救火，而是連結生產、設備、品質與技術支援：讓量產在規格內穩定運作，遇到異常能快速控制並找出根因，同時持續改善效率、成本與自動化程度。', '用「穩定量產」作為一句話定位。'],
                        ['生產效率要看哪些指標？', '依現場定義，我會看產出、cycle time、瓶頸站、設備稼動與非計畫停機，也會同時看良率和報廢，因為只追產能而犧牲品質不是真正的效率。', '主動說明指標需要和公司定義一致。'],
                        ['成本改善如何避免傷害品質？', '改善案開始就把品質規格、可靠度風險和監控指標列為 gate。任何降低耗材、工時或等待的做法，都先在小範圍驗證，再看良率、異常率和客訴風險是否有副作用。', '成本與品質不可二選一。'],
                        ['自動化導入的第一步？', '先定義明確痛點與基準資料，例如重複人工、錯誤率、等待時間或安全風險；確認流程穩定後再談自動化，否則只是把不穩定流程放大。', '很適合連到 AS/RS 專案經驗。']
                    ],
                    motiv: [
                        ['你對製程改善的熱情是什麼？', '我喜歡把現場的模糊問題轉成可觀察、可驗證、可標準化的改善。當改善不只解決一次異常，還能降低重複問題、幫助同事更容易維持品質，這是我最有成就感的地方。', '要比「我喜歡挑戰」更具體。'],
                        ['如何面對重複、細節多的量產工作？', '量產的價值在穩定和紀律。我會把重複工作中的異常、等待與資訊斷點視為改善來源；先穩定遵守規範，再從資料找出值得優化的地方。', '展現定性，不要讓人覺得容易膩。'],
                        ['如何和主管溝通改善提案？', '先用共同關心的指標說明現況與影響，再提出選項、風險、資源需求和預期驗證方式。我會尊重主管對全局的考量，不把提案包裝成只有一種答案。', '回應「要尊重主管」的回饋。'],
                        ['遇到壓力如何保持穩定？', '我先把安全、品質和時效排序，將問題拆成可執行 action；遇到不確定事項會及早升級，而不是自己硬撐。清楚的紀錄與交接能讓團隊在壓力下仍做出一致判斷。', '避免只說運動或睡覺紓壓。']
                    ],
                    behav: [
                        ['請說一個用資料排障的經驗。', '可用 PVD 維護案例：說明異常現象與影響後，描述你如何查看 log、比對狀態、做現場觀察、和相關人員確認假設。結尾用實際恢復、縮短排查、降低風險或完善交接說明結果。', '先寫下你真實案例的日期、設備現象與結果。'],
                        ['你如何與 Vendor、PE 或供應商合作？', '我會先整理問題定義、數據、現場現象和限制條件，讓對方不必從零猜測；過程中我站在設備穩定、製程風險與維護便利性角度追蹤，確認解法能在現場持續運作。', '避免把自己說成 Call Vendor。'],
                        ['研究所材料研究如何幫助製程工作？', '散熱材料和可靠度研究讓我習慣控制實驗條件、分析界面與相變化、用測試驗證結論。雖然產品不同，但這種對變因、數據和可靠度的態度可以直接用在製程改善。', '不要宣稱自己做過不熟悉的磊晶製程。'],
                        ['產品工程與封裝經驗可帶來什麼？', '日月光的產品與覆晶封裝經驗讓我理解品質、材料、製程和客戶需求彼此連動。我會用更完整的角度看異常，不只盯著單一機台或單一數字。', '突出跨域，而不誇大職責。']
                    ],
                    sit: [
                        ['良率突然下滑但原因不明，怎麼做？', '先確認資料真實、範圍與是否需要 hold；再依批次、機台、材料、時間和操作條件切分，建立優先假設並安排最小風險驗證。過程同步生產、設備、品質，讓每個人知道控制措施和更新節點。', '不要直接大幅調參。'],
                        ['產能壓力下，主管要求先放行有疑慮批次？', '我會清楚說明已知風險、規格依據與可能影響，提出加嚴檢驗、分段處置或補充資料等替代選項。最終依公司品質程序與主管決策執行，但必要風險必須被明確記錄與升級。', '穩定、尊重、守住品質底線。'],
                        ['跨班資訊不完整造成重工，如何改善？', '先補足現況並避免錯誤延續，之後檢視交接流程缺的是欄位、責任或工具。將關鍵條件、異常狀態、下一步 action 和 owner 標準化，並追蹤改善後的重工或等待情形。', '從個人問題導向系統改善。'],
                        ['自動化專案遭現場同仁抗拒？', '我會先理解他們擔心的是操作負擔、安全、技能或流程不穩定，讓使用者早期參與需求與測試。用小規模試行和可見數據證明效益，再完善訓練與異常應變，不用命令式推行。', '你的 AS/RS 專案可作延伸案例。']
                    ],
                    combat: [
                        ['面試官說「你不是製程本科，為何適合？」', '我的優勢不是只懂單一領域。機械背景讓我理解設備與結構，封裝研究訓練我用數據和實驗驗證，PVD 經驗讓我懂現場異常與紀律。這些基礎能幫我更快把設備訊號轉成可用的製程改善。', '不要先自我否定。'],
                        ['你如何定義自己的天賦與熱情？', '我擅長把複雜、模糊的現場問題整理成有步驟的判斷：先找事實、再縮小範圍、和不同專業的人協作、最後留下可重複的改善。這是我在設備、研究和專案工作中都持續投入的事情。', '回答要堅定，不加「可能、應該」。'],
                        ['你的缺點是什麼？', '我對不確定問題會想先把資料釐清，早期有時會花太多時間自己整理。現在我會設定初步判斷時間點，及早和主管或同仁同步，讓速度和嚴謹能兼顧。', '缺點要有已採取的改善行動。'],
                        ['如何回答「你還有其他選擇，為何我們要錄取你？」', '我會先重申自己要走的是高科技製造中的設備與製程整合方向。這個職位讓我能真正負責量產改善；而我能帶來現場排障、資料驗證和跨部門協作的基礎，能快速融入並持續累積價值。', '不比較薪資或品牌，回到契合度。']
                    ]
                },
                benq: {
                    name: '明基材料｜塗佈製程技術工程師', eyebrow: 'BENQ MATERIALS · COATING PROCESS',
                    title: '用數據與現場感，把塗佈製程做得更穩定。',
                    summary: '以機械、設備排障、封裝材料研究與跨部門協作經驗為基礎，對應塗佈製程異常、SPC、8D、SOP、客訴與自動化改善。',
                    jobMeta: {
                      items: [
                        '工作地點｜雲林斗六科技工業區（科工七路 29 號）',
                        '班別安排｜08:00–20:00／20:00–08:00，每三個月輪日夜班；每月約 20 天',
                        '核心任務｜製程異常分析、製程能力提升、SOP／管理文件、客訴與自動化改善',
                        '加分能力｜卷對卷／卷對片、Python／AutoML、8D、PFMEA／Control Plan、SPC'
                      ]
                    },
                    script: [
                        ['為什麼想應徵塗佈製程技術工程師？', '我希望把設備現場的問題感、材料研究的變因控制，以及量產環境的紀律整合成更完整的製程改善能力。塗佈製程同時牽涉材料、設備、條件控制與品質，正是我想長期深耕的跨域方向。', '不要假裝已有塗佈經驗；強調可轉移能力與學習動機。'],
                        ['你的背景與這個職缺如何匹配？', '機械背景讓我理解設備、張力與結構；封裝材料研究訓練我控制實驗條件和以數據驗證；PVD 經驗讓我熟悉無塵室、異常排查與 SOP。這些能力能幫助我快速理解塗佈的材料、設備與製程連動。', '用三段式回答：設備、材料、量產紀律。'],
                        ['你如何看待日夜輪班？', '我理解這份工作每三個月輪日夜班、每月約二十個工作天。輪班製程的關鍵是交接完整與判斷一致；我會維持規律作息、清楚記錄異常與條件，確保不同班別都能延續正確的處置。', '回答直接，不要附帶保留條件。'],
                        ['為何離開台積電，轉向明基材料？', '我很珍惜台積讓我建立的安全、設備與高壓現場基礎。下一步我希望更深入參與製程能力提升、品質改善與自動化專案；明基材料這個職位的責任範圍正好能讓我往這條路累積。', '聚焦職涯拉力，避免批評前公司。'],
                        ['前九十天的目標是什麼？', '前期先熟悉產品、塗佈設備、關鍵品質指標、SOP 與交接方式；接著用現場觀察和數據理解常見異常；三個月內希望能在主管指導下獨立完成一次異常分析或小型改善的追蹤。', '學習計畫要具體但不可過度承諾。'],
                        ['如果遇到客訴，你會怎麼處理？', '先確認客訴批次、規格與影響範圍，立即做好產品隔離與追溯；接著比對製程履歷、量測結果與變更紀錄，和品質、製造一起建立暫時對策，再用 8D 找出根因與防再發措施，最後追蹤客戶回覆及成效。', '同時涵蓋速度、證據與閉環。'],
                        ['沒有塗佈產線經驗，如何快速補足？', '我會先理解材料、供料、張力、塗佈間隙、線速與乾燥條件，再跟著現場確認正常窗口與常見失效模式。我的 PVD 設備排障與材料研究經驗，能讓我用假設、數據和小範圍驗證縮短學習曲線。', '誠實說明缺口，再提出具體學習路徑。']
                    ],
                    tech: [
                        ['塗佈製程異常的分析順序？', '先確認異常範圍與是否需要隔離產品，再從人、機、料、法、環、測六個面向切分：原料批次、黏度或固含、塗佈速度、間隙、張力、烘乾條件、環境與量測資料。再用 SPC 與現場紀錄建立優先假設並驗證。', '先 Contain，再 Analyze，不要直接改參數。'],
                        ['你如何理解 SPC 在製程管理的用途？', 'SPC 不是只看有沒有超規，而是用趨勢、偏移與變異提早發現製程失控。我要先確認量測系統和規格定義，再結合設備、材料和操作條件，找出變異來源並驗證改善。', '提到趨勢與變異，比只講管制圖更有深度。'],
                        ['8D、PFMEA 和 Control Plan 如何串起來？', '8D 用於系統化處理已發生的問題：圍堵、根因、矯正與防再發；PFMEA 用來事前辨識失效模式與風險；Control Plan 則把重要製程參數、檢查方法、頻率和反應計畫落地。三者要形成從預防到改善的閉環。', '不要只背名詞，要說明彼此用途。'],
                        ['沒有卷對卷經驗，如何快速補足？', '我會先理解材料流動路徑和每個站點的輸入輸出，再學習張力、速度、對位、塗佈條件與乾燥對品質的影響；同時跟著資深同仁觀察異常處置。我的設備與材料背景能幫助我用系統化方法縮短學習曲線。', '誠實承認缺口，但立刻說明學習路徑。'],
                        ['如何判斷製程能力是否提升？', '先定義關鍵品質特性與基準，再比較改善前後的良率、變異、Cp/Cpk、報廢或重工情形；也要觀察改善是否在不同批次和班別能穩定重複，避免只是一段時間的偶然結果。', '效果要以資料和持續性證明。']
                    ],
                    product: [
                        ['你如何理解塗佈製程工程師的角色？', '角色不只是處理異常，而是把材料、設備、作業條件、品質與生產節奏連結起來，讓製程在規格內穩定運作；同時將改善結果寫入文件、SOP 和 control plan，降低客訴與重複問題。', '用「穩定、可追溯、可複製」概括角色。'],
                        ['對卷對卷或卷對片製程，你會關注什麼？', '我會先關注材料進出、張力與速度穩定性、塗佈均勻性、對位、乾燥條件與收卷品質；也會理解哪些參數是關鍵品質特性，以及出現異常時如何快速追溯到批次、設備與操作紀錄。', '這是理解框架，不要假裝自己已操作過。'],
                        ['客訴異常發生時的處理原則？', '先快速確認客戶端現象、批次範圍和品質風險，啟動圍堵並保持透明溝通；內部用 8D 找根因，提出短期矯正和長期防再發。回覆客戶時以事實、時程和驗證結果為主，不過早承諾未確認的原因。', '展現客戶意識與品質紀律。'],
                        ['如何看待技術文件與 SOP？', 'SOP 是讓不同人、不同班別能做出一致品質的工具，不是行政負擔。我會把關鍵條件、判斷點、異常反應和紀錄要求寫清楚，並在現場驗證可操作性，定期依改善結果更新。', '呼應 JD 的文件撰寫與維護。']
                    ],
                    motiv: [
                        ['你對持續改善的熱情來自哪裡？', '我最有成就感的是把現場模糊問題整理成可驗證的假設，最後變成 SOP、檢查點或防呆，讓團隊少走彎路。這種從一次異常到長期穩定的過程，是我投入製程工作的原因。', '熱情要落在工作行為。'],
                        ['如何面對細節多、重複性高的製程工作？', '量產的核心就是穩定與紀律。我會先確實遵守標準，再從重複的異常、等待和資訊斷點中找改善機會；重複不代表沒有價值，反而能累積最可靠的資料與判斷。', '展現定性，不要讓人覺得容易膩。'],
                        ['你如何面對主管的修正？', '我會先理解主管的判斷依據和期待，不急著辯解；再把回饋轉成具體行動，例如補足資料、調整溝通方式或重新安排優先順序。收到修正後能穩定改善，才是專業。', '直接回應你收到的面試回饋。'],
                        ['Python 或 Auto ML 經驗不足怎麼辦？', '我不會假裝已有經驗，但我對資料化改善有高度興趣。會先從 Python 的資料整理、趨勢視覺化與基礎統計開始，將實際製程問題當作學習題目；同時與資料或自動化同仁合作，理解模型輸入、驗證和現場限制。', '誠實、主動，且不濫用 AI 名詞。']
                    ],
                    behav: [
                        ['請說一個你用資料排除異常的經驗。', '以 PVD 維護經驗作答：先說異常影響，再描述如何查看 log、比對狀態、現場觀察硬體、和相關人員驗證假設。最後說明實際恢復、風險降低或交接改善；請在面試前補入真實情境與結果。', '不要為了完整而虛構數字。'],
                        ['如何與設備、品質和生產部門合作？', '我會先把問題定義、數據、影響與目前假設整理清楚；理解各部門關心的是產能、規格、設備風險或交期，再用共同指標討論選項。我的角色是推動事實一致與 action 落地，而不是只當傳話窗口。', '直接回應跨部門合作需求。'],
                        ['材料研究經驗如何應用於塗佈？', '研究所的材料與可靠度研究讓我習慣控制變因、記錄實驗條件、觀察材料界面並用數據驗證結論。雖然材料系統不同，但我能把這種實驗紀律用在塗佈條件、品質異常與改善驗證。', '不可聲稱已有塗佈配方開發經驗。'],
                        ['自動化專案經驗能帶來什麼？', '村田的 AS/RS 系統專案讓我理解需求、介面、流程與現場使用者要一起被考慮。若推動製程自動化，我會先定義痛點、資料、風險和驗收標準，再小範圍試行，不把不穩定流程直接自動化。', '連回 JD 的自動化改善專案。']
                    ],
                    sit: [
                        ['夜班發現品質趨勢異常，主管不在怎麼辦？', '依既有 reaction plan 先確認資料和產品範圍，必要時停止或隔離受影響批次，並按 escalation 流程通知相關人員。完整保留條件、時間點和處置紀錄，讓日班能無縫接續；不會因為夜班就延後風險處理。', '輪班題先講品質與交接。'],
                        ['產能壓力大，但你認為某批產品有風險？', '我會以規格、資料與可能影響清楚說明風險，提出加嚴檢驗、分段處置或補充驗證等選項。最終遵循品質程序與主管決策，但不會為了趕產能跳過必要的風險揭露。', '尊重決策，同時守住品質底線。'],
                        ['改善案效果不如預期，如何處理？', '我會如實比較目標、實際結果與假設，檢查資料、試驗設計和未控制變因；再提出下一輪驗證或停止投入的建議。透明回報能避免團隊在錯誤方向上花更多資源。', '失敗時更要展現工程紀律。'],
                        ['客戶要求快速回覆，但根因還未確認？', '我會先回覆已知事實、影響範圍、目前圍堵措施與下一次更新時間；對根因和永久對策保持謹慎，等驗證完成再正式承諾。速度重要，但未確認的答案會傷害信任。', '客訴題的關鍵是透明與節奏。']
                    ],
                    combat: [
                        ['面試官說你沒有塗佈經驗，為何要錄取你？', '我不會把自己說成已具備塗佈專家經驗；我的價值是能快速學習且有可轉移的基礎：機械理解設備、材料研究理解變因控制、PVD 經驗理解無塵室與異常處置。我會用資料、現場觀察和跨部門協作，快速建立塗佈製程的判斷能力。', '先承認，再說明可驗證的遷移能力。'],
                        ['如何回答「你是否能適應斗六與輪班」？', '可以。我已理解此職位需要在斗六廠輪日夜班、重視跨班交接與現場穩定。我對製程工作有明確方向，也會事先規劃生活與作息，確保能長期、穩定地投入。', '回答不要含糊或說「先試試看」。'],
                        ['英文：Why do you want to join BenQ Materials?', 'I want to grow in a process engineering role where materials, equipment, quality, and continuous improvement are closely connected. This position is attractive because it includes process troubleshooting, SPC, technical documentation, customer issue handling, and automation projects. My background in equipment support and materials research gives me a strong foundation to learn the coating process quickly and contribute to stable production.', '用短句、清楚停頓，不追求艱深字彙。'],
                        ['你想反問主管什麼？', '我會問：新同仁在前六個月最需要先掌握哪些塗佈製程或品質指標？目前團隊最希望改善的異常或自動化痛點是什麼？這能了解成功標準，也展現我想解決實際問題。', '先問工作成功標準，最後才問制度。']
                    ]
                }
            };

            function buildExpansion(context) {
                const { discipline, outcome, evidence, partners } = context;
                return {
                    script: [
                        ['入職前 90 天你會怎麼做？', `前 30 天我會熟悉 ${discipline} 的安全規範、流程、文件與關鍵指標；60 天開始在指導下獨立處理常見任務；90 天希望能用 ${evidence} 的方法，提出一項能幫助 ${outcome} 的具體改善。`, '展現學習計畫，不要承諾還不熟悉的技術成果。'],
                        ['你認為自己目前最大的能力缺口是什麼？', `我會誠實說明對公司內部產品、工具或流程仍需學習，但我的做法是先建立基礎知識地圖、跟著標準作業做、記錄問題並主動求證。${evidence} 已讓我熟悉高標準現場，因此我有信心把缺口快速縮小。`, '承認缺口後，立刻給出學習方法。'],
                        ['新工作環境中，你如何建立信任？', `我會先做到準時、紀錄完整、遵守安全和品質規範；遇到不確定的事情及早確認，不逞強。對 ${partners} 的承諾，我會明確回覆進度、風險和下一步，讓團隊能放心交付工作。`, '信任來自可靠，不是高調表現。'],
                        ['這個職位最吸引你的日常工作是什麼？', `最吸引我的是能從現場資料、實作和團隊協作中，持續讓 ${outcome} 更穩定。我不只期待處理單次問題，更期待把經驗整理成流程和標準，讓團隊長期受益。`, '回答日常職責，不要只談品牌或福利。'],
                        ['若入職後發現工作比想像更困難，你會怎麼辦？', `我會先把困難拆成知識、流程或協作問題，設定學習與求助節點；不懂就確認、做完就復盤。對我而言，${discipline} 的複雜度正是累積專業深度的機會，而不是退縮的理由。`, '語氣要平穩、有承擔。'],
                        ['你希望主管如何帶領你？', '我期待主管能在目標、品質標準和優先順序上給清楚方向；在執行上我會主動回報、準備選項，不會把每個問題都丟回給主管決定。', '這題同時展現尊重與獨立性。']
                    ],
                    tech: [
                        ['你會先看哪些資料再做技術判斷？', `我會先確認資料來源、版本、時間點和量測條件，再對照正常基準、歷史趨勢與相關紀錄。處理 ${discipline} 時，資料和現場觀察必須互相驗證，不能只依單一 alarm 或單一數字下結論。`, '先確認資料可信度。'],
                        ['何時應停止操作並升級處理？', `只要涉及人員安全、品質規格、設備可能損傷，或超出我的授權和經驗邊界，我會立即停止不必要操作、保存現況，依程序通知 ${partners}。快速升級不是能力不足，而是對 ${outcome} 負責。`, '先說停損，再說溝通。'],
                        ['你如何確認改善真的有效？', `我會事先定義成功標準與觀察期間，改善後比對關鍵數據、異常重複率和現場操作狀況；若結果不穩定，就回到假設重新檢查。只有可重複驗證的結果，才能說改善完成。`, '避免「問題暫時不見」就結案。'],
                        ['資料與現場現象不一致時怎麼辦？', '我不會先選擇相信其中一邊，而是重新確認資料取得方式、時間同步、量測條件與現場狀態，必要時做受控的重測。矛盾通常代表還有未被看見的變因。', '展現科學態度，不急著選邊。'],
                        ['如何避免技術變更造成新風險？', `任何變更前我會確認影響範圍、回復方案、驗證條件和通知對象；小範圍驗證後再擴大。這能同時守住 ${outcome} 與交期，不讓改善變成新的不穩定來源。`, '關鍵字：change control、rollback、verification。'],
                        ['你會用什麼指標追蹤技術改善？', `除了直接結果，我會追蹤與 ${outcome} 最相關的指標，例如異常重複率、通過率、cycle time、downtime 或重工情形；指標需在改善前先定義，才能避免只看對自己有利的數字。`, '指標要能連回工作目標。']
                    ],
                    product: [
                        ['你會如何快速理解這個職位的全流程？', `我會從輸入、關鍵步驟、品質 gate、輸出與例外處理畫出流程，再和 ${partners} 確認各自的介面和痛點。這比只背 SOP 更能幫我理解 ${discipline} 對整體 ${outcome} 的影響。`, '先建立系統圖，再鑽細節。'],
                        ['這個職位的上游與下游關係是什麼？', `我會主動理解前一站提供的條件和限制，也要知道下一站如何使用我的輸出。當 ${discipline} 出現問題，不能只看自己站點，必須評估它對品質、交期和後續作業的連鎖影響。`, '展現系統觀，不只顧自己的工作。'],
                        ['你怎麼定義這份工作中的品質？', `品質不只是結果符合一次規格，也包含流程可追溯、條件可重複、異常被及早控制，且交接資訊完整。這些元素一起才構成可持續的 ${outcome}。`, '用可追溯、可重複、可控管回答。'],
                        ['如何平衡速度與嚴謹？', '我會先分辨哪些檢查是安全與品質底線、不能省；哪些是可平行或可用標準化縮短的工作。用清楚的優先順序提升速度，而不是跳過必要確認。', '不要回答「我會盡量兼顧」。'],
                        ['你會如何發現流程中的浪費？', '我會觀察重複等待、重工、資訊來回、人工抄寫與常見中斷，並用資料確認頻率和影響。先選擇影響大、風險可控的項目試行改善。', '自然銜接效率、成本與自動化。'],
                        ['如何把現場經驗轉成標準？', '將關鍵條件、判斷邊界、例外處理與常見錯誤整理成 checklist 或 SOP，請實際使用者驗證可行性；再依結果修訂。標準化不是把文件寫厚，而是讓正確做法更容易被執行。', '把知識傳承說得具體。']
                    ],
                    motiv: [
                        ['你如何持續學習新技術？', `我會先建立基本原理和流程架構，再用實際任務驗證理解；遇到問題記下來，向 ${partners} 請教後再整理成自己的筆記。${evidence} 讓我知道，技術學習要能回到現場解決問題才有價值。`, '不要只列出上過的課。'],
                        ['收到主管負面回饋時怎麼做？', '我會先確認回饋指向的是事實、行為還是結果，避免急著辯解；接著整理可立刻調整的做法與追蹤方式。對我來說，回饋是讓工作更可靠的校正，而不是否定個人。', '直接回應你近期的面試回饋。'],
                        ['什麼情況下你會主動提出改善？', `當我看到同類問題反覆出現、資訊交接常斷裂，或流程明顯增加風險和等待時，我會先收集事實，再提出小範圍、可驗證的方案。我的目標是幫助 ${outcome}，不是證明自己比較聰明。`, '提案前先有證據。'],
                        ['你如何維持工作上的細心？', '我會把高風險步驟轉成明確檢查點，在執行前、中、後分別確認；對容易受時間壓力影響的工作，尤其依賴紀錄與互相覆核，而不是只相信記憶。', '細心要有方法，不是人格標籤。'],
                        ['你如何處理重複失敗？', '我會先回顧假設、資料與操作條件是否遺漏，再尋求不同專業的觀點；若仍無法確認，會把目前證據和風險透明地升級。持續嘗試不等於固執重複同一方法。', '展現 persistence 與彈性。'],
                        ['你偏好的團隊合作方式？', `我習慣先把目標、分工、資料與決策點講清楚；執行中主動同步進度，遇到分歧回到事實和共同目標。這能讓 ${partners} 在高壓下仍有效合作。`, '避免說「我什麼角色都可以」。']
                    ],
                    behav: [
                        ['請說一次你犯錯後如何處理。', '選一個真實、可承擔的例子：先說你如何發現影響、立即控制、誠實回報，再說如何補救與防再發。重點不是把錯說得很小，而是展現負責任的處置方式。', '請在正式面試前填入真實案例。'],
                        ['如何處理跨部門目標衝突？', `我會先理解每一方關心的是品質、交期、成本還是資源，再把爭點轉成可比較的事實和風險。和 ${partners} 找到能兼顧 ${outcome} 的選項，必要時把取捨與決策層級說清楚。`, '不要把對方描述成不配合。'],
                        ['你曾如何說服他人接受你的建議？', '我不會只靠立場說服，而是先了解對方顧慮，再用現場現象、數據、小範圍試行或風險比較建立共同基礎。即使方案不是我的，也會支持團隊已確認的最佳決策。', '這題的關鍵是 influence，不是辯贏。'],
                        ['如何在資訊不完整時做決定？', '我會先分清楚哪些資訊缺失會影響安全、品質或不可逆風險；高風險事項先升級或暫停，低風險事項則用最小可行驗證補資料。決策與假設都要留下紀錄。', '展現有原則的判斷。'],
                        ['請說一次你主動承擔額外責任的經驗。', `可從 ${evidence} 選一個真實案例，說明原本職責、你主動補上的問題、如何和相關人員協作，以及最後為團隊減少了什麼風險或等待。`, '只選自己真的做過的事。'],
                        ['如何確保交接品質？', '我會交代目前狀態、已完成事項、未解風險、下一步 action、關鍵資料位置和需要注意的條件；必要時口頭確認對方理解。好的交接讓工作可以不中斷地延續。', '跨班、出差與專案都適用。']
                    ],
                    sit: [
                        ['同時出現三件急事，你如何排優先？', '我先依安全、品質、對產出影響與時間敏感度排序；可委派或平行的工作立即分工，並向主管同步資源缺口。每個人知道下一步和更新時間，才能避免大家都在救最吵的問題。', '不要只說「看情況」。'],
                        ['你不認同現場的既有做法，怎麼做？', '我會先理解它存在的歷史原因與限制，不直接否定；再用數據、風險或小範圍驗證提出改善建議。若團隊決定維持原做法，我也會尊重並確實執行。', '展現尊重與成熟度。'],
                        ['發現可能的安全風險但進度很趕？', '安全優先。我會先停止或隔離不安全作業，依程序通知相關人員，保存現況並提出可行的復原計畫。進度可以重排，但安全事故的代價不能用交期合理化。', '這題回答要果斷。'],
                        ['遇到完全沒接觸過的問題？', '我先確認邊界與風險，查閱標準文件、既有案例和可取得資料；提出初步假設後向有經驗的人求證。我的目標是快速建立可靠的判斷，而不是假裝自己早就懂。', '誠實且主動。'],
                        ['合作對象回覆很慢，影響進度怎麼辦？', '我會把需要的資訊、截止時間和對方不回覆的影響寫清楚，先提供他容易回覆的選項；同時準備不依賴該資訊的工作，必要時依正常 escalation 尋求協助。', '不情緒化抱怨。'],
                        ['改善案效果不如預期怎麼回報？', '我會如實呈現原目標、實際數據、已驗證與未驗證假設、造成落差的可能原因，並提出下一輪選項。透明回報能避免資源繼續投入在錯誤方向。', '失敗也能展現專業。']
                    ],
                    combat: [
                        ['面試官質疑你經歷太分散，怎麼回答？', `我的經歷看似跨設備、封裝、材料和系統專案，但核心一致：在高科技製造環境，把複雜問題轉成可驗證的行動。${evidence} 讓我同時具備現場紀律、數據思考和跨部門協作，現在要把它聚焦在 ${discipline}。`, '把跨域說成累積，不要辯解。'],
                        ['你如何回答「你看起來沒有定性」？', `我現在的方向很明確：深耕高科技製造中的 ${discipline}，持續累積從現場問題到系統改善的能力。過去不同經驗不是搖擺，而是讓我確認自己最投入的是 ${outcome}。`, '先給結論，語氣不要防衛。'],
                        ['英文被問到不熟悉技術題怎麼答？', 'I would first clarify the condition and the expected standard. Then I would check available data and follow the procedure to narrow down the possible causes. If needed, I would escalate with a clear summary of what I observed and what I have verified.', '練習短句、邏輯與停頓，不追求艱深單字。'],
                        ['你想問面試官什麼？', `我會問：這個職位在前六個月最重要的學習目標是什麼？團隊目前最希望新同仁協助改善的 ${discipline} 挑戰是什麼？這能讓我理解成功標準，也展現我想真正投入。`, '避開第一題就問福利或休假。'],
                        ['如果沒有具體 KPI，如何描述成果？', '可以描述你讓問題從不清楚變成可定位、讓風險被控制、讓交接更完整，或讓團隊有可依循的流程；但要清楚說明自己的角色與證據，不能暗示未發生的數字成果。', '誠實比華麗數字重要。'],
                        ['面試結尾如何收尾？', `我會重申：我理解這個角色需要 ${discipline} 的實作、紀律與協作；我有 ${evidence} 作為基礎，也願意持續學習。我期待有機會把這些能力投入在團隊的 ${outcome}。`, '30 秒內收尾，穩定有力。']
                    ]
                };
            }

            const expansionContexts = {
                assembly: { discipline: '組裝、校正、functional test 與系統整合', outcome: '高品質交付與系統性能', evidence: 'PVD 現場排障、無塵室紀律及系統專案', partners: 'TS、PE、D&E 與客戶' },
                fstech: { discipline: '量產製程、SPC、良率與生產管理', outcome: '穩定量產、品質與效率', evidence: 'PVD 設備維護、封裝研究與產品工程', partners: '生產、設備、品質與技術支援' },
                benq: { discipline: '塗佈製程、SPC、品質與自動化改善', outcome: '塗佈品質、穩定量產與客戶滿意度', evidence: 'PVD 設備維護、材料研究與系統專案', partners: '生產、設備、品質、客戶與技術支援' }
            };
            Object.entries(expansionContexts).forEach(([companyId, context]) => {
                const expansion = buildExpansion(context);
                tabs.forEach(([tabId]) => banks[companyId][tabId].push(...expansion[tabId]));
            });
            function questionCard([question, answer, tip], index, companyId, categoryId) {
                const questionId = roleQuestionIds[companyId][categoryId][index];
                return `<div data-question-id="${questionId}" class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden qa-card"><button data-action="toggle-card" class="btn-press w-full p-4 text-left flex justify-between gap-3 items-center"><span class="font-bold text-[14px] text-slate-700"><span class="tag tag-must mb-1">必練 ${String(index + 1).padStart(2, '0')}</span><br>${question}</span>${window.AppIcons?.render('chevron', { className: 'text-slate-400' }) || ''}</button><div class="accordion-wrapper"><div class="accordion-inner"><div class="px-4 pb-4 text-[13px] text-slate-600 border-t pt-3 leading-relaxed"><p>${answer}</p><p class="mt-3 rounded-lg bg-[#f5f4f0] px-3 py-2 text-[12px] text-slate-600"><b class="text-[#1f3654]">面試提醒：</b>${tip}</p></div></div></div></div>`;
            }

            window.InterviewQuestionBanks = banks;
            Object.entries(banks).forEach(([companyId, config]) => {
                const section = document.getElementById(`section-${companyId}`);
                if (!section || !window.InterviewRenderer) return;
                const theme = companyId === 'assembly' ? 'assembly-theme' : companyId === 'benq' ? 'benq-theme' : 'fstech-theme';
                const categories = tabs.map(([id, label, icon]) => ({
                    id, label, icon,
                    introHtml: id === 'script' ? `<div class="workspace-hero rounded-2xl shadow-md p-5 text-white mb-4"><div class="flex items-start justify-between gap-3"><div><p class="text-[11px] font-bold tracking-[.14em] text-[#d8e4d5]">${config.eyebrow}</p><h2 class="text-xl font-black mt-1">${config.title}</h2></div><span class="role-meta">${window.AppIcons?.render('layers') || ''} ${Object.values(config).filter(Array.isArray).flat().length} ?</span></div><p class="mt-2 text-[13px] text-slate-200 leading-relaxed">${config.summary}</p>${config.jobMeta ? `<div class="mt-4 grid gap-2 sm:grid-cols-2">${config.jobMeta.items.map(item => `<div class="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-[11px] leading-relaxed text-slate-100">${item}</div>`).join('')}</div>` : ''}</div>` : '',
                    questions: (config[id] || []).map((entry, index) => ({ id: roleQuestionIds[companyId][id][index], question: entry[0], answerHtml: `<p>${entry[1] || ''}</p><p class="answer-tip">${entry[2] || ''}</p>`, priority: 'standard', language: /[A-Za-z]/.test(entry[0]) && !/[\u4e00-\u9fff]/.test(entry[0]) ? 'en' : 'zh-TW', tags: [] }))
                }));
                window.InterviewRenderer.renderCompanySection({ section, companyId, company: { name: config.name, categories }, theme });
            });
        }

        function switchCompany(companyId) {
            if (['assembly', 'fstech', 'benq'].includes(companyId)) ensureRoleBanks();
            document.querySelectorAll('.company-tab').forEach(el => {
                el.classList.remove('active', 'active-asml', 'active-swancor', 'active-skyeuv', 'active-micron', 'active-assembly', 'active-fstech', 'active-benq');
            });
            const activeTab = document.getElementById('comp-' + companyId);
            if(activeTab) activeTab.classList.add('active', 'active-' + companyId);

            document.querySelectorAll('.company-section').forEach(el => {
                el.classList.add('hidden');
                el.classList.remove('block');
                el.setAttribute('hidden', '');
            });
            const targetSection = document.getElementById('section-' + companyId);
            if(targetSection) {
                if (window.LegacyQuestionData?.companies?.[companyId]) window.renderLegacyCompany?.(companyId);
                targetSection.classList.remove('hidden');
                targetSection.classList.add('block');
                targetSection.removeAttribute('hidden');
            }

            if (window.InterviewState) {
                window.InterviewState.state.activeCompanyId = companyId;
                window.InterviewState.save();
            }

            const legacyCompany = window.LegacyQuestionData?.companies?.[companyId];
            const persistedCategory = window.InterviewState?.state.activeCategoryByCompany?.[companyId];
            const hasPersistedCategory = persistedCategory && document.getElementById(`content-${companyId}-${persistedCategory}`);
            const initialCategory = hasPersistedCategory ? persistedCategory : (legacyCompany?.categories.find(category => category.questions.length)?.id || 'script');
            switchSubTab(companyId, initialCategory);
            
            setTimeout(() => {
                const section = document.getElementById('content-' + companyId + '-script');
                if (section) {
                    const firstBtn = section.querySelector('.btn-press');
                    if (firstBtn) {
                        const wrapper = firstBtn.nextElementSibling;
                        if (wrapper && !wrapper.classList.contains('open')) {
                            toggleCard(firstBtn);
                        }
                    }
                }
            }, 150);
        }

        function switchSubTab(companyId, subTabId) {
            const section = document.getElementById('section-' + companyId);
            if(!section) return;
            if (window.LegacyQuestionData?.companies?.[companyId]) window.renderLegacyCategory?.(companyId, subTabId);
            
            section.querySelectorAll('.sub-content').forEach(el => {
                el.classList.add('hidden');
                el.classList.remove('block');
                el.setAttribute('hidden', '');
            });
            
            section.querySelectorAll('.sub-tab-btn').forEach(el => {
                el.classList.remove('active', 'asml-theme', 'swancor-theme', 'skyeuv-theme', 'micron-theme', 'assembly-theme', 'fstech-theme', 'benq-theme');
                el.setAttribute('aria-selected', 'false');
            });
            
            const targetContent = document.getElementById(`content-${companyId}-${subTabId}`);
            if(targetContent) {
                targetContent.classList.remove('hidden');
                targetContent.classList.add('block');
                targetContent.removeAttribute('hidden');
            }
            
            const activeBtn = document.getElementById(`tab-${companyId}-${subTabId}`);
            if(activeBtn) {
                activeBtn.classList.add('active');
                if(companyId === 'asml') activeBtn.classList.add('asml-theme');
                if(companyId === 'swancor') activeBtn.classList.add('swancor-theme');
                if(companyId === 'skyeuv') activeBtn.classList.add('skyeuv-theme');
                if(companyId === 'micron') activeBtn.classList.add('micron-theme');
                if(companyId === 'assembly') activeBtn.classList.add('assembly-theme');
                if(companyId === 'fstech') activeBtn.classList.add('fstech-theme');
                if(companyId === 'benq') activeBtn.classList.add('benq-theme');
                activeBtn.setAttribute('aria-selected', 'true');
            }
            if (window.InterviewState) {
                window.InterviewState.state.activeCategoryByCompany[companyId] = subTabId;
                window.InterviewState.save();
            }
        }

        function toggleArchive() {
            const drawer = document.getElementById('archive-drawer');
            const isOpen = drawer.classList.toggle('open');
            drawer.setAttribute('aria-hidden', String(!isOpen));
            document.querySelectorAll('[aria-controls="archive-drawer"]').forEach(button => button.setAttribute('aria-expanded', String(isOpen)));
        }

        function toggleMasteredLegacy(button, index) {
            const card = button.closest('.qa-card');
            const mastered = window.InterviewState?.getQuestion(card?.dataset.questionId || `legacy.${index + 1}`)?.mastered || false;
            card?.classList.toggle('mastered', mastered);
            button.classList.toggle('mastered-badge', mastered);
            button.classList.toggle('text-slate-600', !mastered);
            button.innerHTML = `<span data-icon="check" class=""></span> ${mastered ? '已掌握' : '標記掌握'}`;
        }


        function filterInterviewCards(input, contentId) {
            const content = document.getElementById(contentId);
            if (!content) return;
            const keyword = (content.querySelector('[data-action="filter"]')?.value || (input.matches?.('[data-action="filter"]') ? input.value : '')).trim().toLowerCase();
            const statusFilter = content.querySelector('[data-action="status-filter"]')?.value || 'all';
            content.querySelectorAll('.qa-card').forEach(card => {
                const text = card.innerText || card.textContent || '';
                const record = window.InterviewState?.getQuestion(card.dataset.questionId) || {};
                const matchesText = !keyword || text.toLowerCase().includes(keyword);
                const matchesStatus = statusFilter === 'all' || (statusFilter === 'mastered' && record.mastered) || (statusFilter === 'unmastered' && !record.mastered) || (statusFilter === 'practiced' && record.attemptedCount > 0);
                card.classList.toggle('search-hidden', !(matchesText && matchesStatus));
            });
            const visibleCount = content.querySelectorAll('.qa-card:not(.search-hidden)').length;
            const count = content.querySelector('[data-result-count]');
            if (count) count.textContent = `${visibleCount} 題`;
            let empty = content.querySelector('.filter-empty');
            if (!visibleCount) {
                if (!empty) { empty = document.createElement('p'); empty.className = 'filter-empty rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500'; content.appendChild(empty); }
                empty.textContent = '目前沒有符合條件的題目。';
            } else if (empty) empty.remove();
        }

        function showInlineNotice(message, anchor) {
            let notice = document.getElementById('workspace-notice');
            if (!notice) { notice = document.createElement('div'); notice.id = 'workspace-notice'; notice.className = 'workspace-notice'; document.body.appendChild(notice); }
            notice.textContent = message;
            notice.classList.add('visible');
            clearTimeout(window.__workspaceNoticeTimer);
            window.__workspaceNoticeTimer = setTimeout(() => notice.classList.remove('visible'), 2600);
            anchor?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
        }

        function randomPractice(contentId) {
            const content = document.getElementById(contentId);
            if (!content) return;
            const cards = [...content.querySelectorAll('.qa-card:not(.search-hidden)')];
            if (!cards.length) { showInlineNotice('目前沒有符合搜尋條件的題目。', content); return; }
            document.querySelectorAll('.practice-highlight').forEach(c => c.classList.remove('practice-highlight'));
            const card = cards[Math.floor(Math.random() * cards.length)];
            const button = card.querySelector(':scope > button');
            const wrapper = button?.nextElementSibling;
            if (wrapper && !wrapper.classList.contains('open')) toggleCard(button);
            card.classList.add('practice-highlight');
            card.scrollIntoView({behavior:'smooth', block:'center'});
            setTimeout(() => card.classList.remove('practice-highlight'), 3500);
        }

        function toggleCard(button) {
            if (!button) return;
            const wrapper = button.nextElementSibling;
            const icon = button.querySelector('.app-icon');
            if (!wrapper || !wrapper.classList.contains('accordion-wrapper')) return;
            const willOpen = !wrapper.classList.contains('open');
            wrapper.classList.toggle('open', willOpen);
            button.setAttribute('aria-expanded', String(willOpen));
            if (icon) icon.classList.toggle('is-rotated', willOpen);
        }

        function expandAll() {
            const activeCompany = document.querySelector('.company-section.block');
            if(activeCompany){
                activeCompany.querySelectorAll('.accordion-wrapper').forEach(w => w.classList.add('open'));
                activeCompany.querySelectorAll('.app-icon').forEach(i => i.classList.add('is-rotated'));
            }
        }

        function scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

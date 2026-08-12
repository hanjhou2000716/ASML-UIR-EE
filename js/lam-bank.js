(() => {
  'use strict';
  const answer = (body, tip) => [body, tip];
  const bank = {
    name: 'Lam Research',
    eyebrow: 'LAM RESEARCH · CUSTOMER ENGINEER',
    title: '把設備可靠度帶到客戶現場。',
    summary: '以機械基礎、TSMC PVD 維護經驗與系統化除錯，準備 Lam Customer Engineer 的 PM、安裝、故障排除與客戶溝通。',
    jobMeta: { items: ['Customer-site equipment service', 'PM / corrective maintenance', 'Install / relocate / start-up', 'Safety · uptime · escalation'] },
    script: [
      ['兩分鐘自我介紹，如何連結 Lam CE？', answer('我具備機械工程與半導體封裝背景，並在 TSMC 2nm PVD 設備團隊累積現場維護、Alarm 分析、PM 與跨部門協作經驗。我不把設備工作定位成單純 Call Vendor，而是先確認症狀、讀取 alarm / log / trend、觀察硬體，再用證據隔離子系統。Lam CE 需要在客戶端維持設備 uptime、執行 PM、安裝與故障排除；這正好結合我的動手能力、FAB 紀律與問題所有權。', '結構：背景 → PVD 證據 → CE 工作對應 → 為何現在。')],
      ['你為什麼想加入 Lam Research？', answer('我希望從單一 FAB 的設備維護，拓展到設備供應商端的完整服務生命週期。Lam CE 不只修機，也要負責 install、relocate、start-up、PM、customer update 與 escalation。我對高精度設備的機械結構與可靠度有長期興趣，也認同以標準程序與技術文件交付可重複的服務品質。', '避免宣稱未確認的 Lam 產品型號，聚焦 JD 明確要求。')],
      ['為什麼想做 Customer Engineer？', answer('我喜歡在現場把抽象的問題轉成可驗證的行動。CE 同時需要 equipment ownership、customer communication 與 safety discipline；我在 PVD 現場已習慣面對 downtime 壓力、依 SOP 操作、記錄證據並與 PE / Vendor 協作。我希望把這些能力帶到不同客戶與設備，成為能獨立完成 first-line diagnosis 的工程師。', '把「喜歡與人互動」轉成具體的客戶更新與技術交接。')],
      ['為什麼從 FAB Equipment Engineer 轉到設備商？', answer('TSMC 讓我建立嚴謹的設備與無塵室基本功；下一步我想更深入設備原廠的系統知識、安裝標準與跨客戶支援。設備商角色能讓我從單一產線的維護，累積更完整的 install、qualification、PM 與 field service 方法，同時保留我最重視的 hands-on troubleshooting。', '不要貶低前公司，用「擴大技術責任」說明轉職。')],
      ['你能接受客戶端、輪值與非固定工時嗎？', answer('可以。我理解客戶設備服務會依 production impact 安排時間，必要時可能需要輪值、加班或到不同客戶現場。我會先確認安全、工時與交接規範，並在可工作的範圍內保持彈性；同時透過 checklist 與 handover 降低長工時下的遺漏。', '表達彈性，也要補上安全與交接的界線。')],
      ['你最符合 Lam CE 的三項能力？', answer('第一是 mechanical foundation，能理解零組件、裝配與狀態變化；第二是 systematic troubleshooting，會用 alarm、trend、硬體觀察與單一變因縮小範圍；第三是 customer ownership，能把設備狀態、風險、下一步與預估時間說清楚。我會再透過 OJT 補足 Lam 特定工具與程序。', '每一項都要準備一個真實案例。')],
      ['你的英文技術溝通如何準備？', answer('我能以英文做自我介紹、描述設備狀態與提出 technical summary。面對陌生術語，我會先確認定義、用簡短句子重述，再以 checklist、log 與圖片補足溝通。我的目標不是用複雜英文，而是讓 customer、senior engineer 與 team leader 對 symptom、risk、action、next step 有一致理解。', '可用「I observed… / I verified… / My next action is…」練習。')],
      ['你為什麼離開 TSMC？', answer('我很感謝 TSMC 讓我建立高標準的設備維護、FAB safety 與量產壓力經驗。離開不是因為排斥設備，而是希望往 equipment supplier / customer service 方向發展，接觸更完整的安裝、PM、start-up 與跨客戶技術支援。這是延伸既有能力的職涯選擇。', '回答保持尊重、堅定，不批評主管或制度。')],
      ['你如何結尾並向面試官提問？', answer('我希望加入一個重視安全、設備 uptime 與技術成長的團隊。若有機會加入，我會先把 OJT、工具程序與 escalation 標準學扎實，再逐步承擔獨立客戶任務。我想請教：新人前 90 天的 certification / shadowing 如何安排？Lam CE 評估獨立作業的關鍵里程碑是什麼？', '問題要讓面試官感覺你已在思考如何成功。')],
      ['三十秒 elevator pitch。', answer('我是具備機械與半導體背景的設備工程師，曾在 TSMC 2nm PVD 現場處理 PM、alarm 與設備問題。我習慣先用資料與硬體觀察做初步診斷，再與 PE、Vendor 或 senior engineer 以證據協作。Lam CE 的客戶設備 ownership、安裝維護與現場溝通，正是我想長期投入的方向。', '先講結論，再補證據。')]
    ],
    tech: [
      ['PM 與 Corrective Maintenance 的差異？', answer('PM 是依週期或狀態在故障前檢查、清潔、校正或更換耗材，目標是降低 failure probability；CM 是設備異常後確認症狀、隔離原因、修復並驗證。兩者都需要紀錄、風險評估與 post-maintenance verification，不能只以「機台恢復」作為完成條件。', '補一句：依 Lam procedure 與 customer safety requirement 執行。')],
      ['Machine down 時你的 troubleshooting flow？', answer('先確保人員與設備安全並確認 customer impact；再重現或確認 symptom，讀取 alarm history、時間軸與 trend，檢查近期變更，依系統架構隔離 subsystem。只做 approved diagnostic，執行 corrective action 後以功能測試、recipe / output 或 baseline 驗證，最後完成 handover 與紀錄。', '流程要可重複，不要直接猜零件。')],
      ['如何降低 MTTR？', answer('把時間花在高資訊量的檢查：先整理 symptom、alarm、最近變更與已排除項目，利用 history / trend 及單一變因隔離範圍。常見 failure 可建立 checklist 與 spare readiness；修復後記錄真正耗時點，回頭改善工具、SOP 或 training，而不是只追求一次性的快速換件。', 'MTTR 是結果，診斷品質與備件流程是槓桿。')],
      ['更換 defective component 前要確認什麼？', answer('確認故障症狀與 component 的因果關係，檢查 alarm / trend、connector、cable、power、氣路或機構狀態，並比對 known-good condition。確認替換件料號、ESD / LOTO 與清潔要求，留下原件狀態與 serial。更換後要做功能測試，避免把「替換」誤當「修復」。', '強調不要用 parts cannon。')],
      ['PM 後機台反而 alarm，你怎麼處理？', answer('先停止可能造成風險的操作，確認 alarm 時間是否與 PM 動作相關。依 checklist 回溯拆裝順序、connector、管路、扭力與 sensor condition，再做安全允許的 isolation test。若是 procedure、零件或原本潛在問題，清楚記錄並向 senior / vendor escalation，完成 verification 後才交還 production。', '不要急著否認與 PM 有關。')],
      ['何時自己處理，何時 escalation？', answer('自己處理的前提是有授權程序、風險可控、症狀在能力範圍且不會擴大設備或客戶風險。若涉及安全、未知 failure mode、重複故障、超出 procedure、需要特殊權限或 downtime 風險升高，就先保護現場並 escalation。Escalation 要附完整 evidence，而不是只說「機台壞了」。', '把 escalation 說成風險管理，不是推責。')],
      ['Escalation package 應包含哪些資訊？', answer('包含 machine / module、symptom、alarm code、timestamp、production impact、recent changes、已執行動作、已排除項目、replacement history、log / trend、目前安全與設備風險、customer expectation，以及需要 senior / vendor 決策的具體問題。', '使用固定模板可減少來回問答。')],
      ['如何執行 install / relocate / start-up？', answer('先確認 scope、layout、utilities、tool condition、lifting / EHS 與 schedule；依 install checklist 完成 unpack、mechanical assembly、connection、初始檢查與 power-on。每階段記錄完成條件與 deviation，start-up 後依 acceptance criteria 做 functional check、qualification 與 handover。', '不要把安裝描述成只會搬機台。')],
      ['如何學習陌生設備 manual？', answer('先建立系統架構與 safety boundary，再抓 operation、PM、alarm、interlock、acceptance criteria 等高頻章節。把 procedure 轉成 checklist，將術語與疑問整理後向 OJT mentor 驗證；完成 supervised task 後以實際 test result 確認理解，而不是只讀過文件。', '展示 coachable 與主動學習。')],
      ['如何保證 PM 品質？', answer('依最新 revision 的 procedure、料號與工具清單執行，先做 pre-check、LOTO / ESD 與 contamination control；過程中記錄 torque、condition、replacement 與異常。完成後做 post-PM functional test、baseline comparison 與 customer handover，最後把未完成 action 明確列出。', 'PM 的品質包含紀錄與交接。')],
      ['如何隔離 subsystem 問題？', answer('先將 symptom 映射到 system block diagram，依 alarm、signal path、power / communication / mechanical condition 切分邊界。優先做低風險、高辨識度的檢查，逐一改變單一變因並記錄結果，直到得到可驗證的 fault domain，再依 procedure 修復。', '避免同時改多個變因。')],
      ['如何確認 corrective action 真正有效？', answer('不只看 alarm 消失；要重跑相關功能與 acceptance test，確認 output、trend、interlock、repeatability 回到 baseline，並觀察足夠的 production / idle cycle。把結果、限制與 follow-up 寫入 service record，若仍有風險就保持 open action。', '用 evidence 定義 close，不用感覺。')]
    ],
    product: [
      ['Lam CE 與 FAB Equipment Engineer 的差異？', answer('FAB EE 主要對特定廠區與生產設備 uptime 負責；Lam CE 代表 equipment supplier，在客戶現場依原廠程序提供 install、PM、CM、start-up 與技術支援。兩者都需要 troubleshooting，但 CE 還要管理 customer expectation、服務紀錄、跨客戶標準與 escalation。', '回答差異時保持雙方專業平等。')],
      ['Lam CE 與 Senior FSE 的合作界線？', answer('CE 先執行授權範圍內的 first-line diagnosis、PM 與紀錄，Senior FSE 提供複雜 failure、風險決策與客戶溝通支援。我會準備完整 escalation package，讓 senior 能快速判斷，而不是把未整理的現場問題整包丟出去。', '讓面試官看到你既獨立又知道界線。')],
      ['典型 customer-site workflow？', answer('接班與確認 customer priority → site safety / tool condition → PM 或 troubleshooting → evidence / parts / corrective action → functional verification → customer update → service report → next action / escalation。每個節點都要有 owner 與完成條件。', '可在白板用箭頭說明。')],
      ['為什麼 equipment uptime 對客戶重要？', answer('設備停機會直接影響 wafer / production schedule、產能、交期與成本。CE 要把 downtime 轉成可管理的時間軸：先降低風險與影響，再快速取得高品質證據，修復後確認穩定性並避免重複發生。', '不要承諾不合理的立即恢復。')],
      ['Installation / relocation / start-up 的責任？', answer('包括 scope review、現場安全、組件與公用設施確認、機械與管線安裝、power-on、functional check、qualification、文件與交接。若進度落後，需及早提出 recovery plan 與風險，不是等到最後才回報。', '對應 JD 的 planning / report / new approach。')],
      ['什麼是 OJT / shadowing 的價值？', answer('OJT 讓新人在真實設備與程序下，觀察 senior 如何做 risk assessment、diagnosis、customer update 與 documentation。Shadow 期間我會先理解「為何這樣做」，再在 supervised scope 內實作，並把 feedback 轉成 checklist。', '表現可教、可回饋、可獨立。')],
      ['為什麼 service manual 與紀錄重要？', answer('它們讓服務品質可重複、讓不同班次與不同地點共享 context，也能支援 audit、root-cause learning 與 recurring issue prevention。紀錄要讓下一位工程師知道現況、做過什麼、驗證到哪裡與下一步是什麼。', '技術寫作是 CE 的一部分。')],
      ['如何定義 CE 的成功？', answer('安全完成工作、設備恢復並維持穩定、customer 對狀態與下一步有清楚認知、service record 完整，且團隊能從案例降低下一次 MTTR 或 recurrence。單一 KPI 不能取代完整服務品質。', '可補充 uptime、MTTR、repeat failure、customer feedback。')],
      ['如何處理不同客戶的工作文化？', answer('先觀察並遵守 site rule、communication protocol 與 escalation route；不把原本廠區習慣直接套用。對技術內容保持一致，對表達方式保持彈性，重要事項用書面或 checklist 確認。', '展現文化敏感度與一致性。')],
      ['你會如何準備第一次客戶現場？', answer('預先確認 tool、scope、site safety、training / access、parts、tools、contact、schedule 與 acceptance criteria。到場後先做 handover 與 safety check，再按 plan 推進；任何 deviation 立即紀錄、告知並提出 options。', '把準備工作視為降低現場風險。')]
    ],
    motiv: [
      ['為什麼 customer-facing role 適合你？', answer('我喜歡把技術內容整理成對方能採取行動的資訊。PVD 現場讓我習慣在 production 壓力下保持冷靜、說明設備狀態與風險；我會尊重客戶的優先順序，同時守住安全與程序底線。', '不要只說自己外向，講具體行為。')],
      ['能接受先 OJT、shadowing 嗎？', answer('可以，而且我認為這是建立正確習慣的必要階段。我會先觀察、提問、記錄，再在授權範圍內重現操作，對每次 feedback 做 closure。我的目標是把 mentor 的判斷框架內化，而非只背步驟。', '表達謙遜但有成長速度。')],
      ['如何學習陌生 equipment？', answer('先建立 architecture、safety、normal state 與 failure symptom map，再依 manual、training material 與現場 observation 做 checklist。每次任務後整理「觀察—判斷—行動—驗證」紀錄，向 mentor 確認盲點。', 'Lam 特定型號等入職後依官方資料學習。')],
      ['能承受 customer downtime pressure 嗎？', answer('可以。我會先承認影響、確認優先順序與安全邊界，再用時間軸回報已知事實、正在檢查的項目與下一個更新時間。壓力不能讓我跳過 procedure；反而要靠 checklist 與 evidence 讓行動更穩定。', '兼顧 empathy、ownership、safety。')],
      ['客戶急躁時如何回應？', answer('先聽完並重述 customer impact，確認對方最需要的是恢復、風險判斷還是時間資訊。接著用簡短語句說明已驗證事實、下一步與預計更新時間；若有不確定性就誠實說明，不用未證實的承諾安撫。', '先處理資訊落差，再處理情緒。')],
      ['為什麼 service engineering 而非 process engineering？', answer('我對製程理解有興趣，但最有成就感的是把設備硬體、程序與數據串起來，讓機台恢復並穩定運轉。CE 能讓我把機械與 PVD 現場經驗延伸到設備生命週期與客戶成功。', '不否定 process，說清楚個人優勢。')],
      ['如何保持技術知識最新？', answer('把現場 failure、manual revision、training note 與 mentor feedback 統一整理；每週挑一個 subsystem 做小型複習，並用實際 alarm / trend 案例驗證。對不確定的資訊標記待確認，不把網路推測當成 procedure。', '符合設備商對文件與版本控制的要求。')],
      ['你如何看待 escalation？', answer('Escalation 是安全與效率工具，不是能力不足的標籤。好的 escalation 要在正確時機提供完整證據與明確請求，讓 senior 能做技術決策；我會先完成授權範圍內的 diagnosis，再在風險升高前提出。', '把 escalation 與 ownership 同時說出。')],
      ['如何面對重複 PM？', answer('重複不代表可以鬆懈。PM 是降低故障的機會，我會維持相同的 procedure discipline，並觀察 recurring condition、耗材壽命與工具改善機會；若發現可標準化或防呆的地方，就提出改善。', '把穩定性與持續改善連起來。')],
      ['困難機台問題如何維持動力？', answer('我會把大問題拆成可驗證的小問題，每完成一個 isolation 就更新假設與下一步。當看到設備恢復、customer 能繼續生產，或團隊因我的紀錄更快解題，就是很直接的成就感。', '避免只用「我喜歡挑戰」空泛回答。')]
    ],
    behav: [
      ['分享一次 PVD particle / equipment issue。', answer('Situation：PVD 設備出現 particle 相關異常。Task：在不直接把問題交給 Vendor 的前提下降低 downtime。Action：我先看 alarm history、trend 與近期 PM 變更，再觀察 chamber / component condition，整理初步 fault domain，與 PE、EE、Vendor 以證據逐步確認。Result：團隊找到真因並完成修復與 follow-up，並把檢查項目補進 SOP。', '請依實際履歷補上可公開的時間與結果數字。')],
      ['如何降低 troubleshooting recovery time？', answer('我把常見 alarm 的排查步驟整理成先後順序，先確認 high-signal、low-risk 項目，再進入 subsystem isolation；同時在 handover 中寫清楚已排除項目。這讓下一位工程師不用重複做相同檢查，也讓 Vendor 收到更完整的 escalation package。', '不捏造百分比；若無精確數字就說 observed improvement。')],
      ['分享設備 installation / qualification 經驗。', answer('在 TSMC 新廠環境，我接觸過設備移入、組裝、utility / condition check、測試與 qualification 的節奏。我會依 checklist 管控 scope、owner、deadline 與 acceptance criteria，遇到 deviation 立即記錄並回報，不讓問題累積到交機前。', '把自身實際參與程度說清楚。')],
      ['如何在 production pressure 下工作？', answer('先分級安全、設備風險與產能影響，確認可做與不可做的動作；再以時間軸向 stakeholder 更新，保留必要的 evidence。即使 production 很急，也不會跳過 LOTO、ESD 或 vendor procedure，因為一次不安全的 shortcut 可能造成更長 downtime。', '這是 Lam CE 的核心態度題。')],
      ['與 PE / EE / Vendor 合作的例子？', answer('我會把三方關注點對齊：PE 關心製程與良率，EE 關心設備穩定，Vendor 關心規格與可支援範圍。我先提供現場觀察與 log，明確說明我需要對方協助判斷的問題，再共同驗證 corrective action，最後更新 SOP 或 handover。', '避免把自己描述成聯絡窗口。')],
      ['Murata system project 如何證明協作能力？', answer('我曾接觸系統專案，需要理解客戶需求、設備條件、layout / schedule 與跨部門限制。我會把需求拆成可交付項目、確認 interface 與 owner，定期追蹤 action，遇到變更即更新風險與時程。這種 project discipline 可轉移到 Lam 的 install / relocation 任務。', '只使用你履歷可證明的內容。')],
      ['學習 TIM / materials 等陌生領域的經驗？', answer('面對陌生材料，我先確認目的、關鍵變數與驗證方法，再用文獻、實驗與跨部門請教建立基本模型。遇到結果不符預期時，保留 sample / data context，逐一排除製程條件，而不是直接否定材料。', '展示 learning agility 與 evidence habit。')],
      ['與資深工程師意見不同怎麼辦？', answer('先確認對方的風險與經驗來源，再把我的觀察、資料與假設整理成可比較的方案。若涉及安全或 production risk，我會提出小範圍、可回退的驗證；若最終採用對方方案，我仍會完整執行並記錄學到的判斷。', '尊重主管與團隊，對事不對人。')],
      ['犯錯或學到教訓的例子？', answer('我曾在工程任務中發現，若只記錄「完成」而不記錄 acceptance condition，後續交接會產生歧義。之後我把紀錄改成包含 expected result、actual result、deviation、owner 與 next action，並在交接時逐項確認。', '用可控、已改善的錯誤，不虛構重大事故。')],
      ['嚴格遵守 safety / procedure 的經驗？', answer('在 FAB 與機械實作環境，我養成先確認 risk、工具與 protective measure，再開始作業的習慣。即使趕工，也會完成 LOTO / ESD、cleanroom discipline 與 buddy check；若現場條件不符，我會先停下來請主管確認。', '把安全行為說成可觀察流程。')]
    ],
    sit: [
      ['客戶說很急，但 safety verification 未完成？', answer('我會先明確說明未完成的 safety gate 與可能後果，暫停高風險動作；同步通知 senior / customer contact，提出完成檢查所需時間與安全替代方案。只有在 authorized condition met 後才繼續，並把 decision / approval 留在紀錄中。', 'Safety gate 不因 customer pressure 被跳過。')],
      ['Alarm 沒有明顯 root cause？', answer('先確認 symptom 是否可重現與設備是否安全，抓 alarm history、timestamp、trend、recent change，從 system boundary 逐層隔離。若仍無法定位，整理已檢查內容與風險 escalation，而不是任意更換零件。', '說出「目前未知」也是專業。')],
      ['換了 component 問題仍存在？', answer('停止繼續換件，回到 symptom 與因果假設，確認 replacement condition、connector / installation、相關 subsystem 與是否有第二個 failure。用 known-good / single-variable test 重新隔離，必要時提供完整 history 給 senior。', '承認假設可能錯誤。')],
      ['Spare part unavailable？', answer('先確認 machine risk 與 customer impact，保護現場並向 planner / senior 查詢 ETA、替代件與可行的 recovery plan。未經授權不使用不相容零件；對 customer 清楚說明已知狀態、選項與下一個更新時間。', '把 supply constraint 轉成有 owner 的 action。')],
      ['Senior engineer 暫時無法支援？', answer('先完成安全檢查與授權範圍內的 diagnosis，整理 escalation package 與可供 senior 快速判斷的 evidence；若設備可安全維持，先做 containment，若有風險則停機並通知正確 escalation path。', '獨立不等於超出授權。')],
      ['客戶要求跳過 SOP？', answer('我會說明 SOP 對安全、設備與 warranty 的意義，拒絕未授權的 shortcut，並請 senior / customer owner 一起確認是否有正式 deviation procedure。若需要變更，必須留下 approval、風險與回復條件。', '語氣尊重但界線堅定。')],
      ['PM 會延後 production schedule？', answer('先確認 PM scope、criticality 與可用時間窗，與 customer 排出 risk-based priority；若無法避免影響，提前提供時間、風險與 recovery options。完成後用 test result 證明投入時間換來的可靠度，而非只追求短期開機。', '顯示你理解 customer business impact。')],
      ['Subcontractor procedure 做錯？', answer('先停止可能造成風險的步驟並保護設備，確認錯誤範圍與是否有 damage；依 escalation path 通知 responsible engineer，記錄現場 evidence，再依 approved recovery procedure 修復與 re-verify。事後提出 training / checklist 防止 recurrence。', '不要在現場情緒化責怪對方。')],
      ['Handover 資訊不完整？', answer('先列出缺少的 machine state、alarm、action、parts、risk 與 next owner，直接向交班者或 supervisor 補齊；在資訊未確認前不做高風險推論。接手後以自己的 baseline check 驗證，並把補充內容回寫紀錄。', 'handover 是服務品質的一環。')],
      ['兩台機台同時 down 如何排優先？', answer('比較安全風險、customer production impact、設備狀態、可用人力與預估 recovery path；先處理高風險或可快速恢復且影響最大的項目，同時對另一台做 containment 與明確更新。必要時請 supervisor 分派 owner，不單打獨鬥。', '講出 decision criteria。')],
      ['客戶不同意你的 diagnosis？', answer('先確認 disagreement 是 evidence、風險或目標不同，請對方說明觀察；把我的判斷拆成可驗證的假設，提出低風險 test 或請 senior review。若結果推翻我的假設，就更新判斷並清楚告知，而不是為了面子堅持。', '以共同找真因為目標。')],
      ['問題似乎解決，但你不確定穩定性？', answer('不會直接 close。依 acceptance criteria 做 repeat test、觀察 baseline / trend 與必要的 production cycle，向 customer 說明目前已驗證範圍與 residual risk，保留 follow-up action。若需要長時間觀察，指定 owner 與時間點。', '把 residual risk 誠實揭露。')]
    ],
    combat: [
      ['如何證明自己不是只會 Call Vendor？', answer('我會先做 first-line diagnosis：確認 symptom、alarm history、trend、recent change 與 component condition，依 subsystem isolation 形成初步假設，再帶著 evidence 找 Vendor / senior。Vendor 是協作資源，不是我的第一個動作；我的責任是把問題定義清楚、驗證 corrective action 並完成 handover。', '這題要直接打破刻板印象。')],
      ['你從 FAB EE 轉 CE，最需要補什麼？', answer('我需要補足 Lam 特定產品、service procedure、customer-site workflow 與原廠 escalation 標準。既有的 mechanical、PVD、safety、data troubleshooting 是可轉移基礎；我會透過 OJT、manual、shadowing 與 supervised certification 補齊，不會假裝已熟悉未知型號。', '誠實說差距，同時提出補足計畫。')],
      ['客戶抱怨你修得太慢，怎麼回應？', answer('先承認 downtime 影響並確認對方需要的資訊，再說明目前已驗證事實、剩餘假設與下一個診斷動作。我會檢討是否能改善 preparation、spare、checklist 或 escalation quality，但不會為了速度跳過安全與驗證。', '把客訴轉成透明溝通與改善。')],
      ['如何管理重複故障？', answer('建立 recurring issue record，對照 alarm、時間、module、replacement、環境與操作條件，做 Pareto / trend 分析；與 senior、PE 或 Vendor 找 systemic cause，再推動 SOP、PM interval、spare 或 training 改善，並以 recurrence / MTBF 驗證。', '從一次修好進化到 prevention。')],
      ['你如何向 customer 解釋未知狀態？', answer('清楚區分 confirmed fact、working hypothesis 與 unknown，說明目前風險、已完成檢查、下一步與更新時間。這比給一個未驗證的 root cause 更能建立信任；結果改變時，我會主動更新。', '使用 evidence-based language。')],
      ['如果 senior 的指示與你觀察矛盾？', answer('先確認我是否理解完整 context，再提供 observation、log 與 test result，詢問判斷依據。若涉及 safety 或設備風險，會依 escalation protocol 暫停高風險動作；若是一般技術取捨，尊重最後決策並記錄學習。', '尊重資深，但不放棄安全與證據。')],
      ['如何讓 service report 真正有用？', answer('報告要回答：發生什麼、何時發生、影響什麼、檢查了什麼、做了什麼、結果如何、還有什麼風險、下一步誰負責。用客戶與下一位工程師看得懂的語句，附必要的 log / trend reference，不塞無關敘述。', '技術報告是交付的一部分。')],
      ['客戶要求你做未受訓練的操作？', answer('我會說明目前 training / authorization 不足，不直接執行；先請 authorized senior 或 supervisor 支援，確認是否有 approved training path。若可由我協助準備資料或做安全範圍內工作，我會先承擔那些部分。', '安全與授權優先。')],
      ['你如何在跨文化團隊建立信任？', answer('準時、準備充分、說話有證據、承諾的 action 有回覆；對不同溝通風格保持尊重，必要時用書面 summary 確認共識。技術標準一致，但表達可以依對象調整。', '以可觀察的可靠行為回答。')],
      ['第一年在 Lam 的成功樣貌？', answer('完成必要 training / certification，能在授權範圍內安全執行 PM、基本 troubleshooting 與 customer update；遇到複雜問題能提供高品質 escalation；同時把 recurring issue、文件與 handover 做好，成為團隊可以信任的現場工程師。', '把短期目標對應 JD，而非只談升遷。')],
      ['如果同時收到其他設備商 offer？', answer('我會比較工作內容、training、技術深度、客戶責任與長期學習方向。Lam CE 若能提供我想要的 customer equipment ownership、系統化 training 與高精度設備成長路徑，會是高度優先選項；我會以長期適配而非只看單一條件決定。', '保持誠實，不用過度承諾。')],
      ['最後用一句話說服我們？', answer('我帶來的是機械與半導體現場的交集：能動手、能用資料除錯、能守住安全，也能把設備狀態與下一步對客戶說清楚；我會用 Lam 的程序與 OJT 把這些能力轉成可交付的 CE 服務品質。', '結尾簡潔、穩定、有 ownership。')]
    ]
  };
  const ids = {};
  Object.entries(bank).filter(([, value]) => Array.isArray(value)).forEach(([category, entries]) => {
    ids[category] = entries.map((_, index) => `lam.${category}.q${String(index + 1).padStart(2, '0')}`);
  });
  window.LamQuestionBank = Object.freeze(bank);
  window.LamQuestionIds = Object.freeze(ids);
  window.LamJobTraceability = Object.freeze([
    { jd: 'repair and preventive maintenance', categories: ['tech', 'situational'], questionIds: ['lam.tech.q01', 'lam.sit.q06'] },
    { jd: 'install, relocate, start-up, check-out', categories: ['tech', 'product'], questionIds: ['lam.tech.q08', 'lam.product.q05'] },
    { jd: 'troubleshoot and isolate problems', categories: ['tech', 'behavior'], questionIds: ['lam.tech.q02', 'lam.behav.q01'] },
    { jd: 'determine corrective actions and escalate', categories: ['tech', 'combat'], questionIds: ['lam.tech.q06', 'lam.combat.q01'] },
    { jd: 'OJT and technical materials', categories: ['motivation', 'product'], questionIds: ['lam.motiv.q02', 'lam.product.q06'] },
    { jd: 'customer satisfaction and professional conduct', categories: ['motivation', 'situational'], questionIds: ['lam.motiv.q05', 'lam.sit.q11'] },
    { jd: 'project action items and subcontractor instruction', categories: ['behavior', 'situational'], questionIds: ['lam.behav.q06', 'lam.sit.q08'] }
  ]);
})();

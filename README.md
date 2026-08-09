# 面試攻防工作台

以 ASML UIR、ASML Assembly、台塑勝高與明基材料塗佈製程為主的面試練習工作台。題庫由職缺、履歷與實際面試回饋整理，介面保留主動職缺與歷史面試分區。

## 架構與資料安全

- `index.html`：頁面骨架與既有題庫呈現。
- `js/state.js`：唯一的進度狀態來源，使用 schema v2、穩定題目 ID，並從舊版 index-based localStorage 遷移。
- `tests/validate.mjs`：無外部套件的內容與語法驗證。
- `.github/workflows/validate.yml`：每次 PR/主分支推送執行驗證。

進度資料只儲存在瀏覽器本機，不包含評分、錄取機率或其他虛構分析；分析應以實際練習次數、掌握狀態與最近練習時間為基礎。

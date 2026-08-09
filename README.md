# 面試攻防工作台

以 ASML UIR、ASML Assembly、台塑勝高與明基材料塗佈製程為主的面試練習工作台。題庫由職缺、履歷與實際面試回饋整理，介面保留主動職缺與歷史面試分區。

## 架構與資料安全

- `index.html`：頁面骨架與既有題庫呈現。
- `js/state.js`：唯一的進度狀態來源，使用 schema v2、穩定題目 ID，並從舊版 index-based localStorage 遷移。
- `tests/validate.mjs`：無外部套件的內容與語法驗證。
- `.github/workflows/validate.yml`：每次 PR/主分支推送執行驗證。

## 開發與部署

本專案是可直接由 GitHub Pages 提供的靜態網站，不需要建置伺服器。修改後執行 `npm run validate`，再透過 feature branch / PR 合併到 `main`；GitHub Pages 會自動部署 `main` 的內容。

完整的資料流、狀態契約與新增題庫方式請參考 [ARCHITECTURE.md](ARCHITECTURE.md)。

Production Lighthouse baseline is recorded in [docs/lighthouse-2026-08-09.md](docs/lighthouse-2026-08-09.md)。

進度資料只儲存在瀏覽器本機，不包含評分、錄取機率或其他虛構分析；分析應以實際練習次數、掌握狀態與最近練習時間為基礎。

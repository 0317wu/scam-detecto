# 系統架構與業務流程 (System Architecture & Flow)

本文件概述了 AI 詐騙訊息與圖片辨識系統的整體技術架構、核心分析流程以及資料流向，幫助開發者快速掌握系統全貌。

---

## 1. 整體架構總覽 (Overview)

系統採用現代化的單體式架構 (Monolith) 加上前後端分離的開發體驗：

- **前端 (Frontend)**：採用 **Vue 3** 搭配 **Inertia.js**。Inertia 允許我們以撰寫 SPA (單頁應用) 的方式開發 Vue 組件，同時保有 Laravel 強大的後端路由與 Controller 支援，免除了傳統前後端分離需額外建置 API 與處理 CORS 的麻煩。
- **後端 (Backend)**：採用 **Laravel 12** 作為核心框架，負責業務邏輯、身分驗證 (Breeze/Sanctum)、資料庫操作 (Eloquent ORM) 以及外部服務串接。
- **資料儲存 (Database)**：預設使用 **SQLite** (`database.sqlite`)，具備輕量、易部署的特性，適合此類不需高併發寫入的展示型系統。
- **外部整合 (Integrations)**：
  - **Tesseract OCR**：用於處理圖片上傳時的光學字元辨識。
  - **Gemini / OpenAI API**：作為系統的大大腦 (LLM)，負責對文字、網址或 OCR 提取後的內容進行語意分析與詐騙判定。

---

## 2. 核心分析流程 (Core Analysis Flow)

當使用者在首頁 (Dashboard) 送出一筆檢測請求時，系統會經歷以下完整生命週期：

1. **前端輸入與阻擋**
   - 使用者透過 `ScannerInput.vue` 送出文字、網址或圖片。
   - 系統首先會檢查是否已配置 AI API Key。如果未配置 (`ApiWarningBanner.vue` 亮起)，前端將直接阻擋請求並提示使用者。
   
2. **請求接收與前處理**
   - 請求由後端的 `ScamAnalysisController` 接收。
   - 若上傳的是**圖片**，Controller 會將圖片暫存並交由 `OcrService` 呼叫本機的 Tesseract 引擎進行文字提取 (OCR)。

3. **AI 智能大腦分析**
   - 提取出的文字、原始文字或網址，會交給 `AiFraudService` 進行處理。
   - 系統會組合出嚴謹的 Prompt，要求 LLM 以嚴格的 JSON 格式回傳分析結果（包含風險等級、分數、詐騙類型、風險特徵陣列與防範建議）。

4. **斷線降級保護 (Fallback Mechanism)**
   - 為了確保系統高可用性，若外部 AI 服務發生逾時、Token 耗盡或 API 錯誤，系統會觸發 Fallback 機制。
   - 降級交由 `FraudService` 接手，利用 `ScamCase` 案例庫中的關鍵字以及 `RuleHelper` 內的正規表示式進行靜態分析，確保使用者仍能得到基本的安全防護。

5. **資料落地與渲染**
   - 分析結束後，結果會被寫入 `ScamScan` 資料表。若使用者已登入，則綁定 `user_id`；若為訪客，則綁定基於 localStorage 生成的 `visitor_id`。
   - 後端將結果以 JSON 回傳給前端的 `ResultCard.vue` 進行科幻風格的渲染展示。

---

## 3. Human-in-the-Loop (管理員一鍵收錄)

系統不只依賴靜態防護，還設計了由人類專家介入的閉環強化機制：

1. **全站紀錄監控**
   - 系統管理員可以進入 `/scans-manager` (掃描紀錄總管) 頁面。
   - 在此頁面，管理員能以分頁形式查閱全站（包含訪客）的所有掃描日誌 (`ScamScan`)。

2. **風險轉化與入庫**
   - 當管理員發現某筆高風險 (Danger/Warning) 的掃描紀錄具有代表性時，可點擊「轉為規則」。
   - 系統會將該筆紀錄中 AI 總結的 `risk_factors` (風險特徵) 自動轉換為防護關鍵字，並透過 `/api/cases` API 寫入到 `ScamCase` (防詐案例庫) 中。

3. **防禦網強化**
   - 這些新收錄的案例，會立刻生效於知識庫 (`Knowledge.vue`) 的展示中，並且在系統進入 Fallback 降級模式時，成為靜態比對的強大彈藥庫，實現「越掃越聰明」的系統演進。

---

## 4. 核心目錄與檔案職責

- `app/Http/Controllers/Api/`
  - 處理所有非同步的 JSON API 請求。
  - `ScamAnalysisController.php`: 核心的掃描分析入口。
  - `ScamAdminScanController.php`: 提供給管理員查看全站掃描紀錄的介面。
- `app/Services/`
  - 封裝商業邏輯與第三方呼叫。
  - `AiFraudService.php`: 專責與 LLM (Gemini/OpenAI) 溝通。
  - `FraudService.php`: 靜態規則判定與分流調度。
  - `OcrService.php`: 處理圖檔與 Tesseract 引擎的介接。
- `app/Models/`
  - `ScamScan.php`: 記錄每一次的掃描行為、分析結果與分數。
  - `ScamCase.php`: 系統內建及管理員後續收錄的詐騙防護案例庫。
- `resources/js/Pages/`
  - `Dashboard.vue`: 主控台，包含掃描框與即時統計模組。
  - `ScansManager.vue`: 管理員專屬，落實 Human-in-the-Loop 的總管頁面。
- `resources/js/Components/`
  - 存放高復用性的 UI 模組，如 `ApiWarningBanner.vue`、`ResultCard.vue` 等。

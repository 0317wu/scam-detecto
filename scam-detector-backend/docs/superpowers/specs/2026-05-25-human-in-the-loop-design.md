# Human-in-the-Loop 與 API Key 提示機制設計

## 概述
本設計旨在實現兩個核心功能：
1. **一鍵收錄 (Human-in-the-Loop)**：允許管理員在後台將 AI 判定為高風險的掃描紀錄 (ScamScan) 轉換為正式的防詐規則 (ScamCase)，實現系統自我學習進化。
2. **API Key 未設定防呆機制**：在系統尚未設定 OpenAI/Gemini API Key 時，透過全域橫幅與分析阻擋，明確告知使用者無法進行 AI 分析。

## 1. 掃描紀錄總管 (ScansManager) 頁面設計
新增一個獨立的後台頁面，專門用於管理全站 `ScamScan` 紀錄。

### 1.1 路由與權限
- 增加前端路由：`/scans`
- 存取權限：必須具備管理員身分 (套用 `AdminMiddleware`)
- API 路由：`GET /api/scans` (這可能需要新增一個專門給管理員看全部掃描的 API，因為現有的 `ScamHistoryController` 只會回傳使用者自己的紀錄)

### 1.2 介面佈局
- **頂部工具列**：
  - 搜尋框 (支援關鍵字、URL)
  - 風險等級過濾器 (Safe, Warning, Danger)
- **資料列表 (Data Table)**：
  - 欄位包含：掃描時間、輸入類型、輸入內容 (擷取)、風險等級、AI 分數、AI 解析的風險要素 (risk_factors)、操作
- **一鍵收錄操作**：
  - 針對 `Danger` 等級的紀錄，提供「➕ 轉為規則」按鈕。
  - 點擊後開啟 Modal 表單，自動帶入 AI 判定出的 `risk_factors` 作為新規則的 Keywords，管理員可微調後點擊儲存，正式寫入 `ScamCase`。

## 2. API Key 未設定防呆機制
當系統的 `.env` 檔案中沒有配置 AI API Key 時，必須給予強烈提示。

### 2.1 後端實作
- 提供一個 Configuration API (`GET /api/config`) 或在啟動時將狀態傳給前端。
- 也可以在呼叫 `/api/analyze` 發現沒有 API Key 且命中需要呼叫 AI 的流程時，拋出特定的錯誤碼 (例如 `API_KEY_MISSING`，Status 422 或 400)。

### 2.2 前端介面 (兩者皆有)
- **全域警告橫幅 (Global Banner)**：
  - 如果 API Key 缺失，在 `Dashboard.vue` 與掃描頁面的最上方顯示黃色醒目橫幅：「⚠️ 系統尚未配置 AI API Key，進階詐騙辨識功能目前無法使用」。
- **操作阻擋 (Inline Error)**：
  - 當使用者點擊「分析」送出請求，若後端回報 API Key 缺失，在按鈕下方顯示紅色錯誤：「請先配置 API Key 才能進行 AI 掃描」，並停止轉圈動畫。

## 3. 測試計畫
- **前端元件測試**：驗證 API 錯誤時橫幅與阻擋邏輯是否出現。
- **ScansManager 整合測試**：管理員一鍵轉入 Case 後，是否成功觸發上一階段完成的 `ScamCase` 快取清除機制。

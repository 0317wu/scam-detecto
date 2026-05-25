# Progress 06 - AI 詐騙分析

## 日期

2026-05-24

## 本次完成內容

本次已完成 Milestone 6：AI 詐騙分析。

後端現在已建立 AI 分析服務，可在有設定 API key 時呼叫 AI 分析詐騙風險，並與原本規則式分析結果整合。若 AI 未啟用、沒有金鑰、API 失敗或回傳格式錯誤，系統會自動 fallback 到規則式分析，避免掃描流程中斷。

## 已完成項目

1. 建立 `AiFraudService`。
2. 新增 `config/ai.php`。
3. 新增 `.env.example` AI 設定。
4. 將 AI 分析整合進 `FraudService`。
5. AI 成功時會合併 AI 結果與規則式結果。
6. AI 分數與規則式分數取較高值，避免低估風險。
7. AI 原始回傳會存入 `scam_scans.ai_raw_response`。
8. API response 新增 `ai_used`。
9. AI 失敗時會自動 fallback 到規則式分析。
10. 新增 AI 成功與失敗 fallback 測試。
11. 測試通過。

## 新增或修改的主要檔案

```text
config/ai.php
.env.example
app/Services/AiFraudService.php
app/Services/FraudService.php
app/Helpers/ScoreHelper.php
app/Http/Controllers/Api/ScamAnalysisController.php
tests/Feature/ScamAnalysisApiTest.php
docs/current-progress.md
```

## AI 設定

`.env` 可設定：

```env
AI_ANALYSIS_ENABLED=false
AI_PROVIDER=openai
AI_TIMEOUT=30
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
```

說明：

- `AI_ANALYSIS_ENABLED`：是否啟用 AI 分析。
- `OPENAI_API_KEY`：OpenAI API key。
- `OPENAI_BASE_URL`：OpenAI API base URL。
- `OPENAI_MODEL`：使用的模型，可依老師或專案需求調整。
- `AI_TIMEOUT`：AI API 逾時秒數。

## AI 回傳格式

AI 會被要求回傳 JSON：

```json
{
  "risk_score": 95,
  "risk_level": "danger",
  "scam_type": "假投資詐騙",
  "summary": "AI 判斷此訊息高度疑似假投資詐騙。",
  "risk_factors": [
    "AI 判斷高報酬話術"
  ],
  "suggestions": [
    "不要加入投資群組"
  ]
}
```

## 整合規則

目前整合方式：

1. 後端先跑規則式分析。
2. 如果 AI 已啟用且有 API key，再呼叫 AI。
3. `risk_score` 取規則式與 AI 的較高分。
4. `risk_level` 根據最後分數重新計算。
5. `risk_factors` 合併規則式與 AI。
6. `suggestions` 合併 AI 與規則式建議。
7. `summary` 優先使用 AI 摘要。
8. AI 失敗則保留規則式分析結果。

## API Response 新增欄位

分析 API 現在會多回傳：

```json
{
  "ai_used": true
}
```

或：

```json
{
  "ai_used": false
}
```

### AI 成功範例

```json
{
  "success": true,
  "message": "analysis_completed",
  "data": {
    "id": 1,
    "input_type": "text",
    "risk_level": "danger",
    "risk_score": 95,
    "scam_type": "假投資詐騙",
    "summary": "AI 判斷此訊息高度疑似假投資詐騙。",
    "ai_used": true,
    "cache_hit": false
  }
}
```

### AI 未啟用或失敗範例

```json
{
  "success": true,
  "message": "analysis_completed",
  "data": {
    "id": 2,
    "input_type": "text",
    "risk_level": "danger",
    "risk_score": 65,
    "scam_type": "假投資詐騙",
    "ai_used": false,
    "cache_hit": false
  }
}
```

## 目前可用 API

```http
POST /api/register
POST /api/login
POST /api/logout
GET /api/user

POST /api/scam/analyze-text
POST /api/scam/analyze-url
POST /api/scam/analyze-image
```

## 測試結果

已執行：

```bash
php artisan test
```

結果：

```text
Tests: 20 passed (109 assertions)
```

新增測試涵蓋：

- AI 成功時會合併 AI 分析結果。
- AI 成功時 `ai_used` 為 `true`。
- AI 原始回傳會存入資料庫。
- AI 失敗時會 fallback 到規則式分析。
- AI 失敗時 `ai_used` 為 `false`。

## 前端目前可以先知道的事情

前端分析結果現在可以讀取：

- `ai_used`：是否真的使用 AI 分析。
- `cache_hit`：是否使用快取結果。

一般使用者畫面可以不顯示這兩個欄位，但後台或開發模式可以顯示，方便確認後端狀態。

## 環境注意事項

目前預設：

```env
AI_ANALYSIS_ENABLED=false
```

也就是不會真的呼叫 AI。若要啟用，需要設定：

```env
AI_ANALYSIS_ENABLED=true
OPENAI_API_KEY=你的 API key
```

## 尚未完成

- 歷史紀錄 API
- 統計 API
- 最新案例 API endpoint
- 前端交接 API 文件總整理

## 下一步

Milestone 7：歷史紀錄與權限。

預計完成：

- 歷史紀錄 API 需要登入
- 使用者只能看自己的掃描紀錄
- 支援搜尋
- 支援分頁
- 支援單筆紀錄查詢
- 更新本進度總覽文件

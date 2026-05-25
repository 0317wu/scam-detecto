# AI 詐騙訊息辨識系統 - 後端開發計畫

## 目前定位

本專案後端會先於前端開始開發。後端目標是提供穩定 API，讓前端之後可以直接串接文字分析、網址分析、圖片 OCR 分析、歷史紀錄、統計圖表與最新詐騙案例資料。

後端主要使用 Laravel API 架構，並依照課堂要求加入：

- 多個 API endpoint
- Laravel Sanctum 驗證
- Response Macro 統一回傳格式
- Service / Helper 注入架構
- Cache 快取重複分析結果
- OCR 圖片文字辨識
- AI 詐騙判斷
- 資料庫保存掃描紀錄

## 已確認需求

1. API 可以做多個 endpoint，不只單一 `/api/scan`。
2. Auth 需要一起規劃 Laravel Sanctum。
3. 圖片分析需要真的接 OCR。
4. 詐騙判斷需要接 AI。
5. 目前先產出後端計畫文件。
6. 每完成一個大進度，都需要另外產出一份 Markdown 進度檔，方便前端了解目前後端狀態。

## 建議技術架構

### Laravel 後端核心

- Laravel API routes
- Laravel Sanctum
- Form Request validation
- API Resource 或統一 response helper
- Migration / Model / Controller / Service 分層

### 分析服務架構

```text
Controller
  -> FraudService
      -> RuleHelper
      -> ScoreHelper
      -> OcrService
      -> AiFraudService
```

### 各層責任

`Controller`

- 接收 API request
- 驗證輸入資料
- 呼叫 service
- 回傳統一格式 response

`FraudService`

- 統一處理文字、網址、圖片分析流程
- 檢查 cache
- 呼叫規則判斷
- 呼叫 OCR
- 呼叫 AI 分析
- 整合分數、風險等級、詐騙類型、建議
- 儲存掃描紀錄

`RuleHelper`

- 用規則找出明顯風險因子
- 例如 LINE 引導、高報酬、急迫語句、個資要求、短網址、非官方網域

`ScoreHelper`

- 根據規則與 AI 回傳內容計算風險分數
- 轉換成 `safe`、`warning`、`danger`

`OcrService`

- 接圖片檔案
- 執行 OCR
- 回傳圖片中的文字

`AiFraudService`

- 呼叫 AI API
- 判斷詐騙類型、摘要、風險因子與防守建議
- 需要包裝錯誤處理，避免 AI API 失敗時整個掃描流程中斷

## API 規劃

### Auth API

```http
POST /api/register
POST /api/login
POST /api/logout
GET /api/user
```

用途：

- 使用者註冊
- 使用者登入
- 登出並清除 token
- 取得目前登入者

### 文字分析 API

```http
POST /api/scam/analyze-text
```

Request:

```json
{
  "content": "加入 LINE 投資群組，保證獲利..."
}
```

### 網址分析 API

```http
POST /api/scam/analyze-url
```

Request:

```json
{
  "url": "https://fake-bank-login.example.com"
}
```

### 圖片 OCR + 分析 API

```http
POST /api/scam/analyze-image
```

Request:

```text
multipart/form-data
image: file
```

### 歷史紀錄 API

```http
GET /api/scam/history
GET /api/scam/history/{id}
```

需求：

- 需要登入
- 只能看自己的紀錄
- 最新紀錄在最上面
- 支援搜尋
- 支援分頁
- 預設每頁 5 筆

### 統計資料 API

```http
GET /api/scam/stats
```

回傳內容：

- 最近 7 天掃描數量
- 詐騙類型分佈
- 風險等級統計

### 最新詐騙案例 API

```http
GET /api/scam/cases
```

初期可以先用 Seeder 或靜態資料，之後再改成後台可維護。

## 統一回傳格式

### 成功

```json
{
  "success": true,
  "message": "分析完成",
  "data": {}
}
```

### 失敗

```json
{
  "success": false,
  "message": "驗證失敗",
  "errors": {}
}
```

## 分析結果格式

```json
{
  "id": 1,
  "input_type": "text",
  "risk_level": "danger",
  "risk_score": 92,
  "scam_type": "假投資詐騙",
  "summary": "此訊息高度疑似假投資詐騙，包含高報酬承諾與引導加入 LINE 的特徵。",
  "risk_factors": [
    "承諾高報酬",
    "引導加入 LINE",
    "使用急迫性話術"
  ],
  "suggestions": [
    "不要加入該投資群組",
    "不要匯款",
    "不要提供個人資料",
    "建議撥打 165 查證"
  ],
  "created_at": "2026-05-24 15:00:00"
}
```

## 資料庫規劃

### users

使用 Laravel 預設 users table，搭配 Sanctum token。

### scam_scans

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | bigint | 主鍵 |
| user_id | bigint nullable | 掃描使用者 |
| input_type | string | text、url、image |
| content | text nullable | 使用者輸入文字 |
| url | text nullable | 使用者輸入網址 |
| image_path | string nullable | 上傳圖片路徑 |
| ocr_text | text nullable | OCR 辨識文字 |
| risk_score | integer | 0 到 100 |
| risk_level | string | safe、warning、danger |
| scam_type | string nullable | 詐騙類型 |
| summary | text nullable | 分析摘要 |
| risk_factors | json | 風險因子 |
| suggestions | json | 防守建議 |
| ai_raw_response | json nullable | AI 原始回傳，方便除錯 |
| created_at | timestamp | 建立時間 |
| updated_at | timestamp | 更新時間 |

### scam_cases

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| id | bigint | 主鍵 |
| title | string | 案例標題 |
| description | text | 案例描述 |
| scam_type | string nullable | 詐騙類型 |
| source_url | text nullable | 來源網址 |
| is_active | boolean | 是否顯示 |
| created_at | timestamp | 建立時間 |
| updated_at | timestamp | 更新時間 |

## Cache 規劃

同一段內容重複分析時，先查 cache。

Cache key:

```text
fraud_scan:{input_type}:{sha256}
```

例如：

```text
fraud_scan:text:9f86d081884c7d659a2feaa0c55ad015...
```

建議快取時間：

- 文字：30 分鐘
- 網址：30 分鐘
- 圖片 OCR 結果：依圖片 hash 快取 30 分鐘

注意：cache 可以避免重複呼叫 OCR 與 AI，降低 API 成本。

## AI 與 OCR 規劃

### OCR

優先方案：

1. Tesseract OCR：適合本機或免費展示，但中文辨識需要安裝語言包。
2. Google Cloud Vision：辨識品質較好，但需要金鑰與費用。

建議開發時先抽成 `OcrService`，之後可以替換 OCR provider。

### AI 分析

AI 分析建議輸出固定 JSON：

```json
{
  "scam_type": "假投資詐騙",
  "summary": "分析摘要",
  "risk_factors": [],
  "suggestions": [],
  "ai_risk_score": 85
}
```

後端再用 `ScoreHelper` 整合規則分數與 AI 分數，避免完全依賴 AI。

## 開發里程碑

### Milestone 0 - 後端計畫文件

產出後端總計畫與進度文件。

交付：

- `docs/backend-plan.md`
- `docs/progress/00-kickoff.md`

### Milestone 1 - 建立 Laravel 專案與基礎設定

目標：

- 建立 Laravel 專案
- 設定 `.env`
- 建立 API routes
- 安裝 Sanctum
- 建立基本 users auth

交付：

- Laravel 專案可以啟動
- Auth API 初版可用
- 進度文件 `docs/progress/01-laravel-setup.md`

### Milestone 2 - 統一回傳格式與資料庫

目標：

- 建立 Response Macro
- 建立 `scam_scans` migration / model
- 建立 `scam_cases` migration / model
- 建立基本 seeder

交付：

- 統一 response 格式
- 資料表可 migrate
- 進度文件 `docs/progress/02-response-and-database.md`

### Milestone 3 - 規則式詐騙分析

目標：

- 建立 `FraudService`
- 建立 `RuleHelper`
- 建立 `ScoreHelper`
- 完成文字與網址規則判斷

交付：

- `/api/scam/analyze-text`
- `/api/scam/analyze-url`
- 進度文件 `docs/progress/03-rule-analysis.md`

### Milestone 4 - Cache

目標：

- 對文字、網址、圖片 hash 建立 cache
- 相同輸入避免重複分析

交付：

- Cache hit / miss 可測試
- 進度文件 `docs/progress/04-cache.md`

### Milestone 5 - OCR 圖片分析

目標：

- 建立 `OcrService`
- 支援圖片上傳
- 將 OCR 文字送進分析流程

交付：

- `/api/scam/analyze-image`
- 圖片儲存與 OCR 文字保存
- 進度文件 `docs/progress/05-ocr.md`

### Milestone 6 - AI 詐騙分析

目標：

- 建立 `AiFraudService`
- 接 AI API
- 要求 AI 回傳固定 JSON
- 整合規則分數與 AI 分數

交付：

- 文字、網址、圖片皆可進入 AI 分析
- AI 失敗時仍有規則式 fallback
- 進度文件 `docs/progress/06-ai-analysis.md`

### Milestone 7 - 歷史紀錄與權限

目標：

- 歷史紀錄 API 需要登入
- 使用者只能看自己的掃描紀錄
- 搜尋、排序、分頁

交付：

- `/api/scam/history`
- `/api/scam/history/{id}`
- 進度文件 `docs/progress/07-history-auth.md`

### Milestone 8 - 統計與案例 API

目標：

- 統計資料 API
- 最新詐騙案例 API

交付：

- `/api/scam/stats`
- `/api/scam/cases`
- 進度文件 `docs/progress/08-stats-and-cases.md`

### Milestone 9 - 測試與前端交接

目標：

- 補 API 測試
- 整理前端串接文件
- 確認 request / response 範例

交付：

- API 測試通過
- 前端串接文件
- 進度文件 `docs/progress/09-handoff.md`

## 前端交接規則

每完成一個大進度，新增一份 Markdown 到：

```text
docs/progress/
```

每份文件需包含：

- 完成日期
- 本次完成內容
- 新增或修改的 API
- Request 範例
- Response 範例
- 前端需要知道的事情
- 尚未完成的事情

## 目前建議順序

1. 先建立 Laravel 專案。
2. 先完成 Sanctum 登入與 Response Macro。
3. 先做規則式分析，確保不用 AI 也能跑。
4. 再接 OCR。
5. 最後接 AI，並保留 fallback。

這樣做的好處是：即使 OCR 或 AI API 金鑰尚未準備好，後端仍然可以先提供可測試的 API 給前端使用。

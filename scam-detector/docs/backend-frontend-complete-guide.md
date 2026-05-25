# 後端使用與前端接手完整教程

## 1. 專案說明

這是 AI 詐騙訊息辨識系統的 Laravel 後端。

目前後端已完成：

- 使用者註冊 / 登入 / 登出
- Laravel Sanctum Token 驗證
- 統一 API 回傳格式
- 文字詐騙分析
- 網址詐騙分析
- 圖片 OCR 詐騙分析
- 規則式風險判斷
- Cache 快取重複分析結果
- Gemini / OpenAI AI 分析整合
- AI 失敗 fallback 規則式分析
- 歷史紀錄
- 統計圖表資料
- 最新詐騙案例

GitHub：

```text
https://github.com/0317wu/scam-detecto
```

## 2. 專案結構

```text
scam-detector-backend/
  app/
    Helpers/
      RuleHelper.php
      ScoreHelper.php
    Services/
      FraudService.php
      OcrService.php
      AiFraudService.php
    Http/Controllers/Api/
      AuthController.php
      ScamAnalysisController.php
      ScamHistoryController.php
      ScamDashboardController.php
    Models/
      User.php
      ScamScan.php
      ScamCase.php
  config/
    ai.php
    ocr.php
  database/
    migrations/
    seeders/
  docs/
    frontend-api-handoff.md
    frontend-handoff-progress.md
    backend-frontend-complete-guide.md
  routes/
    api.php
  tests/
```

## 3. 後端核心流程

### 文字 / 網址分析

```text
前端 request
  -> ScamAnalysisController
  -> FraudService
  -> RuleHelper
  -> ScoreHelper
  -> AiFraudService optional
  -> ScamScan database
  -> API response
```

### 圖片分析

```text
前端上傳圖片
  -> ScamAnalysisController
  -> FraudService
  -> OcrService
  -> Tesseract OCR
  -> OCR 文字
  -> RuleHelper / ScoreHelper / AI
  -> ScamScan database
  -> API response
```

## 4. 後端安裝方式

### 4.1 Clone 專案

```bash
git clone https://github.com/0317wu/scam-detecto.git
cd scam-detecto/scam-detector-backend
```

### 4.2 安裝 Composer 套件

```bash
composer install
```

### 4.3 建立 `.env`

Windows：

```powershell
copy .env.example .env
```

macOS / Linux：

```bash
cp .env.example .env
```

### 4.4 產生 APP_KEY

```bash
php artisan key:generate
```

### 4.5 建立 SQLite database

Windows PowerShell：

```powershell
New-Item -ItemType File -Path database/database.sqlite -Force
```

macOS / Linux：

```bash
touch database/database.sqlite
```

### 4.6 執行 migration 與 seeder

```bash
php artisan migrate --seed
```

### 4.7 啟動後端

```bash
php artisan serve
```

預設網址：

```text
http://127.0.0.1:8000
```

## 5. `.env` 設定範例

### 5.1 基本設定

```env
APP_NAME=Laravel
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=sqlite
CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=local
```

## 6. OCR 設定

本專案使用 Tesseract OCR。

### 6.1 Windows 安裝位置範例

```env
TESSERACT_PATH="C:/Program Files/Tesseract-OCR/tesseract.exe"
OCR_LANGUAGE=chi_tra+eng
OCR_TIMEOUT=30
```

### 6.2 確認 Tesseract 可用

```powershell
& "C:/Program Files/Tesseract-OCR/tesseract.exe" --version
& "C:/Program Files/Tesseract-OCR/tesseract.exe" --list-langs
```

需要看到：

```text
chi_tra
eng
```

### 6.3 OCR 注意事項

如果 `ocr_text` 是空字串，通常不是後端壞掉，而是圖片太小、太糊或文字對比太低。

建議測試圖片：

- 原始截圖
- 解析度高
- 文字清楚
- 對比高
- 不要被壓縮成小縮圖

## 7. AI 設定

後端支援兩種 AI provider：

- Gemini
- OpenAI

建議課堂專題先用 Gemini free tier。

## 8. Gemini 設定方式

### 8.1 取得 Gemini API key

到 Google AI Studio：

```text
https://aistudio.google.com/app/apikey
```

建立 API key。

### 8.2 設定 `.env`

```env
AI_ANALYSIS_ENABLED=true
AI_PROVIDER=gemini
AI_TIMEOUT=30

GEMINI_API_KEY=你的_Gemini_API_Key
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_MODEL=gemini-2.5-flash
```

### 8.3 清 config cache

```bash
php artisan config:clear
```

### 8.4 測試 Gemini 是否成功

呼叫：

```http
POST /api/scam/analyze-text
```

Body：

```json
{
  "content": "加入 LINE 投資群組，老師帶單，保證獲利翻倍，今天截止。"
}
```

如果成功，response 會看到：

```json
"ai_used": true
```

如果失敗，會看到：

```json
"ai_used": false
```

`false` 代表系統 fallback 到規則式分析。

## 9. OpenAI 設定方式 optional

```env
AI_ANALYSIS_ENABLED=true
AI_PROVIDER=openai
AI_TIMEOUT=30

OPENAI_API_KEY=你的_OpenAI_API_Key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini
```

注意：OpenAI API 通常會計費。

## 10. 前端串接總原則

所有 API 回傳格式一致。

成功：

```json
{
  "success": true,
  "message": "message_code",
  "data": {}
}
```

失敗：

```json
{
  "success": false,
  "message": "error_code",
  "errors": {}
}
```

前端建議：

```js
if (response.success) {
  // 使用 response.data
} else {
  // 顯示 response.message 或 errors
}
```

## 11. API 清單

```http
POST /api/register
POST /api/login
POST /api/logout
GET /api/user

POST /api/scam/analyze-text
POST /api/scam/analyze-url
POST /api/scam/analyze-image

GET /api/scam/history
GET /api/scam/history/{id}
GET /api/scam/stats
GET /api/scam/cases
```

## 12. Auth API

### 12.1 註冊

```http
POST /api/register
```

Body：

```json
{
  "name": "Tester",
  "email": "tester@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

### 12.2 登入

```http
POST /api/login
```

Body：

```json
{
  "email": "tester@example.com",
  "password": "password123"
}
```

登入成功後會取得：

```json
{
  "token": "SANCTUM_TOKEN"
}
```

### 12.3 需要登入的 API header

```http
Authorization: Bearer SANCTUM_TOKEN
```

### 12.4 取得登入者

```http
GET /api/user
```

### 12.5 登出

```http
POST /api/logout
```

## 13. 分析 API

分析 API 不強制登入。

但如果有帶 token，後端會把該筆紀錄綁到使用者，之後 history 才看得到。

### 13.1 文字分析

```http
POST /api/scam/analyze-text
```

Body：

```json
{
  "content": "加入 LINE 投資群組，保證獲利，今天截止。"
}
```

### 13.2 網址分析

```http
POST /api/scam/analyze-url
```

Body：

```json
{
  "url": "http://secure-bank-login.verify.example.top/account/password"
}
```

### 13.3 圖片分析

```http
POST /api/scam/analyze-image
Content-Type: multipart/form-data
```

Body：

```text
image: File
```

限制：

```text
jpg, jpeg, png, webp
最大 5MB
```

### 13.4 分析 response

```json
{
  "success": true,
  "message": "analysis_completed",
  "data": {
    "id": 1,
    "user_id": 1,
    "input_type": "text",
    "risk_level": "danger",
    "risk_score": 92,
    "scam_type": "假投資詐騙",
    "summary": "此內容高度疑似假投資詐騙，包含多個高風險特徵。",
    "ocr_text": null,
    "image_path": null,
    "ai_used": true,
    "risk_factors": [
      "引導加入 LINE 或私訊群組",
      "承諾高報酬或保證獲利"
    ],
    "suggestions": [
      "不要點擊連結或加入陌生群組",
      "不要匯款或提供信用卡、身分證、驗證碼"
    ],
    "cache_hit": false,
    "created_at": "2026-05-24 18:00:00"
  }
}
```

### 13.5 前端欄位用途

- `risk_score`：風險分數儀表板
- `risk_level`：3D AI 球狀態，值為 `safe`、`warning`、`danger`
- `scam_type`：詐騙類型
- `summary`：分析摘要
- `risk_factors`：風險因子
- `suggestions`：防守建議
- `ocr_text`：OCR 辨識文字
- `image_path`：圖片路徑
- `ai_used`：是否使用 AI
- `cache_hit`：是否使用快取

## 14. History API

History API 需要登入。

### 14.1 歷史列表

```http
GET /api/scam/history
```

Query：

```text
search       optional
risk_level   safe|warning|danger
input_type   text|url|image
page         optional
per_page     default 5, max 50
```

Response `data`：

```json
{
  "items": [],
  "pagination": {
    "current_page": 1,
    "per_page": 5,
    "total": 0,
    "last_page": 1
  }
}
```

### 14.2 單筆歷史

```http
GET /api/scam/history/{id}
```

使用者不能查看別人的紀錄。

## 15. Stats API

Stats API 需要登入，只統計目前登入者自己的資料。

```http
GET /api/scam/stats
```

Response `data`：

```json
{
  "weekly_trend": [
    { "date": "2026-05-18", "count": 0 }
  ],
  "scam_type_distribution": [
    { "scam_type": "假投資詐騙", "count": 3 }
  ],
  "risk_level_distribution": [
    { "risk_level": "safe", "count": 1 },
    { "risk_level": "warning", "count": 2 },
    { "risk_level": "danger", "count": 3 }
  ],
  "summary": {
    "total_scans": 6,
    "danger_scans": 3,
    "warning_scans": 2,
    "safe_scans": 1
  }
}
```

前端 Chart.js 對應：

- 折線圖：`weekly_trend`
- 圓餅圖：`scam_type_distribution`
- 風險統計：`risk_level_distribution`

## 16. Cases API

不需要登入，給首頁跑馬燈使用。

```http
GET /api/scam/cases
```

Response `data`：

```json
{
  "cases": [
    {
      "id": 1,
      "title": "假投資群組詐騙",
      "description": "詐騙集團引導民眾加入 LINE 群組，宣稱保證獲利或內線消息，最後要求匯款到指定帳戶。",
      "scam_type": "假投資",
      "source_url": null,
      "created_at": "2026-05-24 18:00:00"
    }
  ]
}
```

## 17. 建議前端串接順序

1. `GET /api/scam/cases`
2. `POST /api/scam/analyze-text`
3. `POST /api/scam/analyze-url`
4. `POST /api/scam/analyze-image`
5. `POST /api/register`
6. `POST /api/login`
7. 儲存 token
8. `GET /api/scam/history`
9. `GET /api/scam/stats`

## 18. 常見問題

### 18.1 `ai_used` 是 false

可能原因：

- `AI_ANALYSIS_ENABLED` 不是 `true`
- `AI_PROVIDER` 設錯
- `GEMINI_API_KEY` 或 `OPENAI_API_KEY` 沒填
- 忘記執行 `php artisan config:clear`
- API 額度不足
- 外部 AI API 暫時失敗

### 18.2 `ocr_text` 是空字串

通常是圖片太小或太模糊。請換高解析度、文字清楚的截圖。

### 18.3 History 沒資料

分析 API 沒有帶 token 時，`user_id` 是 null，登入後的 history 看不到。

要讓 history 有資料，分析時也要帶：

```http
Authorization: Bearer SANCTUM_TOKEN
```

### 18.4 401 unauthenticated

代表 API 需要登入，但沒有帶 token 或 token 錯誤。

## 19. 測試

執行：

```bash
php artisan test
```

目前測試結果：

```text
Tests: 31 passed
```

## 20. 結論

前端可以直接依照本文件開始串接。

最重要的兩份文件：

```text
docs/backend-frontend-complete-guide.md
docs/frontend-api-handoff.md
```
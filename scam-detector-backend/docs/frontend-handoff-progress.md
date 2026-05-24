# 前端接手總覽

## 專案狀態

後端核心功能已完成，可以交給前端開始串接。

目前後端提供：

- Laravel 12 API
- Sanctum 登入驗證
- 統一 Response Macro
- 文字詐騙分析
- 網址詐騙分析
- 圖片 OCR 詐騙分析
- Cache 快取
- AI 分析整合與 fallback
- 歷史紀錄 API
- 統計資料 API
- 最新詐騙案例 API

## 後端專案位置

```text
scam-detector-backend
```

## 前端最重要文件

請先看：

```text
docs/frontend-api-handoff.md
```

這份文件有完整 API request / response 格式。

## 本機啟動方式

### 1. 安裝 PHP 套件

```bash
composer install
```

### 2. 建立環境檔

```bash
copy .env.example .env
```

如果是 macOS / Linux：

```bash
cp .env.example .env
```

### 3. 建立 APP_KEY

```bash
php artisan key:generate
```

### 4. 建立 SQLite database

Windows PowerShell：

```powershell
New-Item -ItemType File -Path database/database.sqlite -Force
```

macOS / Linux：

```bash
touch database/database.sqlite
```

### 5. 執行 migration 與 seeder

```bash
php artisan migrate --seed
```

### 6. 啟動後端

```bash
php artisan serve
```

預設 API base URL：

```text
http://127.0.0.1:8000
```

## 建議前端串接順序

1. 先串 `GET /api/scam/cases`
   - 不需要登入
   - 可用於首頁跑馬燈

2. 串文字分析 `POST /api/scam/analyze-text`
   - 不需要登入
   - 可直接測結果卡、3D 球狀態、風險因子與建議

3. 串網址分析 `POST /api/scam/analyze-url`
   - 不需要登入

4. 串圖片分析 `POST /api/scam/analyze-image`
   - 不需要登入
   - 使用 `multipart/form-data`
   - 欄位名稱：`image`

5. 串登入流程
   - `POST /api/register`
   - `POST /api/login`
   - 保存 token

6. 帶 token 串 history
   - `GET /api/scam/history`
   - `GET /api/scam/history/{id}`

7. 帶 token 串 stats
   - `GET /api/scam/stats`

## Token 使用方式

登入後會拿到：

```json
{
  "token": "SANCTUM_TOKEN"
}
```

需要登入的 API header 要帶：

```http
Authorization: Bearer SANCTUM_TOKEN
```

## 統一回傳格式

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

前端可以先判斷 `success`，成功讀 `data`，失敗讀 `message` 與 `errors`。

## 分析 API 共用欄位

分析結果會回傳：

```text
id
user_id
input_type
risk_level
risk_score
scam_type
summary
ocr_text
image_path
ai_used
risk_factors
suggestions
cache_hit
created_at
```

前端主要會用：

- `risk_score`：風險分數儀表板
- `risk_level`：3D AI 球顏色與速度
- `scam_type`：詐騙類型
- `summary`：分析摘要
- `risk_factors`：風險因子列表
- `suggestions`：防守建議列表
- `ocr_text`：圖片 OCR 文字

開發除錯用：

- `cache_hit`
- `ai_used`

## 目前 API 清單

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

## OCR 注意事項

後端已完成 Tesseract OCR 串接。

本機若要真的辨識圖片，需要安裝：

- Tesseract OCR
- `chi_tra` 繁體中文語言包
- `eng` 英文語言包

`.env` 範例：

```env
TESSERACT_PATH="C:/Program Files/Tesseract-OCR/tesseract.exe"
OCR_LANGUAGE=chi_tra+eng
OCR_TIMEOUT=30
```

如果 OCR 回傳空字串，通常是圖片太小、太糊、文字對比太低，建議改用更清楚的截圖。

## AI 注意事項

AI 預設關閉。

若要啟用：

```env
AI_ANALYSIS_ENABLED=true
OPENAI_API_KEY=你的 API key
```

AI 失敗時會自動 fallback 到規則式分析，不會讓 API 中斷。

## 後端測試結果

目前測試通過：

```text
Tests: 30 passed (183 assertions)
```

## 前端接手提醒

- 分析 API 可以不登入就用。
- History 與 Stats 必須登入。
- `GET /api/scam/cases` 不用登入，首頁可以直接抓。
- 圖片上傳欄位名稱必須是 `image`。
- 風險等級固定為 `safe`、`warning`、`danger`。
- 後端 response message 是代碼，例如 `analysis_completed`，前端可自行轉中文。
# Scam Detecto Backend

AI 詐騙訊息辨識系統 Laravel 後端。

## 前端接手請先看

```text
docs/backend-frontend-complete-guide.md
docs/frontend-api-handoff.md
docs/frontend-handoff-progress.md
```

## 已完成功能

- Laravel 12 API
- Sanctum Auth
- Response Macro 統一回傳格式
- 文字詐騙分析
- 網址詐騙分析
- 圖片 OCR 詐騙分析
- Tesseract OCR 串接
- 規則式詐騙分析
- Gemini / OpenAI AI 分析整合
- AI 失敗 fallback 規則式分析
- Cache 快取
- 歷史紀錄 API
- 統計 API
- 最新案例 API

## 快速啟動

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan serve
```

Windows 建立 SQLite：

```powershell
New-Item -ItemType File -Path database/database.sqlite -Force
```

## Gemini AI 設定

```env
AI_ANALYSIS_ENABLED=true
AI_PROVIDER=gemini
GEMINI_API_KEY=你的_Gemini_API_Key
GEMINI_MODEL=gemini-2.5-flash
```

設定後執行：

```bash
php artisan config:clear
```

## OCR 設定

Windows 範例：

```env
TESSERACT_PATH="C:/Program Files/Tesseract-OCR/tesseract.exe"
OCR_LANGUAGE=chi_tra+eng
OCR_TIMEOUT=30
```

## 測試

```bash
php artisan test
```

目前測試：

```text
Tests: 31 passed
```

## API 清單

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
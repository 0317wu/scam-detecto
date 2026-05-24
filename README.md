# Scam Detecto - AI 詐騙訊息辨識系統後端

這是 AI 詐騙訊息辨識系統的 Laravel 後端專案。

後端已完成文字分析、網址分析、圖片 OCR 分析、Gemini / OpenAI AI 分析、歷史紀錄、統計資料與最新詐騙案例 API。

## 前端接手請先看

完整後端使用與前端接手教程：

[scam-detector-backend/docs/backend-frontend-complete-guide.md](scam-detector-backend/docs/backend-frontend-complete-guide.md)

完整 API request / response 文件：

[scam-detector-backend/docs/frontend-api-handoff.md](scam-detector-backend/docs/frontend-api-handoff.md)

前端接手進度總覽：

[scam-detector-backend/docs/frontend-handoff-progress.md](scam-detector-backend/docs/frontend-handoff-progress.md)

## 後端專案位置

```text
scam-detector-backend/
```

## 已完成功能

- Laravel 12 API
- Sanctum 登入驗證
- Response Macro 統一回傳格式
- 文字詐騙分析 API
- 網址詐騙分析 API
- 圖片 OCR 詐騙分析 API
- Tesseract OCR 串接
- Gemini / OpenAI AI 分析整合
- AI 失敗 fallback 規則式分析
- Cache 快取
- 歷史紀錄 API
- 統計 API
- 最新案例 API
- 前端交接文件

## 快速啟動

```bash
cd scam-detector-backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan serve
```

Windows 建立 SQLite：

```powershell
cd scam-detector-backend
New-Item -ItemType File -Path database/database.sqlite -Force
```

啟動後 API base URL：

```text
http://127.0.0.1:8000
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

## Gemini AI 設定

```env
AI_ANALYSIS_ENABLED=true
AI_PROVIDER=gemini
GEMINI_API_KEY=你的_Gemini_API_Key
GEMINI_MODEL=gemini-2.5-flash
```

設定後：

```bash
php artisan config:clear
```

## OCR 設定

Windows Tesseract 範例：

```env
TESSERACT_PATH="C:/Program Files/Tesseract-OCR/tesseract.exe"
OCR_LANGUAGE=chi_tra+eng
OCR_TIMEOUT=30
```

## 測試

```bash
cd scam-detector-backend
php artisan test
```

目前測試：

```text
Tests: 31 passed
```
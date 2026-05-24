# 前端串接 API 文件

## 基本資訊

Base URL 建議：

```text
http://localhost:8000
```

所有 API 回傳格式固定為：

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

需要登入的 API 請帶：

```http
Authorization: Bearer SANCTUM_TOKEN
```

## Auth API

### 註冊

```http
POST /api/register
```

Request:

```json
{
  "name": "Tester",
  "email": "tester@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

Response `data`:

```json
{
  "user": {
    "id": 1,
    "name": "Tester",
    "email": "tester@example.com"
  },
  "token": "SANCTUM_TOKEN"
}
```

### 登入

```http
POST /api/login
```

Request:

```json
{
  "email": "tester@example.com",
  "password": "password123"
}
```

Response `data` 同註冊，前端需保存 `token`。

### 取得登入者

```http
GET /api/user
Authorization: Bearer SANCTUM_TOKEN
```

### 登出

```http
POST /api/logout
Authorization: Bearer SANCTUM_TOKEN
```

## Scam Analysis API

分析 API 不強制登入；如果有帶 Bearer token，後端會把該筆掃描紀錄綁定使用者。

### 文字分析

```http
POST /api/scam/analyze-text
```

Request:

```json
{
  "content": "立即加入 LINE 投資群組，保證獲利。"
}
```

### 網址分析

```http
POST /api/scam/analyze-url
```

Request:

```json
{
  "url": "http://secure-bank-login.verify.example.top/account/password"
}
```

### 圖片 OCR 分析

```http
POST /api/scam/analyze-image
Content-Type: multipart/form-data
```

Request:

```text
image: file
```

限制：`jpg`、`jpeg`、`png`、`webp`，最大 5MB。

### 分析 Response

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
    "ai_used": false,
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

前端建議使用：

- `risk_score`：分數儀表板
- `risk_level`：3D AI 球狀態，值為 `safe`、`warning`、`danger`
- `risk_factors`：風險因子列表
- `suggestions`：防守建議列表
- `ocr_text`：圖片 OCR 結果
- `cache_hit`：除錯用，可不顯示
- `ai_used`：除錯用，可不顯示

## History API

History API 需要登入。

### 歷史列表

```http
GET /api/scam/history
Authorization: Bearer SANCTUM_TOKEN
```

Query parameters:

```text
search       optional string
risk_level   optional safe|warning|danger
input_type   optional text|url|image
page         optional integer
per_page     optional integer, default 5, max 50
```

Response `data`:

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

### 單筆歷史

```http
GET /api/scam/history/{id}
Authorization: Bearer SANCTUM_TOKEN
```

若查詢到別人的紀錄，會回 `404` 與 `scan_not_found`。

## Stats API

Stats API 需要登入，只統計目前登入者自己的掃描紀錄。

```http
GET /api/scam/stats
Authorization: Bearer SANCTUM_TOKEN
```

Response `data`:

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

Chart.js 建議使用：

- 折線圖：`weekly_trend`
- 圓餅圖：`scam_type_distribution`
- 風險等級統計：`risk_level_distribution`

## Cases API

不需要登入，給首頁跑馬燈使用。

```http
GET /api/scam/cases
```

Response `data`:

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

## 環境注意事項

OCR 已完成 Tesseract 串接，但本機目前需要安裝 Tesseract 與繁體中文語言包才會真的辨識圖片。

AI 預設關閉。若要啟用：

```env
AI_ANALYSIS_ENABLED=true
OPENAI_API_KEY=你的 API key
```

AI 失敗時會自動 fallback 到規則式分析，不會讓掃描中斷。
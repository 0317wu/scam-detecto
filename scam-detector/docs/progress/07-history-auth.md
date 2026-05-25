# Progress 07 - 歷史紀錄與權限

## 日期

2026-05-24

## 本次完成內容

本次已完成 Milestone 7：歷史紀錄與權限。

後端現在已支援登入使用者查看自己的掃描紀錄。分析 API 不強制登入，但如果 request 帶有 Sanctum token，分析紀錄會自動綁定該使用者。歷史紀錄 API 則必須登入才能使用。

## 已完成項目

1. 新增 `ScamHistoryController`。
2. 新增歷史紀錄列表 API：`GET /api/scam/history`。
3. 新增單筆歷史紀錄 API：`GET /api/scam/history/{id}`。
4. History API 加上 `auth:sanctum` 保護。
5. 使用者只能看到自己的掃描紀錄。
6. 使用者不能查看其他人的單筆紀錄。
7. 歷史列表支援搜尋。
8. 歷史列表支援風險等級篩選。
9. 歷史列表支援輸入類型篩選。
10. 歷史列表支援分頁，預設每頁 5 筆。
11. 掃描 API 在登入狀態下會自動綁定 `user_id`。
12. 新增 history API 測試。
13. 測試通過。

## 新增或修改的主要檔案

```text
app/Http/Controllers/Api/ScamHistoryController.php
app/Http/Controllers/Api/ScamAnalysisController.php
routes/api.php
tests/Feature/ScamAnalysisApiTest.php
tests/Feature/ScamHistoryApiTest.php
docs/current-progress.md
```

## 新增 API

### 歷史紀錄列表

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

### 單筆歷史紀錄

```http
GET /api/scam/history/{id}
Authorization: Bearer SANCTUM_TOKEN
```

## Response 範例

```json
{
  "success": true,
  "message": "history_retrieved",
  "data": {
    "items": [
      {
        "id": 1,
        "user_id": 1,
        "input_type": "text",
        "content": "加入 LINE 投資群組",
        "url": null,
        "image_path": null,
        "ocr_text": null,
        "risk_level": "danger",
        "risk_score": 80,
        "scam_type": "假投資詐騙",
        "summary": "此內容高度疑似假投資詐騙。",
        "risk_factors": ["引導加入 LINE 或私訊群組"],
        "suggestions": ["不要點擊連結或加入陌生群組"],
        "ai_used": false,
        "created_at": "2026-05-24 17:40:00"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 5,
      "total": 1,
      "last_page": 1
    }
  }
}
```

## 權限規則

分析 API 不強制登入：

```http
POST /api/scam/analyze-text
POST /api/scam/analyze-url
POST /api/scam/analyze-image
```

但是如果有帶 Bearer token，紀錄會綁定該使用者。

歷史紀錄 API 必須登入：

```http
GET /api/scam/history
GET /api/scam/history/{id}
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

GET /api/scam/history
GET /api/scam/history/{id}
```

## 測試結果

已執行：

```bash
php artisan test
```

結果：

```text
Tests: 27 passed (132 assertions)
```

## 前端目前可以先知道的事情

前端若要顯示歷史紀錄，必須先登入並保存 token。

Header：

```http
Authorization: Bearer SANCTUM_TOKEN
```

列表資料在 `data.items`，分頁資料在 `data.pagination`。

## 尚未完成

- 統計 API
- 最新案例 API endpoint
- 前端交接 API 文件總整理

## 下一步

Milestone 8：統計與案例 API。

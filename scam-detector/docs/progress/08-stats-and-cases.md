# Progress 08 - 統計與案例 API

## 日期

2026-05-24

## 本次完成內容

本次已完成 Milestone 8：統計與案例 API。

後端現在已提供前端儀表板與首頁跑馬燈需要的資料來源，包括最近 7 天掃描趨勢、詐騙類型分佈、風險等級分佈，以及最新詐騙案例列表。

## 已完成項目

1. 新增 `ScamDashboardController`。
2. 新增統計 API：`GET /api/scam/stats`。
3. 新增案例 API：`GET /api/scam/cases`。
4. 統計 API 需要登入。
5. 統計 API 只計算目前登入使用者自己的掃描紀錄。
6. 案例 API 不需要登入，方便首頁跑馬燈直接使用。
7. 統計最近 7 天每日掃描數量。
8. 統計詐騙類型分佈。
9. 統計 safe / warning / danger 數量。
10. 回傳總掃描數與各風險等級數量。
11. 修正 `ScamCaseSeeder` 中文案例資料。
12. 新增 Dashboard API 測試。
13. 測試通過。

## 新增或修改的主要檔案

```text
app/Http/Controllers/Api/ScamDashboardController.php
routes/api.php
database/seeders/ScamCaseSeeder.php
tests/Feature/ScamDashboardApiTest.php
docs/current-progress.md
```

## 新增 API

### 統計資料

```http
GET /api/scam/stats
Authorization: Bearer SANCTUM_TOKEN
```

Response:

```json
{
  "success": true,
  "message": "stats_retrieved",
  "data": {
    "weekly_trend": [
      {
        "date": "2026-05-18",
        "count": 0
      },
      {
        "date": "2026-05-19",
        "count": 2
      }
    ],
    "scam_type_distribution": [
      {
        "scam_type": "假投資詐騙",
        "count": 3
      },
      {
        "scam_type": "釣魚網站",
        "count": 1
      }
    ],
    "risk_level_distribution": [
      {
        "risk_level": "safe",
        "count": 1
      },
      {
        "risk_level": "warning",
        "count": 2
      },
      {
        "risk_level": "danger",
        "count": 3
      }
    ],
    "summary": {
      "total_scans": 6,
      "danger_scans": 3,
      "warning_scans": 2,
      "safe_scans": 1
    }
  }
}
```

### 最新詐騙案例

```http
GET /api/scam/cases
```

Response:

```json
{
  "success": true,
  "message": "cases_retrieved",
  "data": {
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
}
```

## 權限規則

### 需要登入

```http
GET /api/scam/stats
```

統計資料只計算目前登入者自己的掃描紀錄。

### 不需要登入

```http
GET /api/scam/cases
```

案例 API 可直接提供首頁跑馬燈使用。

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
GET /api/scam/stats
GET /api/scam/cases
```

## 測試結果

已執行：

```bash
php artisan db:seed --force
php artisan test
```

結果：

```text
Tests: 30 passed (183 assertions)
```

新增測試涵蓋：

- 未登入不能取得 stats。
- stats 只統計目前登入者自己的資料。
- stats 回傳 weekly trend。
- stats 回傳 scam type distribution。
- stats 回傳 risk level distribution。
- cases API 回傳 active seeded cases。

## 前端目前可以先知道的事情

Chart.js 可以直接使用：

- `data.weekly_trend`
- `data.scam_type_distribution`
- `data.risk_level_distribution`

首頁案例跑馬燈可以使用：

- `data.cases`

## 尚未完成

- 前端交接 API 文件總整理
- 最終測試整理

## 下一步

Milestone 9：測試與前端交接。

預計完成：

- 整理完整 API 文件
- 整理前端串接範例
- 確認所有測試通過
- 更新本進度總覽文件

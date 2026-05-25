# Progress 02 - Response Macro 與資料庫

## 日期

2026-05-24

## 本次完成內容

本次已完成 Milestone 2：Response Macro 與資料庫。

後端現在已經有統一 API 回傳格式，也建立了詐騙掃描紀錄與最新詐騙案例的資料表。

## 已完成項目

1. 建立 Response Macro：
   - `response()->success()`
   - `response()->error()`
2. 將 Auth API 改成統一成功回傳格式。
3. 將 validation error 改成統一失敗回傳格式。
4. 將未登入錯誤改成統一失敗回傳格式。
5. 建立 `ScamScan` model。
6. 建立 `ScamCase` model。
7. 建立 `scam_scans` migration。
8. 建立 `scam_cases` migration。
9. 在 `User` model 加入 `scamScans()` 關聯。
10. 建立 `ScamCaseSeeder`，提供初始詐騙案例資料。
11. 執行 migration 與 seeder。
12. 新增資料庫與 Response 格式測試。
13. 測試通過。

## 新增或修改的主要檔案

```text
app/Providers/AppServiceProvider.php
bootstrap/app.php
app/Http/Controllers/Api/AuthController.php
app/Models/User.php
app/Models/ScamScan.php
app/Models/ScamCase.php
database/migrations/2026_05_24_081300_create_scam_scans_table.php
database/migrations/2026_05_24_081301_create_scam_cases_table.php
database/seeders/DatabaseSeeder.php
database/seeders/ScamCaseSeeder.php
tests/Feature/AuthApiTest.php
tests/Feature/ScamDatabaseTest.php
```

## 統一回傳格式

### 成功

```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

### 失敗

```json
{
  "success": false,
  "message": "操作失敗",
  "errors": {}
}
```

### 驗證失敗範例

```json
{
  "success": false,
  "message": "驗證失敗",
  "errors": {
    "email": [
      "The email field is required."
    ]
  }
}
```

### 未登入範例

```json
{
  "success": false,
  "message": "未授權，請先登入",
  "errors": null
}
```

## 資料表

### scam_scans

用途：儲存每一次詐騙分析紀錄。

主要欄位：

```text
id
user_id
input_type
content
url
image_path
ocr_text
risk_score
risk_level
scam_type
summary
risk_factors
suggestions
ai_raw_response
created_at
updated_at
```

補充：

- `risk_factors` 使用 JSON 欄位。
- `suggestions` 使用 JSON 欄位。
- `ai_raw_response` 使用 JSON 欄位，方便之後除錯 AI 原始回傳。
- `user_id` 可以為 null，但之後歷史紀錄會要求登入，只顯示自己的資料。

### scam_cases

用途：儲存首頁或前端跑馬燈使用的最新詐騙案例。

主要欄位：

```text
id
title
description
scam_type
source_url
is_active
created_at
updated_at
```

## 初始詐騙案例

目前 Seeder 已建立 5 筆初始資料：

- 假投資群組詐騙
- 假包裹異常通知
- 假退稅通知
- 解除分期付款詐騙
- 釣魚網站登入頁

## 目前可用 API

目前 Auth API 可用，且已改成統一回傳格式：

```http
POST /api/register
POST /api/login
POST /api/logout
GET /api/user
```

## 測試結果

已執行：

```bash
php artisan migrate --force
php artisan db:seed --force
php artisan test
```

結果：

```text
Tests: 9 passed (40 assertions)
```

測試涵蓋：

- 註冊成功回傳統一格式
- 登入成功回傳統一格式
- 未登入回傳統一錯誤格式
- 驗證失敗回傳統一錯誤格式
- `scam_scans` 可以儲存分析結果
- `scam_cases` Seeder 可以建立初始案例

## 前端目前可以先知道的事情

從現在開始，前端可以預期 API 都會使用固定格式：

```json
{
  "success": true,
  "message": "訊息",
  "data": {}
}
```

錯誤時：

```json
{
  "success": false,
  "message": "錯誤訊息",
  "errors": {}
}
```

所以前端可以先用 `success` 判斷 API 是否成功，再讀取 `data` 或 `errors`。

## 尚未完成

- 詐騙分析 API
- `FraudService`
- `RuleHelper`
- `ScoreHelper`
- Cache
- OCR
- AI 分析
- 歷史紀錄 API
- 統計 API
- 最新案例 API endpoint

## 下一步

Milestone 3：規則式詐騙分析。

預計完成：

- 建立 `FraudService`
- 建立 `RuleHelper`
- 建立 `ScoreHelper`
- 完成文字分析 API
- 完成網址分析 API
- 將分析結果存入 `scam_scans`
- 更新本進度總覽文件

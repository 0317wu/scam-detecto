# Progress 01 - Laravel 專案與 Sanctum 基礎設定

## 日期

2026-05-24

## 本次完成內容

本次已完成 Milestone 1：建立 Laravel 專案與 Sanctum 基礎設定。

目前後端專案已建立在：

```text
scam-detector-backend
```

## 已完成項目

1. 建立 Laravel 12 專案。
2. 保留並整合既有 `docs/` 文件資料夾。
3. 安裝 Laravel Sanctum。
4. 建立 `routes/api.php`。
5. 建立 API Auth Controller。
6. 在 `User` model 加入 `HasApiTokens`。
7. 建立基本 Auth API：
   - `POST /api/register`
   - `POST /api/login`
   - `POST /api/logout`
   - `GET /api/user`
8. 新增 Auth API 測試。
9. 測試通過。

## 新增或修改的主要檔案

```text
app/Http/Controllers/Api/AuthController.php
app/Models/User.php
routes/api.php
tests/Feature/AuthApiTest.php
composer.json
composer.lock
database/migrations/2026_05_24_080952_create_personal_access_tokens_table.php
```

## 目前可用 API

### 註冊

```http
POST /api/register
```

Request:

```json
{
  "name": "Backend Tester",
  "email": "tester@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

Response:

```json
{
  "message": "註冊成功",
  "data": {
    "user": {
      "id": 1,
      "name": "Backend Tester",
      "email": "tester@example.com"
    },
    "token": "SANCTUM_TOKEN"
  }
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

Response:

```json
{
  "message": "登入成功",
  "data": {
    "user": {
      "id": 1,
      "name": "Backend Tester",
      "email": "tester@example.com"
    },
    "token": "SANCTUM_TOKEN"
  }
}
```

### 取得目前登入使用者

```http
GET /api/user
Authorization: Bearer SANCTUM_TOKEN
```

Response:

```json
{
  "id": 1,
  "name": "Backend Tester",
  "email": "tester@example.com"
}
```

### 登出

```http
POST /api/logout
Authorization: Bearer SANCTUM_TOKEN
```

Response:

```json
{
  "message": "登出成功",
  "data": null
}
```

## 測試結果

已執行：

```bash
php artisan test
```

結果：

```text
Tests: 6 passed (22 assertions)
```

測試涵蓋：

- 使用者可以註冊並取得 token
- 使用者可以登入並取得 token
- 未登入不能存取 `/api/user`
- 已登入可以存取 `/api/user`
- Laravel 預設測試通過

## 前端目前可以先知道的事情

前端之後如果有會員登入流程，可以先使用 Sanctum Bearer Token：

```http
Authorization: Bearer SANCTUM_TOKEN
```

後續所有需要登入的 API，例如歷史紀錄，會使用同一種 token 驗證方式。

## 尚未完成

- Response Macro 統一回傳格式
- Scam scan 資料表
- 最新詐騙案例資料表
- 詐騙分析 API
- Cache
- OCR
- AI 分析
- 歷史紀錄 API
- 統計 API

## 下一步

Milestone 2：Response Macro 與資料庫。

預計完成：

- 統一 API 成功/失敗回傳格式
- 建立 `scam_scans` migration / model
- 建立 `scam_cases` migration / model
- 建立初始案例 seeder
- 更新本進度總覽文件

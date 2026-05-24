# Progress 00 - 後端啟動與需求確認

## 日期

2026-05-24

## 目前狀態

後端開發尚未開始實作程式碼，目前先完成需求確認與開發計畫。

目前工作區還沒有 Laravel 專案，後續會先建立 Laravel API 專案，再依里程碑逐步完成後端功能。

## 已確認方向

1. 後端會提供多個 API endpoint，方便前端分功能串接。
2. 後端需要一起規劃 Laravel Sanctum 登入驗證。
3. 圖片分析需要真的接 OCR，不只做假資料。
4. 詐騙判斷需要接 AI。
5. 每完成一個大進度，都會產出一份 Markdown 進度文件給前端查看。

## 後端預計提供 API

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

## 後端回傳格式方向

成功：

```json
{
  "success": true,
  "message": "分析完成",
  "data": {}
}
```

失敗：

```json
{
  "success": false,
  "message": "驗證失敗",
  "errors": {}
}
```

## 前端目前可以先知道的事情

前端之後可以直接依功能串接不同 API：

- 文字輸入串 `/api/scam/analyze-text`
- 網址輸入串 `/api/scam/analyze-url`
- 圖片上傳串 `/api/scam/analyze-image`
- 歷史紀錄串 `/api/scam/history`
- 統計圖表串 `/api/scam/stats`
- 跑馬燈案例串 `/api/scam/cases`

分析 API 都會回傳風險分數、風險等級、詐騙類型、摘要、風險因子與防守建議。

## 尚未完成

- Laravel 專案建立
- Sanctum 登入驗證
- Response Macro
- 資料庫 migration
- 規則式分析
- Cache
- OCR
- AI 分析
- 歷史紀錄
- 統計 API
- 最新案例 API

## 下一步

Milestone 1：建立 Laravel 專案與基礎設定。

預計完成：

- 建立 Laravel 專案
- 設定 API routes
- 安裝 Laravel Sanctum
- 建立登入、註冊、登出 API
- 產出 `docs/progress/01-laravel-setup.md`

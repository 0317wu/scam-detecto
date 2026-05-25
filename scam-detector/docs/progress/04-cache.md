# Progress 04 - Cache 快取分析結果

## 日期

2026-05-24

## 本次完成內容

本次已完成 Milestone 4：Cache。

後端現在會針對相同文字或相同網址快取已計算好的分析結果，避免重複執行規則判斷。API 回傳也新增 `cache_hit` 欄位，方便確認這次分析是否來自快取。

## 已完成項目

1. 在 `FraudService` 加入 Cache 流程。
2. 文字分析使用內容 hash 產生 cache key。
3. 網址分析使用正規化後的網址 hash 產生 cache key。
4. 快取時間設定為 30 分鐘。
5. 相同輸入第二次分析會回傳 `cache_hit: true`。
6. 即使命中 cache，仍會建立新的 `scam_scans` 紀錄，方便之後保留使用者歷史。
7. 分析 API response 新增 `cache_hit`。
8. 新增 cache 測試。
9. 測試通過。

## 新增或修改的主要檔案

```text
app/Services/FraudService.php
app/Http/Controllers/Api/ScamAnalysisController.php
tests/Feature/ScamAnalysisApiTest.php
docs/current-progress.md
```

## Cache Key 規則

格式：

```text
fraud_scan:{input_type}:{sha256}
```

範例：

```text
fraud_scan:text:9f86d081884c7d659a2feaa0c55ad015...
fraud_scan:url:3a6eb0790f39ac87c94f3856b2dd2c5d...
```

## Cache 時間

```text
30 分鐘
```

目前設定在 `FraudService`：

```php
private const CACHE_TTL_SECONDS = 1800;
```

## API Response 新增欄位

分析 API 現在會多回傳：

```json
{
  "cache_hit": false
}
```

或：

```json
{
  "cache_hit": true
}
```

### 第一次分析

```json
{
  "success": true,
  "message": "analysis_completed",
  "data": {
    "id": 1,
    "input_type": "text",
    "risk_level": "danger",
    "risk_score": 83,
    "cache_hit": false
  }
}
```

### 相同內容第二次分析

```json
{
  "success": true,
  "message": "analysis_completed",
  "data": {
    "id": 2,
    "input_type": "text",
    "risk_level": "danger",
    "risk_score": 83,
    "cache_hit": true
  }
}
```

## 為什麼命中 cache 還是新增掃描紀錄

目前設計是：

- Cache 用來避免重複計算分析結果。
- `scam_scans` 用來保存每一次使用者操作紀錄。

因此相同內容再次分析時，後端會重用快取中的風險分數與判斷結果，但仍建立一筆新的掃描紀錄。這樣之後登入使用者查看歷史紀錄時，仍能看到自己的每次操作。

## 目前可用 API

```http
POST /api/register
POST /api/login
POST /api/logout
GET /api/user

POST /api/scam/analyze-text
POST /api/scam/analyze-url
```

## 測試結果

已執行：

```bash
php artisan test
```

結果：

```text
Tests: 16 passed (84 assertions)
```

新增測試涵蓋：

- 相同文字第二次分析會命中 cache
- 相同網址第二次分析會命中 cache
- cache hit 與 miss 都會回傳 `cache_hit`
- cache hit 時風險分數保持一致
- cache hit 時仍會建立新的 `scam_scans` 紀錄

## 前端目前可以先知道的事情

前端可以選擇是否顯示 `cache_hit`。

建議：

- 一般使用者畫面可以不用顯示。
- 開發或 debug 模式可以顯示，方便確認後端快取是否生效。

前端主要仍使用：

- `risk_score`
- `risk_level`
- `scam_type`
- `summary`
- `risk_factors`
- `suggestions`

## 尚未完成

- OCR 圖片分析
- AI 分析
- 歷史紀錄 API
- 統計 API
- 最新案例 API endpoint

## 下一步

Milestone 5：OCR 圖片分析。

預計完成：

- 建立圖片上傳 API
- 建立 `OcrService`
- 圖片檔案儲存
- OCR 結果寫入 `ocr_text`
- OCR 文字進入現有分析流程
- 更新本進度總覽文件

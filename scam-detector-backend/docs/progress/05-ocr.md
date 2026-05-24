# Progress 05 - OCR 圖片分析

## 日期

2026-05-24

## 本次完成內容

本次已完成 Milestone 5：OCR 圖片分析。

後端現在已新增圖片上傳分析 API，流程是：上傳圖片、儲存圖片、呼叫 OCR 服務擷取文字、將 OCR 文字送入既有規則式詐騙分析流程，最後把結果寫入 `scam_scans`。

## 已完成項目

1. 建立 `OcrService`。
2. 新增 `config/ocr.php`。
3. 新增 `.env.example` OCR 設定。
4. 新增圖片分析 API：
   - `POST /api/scam/analyze-image`
5. 圖片會儲存到 public disk 的 `scam-images` 目錄。
6. OCR 結果會存入 `scam_scans.ocr_text`。
7. 圖片路徑會存入 `scam_scans.image_path`。
8. OCR 文字會進入現有 `RuleHelper` 分析流程。
9. 圖片分析也支援 cache。
10. OCR 失敗時會回傳統一錯誤格式。
11. 新增圖片分析 API 測試。
12. 測試通過。

## 新增或修改的主要檔案

```text
config/ocr.php
.env.example
app/Services/OcrService.php
app/Services/FraudService.php
app/Http/Controllers/Api/ScamAnalysisController.php
routes/api.php
bootstrap/app.php
tests/Feature/ScamAnalysisApiTest.php
docs/current-progress.md
```

## 新增 API

### 圖片 OCR + 分析

```http
POST /api/scam/analyze-image
Content-Type: multipart/form-data
```

Request:

```text
image: file
```

限制：

```text
格式：jpg、jpeg、png、webp
大小：最大 5MB
```

Response:

```json
{
  "success": true,
  "message": "analysis_completed",
  "data": {
    "id": 3,
    "input_type": "image",
    "risk_level": "danger",
    "risk_score": 65,
    "scam_type": "假投資詐騙",
    "summary": "此內容有可疑特徵，可能與假投資詐騙相關，建議進一步查證。",
    "ocr_text": "立即加入 LINE 投資群組，保證獲利。",
    "image_path": "scam-images/example.png",
    "risk_factors": [
      "引導加入 LINE 或私訊群組",
      "承諾高報酬或保證獲利"
    ],
    "suggestions": [
      "先不要提供個人資料",
      "確認網址是否為官方網域",
      "向官方客服或 165 查證後再操作"
    ],
    "cache_hit": false,
    "created_at": "2026-05-24 17:20:00"
  }
}
```

## OCR 設定

目前使用 Tesseract OCR 指令列整合。

`.env` 可設定：

```env
TESSERACT_PATH=tesseract
OCR_LANGUAGE=chi_tra+eng
OCR_TIMEOUT=30
```

說明：

- `TESSERACT_PATH`：Tesseract 執行檔路徑。
- `OCR_LANGUAGE`：OCR 語言包，預設繁中 + 英文。
- `OCR_TIMEOUT`：OCR 執行逾時秒數。

## 目前環境注意事項

目前這台開發環境執行：

```bash
tesseract --version
```

結果是找不到 `tesseract` 指令。

因此程式已經完成真 OCR 串接，但本機若要實際辨識圖片，還需要安裝 Tesseract OCR，並確認繁體中文語言包可用。

Windows 建議設定範例：

```env
TESSERACT_PATH="C:\\Program Files\\Tesseract-OCR\\tesseract.exe"
OCR_LANGUAGE=chi_tra+eng
```

## OCR 失敗回傳

如果 Tesseract 未安裝、圖片不存在、OCR 執行失敗或逾時，會回傳統一錯誤格式：

```json
{
  "success": false,
  "message": "ocr_failed: ...",
  "errors": null
}
```

HTTP status:

```text
503
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
```

## 測試結果

已執行：

```bash
php artisan test
```

結果：

```text
Tests: 18 passed (99 assertions)
```

新增測試涵蓋：

- 圖片可以上傳分析。
- OCR 文字會進入詐騙分析流程。
- OCR 文字會存入 `ocr_text`。
- 圖片路徑會存入 `image_path`。
- 圖片檔會存入 storage。
- 非圖片檔會回傳 validation error。

## 前端目前可以先知道的事情

前端圖片上傳可以串：

```http
POST /api/scam/analyze-image
```

使用 `multipart/form-data`，欄位名稱固定為：

```text
image
```

前端可以使用回傳的：

- `ocr_text` 顯示 OCR 辨識結果
- `risk_score` 顯示風險分數
- `risk_level` 更新 3D AI 球狀態
- `risk_factors` 顯示風險因子
- `suggestions` 顯示防守建議
- `image_path` 之後可作為歷史紀錄圖片來源

## 尚未完成

- AI 分析
- 歷史紀錄 API
- 統計 API
- 最新案例 API endpoint

## 下一步

Milestone 6：AI 詐騙分析。

預計完成：

- 建立 `AiFraudService`
- 設計 AI JSON 回傳格式
- 將 AI 分析與規則式分析整合
- AI 失敗時保留規則式 fallback
- 更新本進度總覽文件

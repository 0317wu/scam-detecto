# Progress 03 - 規則式詐騙分析

## 日期

2026-05-24

## 本次完成內容

本次已完成 Milestone 3：規則式詐騙分析。

後端現在可以接收文字與網址，透過規則式判斷產生風險分數、風險等級、詐騙類型、風險因子、防守建議，並將分析結果存入 `scam_scans`。

## 已完成項目

1. 建立 `FraudService`。
2. 建立 `RuleHelper`。
3. 建立 `ScoreHelper`。
4. 建立 `ScamAnalysisController`。
5. 新增文字分析 API。
6. 新增網址分析 API。
7. 分析完成後會寫入 `scam_scans`。
8. 新增分析 API 測試。
9. 將 API message 改成穩定代碼，例如 `analysis_completed`。
10. 測試通過。

## 新增或修改的主要檔案

```text
app/Helpers/RuleHelper.php
app/Helpers/ScoreHelper.php
app/Services/FraudService.php
app/Http/Controllers/Api/ScamAnalysisController.php
routes/api.php
tests/Feature/ScamAnalysisApiTest.php
tests/Feature/AuthApiTest.php
```

## 新增 API

### 文字分析

```http
POST /api/scam/analyze-text
```

Request:

```json
{
  "content": "立即加入 LINE 投資群組，老師帶單保證獲利翻倍，今天截止。"
}
```

Response:

```json
{
  "success": true,
  "message": "analysis_completed",
  "data": {
    "id": 1,
    "input_type": "text",
    "risk_level": "danger",
    "risk_score": 83,
    "scam_type": "假投資詐騙",
    "summary": "此內容高度疑似假投資詐騙，包含多個高風險特徵。",
    "risk_factors": [
      "引導加入 LINE 或私訊群組",
      "承諾高報酬或保證獲利",
      "使用急迫性話術"
    ],
    "suggestions": [
      "不要點擊連結或加入陌生群組",
      "不要匯款或提供信用卡、身分證、驗證碼",
      "請改從官方網站或官方客服查證",
      "必要時撥打 165 反詐騙專線確認"
    ],
    "created_at": "2026-05-24 16:50:00"
  }
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

Response:

```json
{
  "success": true,
  "message": "analysis_completed",
  "data": {
    "id": 2,
    "input_type": "url",
    "risk_level": "danger",
    "risk_score": 100,
    "scam_type": "釣魚網站",
    "summary": "此內容高度疑似釣魚網站，包含多個高風險特徵。",
    "risk_factors": [
      "使用非 HTTPS 或不完整網址",
      "使用高風險網域後綴",
      "網域疑似假冒金融或官方服務",
      "網址包含可疑登入或驗證路徑",
      "網域層級過多，可能混淆真實來源"
    ],
    "suggestions": [
      "不要點擊連結或加入陌生群組",
      "不要匯款或提供信用卡、身分證、驗證碼",
      "請改從官方網站或官方客服查證",
      "必要時撥打 165 反詐騙專線確認"
    ],
    "created_at": "2026-05-24 16:50:00"
  }
}
```

## 目前規則判斷項目

文字分析目前會偵測：

- 引導加入 LINE 或私訊群組
- 承諾高報酬或保證獲利
- 使用急迫性話術
- 要求提供個人或金融資料
- 要求匯款或操作 ATM
- 疑似假冒政府、銀行或物流單位
- 含有可疑連結

網址分析目前會偵測：

- 使用非 HTTPS 或不完整網址
- 使用高風險網域後綴
- 疑似短網址或跳轉服務
- 網域疑似假冒金融或官方服務
- 網址包含可疑登入或驗證路徑
- 網域層級過多，可能混淆真實來源

## 風險等級

```text
0 - 34   safe
35 - 69  warning
70 - 100 danger
```

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
Tests: 14 passed (73 assertions)
```

測試涵蓋：

- 高風險投資訊息會判斷為 danger
- 釣魚網址會判斷為 danger
- 一般文字會判斷為 safe
- 文字分析缺少 content 會回傳 validation error
- 網址分析格式錯誤會回傳 validation error
- 分析結果會寫入 `scam_scans`

## 前端目前可以先知道的事情

前端現在可以先串文字與網址分析 API。

目前分析 API 不強制登入，因此可以讓使用者先掃描；登入後看歷史紀錄會在後續里程碑加入。

前端可依照：

- `data.risk_score` 更新分數儀表板
- `data.risk_level` 更新 3D AI 球狀態
- `data.risk_factors` 顯示風險因子
- `data.suggestions` 顯示防守建議
- `data.scam_type` 顯示詐騙類型

## 尚未完成

- Cache
- OCR 圖片分析
- AI 分析
- 歷史紀錄 API
- 統計 API
- 最新案例 API endpoint

## 下一步

Milestone 4：Cache。

預計完成：

- 對文字分析加入 cache
- 對網址分析加入 cache
- 相同輸入避免重複運算
- 回傳資料標示是否來自 cache
- 更新本進度總覽文件

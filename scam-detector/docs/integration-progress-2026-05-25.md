# 2026-05-25 前後端整合驗收紀錄

## 分支資訊

前端上傳分支：

```text
origin/feature/integrate-frontend
```

本機驗收分支：

```text
codex/integration-review
```

## 驗收結果

目前自動化驗收結果通過：

```text
46 passed (455 assertions)
```

已確認項目：

```text
composer install 成功
npm install 成功
php artisan migrate --seed 成功
npm.cmd run build 成功
php artisan test 成功
```

已實測 API：

```text
GET  /api/scam/config
GET  /api/scam/cases
POST /api/scam/analyze-text
```

## 發現與修正

### 問題

分析 API 原本只檢查 OpenAI API key：

```text
services.openai.api_key
```

這會讓 Gemini 模式被錯誤擋下。

### 修正

已改成依照 `config/ai.php` 的 provider 檢查：

```text
AI_PROVIDER=openai -> OPENAI_API_KEY
AI_PROVIDER=gemini -> GEMINI_API_KEY
```

如果 AI 功能未啟用：

```text
AI_ANALYSIS_ENABLED=false
```

則允許使用規則式分析，不強制要求 AI key。

### 測試

新增測試：

```text
scan fails without api key when ai is enabled
scan allows gemini api key when ai is enabled
```

## 尚未完成

尚未完成瀏覽器人工流程驗收。

下一步需要實際開啟網站確認：

```text
Dashboard
文字分析
網址分析
圖片 OCR
歷史紀錄
統計圖表
登入註冊
管理員頁面
```

## 結論

目前整合分支的後端測試與基本 HTTP API 驗收已通過，可以進入人工畫面測試階段。

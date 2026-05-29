# 目前進度總覽

更新日期：2026-05-25

## 目前狀態

前端負責人已將整合版上傳到 GitHub 分支：

```text
feature/integrate-frontend
```

目前本機已切出整合驗收分支：

```text
codex/integration-review
```

這個分支已將原本後端專案 `scam-detector-backend` 改為整合專案資料夾：

```text
scam-detector
```

整合後的專案型態是：

```text
Laravel 12 + Inertia.js + Vue 3 + Sanctum + Tesseract OCR + Gemini/OpenAI AI
```

2026-05-30 追加：

前端新增 app 版介面分支：

```text
feature/react-native-app
```

目前已切出本機除錯分支：

```text
codex/app-integration-debug
```

新增 app 專案：

```text
scam-detector-app/
```

專案型態：

```text
Expo + React Native + Expo Router + Axios
```

## 已完成驗收

1. 已安裝 PHP 依賴：

```bash
composer install
```

2. 已安裝前端依賴：

```bash
npm install
```

3. 已建立本機測試環境：

```text
.env
database/database.sqlite
APP_KEY
```

4. 已完成資料庫 migration 與 seed：

```bash
php artisan migrate --seed
```

5. 已完成前端 production build：

```bash
npm.cmd run build
```

6. 已完成完整測試：

```text
48 passed (461 assertions)
```

7. 已完成實際 HTTP API 驗收：

```text
GET  /api/scam/config
GET  /api/scam/cases
POST /api/scam/analyze-text
```

以上端點皆可正常回應。

8. 已完成主要頁面 HTTP smoke test：

```text
GET /           -> 200
GET /history    -> 200
GET /knowledge  -> 200
```

9. 已完成管理頁權限 smoke test：

```text
GET /cases-manager -> 302 redirect to login
GET /scans-manager -> 302 redirect to login
```

10. 已完成統計 API smoke test：

```text
GET /api/scam/stats -> stats_retrieved
```

11. 已完成登入 token 串接流程測試：

```text
POST /api/register
GET  /api/user
POST /api/scam/analyze-url
GET  /api/scam/history
```

測試結果：

```text
註冊成功
Bearer token 可用
分析紀錄正確綁定 user_id
history_total = 1
```

12. 已完成 React Native app 版初步除錯：

```text
npm install 成功
npm.cmd run test -- --runInBand 成功
npx.cmd tsc --noEmit 成功
npx.cmd expo export --platform web 成功
```

13. 已完成 app 分支後端回歸修正：

```text
php artisan test -> 48 passed (461 assertions)
```

14. 已移除 app .env 版控：

```text
scam-detector-app/.env 不再追蹤
scam-detector-app/.env.example 保留
```

## 本次後端修正

本次整合驗收發現 `ScamAnalysisController` 原本只檢查 OpenAI API key。

這會造成一個問題：

```text
如果 AI_PROVIDER=gemini，但沒有 OPENAI_API_KEY，分析 API 仍可能被錯誤擋下。
```

目前已修正為：

```text
AI_ANALYSIS_ENABLED=false
    -> 允許使用規則分析，不強制要求 AI key

AI_ANALYSIS_ENABLED=true + AI_PROVIDER=openai
    -> 檢查 OPENAI_API_KEY

AI_ANALYSIS_ENABLED=true + AI_PROVIDER=gemini
    -> 檢查 GEMINI_API_KEY
```

並新增測試確認 Gemini key 可以通過分析 API。

## 本次新增修正：可選 Sanctum 驗證

整合測試發現一個登入後歷史紀錄問題：

```text
前端登入後使用 Bearer token 呼叫分析 API，分析成功，但 history 查不到該紀錄。
```

原因是：

```text
/api/scam/analyze-*、/api/scam/history、/api/scam/stats 同時支援訪客與登入者，
所以路由沒有掛 auth:sanctum。
沒有 auth:sanctum 時，真實 Bearer token 不會自動解析成 request user。
```

目前已新增：

```text
app/Http/Middleware/OptionalSanctumAuth.php
```

效果：

```text
有 Bearer token -> 自動辨識登入使用者
沒有 Bearer token -> 保持訪客 visitor_id 模式
```

已確認：

```text
登入者分析紀錄會寫入 user_id
登入者 history 可查回自己的紀錄
訪客仍可用 visitor_id 查自己的紀錄
```

## 目前注意事項

1. 不建議直接把 `feature/integrate-frontend` 合併到 `main`，需要先完成最終人工操作測試。

2. 前端 README 中有些 AI 型號名稱需要再確認，不應寫不存在或未實際使用的型號。

3. 本機 `.env` 不會上傳 GitHub，前端與後端各自測試時都需要自行填入：

```env
AI_ANALYSIS_ENABLED=true
AI_PROVIDER=gemini
GEMINI_API_KEY=自己的金鑰
TESSERACT_PATH="C:/Program Files/Tesseract-OCR/tesseract.exe"
OCR_LANGUAGE=chi_tra+eng
```

4. 舊資料夾 `scam-detector-backend` 在本機目前是未追蹤資料夾，因為前端分支已改名為 `scam-detector`。合併前要決定是否保留或移除舊資料夾。

## 下一步

下一步是啟動整合版網站，進行瀏覽器人工操作測試：

```bash
cd scam-detector
php artisan serve
npm.cmd run dev
```

然後在瀏覽器測試：

```text
http://127.0.0.1:8000
```

已完成 HTTP 層 smoke test，接下來需要用瀏覽器人工確認的畫面與流程：

1. 首頁 Dashboard 是否正常顯示。
2. 文字分析是否能顯示結果卡。
3. 網址分析是否能顯示結果卡。
4. 圖片上傳是否能跑 OCR。
5. 歷史紀錄是否有新增資料。
6. 統計圖表是否有資料。
7. 登入、註冊、管理頁面權限是否正常。

人工測試通過後，再將整合分支合併回 `main`。

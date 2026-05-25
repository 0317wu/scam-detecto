# 2026-05-25 整合版頁面 Smoke Test

## 測試目標

確認前端整合分支在 Laravel production build 後，主要頁面與資料 API 可由 Laravel 正常回應。

## 測試前置

已完成：

```text
composer install
npm install
php artisan migrate --seed
npm.cmd run build
php artisan test
```

完整測試結果：

```text
46 passed (455 assertions)
```

## HTTP 頁面測試

```text
GET /          -> 200
GET /history   -> 200
GET /knowledge -> 200
```

代表 Dashboard、History、Knowledge 這三個 Inertia 頁面可以正常由 Laravel 輸出。

## 權限測試

未登入狀態下：

```text
GET /cases-manager -> 302
GET /scans-manager -> 302
```

結果符合預期，管理頁會導向登入流程，不會直接開放給訪客。

## API 測試

```text
GET /api/scam/stats -> stats_retrieved
```

代表統計圖表所需資料端點可正常回應。

## 結論

目前整合分支已通過後端測試、前端 build、主要頁面 HTTP smoke test、管理頁權限 smoke test、統計 API smoke test。

下一步是瀏覽器人工操作測試：

```text
1. 打開首頁並確認 Cyber UI 是否正常顯示
2. 實際輸入文字並分析
3. 實際輸入網址並分析
4. 實際上傳圖片並確認 OCR
5. 檢查歷史紀錄是否新增
6. 檢查統計圖是否更新
7. 測試登入、註冊、管理頁權限
```

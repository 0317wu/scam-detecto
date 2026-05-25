# 2026-05-26 登入 Token 與歷史紀錄整合修正

## 測試目標

確認前端登入後使用 Bearer token 呼叫分析 API 時，後端會把分析紀錄綁定到登入使用者，並能在歷史紀錄 API 查回。

## 發現問題

整合測試流程：

```text
POST /api/register
GET  /api/user
POST /api/scam/analyze-url
GET  /api/scam/history
```

原本結果：

```text
register_success = true
analyze_success = true
history_success = true
history_total = 0
```

代表分析成功，但紀錄沒有被登入者查到。

## 問題原因

`/api/scam/*` 路由同時支援：

```text
登入使用者
訪客 visitor_id
```

因此不能直接全部套用 `auth:sanctum`，否則訪客無法使用。

但沒有 `auth:sanctum` 時，真實 HTTP Bearer token 不會自動變成 `$request->user()`，導致分析紀錄被當成訪客紀錄。

## 修正方式

新增 middleware：

```text
app/Http/Middleware/OptionalSanctumAuth.php
```

註冊 alias：

```text
optional.sanctum
```

套用到：

```text
Route::prefix('scam')->middleware('optional.sanctum')
```

修正後行為：

```text
有 Bearer token -> 解析登入使用者並設定 request user
沒有 Bearer token -> 不阻擋，繼續使用 visitor_id 訪客模式
```

## 新增測試

新增測試案例：

```text
bearer token analysis is attached to user
bearer token user can list own history
```

完整測試結果：

```text
48 passed (461 assertions)
```

## 實際 HTTP 驗收結果

修正後重跑真實 HTTP 流程：

```text
POST /api/register
POST /api/scam/analyze-url
GET  /api/scam/history
```

結果：

```text
scan_user_id = 4
analyze_success = true
risk_level = danger
risk_score = 100
history_success = true
history_total = 1
first_history_type = url
```

## 結論

登入 token、分析紀錄、歷史紀錄現在已完成串接。

前端登入後呼叫分析 API，再進入歷史紀錄頁，應該可以看到該使用者自己的掃描紀錄。

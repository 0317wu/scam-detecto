# 2026-05-30 React Native App 整合除錯紀錄

## 來源分支

GitHub 最新 app 版介面位於：

```text
origin/feature/react-native-app
```

本機除錯分支：

```text
codex/app-integration-debug
```

## 本次檢查範圍

本次新增並檢查：

```text
scam-detector-app/
```

這是一個 Expo / React Native app 專案，包含：

```text
登入與註冊
Dashboard 掃描首頁
History 歷史紀錄
Stats 統計頁
Knowledge 防詐知識庫
Profile 個人設定
API client
Token 儲存
```

同時也檢查前端分支對 Laravel 後端的修改。

## 發現與修正

### 1. 移除不相容測試套件

問題：

```text
@testing-library/react-hooks@8.0.1 只支援 React 16/17，
但 app 使用 React 19。
```

修正：

```text
從 package.json 移除 @testing-library/react-hooks
```

### 2. 對齊 react-test-renderer 版本

問題：

```text
react = 19.2.3
react-test-renderer = ^19.2.6
```

npm 會解析到不相容版本並造成 ERESOLVE。

修正：

```text
react-test-renderer = 19.2.3
```

### 3. 移除 app .env 版控

問題：

```text
scam-detector-app/.env 被 Git 追蹤
```

修正：

```text
移除 scam-detector-app/.env 版控
在 scam-detector-app/.gitignore 加入 .env
保留 .env.example 作為範本
```

### 4. 修復圖片快取回歸

問題：

前端 app 分支讓圖片分析每次都先儲存圖片，即使命中 cache，仍會產生新的 `image_path`。

影響：

```text
同一張圖片重複分析時，會重複存檔
既有測試 repeated image analysis 失敗
```

修正：

```text
只有 cache miss 時才儲存圖片
cache hit 時沿用第一次分析的 image_path
```

## 驗證結果

後端測試：

```text
php artisan test
48 passed (461 assertions)
```

App 測試：

```text
npm.cmd run test -- --runInBand
1 passed
```

TypeScript 檢查：

```text
npx.cmd tsc --noEmit
passed
```

Expo web export：

```text
npx.cmd expo export --platform web
Exported: dist
```

## 注意事項

`npm install` 仍回報：

```text
12 moderate severity vulnerabilities
```

目前沒有使用 `npm audit fix --force`，因為它可能造成 Expo / React Native 依賴大範圍升級，風險較高。建議在課堂專案階段先保持目前可建置、可測試狀態。

## 下一步

下一步可進行實機或 Web 模式人工測試：

```bash
cd scam-detector
php artisan serve --host=127.0.0.1 --port=8002
```

另外開一個終端機：

```bash
cd scam-detector-app
npm.cmd run web
```

若使用手機實機測試，`scam-detector-app/.env` 的 `EXPO_PUBLIC_API_URL` 不能使用 `127.0.0.1`，需要改成電腦的區網 IP，例如：

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:8002/api
```

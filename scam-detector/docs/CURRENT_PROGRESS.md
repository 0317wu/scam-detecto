# 目前進度總覽

更新日期：2026-06-10

## 目前狀態

專案已整理成同一個 GitHub repository：

```text
https://github.com/0317wu/scam-detecto
```

目前 `main` 分支已包含：

```text
scam-detector/      Laravel 12 後端 API + Inertia/Vue Web 版
scam-detector-app/  Expo / React Native App 版與 Web 預覽版
```

本機舊資料夾 `scam-detector-backend/` 仍是未追蹤資料夾，並未上傳到 GitHub。正式接手請使用 `scam-detector/` 與 `scam-detector-app/`。

## 已完成的大進度

1. Laravel 後端 API 已完成

```text
POST /api/scam/analyze-text
POST /api/scam/analyze-url
POST /api/scam/analyze-image
GET  /api/scam/history
GET  /api/scam/history/{id}
GET  /api/scam/stats
GET  /api/scam/cases
GET  /api/scam/config
```

2. 資料庫已完成

```text
scam analyses
users
sessions
cache
jobs
personal access tokens
```

分析紀錄會保存輸入類型、文字或網址、圖片路徑、OCR 文字、風險分數、風險等級、詐騙類型、風險因子、建議與建立時間。

3. Sanctum 驗證已完成

系統支援兩種模式：

```text
未登入：使用 visitor_id 保存與讀取自己的掃描紀錄
已登入：使用 Bearer token，掃描紀錄綁定 user_id
管理員：History 與 Stats 可查看全部掃描紀錄，包含 App 訪客掃描
```

4. 真 OCR 已完成

後端可使用 Tesseract OCR：

```env
TESSERACT_PATH="C:/Program Files/Tesseract-OCR/tesseract.exe"
OCR_LANGUAGE=chi_tra+eng
OCR_TIMEOUT=30
```

5. 真 AI 已完成

後端支援 Gemini 與 OpenAI，目前建議用 Gemini：

```env
AI_ANALYSIS_ENABLED=true
AI_PROVIDER=gemini
GEMINI_API_KEY=自己的金鑰
GEMINI_MODEL=gemini-2.5-flash
```

若 AI 服務失敗，後端會回退到規則分析，不會讓整個掃描流程中斷。

6. Expo / React Native App 已整合

App 專案位於：

```text
scam-detector-app/
```

目前已修正：

```text
依賴版本衝突
Token 儲存
圖片分析快取 image_path 問題
API base URL fallback 改為 http://127.0.0.1:8002/api
Expo Web 圖片上傳改用 Blob/File，避免瀏覽器 FormData 送出失敗
App API timeout 提高到 60 秒，避免 OCR + AI 分析時間超過 10 秒
OCR 失敗時回傳乾淨錯誤代碼，避免 Windows 非 UTF-8 錯誤訊息造成 JSON 500
網址規則加強：假冒官方/郵政/政府字樣且搭配高風險網域後綴時，會判定為高風險釣魚網站
管理員後台 History/Stats 可查看全部使用者與訪客掃描紀錄
.env 不再進入 Git 版控
```

7. GitHub 已更新

最新已推送到 `main`：

```text
129dc00 Improve URL validation errors
```

## 驗收結果

後端測試：

```text
php artisan test
58 passed (586 assertions)
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

## 正確啟動方式

### 1. 啟動後端 API

```powershell
cd C:\Users\User\Documents\final_work\scam-detector
php artisan serve --host=127.0.0.1 --port=8002
```

可用以下網址確認 API 設定：

```text
http://127.0.0.1:8002/api/scam/config
```

注意：`http://127.0.0.1:8002/api` 顯示 404 是正常的，因為沒有設定 API 根目錄首頁。

### 2. 啟動 App 網頁版

```powershell
cd C:\Users\User\Documents\final_work\scam-detector-app
npx.cmd expo start --web -c
```

瀏覽器請開啟：

```text
http://localhost:8081
```

不要把 App 畫面開在 `http://127.0.0.1:8002/api`，那裡是 Laravel API，不是 Expo App。

### 3. App API URL 設定

`scam-detector-app/.env` 應設定：

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8002/api
```

如果使用手機 Expo Go 測試，請改用電腦區域網路 IP：

```env
EXPO_PUBLIC_API_URL=http://192.168.x.x:8002/api
```

同時後端要改用：

```powershell
php artisan serve --host=0.0.0.0 --port=8002
```

如果手機出現 `Project is incompatible with this version of Expo Go`，代表手機 Expo Go 版本太舊，需要更新 App Store 版本。

## 目前注意事項

1. `.env` 不會上傳 GitHub，前端與後端測試者都要自行建立。
2. Gemini API key、OpenAI API key 都不能提交到 GitHub。
3. Expo web 的 `textShadow`、`shadow`、Reanimated reduced motion 警告目前不影響主要功能。
4. 如果 Expo web 一直打到舊的 API 位址，請用 `npx.cmd expo start --web -c` 清除 Metro 快取。
5. 正式接手時請優先拉取 `main`，不要使用本機未追蹤的 `scam-detector-backend/`。
6. Windows 本機 OCR 建議在 `scam-detector/.env` 使用完整路徑：`TESSERACT_PATH="C:/Program Files/Tesseract-OCR/tesseract.exe"`。

## 下一步

下一步建議做整合人工驗收：

1. 開啟後端 `8002`。
2. 開啟 Expo web `8081`。
3. 測試文字分析、網址分析、圖片 OCR 分析。
4. 測試登入後歷史紀錄是否正確綁定帳號。
5. 測試統計資料與案例庫是否能正常載入。
6. 前端負責人確認 App 畫面與 API 串接欄位是否符合需求。

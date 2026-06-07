# AI 詐騙訊息與圖片辨識系統 (AI Scam Detecto Platform)

本專案是一個全端的未來科技科幻風（Cyberpunk Neon）AI 詐騙辨識系統。具備雙軌前端：基於 **Laravel 12 + Inertia.js (Vue 3)** 的網頁管理端，以及基於 **Expo / React Native** 的跨平台行動 App。搭配後端規則判定、Tesseract OCR 圖片辨識與 Gemini / OpenAI AI 分析引擎，提供堅若磐石的防詐偵測服務。

---

## 系統特點 (Features)

*   **雙重客戶端支援**：同時包含高質感的 Web 網頁端（玻璃擬態、雷達動畫）以及跨平台的手機 App 端（Expo Router、極黑 Cyberpunk 風格）。
*   **多模態辨識主控艙**：支援文字貼上、網址檢測，以及圖片（截圖）上傳預覽與分析。
*   **真實 OCR 與 AI 整合**：後端已串接真實的 Tesseract OCR 與 Gemini / OpenAI 大語言模型。若外部 AI API 故障，會自動 Fallback 至後端的規則判定引擎，確保服務不中斷，並將失敗日誌追蹤以便維護。
*   **防衛歷史日誌與統計**：後台提供 Chart.js 動態圖表；App 提供專屬「數據中樞 (Stats Center)」，隨時查看攔截趨勢與詐騙分佈。
*   **安全驗證與訪客追蹤**：Laravel API 使用 Sanctum 提供 Bearer Token 機制。未登入的訪客亦可透過自動產生的 `visitor_id` 免登入直接使用辨識功能並查看自身日誌。

---

## 專案檔案結構導覽 (File Structure)

本倉庫為一個 Monorepo 結構，包含前後端兩個獨立目錄：

### 1. `scam-detector/` (後端核心與 Web 網頁端)
*   **技術棧**：Laravel 12.x, PHP 8.2+, SQLite, Vue 3, Tailwind CSS
*   **核心功能**：
    *   API 路由與邏輯 (Auth, 詐騙分析, 日誌統計, 管理員案例庫)
    *   FraudService / AiFraudService 雙重引擎防護
    *   Web 網頁端 (Inertia.js 渲染)

### 2. `scam-detector-app/` (跨平台行動 App 端)
*   **技術棧**：Expo (React Native), Expo Router, Axios
*   **核心功能**：
    *   無縫的底部分頁架構 (安全檢測 / 防禦日誌 / 威脅庫 / 數據中樞)
    *   全域 Modal 指揮官設定檔管理
    *   跨平台 `SecureStore` + `localStorage` Token 儲存方案
    *   全局 401 攔截與安全登出機制

---

## 快速啟動指南 (Quick Start)

請先安裝 PHP 8.2+、Composer、Node.js、Tesseract OCR，以及手機測試需要的 Expo Go。

### 1. 後端 API 與 Laravel Web 版

後端資料夾是 `scam-detector/`。第一次啟動請先安裝依賴、建立 `.env`、初始化 SQLite 資料庫：

```powershell
cd scam-detector
composer install
npm install
copy .env.example .env
php artisan key:generate
New-Item -ItemType File -Path database/database.sqlite -Force
php artisan migrate --seed
```

如果要使用真 OCR 與 Gemini AI，請在 `scam-detector/.env` 設定：

```env
TESSERACT_PATH="C:/Program Files/Tesseract-OCR/tesseract.exe"
OCR_LANGUAGE=chi_tra+eng
AI_ANALYSIS_ENABLED=true
AI_PROVIDER=gemini
GEMINI_API_KEY=你的_Gemini_API_Key
GEMINI_MODEL=gemini-2.5-flash
```

設定後清除 Laravel 設定快取：

```powershell
php artisan config:clear
```

電腦本機測試時，後端固定開在 `8002`：

```powershell
php artisan serve --host=127.0.0.1 --port=8002
```

Laravel Web 版網址：

```text
http://127.0.0.1:8002
```

API 健康檢查網址：

```text
http://127.0.0.1:8002/api/scam/config
```

注意：`http://127.0.0.1:8002/api` 顯示 404 是正常的，因為 API 根目錄沒有做首頁。

### 2. 電腦網頁版 App (Expo Web)

App 資料夾是 `scam-detector-app/`。第一次啟動請先安裝依賴並建立 `.env`：

```powershell
cd scam-detector-app
npm install
copy .env.example .env
```

電腦網頁版測試時，`scam-detector-app/.env` 請設定：

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8002/api
```

啟動 Expo Web：

```powershell
npx.cmd expo start --web -c
```

電腦網頁版網址：

```text
http://localhost:8081
```

### 3. 手機版 App (Expo Go)

手機和電腦必須連同一個 Wi-Fi。先在電腦查詢區域網路 IP：

```powershell
ipconfig
```

找到 Wi-Fi 或乙太網路的 `IPv4 Address`，例如：

```text
192.168.20.72
```

手機版測試時，後端不能只綁 `127.0.0.1`，要改成：

```powershell
cd scam-detector
php artisan serve --host=0.0.0.0 --port=8002
```

接著把 `scam-detector-app/.env` 改成電腦 IP：

```env
EXPO_PUBLIC_API_URL=http://192.168.20.72:8002/api
```

重新啟動 Expo，並用手機 Expo Go 掃描 QR Code：

```powershell
cd scam-detector-app
npx.cmd expo start -c
```

如果只想用手機瀏覽器開 Web 版，可開：

```text
http://192.168.20.72:8081
```

如果手機出現 `Project is incompatible with this version of Expo Go`，請更新 App Store / Google Play 裡的 Expo Go。

---

## OCR 與 AI 設定說明 (於 `scam-detector/.env` 內設定)

1. **Gemini AI 設定**：
   註冊取得 [Google AI Studio](https://aistudio.google.com/app/apikey) 金鑰後：
   ```env
   AI_ANALYSIS_ENABLED=true
   AI_PROVIDER=gemini
   GEMINI_API_KEY=你的金鑰
   GEMINI_MODEL=gemini-2.5-flash
   ```

2. **Tesseract OCR 設定**：
   ```env
   TESSERACT_PATH="C:/Program Files/Tesseract-OCR/tesseract.exe"
   OCR_LANGUAGE=chi_tra+eng
   ```

---

## 系統測試與自動化
*   後端已內建大量測試驗證，您可以執行以下指令確認系統健全：
    ```bash
    cd scam-detector
    php artisan test
    ```
*   App 端提供 TypeScript 完整型別檢查：
    ```bash
    cd scam-detector-app
    npx tsc --noEmit
    ```

> 本專案已完全優化並清除不需要上傳的敏感檔案與日誌，可隨時發布至正式環境。

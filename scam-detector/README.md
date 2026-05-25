# AI 詐騙訊息與圖片辨識系統 (AI Scam Detection Platform)

本專案是一個基於 **Laravel 12 (後端 API + 認證)**、**Inertia.js** 和 **Vue 3 (前端)** 整合開發的未來科技科幻風（Cyberpunk Neon）AI 詐騙辨識系統。它提供了高度互動的前端介面，搭配後端的規則判定、Tesseract OCR 圖片辨識與 Gemini / OpenAI AI 分析引擎。

---

## 🌌 系統特點 (Features)

*   **未來科幻視覺風格**：全站採用發光字體、玻璃擬態（Glassmorphism）、雷達掃描與代碼瀑布流動畫，呈現高質感的 Cyberpunk 介面。
*   **多模態辨識主控艙**：支援文字貼上、網址檢測，以及對話截圖拖曳上傳與預覽分析。
*   **真實 OCR 與 AI 整合**：後端已串接真實的 Tesseract OCR（圖片文字提取）與 Gemini / OpenAI 大語言模型。當外部 AI API 故障時，會自動 fallback 到後端精心設計的規則式判定引擎，確保服務不中斷。
*   **防衛歷史日誌與統計**：整合 Chart.js，動態呈現一週攔截趨勢與詐騙類型圓餅圖。日誌表支援即時關鍵字過濾、自動分頁與時間降序排列。
*   **防詐防衛檔案館**：以加密檔案解碼動畫，呈現四大常見詐騙類型的防範守則與檔案管理。
*   **Breeze 身分驗證整合**：前端採用 Laravel Breeze 網頁端認證 (Session Cookie)，並藉由 Sanctum Stateful API 自動共用登入狀態，無需在前端手動儲存或管理 Token。

---

## 🛠️ 專案技術棧 (Tech Stack)

*   **後端框架**：Laravel 12.x (PHP 8.2+)
*   **前端框架**：Vue 3.x (Composition API) + Inertia.js 2.x
*   **樣式與打包**：Tailwind CSS v3 + Vite 6+
*   **資料庫**：SQLite (預設 `database.sqlite`)
*   **OCR 引擎**：Tesseract OCR
*   **AI 整合**：Google Gemini 2.5 Flash / OpenAI GPT-4o-mini

---

## 📂 專案檔案結構導覽 (File Structure)

*   **前端（Vue 3 / Inertia / CSS）**：
    *   頁面元件 ➜ [resources/js/Pages/](file:///D:/User/Desktop/scam_detecto/scam-detector/resources/js/Pages)
    *   組件元件 ➜ [resources/js/Components/](file:///D:/User/Desktop/scam_detecto/scam-detector/resources/js/Components)
    *   全站版面 ➜ [resources/js/Layouts/](file:///D:/User/Desktop/scam_detecto/scam-detector/resources/js/Layouts)
    *   全站樣式 ➜ [resources/css/app.css](file:///D:/User/Desktop/scam_detecto/scam-detector/resources/css/app.css)
*   **後端（Laravel / PHP）**：
    *   分析服務層 ➜ [app/Services/](file:///D:/User/Desktop/scam_detecto/scam-detector/app/Services)
    *   API / 認證控制器 ➜ [app/Http/Controllers/](file:///D:/User/Desktop/scam_detecto/scam-detector/app/Http/Controllers)
    *   路由定義 ➜ [routes/web.php](file:///D:/User/Desktop/scam_detecto/scam-detector/routes/web.php) 與 [routes/api.php](file:///D:/User/Desktop/scam_detecto/scam-detector/routes/api.php)

---

## 🚀 本地安裝與快速啟動 (Quick Start)

請確保您的電腦已安裝 PHP 8.2+、Composer 以及 Node.js。

### 1. 複製並安裝依賴
```bash
composer install
npm install
```

### 2. 配置環境變數
複製環境設定檔：
```bash
copy .env.example .env
```
產生應用程式 Key：
```bash
php artisan key:generate
```

### 3. 初始化 SQLite 資料庫
在 Windows PowerShell 下執行：
```powershell
# 建立 SQLite 資料庫檔案
New-Item -ItemType File -Path database/database.sqlite -Force

# 執行資料表遷移與種子資料植入
php artisan migrate --seed
```

### 4. 啟動開發服務
為確保服務在 Windows 環境下不中斷且 Log 輸出清晰，建議分開兩個獨立終端機（CMD）執行：
*   **終端機 A：啟動 Laravel 後端伺服器 (使用 8000 連接埠)**
    ```bash
    php -S 127.0.0.1:8000 -t public public/index.php
    ```
*   **終端機 B：啟動 Vite 前端熱重載**
    ```bash
    npm run dev
    ```

### 5. 瀏覽器存取
造訪主入口網址即可體驗完整系統：
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## 🧠 OCR 與 AI 設定說明

### 1. Gemini AI 設定
1.  前往 [Google AI Studio](https://aistudio.google.com/app/apikey) 建立 API 金鑰。
2.  修改 `.env` 檔案：
    ```env
    AI_ANALYSIS_ENABLED=true
    AI_PROVIDER=gemini
    GEMINI_API_KEY=您的_Gemini_API_Key
    GEMINI_MODEL=gemini-2.5-flash
    ```
3.  清除 Laravel 的配置快取：
    ```bash
    php artisan config:clear
    ```

### 2. Tesseract OCR 圖片辨識設定
1.  安裝 Tesseract OCR 至您的電腦。
2.  修改 `.env` 中的路徑：
    ```env
    TESSERACT_PATH="C:/Program Files/Tesseract-OCR/tesseract.exe"
    OCR_LANGUAGE=chi_tra+eng
    OCR_TIMEOUT=30
    ```

---

## 🧪 運行自動化測試

```bash
php artisan test
```
預期結果：**31 passed (179 assertions)**。

# Human-in-the-Loop 與 API Warning 實作計畫

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推薦）或 superpowers:executing-plans 逐任務實現此計畫。步驟使用複選框（`- [ ]`）語法來追蹤進度。

**目標：** 實作管理員專用的「掃描紀錄總管」頁面以進行「一鍵收錄 (Human-in-the-Loop)」，並增加 API Key 缺失的全域警告與阻擋機制。

**架構：**
1. 後端新增 `/api/config` 讓前端知道 API Key 狀態，並在 `/api/analyze-*` 阻擋無 Key 請求。
2. 後端新增 `/api/scans` 供管理員取得全站掃描紀錄。
3. 前端新增 `ApiWarningBanner.vue` 顯示警告，並在 `Dashboard.vue` 阻擋送出。
4. 前端新增 `ScansManager.vue` 頁面，串接 `/api/scans` 並整合「➕ 轉為規則」呼叫既有的 `/api/cases` API。

**技術棧：** Laravel, Inertia.js, Vue 3, Tailwind CSS

---

### 任務 1：後端 - API Key 狀態與阻擋機制

**文件：**
- 創建：`app/Http/Controllers/Api/SystemConfigController.php`
- 修改：`app/Http/Controllers/Api/ScamAnalysisController.php`
- 修改：`routes/api.php`
- 修改：`tests/Feature/ScamAnalysisApiTest.php`

- [ ] **步驟 1：編寫失敗的測試**
在 `tests/Feature/ScamAnalysisApiTest.php` 新增測試 `test_scan_fails_without_api_key`：
```php
public function test_scan_fails_without_api_key()
{
    config(['services.openai.api_key' => null]);
    $response = $this->postJson('/api/scam/analyze-text', ['content' => 'test']);
    $response->assertStatus(422)
             ->assertJsonFragment(['error_code' => 'api_key_missing']);
}
```

- [ ] **步驟 2：運行測試驗證失敗**
運行：`php artisan test tests/Feature/ScamAnalysisApiTest.php --filter test_scan_fails_without_api_key`
預期：FAIL

- [ ] **步驟 3：實作 SystemConfigController 與路由**
創建 `app/Http/Controllers/Api/SystemConfigController.php`，回傳 `['has_ai_key' => !empty(env('OPENAI_API_KEY'))]`。
在 `routes/api.php` 新增 `Route::get('/config', [SystemConfigController::class, 'index']);`

- [ ] **步驟 4：在 ScamAnalysisController 加上阻擋**
在 `analyzeText` 與 `analyzeImage` 前端檢查 `env('OPENAI_API_KEY')`，若空則 `return response()->error('api_key_missing', 'API Key not configured', 422);`。

- [ ] **步驟 5：運行測試驗證通過並 Commit**
運行：`php artisan test tests/Feature/ScamAnalysisApiTest.php`
預期：PASS
Commit：`git commit -m "feat: block AI scan when API key is missing and add config API"`

### 任務 2：後端 - 管理員掃描紀錄 API

**文件：**
- 創建：`app/Http/Controllers/Api/ScamAdminScanController.php`
- 修改：`routes/api.php`
- 創建：`tests/Feature/ScamAdminApiTest.php`

- [ ] **步驟 1：編寫失敗的測試**
創建 `tests/Feature/ScamAdminApiTest.php`，寫測試確認普通使用者存取 `/api/scans` 得到 403，而管理員可以取得所有 `ScamScan` 分頁資料。

- [ ] **步驟 2：運行測試驗證失敗**
運行：`php artisan test tests/Feature/ScamAdminApiTest.php`
預期：FAIL

- [ ] **步驟 3：實作 ScamAdminScanController**
創建該 Controller，實作 `index` 方法，撈取 `ScamScan::latest()->paginate(15)`。

- [ ] **步驟 4：新增路由與權限設定**
在 `routes/api.php` 放在 `middleware(['auth:sanctum', 'admin'])` 群組內。

- [ ] **步驟 5：運行測試驗證通過並 Commit**
運行測試，預期：PASS。
Commit：`git commit -m "feat: add admin scans api"`

### 任務 3：前端 - API 警告橫幅與阻擋

**文件：**
- 創建：`resources/js/Components/ApiWarningBanner.vue`
- 修改：`resources/js/Pages/Dashboard.vue`

- [ ] **步驟 1：建立 ApiWarningBanner.vue**
寫一個簡單的黃色 Banner 組件，支援 v-if。

- [ ] **步驟 2：修改 Dashboard.vue 串接 config API**
在 Dashboard 的 setup 裡，利用 `axios.get('/api/scam/config')` (或放到全域) 取得狀態。
如果沒有 Key，顯示 `ApiWarningBanner`。

- [ ] **步驟 3：阻擋送出**
修改 `analyze` 函數，若發現沒有 key，直接顯示 `toast.error` 阻擋請求。

- [ ] **步驟 4：編譯與 Commit**
運行：`npm run build`
Commit：`git commit -m "feat: add API warning banner and client side block"`

### 任務 4：前端 - 掃描紀錄總管頁面 (ScansManager)

**文件：**
- 創建：`resources/js/Pages/ScansManager.vue`
- 修改：`routes/web.php`
- 修改：`resources/js/Layouts/AuthenticatedLayout.vue`

- [ ] **步驟 1：註冊 Web 路由**
在 `routes/web.php` 新增 `/scans-manager` 路由，限定 auth 與 admin 權限，回傳 `Inertia::render('ScansManager')`。

- [ ] **步驟 2：在導覽列加入連結**
在 `AuthenticatedLayout.vue` 裡，為管理員新增「掃描紀錄 (Scans)」的導覽連結。

- [ ] **步驟 3：實作 ScansManager.vue**
刻劃頁面：使用表格顯示資料，提供分頁。
實作「轉為規則」按鈕：點擊後發送 POST 到 `/api/cases` (使用已存在的案例新增 API)，並將 AI 產生的 `risk_factors` (陣列轉字串) 塞給 `keywords` 欄位，送出後提示成功。

- [ ] **步驟 4：編譯與 Commit**
運行：`npm run build`
Commit：`git commit -m "feat: implement ScansManager page for human in the loop"`

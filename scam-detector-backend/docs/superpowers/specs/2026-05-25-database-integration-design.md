# 設計規格：案例庫動態規則整合 (Database Integration)

## 1. 目的與背景
目前防詐掃描引擎 (`FraudService` / `RuleHelper`) 依賴寫死的規則陣列，未與管理員維護的 `ScamCase` 資料庫連動。此設計旨在讓掃描引擎能即時且有效率地套用資料庫中新增的防詐規則，打造具備動態學習能力的防禦網。

## 2. 核心架構

### 2.1. 權重映射機制 (Weight Mapping)
不需要修改資料庫 Schema，直接根據 `ScamCase` 的 `threat_level` 轉換為掃描分數：
- `danger` -> 30 分
- `warning` -> 20 分
- `safe` -> 0 分（不納入規則比對）

### 2.2. 動態規則載入與快取 (Caching)
- **實作位置**：`App\Helpers\RuleHelper`
- **邏輯**：在 `detectTextRules` 執行時，除了原本的基礎規則外，從快取中載入「動態資料庫規則」。
- **快取鍵值**：`dynamic_scam_rules`
- **快取行為**：若快取不存在，則執行 `ScamCase::select('title', 'threat_level', 'scam_type', 'keywords')->get()`，並轉換為 `RuleHelper` 接受的規則陣列格式，然後寫入快取（TTL: 24 小時）。

### 2.3. 快取自動失效 (Cache Invalidation)
為了達成零延遲的動態更新，只要資料庫發生變動就清除快取。
- **實作位置**：`App\Http\Controllers\Api\ScamCaseController`
- **邏輯**：在 `store`、`update`、`destroy` 方法內，當資料寫入成功後，呼叫 `Cache::forget('dynamic_scam_rules')` 清除快取。

## 3. 測試與驗證策略
- 修改或新增測試，確認當 `ScamCase` 建立後，原本無法被偵測出的特殊關鍵字可以被 `FraudService` 正確識別並給予對應的 `risk_score`。
- 確認管理員更新案例後，系統的掃描行為會立刻改變（快取清除機制正常運作）。

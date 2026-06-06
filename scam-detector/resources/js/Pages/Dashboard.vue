<template>
  <CyberLayout>
    <div class="dashboard-grid">
      <!-- 左側主要核心舱 (佔比 2/3) -->
      <section class="main-console-section">
        <ApiWarningBanner v-if="hasApiKey !== null && !hasApiKey" :provider="aiProvider" />
        
        <div v-if="scanError" class="scan-error-panel text-mono text-glow-danger">
          [SCAN_ERROR]: {{ scanError }}
        </div>

        <!-- 階段 1：輸入模式 -->
        <ScannerInput 
          v-if="scanState === 'idle'" 
          @start-scan="handleStartScan" 
        />

        <!-- 階段 2：雷達掃描中 -->
        <ScanningLoader 
          v-else-if="scanState === 'scanning'"
        />

        <!-- 階段 3：分析報告完成 -->
        <ResultCard 
          v-else-if="scanState === 'completed'" 
          :result="analysisResult" 
          :ocrText="ocrText"
          @reset="resetScanner" 
        />
      </section>

      <!-- 右側輔助資訊模組 (佔比 1/3) -->
      <aside class="side-info-section">
        <!-- 上格：AI 核心防禦儀表板 -->
        <div class="side-card cyber-card core-dashboard">
          <h3 class="side-title text-mono">[ DEFENSE_CORE_MONITOR ]</h3>
          
          <div class="core-visual-wrapper">
            <!-- 3D 旋轉球體與發光投影 -->
            <div class="core-sphere-container">
              <div class="core-sphere" :class="'sphere-' + aiCoreStatus">
                <div class="sphere-ring ring-x"></div>
                <div class="sphere-ring ring-y"></div>
                <div class="sphere-ring ring-z"></div>
              </div>
              <div class="core-shadow" :class="'shadow-' + aiCoreStatus"></div>
            </div>
            
            <div class="core-meta text-mono">
              <span class="meta-title">CORE_INTEGRITY</span>
              <span class="meta-value text-glow-safe" :class="'text-' + aiCoreStatus">
                {{ coreStatusText }}
              </span>
            </div>
          </div>

          <div class="stats-counter-group text-mono">
            <div class="stat-counter">
              <span class="stat-label">今日辨識總數</span>
              <span class="stat-number text-glow-safe">{{ todayProcessed }}</span>
            </div>
            <div class="stat-counter">
              <span class="stat-label">已攔截詐騙</span>
              <span class="stat-number text-glow-danger" :class="{ 'glow-active': todayBlocked > 0 }">
                {{ todayBlocked }}
              </span>
            </div>
          </div>
        </div>

        <!-- 下格：後端案例庫摘要 -->
        <div class="side-card cyber-card alert-ticker-panel">
          <h3 class="side-title text-mono">[ CASE_ARCHIVE_FEED ]</h3>
          
          <div class="ticker-view">
            <div v-if="isAlertLoading" class="ticker-status text-mono">
              [ LOADING_CASES ]
            </div>

            <div v-else-if="activeAlerts.length === 0" class="ticker-status text-mono">
              [ NO_CASES_AVAILABLE ]
            </div>

            <div class="ticker-list" :style="{ transform: `translateY(-${tickerOffset}px)` }">
              <div 
                v-for="(alert, idx) in activeAlerts" 
                :key="'a-'+idx" 
                class="ticker-item text-mono"
              >
                <div class="ticker-meta">
                  <span class="ticker-badge" :class="'badge-' + alert.severity">
                    {{ alert.badge }}
                  </span>
                  <span class="ticker-time">{{ alert.time }}</span>
                </div>
                <p class="ticker-content">{{ alert.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </CyberLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { usePage } from '@inertiajs/vue3';
import axios from 'axios';
import CyberLayout from '@/Layouts/CyberLayout.vue';
import ScannerInput from '@/Components/ScannerInput.vue';
import ScanningLoader from '@/Components/ScanningLoader.vue';
import ResultCard from '@/Components/ResultCard.vue';
import ApiWarningBanner from '@/Components/ApiWarningBanner.vue';

// 狀態管理
const scanState = ref('idle'); // idle | scanning | completed
const ocrText = ref('');
const analysisResult = ref(null);
const scanError = ref('');

const aiCoreStatus = ref('safe'); // safe | warning | danger
const todayProcessed = ref(0);
const todayBlocked = ref(0);
const page = usePage();

// 後端案例庫摘要，不宣稱為即時警報。
const tickerOffset = ref(0);
const activeAlerts = ref([]);
const isAlertLoading = ref(true);

// API Key 狀態
const hasApiKey = ref(true); // 預設為 true，避免載入時閃爍
const aiProvider = ref('AI');

const coreStatusText = computed(() => {
  if (aiCoreStatus.value === 'safe') return 'SECURE (100%)';
  if (aiCoreStatus.value === 'warning') return 'WARNING (WARN)';
  return 'THREAT DETECTED';
});

// 案例摘要滾動
let tickerTimer = null;
const runTicker = () => {
  tickerTimer = setInterval(() => {
    if (activeAlerts.value.length <= 3) {
      tickerOffset.value = 0;
      return;
    }

    tickerOffset.value += 74; // 每個 ticker-item 的高度加上 margin
    if (tickerOffset.value >= 74 * (activeAlerts.value.length - 2)) {
      tickerOffset.value = 0;
    }
  }, 4000);
};

// 取得或生成訪客唯一識別碼
const getVisitorId = () => {
  let uuid = localStorage.getItem('visitor_uuid');
  if (!uuid) {
    uuid = 'v-' + Math.random().toString(36).substring(2, 15) + '-' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('visitor_uuid', uuid);
  }
  return uuid;
};

// 啟動掃描辨識
const handleStartScan = (payload) => {
  if (hasApiKey.value === false) {
    scanError.value = `系統尚未設定 ${aiProvider.value} API Key，AI 掃描功能無法使用。`;
    scanState.value = 'idle';
    aiCoreStatus.value = 'danger';
    return;
  }

  scanState.value = 'scanning';
  ocrText.value = '';
  analysisResult.value = null;
  scanError.value = '';

  let apiFinished = false;
  let apiResponse = null;
  let apiError = null;

  const visitorId = getVisitorId();

  // 1. 根據分析類型發送真實 API 請求
  let requestPromise;
  if (payload.type === 'text') {
    requestPromise = axios.post('/api/scam/analyze-text', { content: payload.content, visitor_id: visitorId });
  } else if (payload.type === 'url') {
    requestPromise = axios.post('/api/scam/analyze-url', { url: payload.content, visitor_id: visitorId });
  } else if (payload.type === 'image') {
    const formData = new FormData();
    // 使用真實的圖片檔案物件，優先嘗試 imageFile，再嘗試 file，最後退回到 base64/字串（如有需要）
    const imageObj = payload.imageFile || payload.file || payload.content;
    formData.append('image', imageObj);
    formData.append('visitor_id', visitorId);
    requestPromise = axios.post('/api/scam/analyze-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  } else {
    requestPromise = Promise.reject(new Error('未知的分析類型'));
  }

  requestPromise
    .then((response) => {
      // 成功取得資料，對接後端真實回傳格式 response.data.data
      apiResponse = response.data?.data || {};
      apiFinished = true;
    })
    .catch((error) => {
      console.error('分析 API 請求失敗:', error);
      apiError = error;
      apiFinished = true;
    })
    .finally(() => {
      if (!apiFinished) return;

      if (apiError) {
        scanError.value = resolveApiErrorMessage(apiError);
        scanState.value = 'idle';
        aiCoreStatus.value = 'warning';
        return;
      }

      ocrText.value = apiResponse.ocr_text || '';
      aiCoreStatus.value = apiResponse.risk_level || 'safe';

      analysisResult.value = {
        status: apiResponse.risk_level || 'safe',
        score: apiResponse.risk_score !== undefined ? apiResponse.risk_score : 0,
        title: apiResponse.scam_type || '無異常',
        summary: apiResponse.summary || '未發現明顯詐騙特徵',
        risk_factors: apiResponse.risk_factors || [],
        details: apiResponse.details || fallbackDetails(apiResponse.risk_level),
        recommendations: apiResponse.suggestions || []
      };

      scanState.value = 'completed';

      todayProcessed.value += 1;
      if (apiResponse.risk_level === 'danger') {
        todayBlocked.value += 1;
      }
    });
};

const resolveApiErrorMessage = (error) => {
  const status = error?.response?.status;
  const message = error?.response?.data?.message;
  const errors = error?.response?.data?.errors;

  if (errors && typeof errors === 'object') {
    const firstError = Object.values(errors).flat().find(Boolean);
    if (firstError) return firstError;
  }

  if (status === 401) return '請先登入後再查看或儲存個人分析紀錄。';
  if (status === 429) return '掃描請求過於頻繁，請稍候再試。';
  if (status === 503) return '圖片 OCR 服務暫時無法使用，請稍後重試。';
  if (message) return message;

  return '分析服務暫時無法連線，請稍後再試。';
};

const fallbackDetails = (riskLevel) => {
  if (riskLevel === 'danger') {
    return '系統偵測到多個高風險詐騙特徵，請勿點擊連結、加入陌生群組、匯款或提供個人資料。';
  }

  if (riskLevel === 'warning') {
    return '系統偵測到可疑特徵，建議先從官方管道查證來源與內容真偽。';
  }

  return '目前未偵測到明確詐騙危險指標，但仍建議確認訊息來源。';
};

// 重設
const resetScanner = () => {
  scanState.value = 'idle';
  aiCoreStatus.value = 'safe';
  scanError.value = '';
};

const loadUserStats = () => {
  const params = {
    visitor_id: getVisitorId()
  };

  axios.get('/api/scam/stats', { params })
    .then((response) => {
      const summary = response.data?.data?.summary;
      if (!summary) return;

      todayProcessed.value = summary.total_scans || 0;
      todayBlocked.value = summary.danger_scans || 0;
    })
    .catch((err) => {
      console.error('無法載入使用者統計資料:', err);
    });
};

onMounted(() => {
  // 取得 API 狀態
  axios.get('/api/scam/config')
    .then(response => {
      hasApiKey.value = response.data?.has_ai_key ?? true;
      aiProvider.value = response.data?.provider ?? 'AI';
    })
    .catch(err => {
      console.error('無法取得 API Key 狀態', err);
    });

  loadUserStats();

  // 4. 對接後端案例庫 API
  axios.get('/api/scam/cases')
    .then((response) => {
      const casesData = response.data?.data?.cases || [];
      if (casesData.length > 0) {
        activeAlerts.value = casesData.map(c => {
          let timeStr = '案例庫';
          if (c.created_at) {
            // 只顯示案例日期，避免誤導成即時發生時間。
            const parts = c.created_at.split(' ');
            if (parts.length >= 1) {
              timeStr = parts[0];
            }
          }
          return {
            severity: c.threat_level || 'warning',
            badge: c.scam_type || '詐騙警報',
            time: timeStr,
            content: c.description || c.title || ''
          };
        });
      }
    })
    .catch((err) => {
      console.error('無法獲取詐騙案例資料:', err);
    })
    .finally(() => {
      isAlertLoading.value = false;
    });

  runTicker();
});

onUnmounted(() => {
  if (tickerTimer) clearInterval(tickerTimer);
});
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.main-console-section {
  display: flex;
  flex-direction: column;
}

.scan-error-panel {
  background: rgba(255, 8, 68, 0.08);
  border: 1px solid rgba(255, 8, 68, 0.25);
  border-radius: 6px;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

.side-info-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.side-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border: var(--glass-border);
  padding: 1.25rem;
}

.side-title {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 1.25rem;
  border-left: 2px solid var(--color-safe);
  padding-left: 0.5rem;
  letter-spacing: 1px;
}

/* AI 核心球體與發光 */
.core-visual-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
  position: relative;
}

.core-sphere-container {
  width: 120px;
  height: 120px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 600px;
}

.core-sphere {
  width: 70px;
  height: 70px;
  position: relative;
  transform-style: preserve-3d;
  animation: sphere-rotate 8s linear infinite;
  transition: all 0.5s;
}

.sphere-ring {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  border-radius: 50%;
  border: 1.5px solid var(--color-safe);
  transition: border-color 0.5s;
}

.ring-x { transform: rotateX(0deg); }
.ring-y { transform: rotateY(90deg); }
.ring-z { transform: rotateZ(45deg); }

/* 三色狀態 AI 核心 */
.sphere-safe .sphere-ring {
  border-color: var(--color-safe);
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.4);
}
.sphere-warning .sphere-ring {
  border-color: var(--color-warning);
  box-shadow: 0 0 10px rgba(241, 196, 15, 0.4);
}
.sphere-danger .sphere-ring {
  border-color: var(--color-danger);
  box-shadow: 0 0 10px rgba(255, 8, 68, 0.4);
}

.core-shadow {
  position: absolute;
  bottom: 0;
  width: 60px;
  height: 6px;
  border-radius: 50%;
  background: rgba(0, 242, 254, 0.15);
  filter: blur(4px);
  transition: all 0.5s;
}

.shadow-safe { background: rgba(0, 242, 254, 0.15); }
.shadow-warning { background: rgba(241, 196, 15, 0.15); }
.shadow-danger { background: rgba(255, 8, 68, 0.15); }

@keyframes sphere-rotate {
  0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
  100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg); }
}

.core-meta {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.meta-title {
  font-size: 0.6rem;
  color: var(--color-text-muted);
  letter-spacing: 1px;
}

.meta-value {
  font-size: 0.9rem;
  font-weight: 700;
}

.text-safe { color: var(--color-safe); text-shadow: 0 0 8px rgba(0, 242, 254, 0.4); }
.text-warning { color: var(--color-warning); text-shadow: 0 0 8px rgba(241, 196, 15, 0.4); }
.text-danger { color: var(--color-danger); text-shadow: 0 0 8px rgba(255, 8, 68, 0.4); }

/* 今日計數器 */
.stats-counter-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 1.25rem;
}

.stat-counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.03);
  padding: 0.75rem;
  border-radius: 4px;
}

.stat-label {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  margin-bottom: 0.25rem;
}

.stat-number {
  font-size: 1.3rem;
  font-weight: bold;
}

/* 跑馬燈警報區 */
.alert-ticker-panel {
  flex: 1;
  min-height: 250px;
}

.ticker-view {
  height: 220px;
  overflow: hidden;
  position: relative;
}

.ticker-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: transform 0.5s ease-in-out;
}

.ticker-status {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  padding: 0.65rem;
}

.ticker-item {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 4px;
  padding: 0.65rem;
  height: 64px; /* 固定高方便計算偏移 */
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.ticker-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  margin-bottom: 0.25rem;
}

.ticker-badge {
  font-weight: bold;
  padding: 0 0.35rem;
  border-radius: 2px;
}

.badge-danger {
  background: rgba(255, 8, 68, 0.12);
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
}

.badge-warning {
  background: rgba(241, 196, 15, 0.12);
  border: 1px solid var(--color-warning);
  color: var(--color-warning);
}

.ticker-time {
  color: var(--color-text-muted);
}

.ticker-content {
  font-size: 0.75rem;
  color: var(--color-text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 900px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  .side-info-section {
    flex-direction: row;
  }
  .core-dashboard, .alert-ticker-panel {
    flex: 1;
  }
}

@media (max-width: 600px) {
  .side-info-section {
    flex-direction: column;
  }
}
</style>

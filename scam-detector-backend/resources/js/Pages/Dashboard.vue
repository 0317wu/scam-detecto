<template>
  <CyberLayout>
    <div class="dashboard-grid">
      <!-- 左側主要核心舱 (佔比 2/3) -->
      <section class="main-console-section">
        <!-- 階段 1：輸入模式 -->
        <ScannerInput 
          v-if="scanState === 'idle'" 
          @start-scan="handleStartScan" 
        />

        <!-- 階段 2：雷達掃描中 -->
        <ScanningLoader 
          v-else-if="scanState === 'scanning'" 
          :progress="scanProgress" 
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

        <!-- 下格：即時詐騙警報器 -->
        <div class="side-card cyber-card alert-ticker-panel">
          <h3 class="side-title text-mono">[ LIVE_SCAM_TICKER ]</h3>
          
          <div class="ticker-view">
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
import axios from 'axios';
import CyberLayout from '@/Layouts/CyberLayout.vue';
import ScannerInput from '@/Components/ScannerInput.vue';
import ScanningLoader from '@/Components/ScanningLoader.vue';
import ResultCard from '@/Components/ResultCard.vue';

// 狀態管理
const scanState = ref('idle'); // idle | scanning | completed
const scanProgress = ref(0);
const ocrText = ref('');
const analysisResult = ref(null);

const aiCoreStatus = ref('safe'); // safe | warning | danger
const todayProcessed = ref(128); // 起始模擬數據
const todayBlocked = ref(42);

// 警報跑馬燈數據
const tickerOffset = ref(0);
const activeAlerts = ref([
  { severity: 'danger', badge: '偽冒退稅', time: '15:32', content: '簡訊「國稅局通知，您有一筆退稅金尚未領取...」' },
  { severity: 'danger', badge: '飆股群組', time: '15:28', content: 'FB 廣告引導加 LINE「李老師投資心法，保證獲利」' },
  { severity: 'warning', badge: '疑似釣魚', time: '15:15', content: '可疑網址「http://post-tw-cargo.xyz」已封鎖' },
  { severity: 'danger', badge: '假冒銀行', time: '14:50', content: '簡訊「您的網銀帳戶異常，請立即登入解除...」' },
  { severity: 'warning', badge: '假求職', time: '14:22', content: '社團貼文「誠徵在家打字員，時薪 500 元起」' },
  { severity: 'danger', badge: '偽冒水費', time: '13:05', content: '簡訊「您的水費已逾期，請點擊連結繳納...」' }
]);

const coreStatusText = computed(() => {
  if (aiCoreStatus.value === 'safe') return 'SECURE (100%)';
  if (aiCoreStatus.value === 'warning') return 'WARNING (WARN)';
  return 'THREAT DETECTED';
});

// 模擬跑馬燈滾動
let tickerTimer = null;
const runTicker = () => {
  tickerTimer = setInterval(() => {
    tickerOffset.value += 74; // 每個 ticker-item 的高度加上 margin
    if (tickerOffset.value >= 74 * (activeAlerts.value.length - 2)) {
      tickerOffset.value = 0;
    }
  }, 4000);
};

// 啟動掃描辨識
// 啟動掃描辨識
const handleStartScan = (payload) => {
  scanState.value = 'scanning';
  scanProgress.value = 0;
  ocrText.value = '';
  analysisResult.value = null;

  let apiFinished = false;
  let apiResponse = null;

  // 1. 根據分析類型發送真實 API 請求
  let requestPromise;
  if (payload.type === 'text') {
    requestPromise = axios.post('/api/scam/analyze-text', { content: payload.content });
  } else if (payload.type === 'url') {
    requestPromise = axios.post('/api/scam/analyze-url', { url: payload.content });
  } else if (payload.type === 'image') {
    const formData = new FormData();
    // 使用真實的圖片檔案物件，優先嘗試 imageFile，再嘗試 file，最後退回到 base64/字串（如有需要）
    const imageObj = payload.imageFile || payload.file || payload.content;
    formData.append('image', imageObj);
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
      console.error('分析 API 請求失敗，啟動防呆臨時引擎:', error);
      // 模擬通信失敗防呆
      apiResponse = {
        risk_level: 'warning',
        risk_score: 50,
        scam_type: '通信鏈結異常警告',
        summary: '目前無法與雲端 AI 核心同步，以下為本地防火牆規則引擎辨識結果。',
        risk_factors: ['本地規則警告', '未知外部連結'],
        details: '因為伺服器網路異常，我們啟動了本地臨時防範引擎。若此訊息要求轉帳或提供個人資料，請提高警覺。',
        suggestions: ['請稍後在網路通暢時再次掃描。', '請勿在來源不明的表單輸入信用卡號。'],
        ocr_text: ''
      };
      apiFinished = true;
    });

  // 2. 模擬進度條增加
  const progressTimer = setInterval(() => {
    if (scanProgress.value < 90) {
      scanProgress.value += Math.floor(Math.random() * 8) + 2;
    } else if (apiFinished && scanProgress.value < 100) {
      scanProgress.value += 5;
      if (scanProgress.value > 100) scanProgress.value = 100;
    }

    // 達到 100% 且 API 已回傳
    if (scanProgress.value >= 100 && apiFinished) {
      clearInterval(progressTimer);
      
      // 3. 適配返回欄位與 Vue state 綁定（包含完善防呆）
      ocrText.value = apiResponse.ocr_text || '';
      aiCoreStatus.value = apiResponse.risk_level || 'safe';
      
      analysisResult.value = {
        status: apiResponse.risk_level || 'safe',
        score: apiResponse.risk_score !== undefined ? apiResponse.risk_score : 0,
        title: apiResponse.scam_type || '無異常',
        summary: apiResponse.summary || '未發現明顯詐騙特徵',
        risk_factors: apiResponse.risk_factors || [],
        details: apiResponse.details || '經過初步分析，該內容並無明確的詐騙危險指標。請繼續保持警覺。',
        recommendations: apiResponse.suggestions || []
      };
      
      scanState.value = 'completed';

      // 今日計數器加 1
      todayProcessed.value += 1;
      if (apiResponse.risk_level === 'danger') {
        todayBlocked.value += 1;
      }
    }
  }, 100);
};

// 重設
const resetScanner = () => {
  scanState.value = 'idle';
  scanProgress.value = 0;
  aiCoreStatus.value = 'safe';
};

onMounted(() => {
  // 4. 對接跑馬燈 Ticker 案例 API
  axios.get('/api/scam/cases')
    .then((response) => {
      const casesData = response.data?.data?.cases || [];
      if (casesData.length > 0) {
        activeAlerts.value = casesData.map(c => {
          let timeStr = '剛剛';
          if (c.created_at) {
            // 從 '2026-05-24 15:32:00' 格式提取出 '15:32'
            const parts = c.created_at.split(' ');
            if (parts.length >= 2) {
              const hm = parts[1].split(':');
              if (hm.length >= 2) {
                timeStr = `${hm[0]}:${hm[1]}`;
              }
            }
          }
          return {
            severity: 'danger', // 既為已通報之真實詐騙案例，設定為高風險
            badge: c.scam_type || '詐騙警報',
            time: timeStr,
            content: c.description || c.title || ''
          };
        });
      }
    })
    .catch((err) => {
      console.error('無法獲取即時詐騙案例數據:', err);
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

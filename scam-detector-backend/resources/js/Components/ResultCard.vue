<template>
  <div class="result-card cyber-card" :class="'status-' + result.status">
    <!-- 頂部霓虹掃描邊角裝飾 -->
    <div class="card-corner top-left"></div>
    <div class="card-corner top-right"></div>
    <div class="card-corner bottom-left"></div>
    <div class="card-corner bottom-right"></div>

    <!-- 頂部儀表與分數 -->
    <div class="result-header">
      <div class="score-gauge">
        <svg viewBox="0 0 100 100" class="gauge-svg">
          <circle cx="50" cy="50" r="42" class="gauge-bg" />
          <circle 
            cx="50" 
            cy="50" 
            r="42" 
            class="gauge-progress" 
            :stroke-dasharray="strokeDashArray"
            :stroke-dashoffset="strokeDashOffset"
            :class="'stroke-' + result.status"
          />
        </svg>
        <div class="score-text text-mono">
          <span class="score-num" :class="'text-' + result.status">{{ result.score }}</span>
          <span class="score-lbl">SCAM_IDX</span>
        </div>
      </div>

      <div class="status-info">
        <div class="status-badge text-mono" :class="'badge-' + result.status">
          [ STATUS: {{ statusLabel }} ]
        </div>
        <h2 class="result-title text-mono" :class="'text-' + result.status">
          {{ result.title }}
        </h2>
        <p class="result-summary">{{ result.summary }}</p>
      </div>
    </div>

    <!-- 模擬 OCR 結果 (僅在有提取圖片文字時展示) -->
    <div v-if="ocrText" class="ocr-section">
      <h3 class="section-title text-mono">[ OCR_IMAGE_TEXT_EXTRACTED ]</h3>
      <div class="ocr-box text-mono">
        {{ ocrText }}
      </div>
    </div>

    <!-- 風險因子 (RISK FACTORS) -->
    <div class="info-section">
      <h3 class="section-title text-mono" :class="'text-' + result.status">
        [ RISK_FACTORS_DETECTED: {{ result.risk_factors.length }} ]
      </h3>
      <ul class="risk-list text-mono">
        <li v-for="(factor, idx) in result.risk_factors" :key="'f-'+idx" class="risk-item">
          <span class="risk-bullet">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </span> 
          {{ factor }}
        </li>
      </ul>
    </div>

    <!-- 詳細手法說明 (DETAILS) -->
    <div class="info-section">
      <h3 class="section-title text-mono">[ DEEP_ANALYSIS_DETAILS ]</h3>
      <p class="details-text">{{ result.details }}</p>
    </div>

    <!-- 防禦修復建議 (RECOMMENDATIONS) -->
    <div class="info-section">
      <h3 class="section-title text-mono text-glow-safe">[ AI_DEFENSE_RECOMMENDATIONS ]</h3>
      <ol class="rec-list">
        <li v-for="(rec, idx) in result.recommendations" :key="'r-'+idx" class="rec-item">
          {{ rec }}
        </li>
      </ol>
    </div>

    <!-- 科幻小通知 Toast -->
    <div v-if="toastMessage" class="cyber-toast text-mono text-glow-safe">
      {{ toastMessage }}
    </div>

    <!-- 底部功能按鈕 -->
    <div class="result-footer">
      <button type="button" class="cyber-btn-sec text-mono" @click="$emit('reset')">
        [ RETURN / SCAN AGAIN ]
      </button>

      <div class="action-group">
        <button type="button" class="cyber-btn share-btn" @click="shareReport">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; display: inline-block; vertical-align: middle;">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          SHARE REPORT
        </button>

        <a 
          v-if="result.status !== 'safe'"
          href="https://165.npa.gov.tw/#/" 
          target="_blank"
          rel="noopener noreferrer"
          class="cyber-btn danger-btn text-mono"
          @click.prevent="call165"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; display: inline-block; vertical-align: middle;">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          CALL 165
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  result: {
    type: Object,
    required: true
  },
  ocrText: {
    type: String,
    default: ''
  }
});

defineEmits(['reset']);

const toastMessage = ref('');

const statusLabel = computed(() => {
  if (props.result.status === 'safe') return 'SECURE / SAFE';
  if (props.result.status === 'warning') return 'SUSPICIOUS / WARNING';
  return 'HIGH RISK / DANGER';
});

// SVG 圓圈進度條計算
const strokeDashArray = 2 * Math.PI * 42; // 約 263.89
const strokeDashOffset = computed(() => {
  const percent = Math.min(Math.max(props.result.score, 0), 100);
  return strokeDashArray - (percent / 100) * strokeDashArray;
});

// 分享報告 Mock 複製連結
const shareReport = () => {
  const mockUrl = `https://scam-shield.pro/report/${Math.random().toString(36).substring(7)}`;
  navigator.clipboard.writeText(mockUrl).then(() => {
    showToast('[SUCCESS]: 防詐騙分析報告連結已複製到剪貼簿！');
  }).catch(() => {
    showToast('[ERROR]: 無法自動複製，請手動複製網址。');
  });
};

// 前往 165 全民防騙網
const call165 = () => {
  if (confirm('系統檢測到高風險詐騙內容。\n是否確認前往「165 全民防騙官網」尋求協助或檢舉？')) {
    window.open('https://165.npa.gov.tw/#/', '_blank');
  }
};

const showToast = (msg) => {
  toastMessage.value = msg;
  setTimeout(() => {
    toastMessage.value = '';
  }, 3000);
};
</script>

<style scoped>
.result-card {
  width: 100%;
  border-radius: 12px;
  background: var(--bg-card);
  border: var(--glass-border);
  padding: 2rem;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* 霓虹發光外框微調 */
.status-safe {
  border-color: var(--color-safe);
  box-shadow: var(--glow-safe);
}
.status-warning {
  border-color: var(--color-warning);
  box-shadow: var(--glow-warning);
}
.status-danger {
  border-color: var(--color-danger);
  box-shadow: var(--glow-danger);
}

/* 四角幾何裝飾線 */
.card-corner {
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: rgba(255, 255, 255, 0.25);
  border-style: solid;
  pointer-events: none;
}
.top-left { top: 6px; left: 6px; border-width: 1.5px 0 0 1.5px; }
.top-right { top: 6px; right: 6px; border-width: 1.5px 1.5px 0 0; }
.bottom-left { bottom: 6px; left: 6px; border-width: 0 0 1.5px 1.5px; }
.bottom-right { bottom: 6px; right: 6px; border-width: 0 1.5px 1.5px 0; }

.status-safe .card-corner { border-color: var(--color-safe); }
.status-warning .card-corner { border-color: var(--color-warning); }
.status-danger .card-corner { border-color: var(--color-danger); }

/* 頂部佈局 */
.result-header {
  display: flex;
  gap: 2rem;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
}

/* 進度儀表 */
.score-gauge {
  width: 100px;
  height: 100px;
  position: relative;
  flex-shrink: 0;
}

.gauge-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.gauge-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.03);
  stroke-width: 8;
}

.gauge-progress {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s ease-out;
}

.stroke-safe { stroke: var(--color-safe); filter: drop-shadow(0 0 3px var(--color-safe)); }
.stroke-warning { stroke: var(--color-warning); filter: drop-shadow(0 0 3px var(--color-warning)); }
.stroke-danger { stroke: var(--color-danger); filter: drop-shadow(0 0 3px var(--color-danger)); }

.score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-num {
  font-size: 1.8rem;
  font-weight: 700;
}

.score-lbl {
  font-size: 0.55rem;
  color: var(--color-text-muted);
  letter-spacing: 1px;
}

/* 狀態資訊 */
.status-info {
  flex: 1;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  letter-spacing: 1px;
}

.badge-safe { color: var(--color-safe); text-shadow: 0 0 5px rgba(0, 242, 254, 0.3); }
.badge-warning { color: var(--color-warning); text-shadow: 0 0 5px rgba(241, 196, 15, 0.3); }
.badge-danger { color: var(--color-danger); text-shadow: 0 0 5px rgba(255, 8, 68, 0.3); }

.result-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.result-summary {
  font-size: 0.95rem;
  color: var(--color-text-main);
  line-height: 1.5;
}

/* 各段落標題 */
.section-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
  margin-bottom: 0.75rem;
  letter-spacing: 1px;
  border-left: 2px solid rgba(255, 255, 255, 0.15);
  padding-left: 0.5rem;
}

.info-section {
  margin-bottom: 1.5rem;
}

/* OCR 區塊 */
.ocr-section {
  margin-bottom: 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 1rem;
}

.ocr-box {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  line-height: 1.6;
  white-space: pre-wrap;
  border-top: 1px solid rgba(255, 255, 255, 0.03);
  padding-top: 0.5rem;
  margin-top: 0.25rem;
}

/* 風險因子清單 */
.risk-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.risk-item {
  font-size: 0.85rem;
  color: var(--color-text-main);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.risk-bullet {
  font-size: 0.9rem;
}

.status-safe .risk-bullet { color: var(--color-safe); }
.status-warning .risk-bullet { color: var(--color-warning); }
.status-danger .risk-bullet { color: var(--color-danger); }

/* 詳細說明 */
.details-text {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}

/* 防禦建議 */
.rec-list {
  padding-left: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rec-item {
  font-size: 0.9rem;
  color: var(--color-text-main);
  line-height: 1.5;
}

/* 文字顏色 */
.text-safe { color: var(--color-safe); text-shadow: 0 0 5px rgba(0, 242, 254, 0.3); }
.text-warning { color: var(--color-warning); text-shadow: 0 0 5px rgba(241, 196, 15, 0.3); }
.text-danger { color: var(--color-danger); text-shadow: 0 0 5px rgba(255, 8, 68, 0.3); }

/* 底部按鈕區 */
.result-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 1.5rem;
  gap: 1rem;
}

.action-group {
  display: flex;
  gap: 0.75rem;
}

.cyber-btn-sec {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--color-text-muted);
  padding: 0.75rem 1.25rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  transition: all 0.3s;
}

.cyber-btn-sec:hover {
  border-color: rgba(255, 255, 255, 0.35);
  color: #ffffff;
  background: rgba(255, 255, 255, 0.03);
}

.share-btn {
  background: rgba(0, 242, 254, 0.05);
}

.danger-btn {
  border-color: var(--color-danger);
  color: var(--color-danger);
  box-shadow: var(--glow-danger);
  background: rgba(255, 8, 68, 0.05);
  text-decoration: none;
}

.danger-btn:hover {
  background: rgba(255, 8, 68, 0.15);
  box-shadow: 0 0 20px rgba(255, 8, 68, 0.6);
  border-color: #ffffff;
}

/* Toast 通知 */
.cyber-toast {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(8, 7, 30, 0.95);
  border: 1px solid var(--color-safe);
  box-shadow: var(--glow-safe);
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  z-index: 100;
  font-size: 0.8rem;
  animation: toast-fade-in 0.3s ease;
  pointer-events: none;
}

@keyframes toast-fade-in {
  from { opacity: 0; bottom: 1.5rem; }
  to { opacity: 1; bottom: 2rem; }
}

@media (max-width: 600px) {
  .result-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .result-footer {
    flex-direction: column;
    align-items: stretch;
  }
  .action-group {
    flex-direction: column;
  }
  .cyber-btn-sec {
    text-align: center;
  }
}
</style>

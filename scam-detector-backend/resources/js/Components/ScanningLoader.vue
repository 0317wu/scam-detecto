<template>
  <div class="scanning-container cyber-card">
    <div class="cyber-loading-panel">
      <!-- 左右兩側的二進位瀑布流 -->
      <div class="code-stream left-stream text-mono">
        <div v-for="(line, idx) in codeLinesLeft" :key="'l-'+idx" class="stream-line">
          {{ line }}
        </div>
      </div>

      <!-- 雷達主體 -->
      <div class="radar-wrapper">
        <div class="radar-screen">
          <!-- 同心圓 -->
          <div class="radar-circle circle-1"></div>
          <div class="radar-circle circle-2"></div>
          <div class="radar-circle circle-3"></div>
          <div class="radar-circle circle-4"></div>
          
          <!-- 十字網格線 -->
          <div class="radar-line-h"></div>
          <div class="radar-line-v"></div>
          
          <!-- 旋轉的掃描指針 -->
          <div class="radar-sweep"></div>
          
          <!-- 隨機閃爍的目標點 (模擬識別出的詐騙因子) -->
          <div class="radar-blip blip-1"></div>
          <div class="radar-blip blip-2 text-mono">!</div>

          <!-- 中心百分比文字 -->
          <div class="radar-center text-mono">
            <span class="scan-percent">{{ progress }}%</span>
            <span class="scan-tag">SCANNING</span>
          </div>
        </div>
      </div>

      <div class="code-stream right-stream text-mono">
        <div v-for="(line, idx) in codeLinesRight" :key="'r-'+idx" class="stream-line">
          {{ line }}
        </div>
      </div>
    </div>

    <!-- 底部文字警告 -->
    <div class="scanning-status text-mono text-glow-safe">
      <span class="status-blink">></span> [ SYS_CORE: DECONSTRUCTING MULTIMODAL SOURCE DATA... ]
      <br />
      <span class="status-blink">></span> [ STATUS: RUNNING DEEP SCAM DETECTOR V4.82 ]
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  progress: {
    type: Number,
    required: true,
    default: 0
  }
});

const codeLinesLeft = ref([]);
const codeLinesRight = ref([]);
let intervalId = null;

const generateBinaryLine = () => {
  let len = Math.floor(Math.random() * 8) + 8;
  let str = '';
  for (let i = 0; i < len; i++) {
    str += Math.random() > 0.5 ? '1' : '0';
  }
  return str;
};

onMounted(() => {
  // 初始化瀑布流數據
  for (let i = 0; i < 8; i++) {
    codeLinesLeft.value.push(generateBinaryLine());
    codeLinesRight.value.push(generateBinaryLine());
  }

  // 動態更新二進位瀑布
  intervalId = setInterval(() => {
    codeLinesLeft.value.shift();
    codeLinesLeft.value.push(generateBinaryLine());
    
    codeLinesRight.value.shift();
    codeLinesRight.value.push(generateBinaryLine());
  }, 150);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<style scoped>
.scanning-container {
  width: 100%;
  background: var(--bg-card);
  border: var(--glass-border);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: var(--glow-safe);
}

.cyber-loading-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 550px;
  margin-bottom: 2rem;
  gap: 1rem;
}

/* 二進位數據瀑布 */
.code-stream {
  width: 80px;
  font-size: 0.7rem;
  color: rgba(0, 242, 254, 0.4);
  line-height: 1.5;
  height: 150px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  user-select: none;
}

.left-stream {
  text-align: right;
}

.right-stream {
  text-align: left;
}

.stream-line {
  transition: all 0.15s ease;
  opacity: 0.8;
}

.stream-line:last-child {
  color: var(--color-safe);
  text-shadow: 0 0 5px rgba(0, 242, 254, 0.6);
  opacity: 1;
}

/* 雷達本體 */
.radar-wrapper {
  flex: 1;
  display: flex;
  justify-content: center;
}

.radar-screen {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 1px solid rgba(0, 242, 254, 0.25);
  background: radial-gradient(circle, rgba(0, 25, 40, 0.4) 0%, rgba(3, 0, 10, 0.9) 100%);
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0, 242, 254, 0.2);
}

/* 同心圓波紋 */
.radar-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px solid rgba(0, 242, 254, 0.12);
}

.circle-1 { width: 40px; height: 40px; }
.circle-2 { width: 90px; height: 90px; }
.circle-3 { width: 140px; height: 140px; }
.circle-4 {
  width: 190px;
  height: 190px;
  border-color: rgba(0, 242, 254, 0.05);
  animation: radar-pulse 3s infinite linear;
}

@keyframes radar-pulse {
  0% {
    width: 40px;
    height: 40px;
    opacity: 0.8;
  }
  100% {
    width: 220px;
    height: 220px;
    opacity: 0;
  }
}

/* 雷達十字線 */
.radar-line-h {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  background: rgba(0, 242, 254, 0.1);
}

.radar-line-v {
  position: absolute;
  left: 50%;
  top: 0;
  width: 1px;
  height: 100%;
  background: rgba(0, 242, 254, 0.1);
}

/* 旋轉的掃描線 */
.radar-sweep {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: conic-gradient(from 0deg, rgba(0, 242, 254, 0.25) 0deg, rgba(0, 242, 254, 0.05) 90deg, transparent 180deg);
  border-radius: 50%;
  transform-origin: center;
  animation: sweep-rotate 3.5s linear infinite;
  pointer-events: none;
}

@keyframes sweep-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 偵測到的閃爍目標點 */
.radar-blip {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-danger);
  box-shadow: 0 0 10px var(--color-danger);
  opacity: 0;
  animation: blip-blink 1.8s infinite ease-in-out;
}

.blip-1 {
  top: 35%;
  left: 70%;
  animation-delay: 0.2s;
}

.blip-2 {
  top: 65%;
  left: 25%;
  background: var(--color-warning);
  box-shadow: 0 0 10px var(--color-warning);
  color: #000000;
  font-size: 8px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  animation-delay: 0.9s;
}

@keyframes blip-blink {
  0%, 100% { opacity: 0; transform: scale(0.6); }
  50% { opacity: 0.8; transform: scale(1.2); }
}

/* 雷達中心進度顯示 */
.radar-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
  text-shadow: 0 0 8px rgba(0, 242, 254, 0.7);
}

.scan-percent {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-safe);
  letter-spacing: 0.5px;
}

.scan-tag {
  font-size: 0.6rem;
  color: var(--color-text-muted);
  letter-spacing: 2px;
  margin-top: 0.15rem;
}

/* 狀態面板 */
.scanning-status {
  width: 100%;
  max-width: 480px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 242, 254, 0.1);
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-size: 0.78rem;
  line-height: 1.6;
  letter-spacing: 0.5px;
  text-align: left;
}

.status-blink {
  color: var(--color-safe);
  animation: text-blink 1s steps(2, start) infinite;
}

@keyframes text-blink {
  to { visibility: hidden; }
}

@media (max-width: 480px) {
  .code-stream {
    display: none;
  }
}
</style>

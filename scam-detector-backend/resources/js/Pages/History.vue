<template>
  <CyberLayout>
    <div class="history-page">
      <!-- 頂部圖表 Bento Grid (並排兩大圖表) -->
      <section class="charts-section">
        <div class="chart-card-box cyber-card">
          <h3 class="box-title text-mono">[ THREAT_DISTRIBUTION / 詐騙類型佔比 ]</h3>
          <div class="chart-wrapper">
            <StatChart type="doughnut" :chart-data="doughnutData" />
          </div>
        </div>

        <div class="chart-card-box cyber-card">
          <h3 class="box-title text-mono">[ WEEKLY_BLOCKS_TREND / 近期攔截趨勢 ]</h3>
          <div class="chart-wrapper">
            <StatChart type="line" :chart-data="lineData" :options="lineOptions" />
          </div>
        </div>
      </section>

      <!-- 下半部：歷史日誌數據表 -->
      <section class="logs-section cyber-card">
        <div class="logs-header">
          <h3 class="box-title text-mono">[ SECURITY_SCAN_LOGS / 防衛歷史日誌 ]</h3>
          
          <!-- 篩選搜尋框 -->
          <div class="search-container">
            <span class="search-icon">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-safe); display: inline-block; vertical-align: middle;">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="搜尋歷史日誌（如：退稅、投資、網址）..."
              class="cyber-search-input"
            />
          </div>
        </div>

        <!-- 日誌表格 -->
        <div class="table-container">
          <table class="cyber-table">
            <thead>
              <tr class="text-mono">
                <th>TIME</th>
                <th>MEDIA</th>
                <th>SUMMARY / CONTENT</th>
                <th class="text-center">SCAM_IDX</th>
                <th>LEVEL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in paginatedLogs" :key="log.id" :class="'row-' + log.status">
                <td class="text-mono col-time">{{ log.date }}</td>
                <td class="col-media">
                  <span class="media-tag text-mono">{{ log.type }}</span>
                </td>
                <td class="col-content">
                  <div class="content-text" :title="log.snippet">{{ log.snippet }}</div>
                  <div class="sub-label text-mono">{{ log.type_label }}</div>
                </td>
                <td class="text-center text-mono col-score font-bold" :class="'text-' + log.status">
                  {{ log.score }}
                </td>
                <td class="col-status">
                  <span class="status-glow-label text-mono" :class="'lbl-' + log.status">
                    {{ log.status.toUpperCase() }}
                  </span>
                </td>
              </tr>
              <tr v-if="filteredLogs.length === 0">
                <td colspan="5" class="empty-row text-center text-mono">
                  [ NO_LOGS_FOUND_MATCHING_CRITERIA ]
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 科幻風分頁控制 -->
        <div v-if="totalPages > 1" class="cyber-pagination text-mono">
          <button 
            :disabled="currentPage === 1" 
            @click="currentPage--" 
            class="cyber-btn-sec"
          >
            [ PREV_PAGE ]
          </button>
          <span class="page-info">
            PAGE {{ String(currentPage).padStart(2, '0') }} / {{ String(totalPages).padStart(2, '0') }}
          </span>
          <button 
            :disabled="currentPage >= totalPages" 
            @click="currentPage++" 
            class="cyber-btn-sec"
          >
            [ NEXT_PAGE ]
          </button>
        </div>
      </section>
    </div>
  </CyberLayout>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import CyberLayout from '@/Layouts/CyberLayout.vue';
import StatChart from '@/Components/StatChart.vue';

const searchQuery = ref('');

// 歷史日誌 Mock 數據
const logsData = ref([
  { id: 1, date: '2026-05-23 15:32', type: 'TEXT', snippet: '【國稅局重要通知】您有一筆退稅金 10,000 元尚未申領，請點擊連結辦理...', score: 92, status: 'danger', type_label: '假冒政府退稅' },
  { id: 2, date: '2026-05-23 12:15', type: 'URL', snippet: '聯絡寄件異常！請進入下方貨運連結重新確認地址：http://post-tw-cargo.xyz', score: 58, status: 'warning', type_label: '疑似釣魚連結' },
  { id: 3, date: '2026-05-22 18:40', type: 'IMAGE', snippet: '【飆股推薦對話截圖】跟著李老師穩賺不賠，保證高報酬無風險，加LINE...', score: 96, status: 'danger', type_label: '假投資社群' },
  { id: 4, date: '2026-05-22 10:10', type: 'TEXT', snippet: '您好，這是明天開會的簡報網址：https://www.google.com，請查閱。', score: 8, status: 'safe', type_label: '安全通訊' },
  { id: 5, date: '2026-05-21 16:30', type: 'TEXT', snippet: '【自來水公司】提醒您，您的自來水費已逾期。請點擊連結補繳...', score: 88, status: 'danger', type_label: '假冒公用事業' },
  { id: 6, date: '2026-05-21 11:05', type: 'URL', snippet: '快來領取免費 LINE 貼圖！限時點擊：http://line-free-stickers.top', score: 65, status: 'warning', type_label: '可疑推廣連結' },
  { id: 7, date: '2026-05-20 09:20', type: 'IMAGE', snippet: '【網購客服截圖】您好，您有一筆訂單重複扣款12次，需要前往ATM解除...', score: 94, status: 'danger', type_label: '假冒客服解除扣款' },
  { id: 8, date: '2026-05-20 08:15', type: 'TEXT', snippet: '恭喜您獲得全家便利商店 1000 元禮券！請點擊連結領取...', score: 52, status: 'warning', type_label: '中獎詐騙連結' }
]);

// 篩選與排序（從近到遠，即時間降序）
const filteredLogs = computed(() => {
  let list = [...logsData.value];
  
  // 依時間從近到遠排序（降序）
  list.sort((a, b) => b.date.localeCompare(a.date));
  
  if (!searchQuery.value.trim()) return list;
  const q = searchQuery.value.toLowerCase();
  return list.filter(log => 
    log.snippet.toLowerCase().includes(q) || 
    log.type_label.toLowerCase().includes(q) ||
    log.type.toLowerCase().includes(q)
  );
});

// 分頁狀態
const currentPage = ref(1);
const itemsPerPage = ref(5);

const totalPages = computed(() => {
  const pages = Math.ceil(filteredLogs.value.length / itemsPerPage.value);
  return pages > 0 ? pages : 1;
});

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredLogs.value.slice(start, start + itemsPerPage.value);
});

// 當搜尋條件改變時重設頁碼
watch(searchQuery, () => {
  currentPage.value = 1;
});

// 圖表數據 1：圓餅分佈
const doughnutData = computed(() => {
  return {
    labels: ['假投資社群', '釣魚短連結', '假冒官方機構', '安全訊息'],
    datasets: [{
      data: [40, 25, 25, 10], // 比例
      backgroundColor: [
        '#ff0844', // danger (紅)
        '#f1c40f', // warning (黃)
        '#ae3ec9', // purple (紫)
        '#00f2fe'  // safe (青)
      ],
      borderWidth: 1,
      borderColor: '#08071e'
    }]
  };
});

// 圖表數據 2：折線趨勢
const lineData = computed(() => {
  return {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'AI 攔截詐騙次數',
      data: [12, 19, 15, 28, 22, 35, 42],
      borderColor: '#00f2fe',
      backgroundColor: 'rgba(0, 242, 254, 0.05)',
      borderWidth: 2,
      pointBackgroundColor: '#00f2fe',
      pointBorderColor: '#ffffff',
      pointHoverRadius: 6,
      fill: true,
      tension: 0.3
    }]
  };
});

const lineOptions = {
  plugins: {
    legend: {
      display: false // 折線圖不需要單獨標籤圖示
    }
  }
};
</script>

<style scoped>
.history-page {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 圖表 Bento 格 */
.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.chart-card-box {
  background: var(--bg-card);
  border: var(--glass-border);
  padding: 1.5rem;
  height: 350px;
  display: flex;
  flex-direction: column;
}

.box-title {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
  border-left: 2px solid var(--color-safe);
  padding-left: 0.5rem;
  letter-spacing: 1px;
}

.chart-wrapper {
  flex: 1;
  position: relative;
}

/* 歷史日誌 */
.logs-section {
  background: var(--bg-card);
  border: var(--glass-border);
  padding: 1.5rem;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
}

.logs-header .box-title {
  margin-bottom: 0;
}

/* 搜尋框 */
.search-container {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  padding: 0.4rem 0.75rem;
  width: 320px;
  transition: all 0.3s;
}

.search-container:focus-within {
  border-color: var(--color-safe);
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.15);
}

.search-icon {
  font-size: 0.9rem;
  margin-right: 0.5rem;
  color: var(--color-text-muted);
}

.cyber-search-input {
  background: transparent;
  border: none;
  color: var(--color-text-main);
  outline: none;
  font-size: 0.85rem;
  width: 100%;
}

/* 表格樣式 */
.table-container {
  overflow-x: auto;
}

.cyber-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.cyber-table th {
  padding: 1rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  border-bottom: 2px solid rgba(255, 255, 255, 0.08);
  letter-spacing: 1px;
}

.cyber-table td {
  padding: 1rem;
  font-size: 0.88rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  vertical-align: middle;
}

/* 行發光微調 */
.row-safe:hover { background: rgba(0, 242, 254, 0.02); }
.row-warning:hover { background: rgba(241, 196, 15, 0.02); }
.row-danger:hover { background: rgba(255, 8, 68, 0.02); }

.col-time {
  color: var(--color-text-muted);
  font-size: 0.8rem;
  width: 150px;
}

.col-media {
  width: 90px;
}

.media-tag {
  font-size: 0.65rem;
  font-weight: bold;
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-text-main);
}

.col-content {
  max-width: 400px;
}

.content-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--color-text-main);
}

.sub-label {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  margin-top: 0.15rem;
}

.col-score {
  width: 90px;
}

.text-center {
  text-align: center;
}

.font-bold {
  font-weight: bold;
}

.col-status {
  width: 120px;
}

/* 發光標籤 */
.status-glow-label {
  font-size: 0.7rem;
  font-weight: bold;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.lbl-safe {
  border: 1px solid var(--color-safe);
  color: var(--color-safe);
  background: rgba(0, 242, 254, 0.05);
  box-shadow: 0 0 5px rgba(0, 242, 254, 0.2);
}

.lbl-warning {
  border: 1px solid var(--color-warning);
  color: var(--color-warning);
  background: rgba(241, 196, 15, 0.05);
  box-shadow: 0 0 5px rgba(241, 196, 15, 0.2);
}

.lbl-danger {
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  background: rgba(255, 8, 68, 0.05);
  box-shadow: 0 0 5px rgba(255, 8, 68, 0.2);
}

.text-safe { color: var(--color-safe); }
.text-warning { color: var(--color-warning); }
.text-danger { color: var(--color-danger); }

.empty-row {
  padding: 3rem !important;
  color: var(--color-text-muted);
  font-style: italic;
}

/* 科幻風分頁控制 */
.cyber-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  margin-top: 1.5rem;
  padding-top: 1.2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.cyber-btn-sec {
  background: transparent;
  border: 1px solid var(--color-safe);
  color: var(--color-safe);
  padding: 0.4rem 1rem;
  font-family: inherit;
  font-size: 0.75rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease-in-out;
  text-shadow: 0 0 5px rgba(0, 242, 254, 0.3);
}

.cyber-btn-sec:hover:not(:disabled) {
  background: rgba(0, 242, 254, 0.1);
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.3);
}

.cyber-btn-sec:disabled {
  border-color: rgba(255, 255, 255, 0.15);
  color: var(--color-text-muted);
  cursor: not-allowed;
  text-shadow: none;
}

.page-info {
  font-size: 0.8rem;
  color: var(--color-text-main);
  letter-spacing: 1px;
}

@media (max-width: 900px) {
  .charts-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .logs-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .search-container {
    width: 100%;
  }
}
</style>

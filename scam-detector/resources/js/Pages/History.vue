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

        <div class="logs-meta-strip text-mono">
          <span>[ SORT: NEWEST_TO_OLDEST ]</span>
          <span>TOTAL {{ totalItems }}</span>
          <span v-if="totalItems > 0">SHOWING {{ visibleStart }}-{{ visibleEnd }}</span>
          <span v-if="isLoadingLogs" class="syncing-label">SYNCING_LOGS...</span>
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
              <tr v-if="isLoadingLogs">
                <td colspan="5" class="empty-row text-center text-mono">
                  [ LOADING_SECURITY_SCAN_LOGS ]
                </td>
              </tr>
              <template v-else>
                <tr v-for="log in paginatedLogs" :key="log.id" :class="'row-' + log.status">
                  <td class="text-mono col-time">{{ log.date }}</td>
                  <td class="col-media">
                    <span class="media-tag text-mono">{{ log.type }}</span>
                  </td>
                  <td class="col-content">
                    <details class="log-details">
                      <summary class="content-preview text-mono">
                        <span class="expand-prefix" aria-hidden="true"></span>
                        <span class="preview-copy">{{ log.input_text }}</span>
                      </summary>
                      <div class="full-content-block">
                        <div class="full-content-title text-mono">INPUT_CONTENT</div>
                        <p>{{ log.input_text }}</p>
                      </div>
                      <div v-if="log.snippet" class="full-content-block">
                        <div class="full-content-title text-mono">AI_SUMMARY</div>
                        <p>{{ log.snippet }}</p>
                      </div>
                    </details>
                    <div class="content-summary">{{ log.snippet }}</div>
                    <div class="sub-label text-mono">{{ log.type_label }}</div>
                    <div v-if="isAdmin && isConvertibleLog(log)" class="admin-rule-action">
                      <button
                        type="button"
                        class="rule-action-btn text-mono"
                        :disabled="convertingLogId === log.id || log.converted"
                        @click.stop="convertLogToCase(log)"
                    >
                      {{ log.converted ? '已經加入' : convertingLogId === log.id ? '加入中' : '加入防禦規則' }}
                      </button>
                      <span v-if="conversionErrors[log.id]" class="rule-action-error text-mono">
                        {{ conversionErrors[log.id] }}
                      </span>
                    </div>
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
              </template>
              <tr v-if="!isLoadingLogs && filteredLogs.length === 0">
                <td colspan="5" class="empty-row text-center text-mono">
                  {{ searchQuery ? '[ NO_LOGS_FOUND_MATCHING_CRITERIA ]' : '[ NO_SECURITY_SCAN_LOGS_YET ]' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 科幻風分頁控制 -->
        <div v-if="totalPages > 1" class="cyber-pagination text-mono">
          <button 
            :disabled="currentPage === 1" 
            @click="goToPage(currentPage - 1)" 
            class="cyber-btn-sec"
          >
            [ NEWER_LOGS ]
          </button>
          <span class="page-info">
            PAGE {{ String(currentPage).padStart(2, '0') }} / {{ String(totalPages).padStart(2, '0') }}
          </span>
          <button 
            :disabled="currentPage >= totalPages" 
            @click="goToPage(currentPage + 1)" 
            class="cyber-btn-sec"
          >
            [ OLDER_LOGS ]
          </button>
        </div>
      </section>
    </div>
  </CyberLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { usePage } from '@inertiajs/vue3';
import axios from 'axios';
import CyberLayout from '@/Layouts/CyberLayout.vue';
import StatChart from '@/Components/StatChart.vue';

const page = usePage();
const searchQuery = ref('');
const logsData = ref([]);
const convertingLogId = ref(null);
const conversionErrors = ref({});
const isAdmin = computed(() => Boolean(page.props.auth?.user?.is_admin));

// 取得或生成訪客唯一識別碼
const getVisitorId = () => {
  let uuid = localStorage.getItem('visitor_uuid');
  if (!uuid) {
    uuid = 'v-' + Math.random().toString(36).substring(2, 15) + '-' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('visitor_uuid', uuid);
  }
  return uuid;
};

// 為了相容現有 Template 的變數，將 filteredLogs 與 paginatedLogs 對接至 logsData
const filteredLogs = computed(() => logsData.value);
const paginatedLogs = computed(() => logsData.value);

// 分頁狀態
const currentPage = ref(1);
const itemsPerPage = ref(5);
const totalPages = ref(1);
const totalItems = ref(0);

const isLoadingLogs = ref(false);
const isLoadingStats = ref(false);

const visibleStart = computed(() => {
  if (totalItems.value === 0) return 0;
  return ((currentPage.value - 1) * itemsPerPage.value) + 1;
});

const visibleEnd = computed(() => {
  if (totalItems.value === 0) return 0;
  return Math.min(currentPage.value * itemsPerPage.value, totalItems.value);
});

const isConvertibleLog = (log) => ['warning', 'danger'].includes(log.status);

const goToPage = (pageNumber) => {
  if (pageNumber < 1 || pageNumber > totalPages.value || pageNumber === currentPage.value) return;
  currentPage.value = pageNumber;
};

const convertLogToCase = async (log) => {
  if (!isAdmin.value || !isConvertibleLog(log) || convertingLogId.value) return;
  if (!confirm('確定要將此高風險掃描紀錄加入防禦規則資料庫嗎？')) return;

  convertingLogId.value = log.id;
  conversionErrors.value = { ...conversionErrors.value, [log.id]: '' };

  try {
    await axios.post(`/api/scam/scans/${log.id}/case`);
    log.converted = true;
  } catch (error) {
    conversionErrors.value = {
      ...conversionErrors.value,
      [log.id]: error.response?.data?.message || 'CONVERSION_FAILED'
    };
  } finally {
    convertingLogId.value = null;
  }
};

// 日期格式化工具，格式化為 YYYY-MM-DD HH:mm
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      // 容錯機制：若解析失敗則直接傳回前 16 個字元（去 T）
      return dateStr.substring(0, 16).replace('T', ' ');
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  } catch (e) {
    return dateStr || '';
  }
};

// 載入歷史日誌
const loadHistoryLogs = async () => {
  isLoadingLogs.value = true;
  try {
    const params = {
      search: searchQuery.value || '',
      page: currentPage.value,
      per_page: itemsPerPage.value
    };

    if (!page.props.auth?.user) {
      params.visitor_id = getVisitorId();
    }

    const response = await axios.get('/api/scam/history', { params });

    if (response.data && response.data.success && response.data.data) {
      const data = response.data.data;
      const items = data.items || [];
      
      logsData.value = items.map(item => {
        let inputContent = '';
        if (item.input_type === 'text') inputContent = item.content || '';
        else if (item.input_type === 'url') inputContent = item.url || '';
        else if (item.input_type === 'image') inputContent = '[ IMAGE ] ' + (item.ocr_text || '');
        
        return {
          id: item.id,
          date: formatDate(item.created_at),
          type: (item.input_type || '').toUpperCase(),
          snippet: item.summary || '',
          input_text: inputContent || '[ No Input Content ]',
          score: typeof item.risk_score === 'number' ? item.risk_score : 0,
          status: ['safe', 'warning', 'danger'].includes(item.risk_level) ? item.risk_level : 'safe',
          type_label: item.scam_type || '',
          converted: Boolean(item.converted_to_case)
        };
      });

      if (data.pagination) {
        currentPage.value = typeof data.pagination.current_page === 'number' ? data.pagination.current_page : currentPage.value;
        itemsPerPage.value = typeof data.pagination.per_page === 'number' ? data.pagination.per_page : itemsPerPage.value;
        totalPages.value = typeof data.pagination.last_page === 'number' ? data.pagination.last_page : 1;
        totalItems.value = typeof data.pagination.total === 'number' ? data.pagination.total : 0;
      }
    } else {
      logsData.value = [];
      totalPages.value = 1;
      totalItems.value = 0;
    }
  } catch (error) {
    console.error('載入歷史日誌失敗:', error);
    logsData.value = [];
    totalPages.value = 1;
    totalItems.value = 0;
  } finally {
    isLoadingLogs.value = false;
  }
};

// 當搜尋條件改變時重設頁碼，並重新載入日誌
watch(searchQuery, () => {
  if (currentPage.value !== 1) {
    currentPage.value = 1; // 會觸發 watch(currentPage)
  } else {
    loadHistoryLogs();
  }
});

// 當頁碼改變時重新載入日誌
watch(currentPage, () => {
  loadHistoryLogs();
});

// 圖表數據 1：圓餅分佈
const doughnutData = ref({
  labels: [],
  datasets: [{
    data: [],
    backgroundColor: [
      '#ff0844', // danger (紅)
      '#f1c40f', // warning (黃)
      '#ae3ec9', // purple (紫)
      '#00f2fe', // safe (青)
      '#ff9f43', // 額外的顏色做為防呆
      '#0abde3',
      '#10ac84',
      '#5f27cd',
      '#ff6b6b'
    ],
    borderWidth: 1,
    borderColor: '#08071e'
  }]
});

// 圖表數據 2：折線趨勢
const lineData = ref({
  labels: [],
  datasets: [{
    label: 'AI 攔截詐騙次數',
    data: [],
    borderColor: '#00f2fe',
    backgroundColor: 'rgba(0, 242, 254, 0.05)',
    borderWidth: 2,
    pointBackgroundColor: '#00f2fe',
    pointBorderColor: '#ffffff',
    pointHoverRadius: 6,
    fill: true,
    tension: 0.3
  }]
});

const lineOptions = {
  plugins: {
    legend: {
      display: false
    }
  }
};

// 格式化日期為 MM/DD
const formatMD = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length >= 3) {
    return `${parts[1]}/${parts[2]}`;
  }
  return dateStr;
};

// 載入統計數據
const loadStatsData = async () => {
  isLoadingStats.value = true;
  try {
    const params = {};
    if (!page.props.auth?.user) {
      params.visitor_id = getVisitorId();
    }

    const response = await axios.get('/api/scam/stats', { params });
    if (response.data && response.data.success && response.data.data) {
      const data = response.data.data;
      
      // 更新折線圖
      if (data.weekly_trend && Array.isArray(data.weekly_trend)) {
        const sortedTrend = [...data.weekly_trend].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        lineData.value = {
          ...lineData.value,
          labels: sortedTrend.map(item => formatMD(item.date)),
          datasets: [{
            ...lineData.value.datasets[0],
            data: sortedTrend.map(item => typeof item.count === 'number' ? item.count : 0)
          }]
        };
      }

      // 更新圓餅圖
      if (data.scam_type_distribution && Array.isArray(data.scam_type_distribution)) {
        const dist = data.scam_type_distribution;
        doughnutData.value = {
          ...doughnutData.value,
          labels: dist.map(item => item.scam_type || '未分類'),
          datasets: [{
            ...doughnutData.value.datasets[0],
            data: dist.map(item => typeof item.count === 'number' ? item.count : 0)
          }]
        };
      }
    }
  } catch (error) {
    console.error('載入統計數據失敗:', error);
  } finally {
    isLoadingStats.value = false;
  }
};

onMounted(() => {
  loadHistoryLogs();
  loadStatsData();
});
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

.logs-meta-strip {
  align-items: center;
  color: var(--color-text-muted);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.72rem;
  gap: 0.6rem 1rem;
  letter-spacing: 1px;
  margin: -0.5rem 0 1rem;
}

.syncing-label {
  color: var(--color-safe);
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
  table-layout: fixed;
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
  width: 110px;
}

.col-media {
  width: 74px;
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
  min-width: 0;
  width: auto;
}

.log-details {
  color: var(--color-text-main);
}

.content-preview {
  align-items: baseline;
  color: var(--color-safe);
  cursor: pointer;
  display: flex;
  font-size: 0.8rem;
  gap: 0.45rem;
  line-height: 1.55;
  margin-bottom: 0.35rem;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  list-style: none;
}

.content-preview::marker,
.content-preview::-webkit-details-marker {
  display: none;
}

.content-preview:hover {
  text-shadow: 0 0 8px rgba(0, 242, 254, 0.25);
}

.expand-prefix::before {
  content: "+";
  color: var(--color-safe);
  font-weight: bold;
}

.log-details[open] .expand-prefix::before {
  content: "-";
}

.preview-copy {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.log-details[open] .content-preview {
  overflow: visible;
  white-space: normal;
  word-break: break-word;
}

.log-details[open] .preview-copy {
  overflow: visible;
}

.content-summary {
  color: var(--color-text-main);
  line-height: 1.55;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-details[open] + .content-summary {
  display: none;
}

.full-content-block {
  background: rgba(0, 0, 0, 0.24);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-left: 2px solid var(--color-safe);
  border-radius: 4px;
  margin: 0.55rem 0;
  padding: 0.75rem;
}

.full-content-title {
  color: var(--color-text-muted);
  font-size: 0.68rem;
  letter-spacing: 1px;
  margin-bottom: 0.35rem;
}

.full-content-block p {
  color: var(--color-text-main);
  line-height: 1.65;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.sub-label {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  margin-top: 0.15rem;
}

.admin-rule-action {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.55rem;
}

.rule-action-btn {
  background: rgba(0, 242, 254, 0.06);
  border: 1px solid rgba(0, 242, 254, 0.45);
  border-radius: 4px;
  color: var(--color-safe);
  cursor: pointer;
  font-size: 0.68rem;
  letter-spacing: 0.6px;
  padding: 0.35rem 0.55rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.rule-action-btn:hover:not(:disabled) {
  background: rgba(0, 242, 254, 0.14);
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.25);
}

.rule-action-btn:disabled {
  border-color: rgba(255, 255, 255, 0.12);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.rule-action-error {
  color: var(--color-danger);
  font-size: 0.68rem;
}

.col-score {
  width: 84px;
}

.text-center {
  text-align: center;
}

.font-bold {
  font-weight: bold;
}

.col-status {
  width: 96px;
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
  .logs-meta-strip {
    margin-top: 0;
  }
  .admin-rule-action {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

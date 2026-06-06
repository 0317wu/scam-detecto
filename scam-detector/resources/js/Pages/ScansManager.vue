<script setup>
import { Head } from '@inertiajs/vue3';
import { computed, onMounted, ref } from 'vue';
import axios from 'axios';
import CyberLayout from '@/Layouts/CyberLayout.vue';

const scans = ref({ data: [], current_page: 1, last_page: 1, total: 0 });
const loading = ref(true);
const convertingId = ref(null);
const convertedIds = ref(new Set());
const errorMessage = ref('');

const visibleStart = computed(() => {
  if (!scans.value.total) return 0;
  return ((scans.value.current_page - 1) * 15) + 1;
});

const visibleEnd = computed(() => {
  if (!scans.value.total) return 0;
  return Math.min(scans.value.current_page * 15, scans.value.total);
});

const fetchScans = async (page = 1) => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await axios.get(`/api/scam/scans?page=${page}`);
    const payload = response.data.data || {};

    scans.value = {
      data: payload.items || [],
      current_page: payload.pagination?.current_page || 1,
      last_page: payload.pagination?.last_page || 1,
      total: payload.pagination?.total || 0,
    };

    convertedIds.value = new Set((payload.items || [])
      .filter((scan) => scan.converted_to_case)
      .map((scan) => scan.id));
  } catch (error) {
    console.error('Error fetching scans:', error);
    errorMessage.value = error.response?.data?.message || 'SCAN_LOGS_LOAD_FAILED';
    scans.value = { data: [], current_page: 1, last_page: 1, total: 0 };
  } finally {
    loading.value = false;
  }
};

const convertToRule = async (scan) => {
  if (!isConvertibleScan(scan) || convertingId.value) return;
  if (!confirm('確定要將此高風險掃描紀錄加入防禦規則資料庫嗎？')) return;

  convertingId.value = scan.id;
  errorMessage.value = '';

  try {
    await axios.post(`/api/scam/scans/${scan.id}/case`);
    convertedIds.value = new Set([...convertedIds.value, scan.id]);
  } catch (error) {
    console.error('Error converting to rule:', error);
    errorMessage.value = error.response?.data?.message || 'CONVERSION_FAILED';
  } finally {
    convertingId.value = null;
  }
};

const isConvertibleScan = (scan) => ['danger', 'warning'].includes(scan.risk_level);

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const scanContent = (scan) => scan.summary || scan.content || scan.url || scan.ocr_text || '[ NO_INPUT_CONTENT ]';
const rawInput = (scan) => scan.content || scan.url || scan.ocr_text || '';

onMounted(() => {
  fetchScans();
});
</script>

<template>
  <Head title="Security Scan Logs" />

  <CyberLayout>
    <div class="scans-manager-page">
      <section class="admin-intake-panel cyber-card">
        <div class="panel-header">
          <div>
            <h2 class="panel-title text-mono">[ ADMIN_SCAN_INTAKE / 高風險收錄工作台 ]</h2>
            <p class="panel-subtitle">
              管理員可將 warning / danger 掃描紀錄一鍵轉為 ScamCase，供 Knowledge 與 fallback 靜態規則使用。
            </p>
          </div>

          <button
            type="button"
            class="cyber-btn-sec text-mono"
            :disabled="loading"
            @click="fetchScans(scans.current_page)"
          >
            [ REFRESH ]
          </button>
        </div>

        <div class="scan-meta-strip text-mono">
          <span>[ SORT: NEWEST_TO_OLDEST ]</span>
          <span>TOTAL {{ scans.total }}</span>
          <span v-if="scans.total > 0">SHOWING {{ visibleStart }}-{{ visibleEnd }}</span>
          <span v-if="loading" class="syncing-label">SYNCING_ADMIN_LOGS...</span>
          <span v-if="errorMessage" class="error-label">[ {{ errorMessage }} ]</span>
        </div>

        <div class="table-container">
          <table class="cyber-table">
            <thead>
              <tr class="text-mono">
                <th>ID</th>
                <th>MEDIA</th>
                <th>SUMMARY / CONTENT</th>
                <th>RISK</th>
                <th>TIME</th>
                <th class="text-right">ADMIN_ACTION</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="6" class="empty-row text-center text-mono">
                  [ LOADING_ADMIN_SCAN_LOGS ]
                </td>
              </tr>

              <template v-else>
                <tr v-for="scan in scans.data" :key="scan.id" :class="'row-' + scan.risk_level">
                  <td class="text-mono col-id">#{{ scan.id }}</td>
                  <td class="col-media">
                    <span class="media-tag text-mono">{{ (scan.input_type || 'text').toUpperCase() }}</span>
                  </td>
                  <td class="col-content">
                    <details class="scan-details">
                      <summary class="content-preview text-mono">
                        <span class="expand-prefix" aria-hidden="true"></span>
                        <span class="preview-copy">{{ scanContent(scan) }}</span>
                      </summary>
                      <div class="full-content-block">
                        <div class="full-content-title text-mono">INPUT_CONTENT</div>
                        <p>{{ rawInput(scan) || scanContent(scan) }}</p>
                      </div>
                      <div v-if="scan.summary" class="full-content-block">
                        <div class="full-content-title text-mono">AI_SUMMARY</div>
                        <p>{{ scan.summary }}</p>
                      </div>
                    </details>
                    <div class="sub-label text-mono">{{ scan.scam_type || '未分類' }}</div>
                  </td>
                  <td class="col-risk">
                    <span class="status-glow-label text-mono" :class="'lbl-' + scan.risk_level">
                      {{ scan.risk_level?.toUpperCase() || 'UNKNOWN' }} · {{ scan.risk_score ?? 0 }}
                    </span>
                  </td>
                  <td class="text-mono col-time">{{ formatDate(scan.created_at) }}</td>
                  <td class="col-action text-right">
                    <button
                      v-if="isConvertibleScan(scan)"
                      type="button"
                      class="rule-action-btn text-mono"
                      :disabled="convertingId === scan.id || convertedIds.has(scan.id)"
                      @click="convertToRule(scan)"
                    >
                      {{ convertedIds.has(scan.id) ? '已經加入' : convertingId === scan.id ? '加入中' : '加入防禦規則' }}
                    </button>
                    <span v-else class="safe-skip text-mono">SAFE_SKIP</span>
                  </td>
                </tr>
              </template>

              <tr v-if="!loading && scans.data.length === 0">
                <td colspan="6" class="empty-row text-center text-mono">
                  [ NO_ADMIN_SCAN_LOGS_FOUND ]
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="scans.last_page > 1" class="cyber-pagination text-mono">
          <button
            class="cyber-btn-sec"
            :disabled="scans.current_page === 1"
            @click="fetchScans(scans.current_page - 1)"
          >
            [ NEWER_LOGS ]
          </button>
          <span class="page-info">
            PAGE {{ String(scans.current_page).padStart(2, '0') }} / {{ String(scans.last_page).padStart(2, '0') }}
          </span>
          <button
            class="cyber-btn-sec"
            :disabled="scans.current_page === scans.last_page"
            @click="fetchScans(scans.current_page + 1)"
          >
            [ OLDER_LOGS ]
          </button>
        </div>
      </section>
    </div>
  </CyberLayout>
</template>

<style scoped>
.scans-manager-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin: 0 auto;
  max-width: 1200px;
}

.admin-intake-panel {
  background: var(--bg-card);
  border: var(--glass-border);
  padding: 1.5rem;
}

.panel-header {
  align-items: flex-start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.panel-title {
  border-left: 2px solid var(--color-safe);
  color: var(--color-text-muted);
  font-size: 0.82rem;
  letter-spacing: 1px;
  margin: 0 0 0.5rem;
  padding-left: 0.5rem;
}

.panel-subtitle {
  color: var(--color-text-muted);
  font-size: 0.86rem;
  line-height: 1.7;
  margin: 0;
}

.scan-meta-strip {
  align-items: center;
  color: var(--color-text-muted);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.72rem;
  gap: 0.6rem 1rem;
  letter-spacing: 1px;
  margin-bottom: 1rem;
}

.syncing-label {
  color: var(--color-safe);
}

.error-label {
  color: var(--color-danger);
}

.table-container {
  overflow-x: auto;
}

.cyber-table {
  border-collapse: collapse;
  table-layout: fixed;
  text-align: left;
  width: 100%;
}

.cyber-table th {
  border-bottom: 2px solid rgba(255, 255, 255, 0.08);
  color: var(--color-text-muted);
  font-size: 0.72rem;
  letter-spacing: 1px;
  padding: 1rem;
}

.cyber-table td {
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 0.86rem;
  padding: 1rem;
  vertical-align: middle;
}

.row-safe:hover { background: rgba(0, 242, 254, 0.02); }
.row-warning:hover { background: rgba(241, 196, 15, 0.02); }
.row-danger:hover { background: rgba(255, 8, 68, 0.02); }

.col-id {
  color: var(--color-text-muted);
  width: 72px;
}

.col-media {
  width: 80px;
}

.col-content {
  min-width: 0;
  width: auto;
}

.col-risk {
  width: 150px;
}

.col-time {
  color: var(--color-text-muted);
  width: 150px;
}

.col-action {
  width: 180px;
}

.media-tag {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  color: var(--color-text-main);
  font-size: 0.65rem;
  font-weight: bold;
  padding: 0.15rem 0.4rem;
}

.scan-details {
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
  list-style: none;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-preview::marker,
.content-preview::-webkit-details-marker {
  display: none;
}

.expand-prefix::before {
  color: var(--color-safe);
  content: "+";
  font-weight: bold;
}

.scan-details[open] .expand-prefix::before {
  content: "-";
}

.preview-copy {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scan-details[open] .content-preview {
  overflow: visible;
  white-space: normal;
  word-break: break-word;
}

.scan-details[open] .preview-copy {
  overflow: visible;
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
  color: var(--color-text-muted);
  font-size: 0.7rem;
  margin-top: 0.35rem;
}

.status-glow-label {
  border-radius: 4px;
  display: inline-block;
  font-size: 0.68rem;
  font-weight: bold;
  padding: 0.25rem 0.5rem;
}

.lbl-safe {
  background: rgba(0, 242, 254, 0.05);
  border: 1px solid var(--color-safe);
  color: var(--color-safe);
}

.lbl-warning {
  background: rgba(241, 196, 15, 0.05);
  border: 1px solid var(--color-warning);
  color: var(--color-warning);
}

.lbl-danger {
  background: rgba(255, 8, 68, 0.05);
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
}

.rule-action-btn,
.cyber-btn-sec {
  background: transparent;
  border: 1px solid var(--color-safe);
  border-radius: 4px;
  color: var(--color-safe);
  cursor: pointer;
  font-family: inherit;
  font-size: 0.68rem;
  letter-spacing: 0.6px;
  padding: 0.4rem 0.65rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.rule-action-btn:hover:not(:disabled),
.cyber-btn-sec:hover:not(:disabled) {
  background: rgba(0, 242, 254, 0.1);
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.28);
}

.rule-action-btn:disabled,
.cyber-btn-sec:disabled {
  border-color: rgba(255, 255, 255, 0.15);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.safe-skip {
  color: var(--color-text-muted);
  font-size: 0.68rem;
}

.empty-row {
  color: var(--color-text-muted);
  font-style: italic;
  padding: 3rem !important;
}

.cyber-pagination {
  align-items: center;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-top: 1.5rem;
  padding-top: 1.2rem;
}

.page-info {
  color: var(--color-text-main);
  font-size: 0.8rem;
  letter-spacing: 1px;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

@media (max-width: 760px) {
  .panel-header {
    align-items: stretch;
    flex-direction: column;
  }

  .cyber-table {
    min-width: 920px;
  }
}
</style>

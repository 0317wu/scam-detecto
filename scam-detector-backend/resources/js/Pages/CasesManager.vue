<template>
  <Head title="案例庫維護中心" />

  <CyberLayout>
    <div class="cases-manager-page">
      <!-- 頂部宣傳 Banner -->
      <header class="page-hero cyber-card">
        <div class="card-corner top-left"></div>
        <div class="card-corner top-right"></div>
        <div class="card-corner bottom-left"></div>
        <div class="card-corner bottom-right"></div>

        <div class="hero-content">
          <div>
            <h2 class="hero-title text-mono text-glow-safe">[ CASES_DATABASE_OPERATOR / 案例資料庫維護 ]</h2>
            <p class="hero-subtitle text-mono">在此對系統內建的防詐案例庫進行新增、編輯與刪除，以同步更新防禦庫與知識館。</p>
          </div>
          <button @click="openCreateModal" class="cyber-btn text-mono add-btn">
            + CREATE_NEW_CASE / 新增案例
          </button>
        </div>
      </header>

      <!-- 案例列表表格 -->
      <section class="cases-section cyber-card">
        <div class="card-corner top-left"></div>
        <div class="card-corner top-right"></div>
        <div class="card-corner bottom-left"></div>
        <div class="card-corner bottom-right"></div>

        <div v-if="isLoading" class="status-box text-mono text-glow-safe">
          [ LOADING_DATABASE ] 正在同步防詐案例資料...
        </div>

        <div v-else-if="cases.length === 0" class="status-box text-mono">
          [ EMPTY_DATABASE ] 目前案例資料庫為空。
        </div>

        <div v-else class="table-container">
          <table class="cyber-table text-mono">
            <thead>
              <tr>
                <th width="15%">TYPE / 類型</th>
                <th width="25%">TITLE / 標題</th>
                <th width="35%">DESCRIPTION / 描述</th>
                <th width="10%" class="text-center">THREAT</th>
                <th width="15%" class="text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in cases" :key="c.id" :class="'row-' + c.threat_level">
                <td>
                  <span class="type-tag">{{ c.scam_type }}</span>
                </td>
                <td class="col-title">{{ c.title }}</td>
                <td class="col-desc" :title="c.description">{{ truncate(c.description, 60) }}</td>
                <td class="text-center">
                  <span class="threat-badge" :class="'lbl-' + c.threat_level">
                    {{ c.threat_level.toUpperCase() }}
                  </span>
                </td>
                <td class="text-center actions-cell">
                  <button @click="openEditModal(c)" class="action-btn edit-btn">[ EDIT ]</button>
                  <button @click="deleteCase(c)" class="action-btn delete-btn">[ DELETE ]</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 編輯/新增案例 Modal -->
      <Modal :show="showModal" @close="closeModal" max-width="2xl">
        <div class="modal-cyber-panel text-mono">
          <div class="card-corner" :class="modalType === 'create' ? 'top-left' : 'top-left-warning'"></div>
          <div class="card-corner" :class="modalType === 'create' ? 'top-right' : 'top-right-warning'"></div>
          <div class="card-corner" :class="modalType === 'create' ? 'bottom-left' : 'bottom-left-warning'"></div>
          <div class="card-corner" :class="modalType === 'create' ? 'bottom-right' : 'bottom-right-warning'"></div>

          <h3 class="modal-title" :class="modalType === 'create' ? 'text-glow-safe' : 'text-glow-warning'">
            {{ modalType === 'create' ? '[ DATABASE / CREATE_CASE_NODE ]' : '[ DATABASE / UPDATE_CASE_NODE ]' }}
          </h3>

          <form @submit.prevent="submitForm" class="modal-form">
            <div class="form-row">
              <!-- 標題 -->
              <div class="form-group flex-1">
                <label for="title" class="cyber-label">CASE_TITLE / 案例標題</label>
                <div class="input-container">
                  <span class="input-prefix">></span>
                  <input id="title" type="text" v-model="form.title" class="cyber-input" required placeholder="如：假投資群組詐騙" />
                </div>
              </div>

              <!-- 類型 -->
              <div class="form-group flex-1">
                <label for="scam_type" class="cyber-label">SCAM_TYPE / 詐騙類型</label>
                <div class="input-container">
                  <span class="input-prefix">></span>
                  <input id="scam_type" type="text" v-model="form.scam_type" class="cyber-input" required placeholder="如：假投資" />
                </div>
              </div>
            </div>

            <div class="form-row">
              <!-- 威脅等級 -->
              <div class="form-group flex-1">
                <label for="threat_level" class="cyber-label">THREAT_LEVEL / 威脅等級</label>
                <div class="input-container">
                  <span class="input-prefix">></span>
                  <select id="threat_level" v-model="form.threat_level" class="cyber-select" required>
                    <option value="safe">SAFE (低風險)</option>
                    <option value="warning">WARNING (中風險)</option>
                    <option value="danger">DANGER (高危險)</option>
                  </select>
                </div>
              </div>

              <!-- 來源連結 -->
              <div class="form-group flex-1">
                <label for="source_url" class="cyber-label">SOURCE_URL / 來源連結</label>
                <div class="input-container">
                  <span class="input-prefix">></span>
                  <input id="source_url" type="url" v-model="form.source_url" class="cyber-input" placeholder="https://165.npa.gov.tw/..." />
                </div>
              </div>
            </div>

            <!-- 案例描述 -->
            <div class="form-group">
              <label for="description" class="cyber-label">CASE_DESCRIPTION / 案例描述</label>
              <div class="input-container">
                <span class="input-prefix">></span>
                <textarea id="description" v-model="form.description" class="cyber-textarea" required rows="3" placeholder="請輸入簡短的案例概要..."></textarea>
              </div>
            </div>

            <!-- 犯罪手法 -->
            <div class="form-group">
              <label for="method" class="cyber-label">CRIMINAL_METHOD / 核心犯罪手法剖析</label>
              <div class="input-container">
                <span class="input-prefix">></span>
                <textarea id="method" v-model="form.method" class="cyber-textarea" rows="3" placeholder="詳細分析詐騙集團的誘導與詐取手法..."></textarea>
              </div>
            </div>

            <!-- 關鍵字列表 -->
            <div class="form-group">
              <label class="cyber-label">KEYWORDS / 詐騙特徵關鍵字</label>
              <div class="tags-manager">
                <div class="tags-list">
                  <span v-for="(tag, idx) in form.keywords" :key="idx" class="tag-item">
                    #{{ tag }} <button type="button" @click="removeKeyword(idx)" class="remove-tag-btn">&times;</button>
                  </span>
                </div>
                <div class="tag-input-row">
                  <div class="input-container tag-input-container">
                    <span class="input-prefix">></span>
                    <input type="text" v-model="newKeyword" @keyup.enter.prevent="addKeyword" class="cyber-input" placeholder="輸入關鍵字後按 Enter 新增..." />
                  </div>
                  <button type="button" @click="addKeyword" class="cyber-btn-sec add-tag-btn">[ ADD ]</button>
                </div>
              </div>
            </div>

            <!-- 防範守則列表 -->
            <div class="form-group">
              <label class="cyber-label">SHIELD_RULES / 安全防禦守則</label>
              <div class="rules-manager">
                <ol class="rules-list">
                  <li v-for="(rule, idx) in form.rules" :key="idx" class="rule-item">
                    <span class="rule-num">0{{ idx + 1 }}.</span>
                    <span class="rule-text">{{ rule }}</span>
                    <button type="button" @click="removeRule(idx)" class="remove-rule-btn">[ REMOVE ]</button>
                  </li>
                </ol>
                <div class="rule-input-row">
                  <div class="input-container rule-input-container">
                    <span class="input-prefix">></span>
                    <input type="text" v-model="newRule" @keyup.enter.prevent="addRule" class="cyber-input" placeholder="輸入一條安全防禦守則..." />
                  </div>
                  <button type="button" @click="addRule" class="cyber-btn-sec add-rule-btn">[ ADD ]</button>
                </div>
              </div>
            </div>

            <!-- 彈窗控制按鈕 -->
            <div class="modal-actions">
              <button type="button" @click="closeModal" class="cyber-btn-sec">[ CANCEL / 取消 ]</button>
              <button type="submit" class="cyber-btn submit-btn" :disabled="form.processing">
                {{ modalType === 'create' ? 'EXECUTE CREATE / 執行建立' : 'EXECUTE UPDATE / 執行更新' }}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  </CyberLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Head, useForm } from '@inertiajs/vue3';
import axios from 'axios';
import CyberLayout from '@/Layouts/CyberLayout.vue';
import Modal from '@/Components/Modal.vue';

const cases = ref([]);
const isLoading = ref(true);
const showModal = ref(false);
const modalType = ref('create'); // 'create' | 'edit'
const editingCaseId = ref(null);

const newKeyword = ref('');
const newRule = ref('');

const form = useForm({
  title: '',
  description: '',
  scam_type: '',
  threat_level: 'warning',
  keywords: [],
  method: '',
  rules: [],
  source_url: '',
  is_active: true
});

// 載入所有案例
const loadCases = async () => {
  isLoading.value = true;
  try {
    const response = await axios.get('/api/scam/cases');
    cases.value = response.data?.data?.cases || [];
  } catch (error) {
    console.error('無法載入案例列表:', error);
  } finally {
    isLoading.value = false;
  }
};

// 截斷文字
const truncate = (text, length) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

// 開啟新增視窗
const openCreateModal = () => {
  modalType.value = 'create';
  editingCaseId.value = null;
  form.reset();
  form.clearErrors();
  form.keywords = [];
  form.rules = [];
  newKeyword.value = '';
  newRule.value = '';
  showModal.value = true;
};

// 開啟編輯視窗
const openEditModal = (c) => {
  modalType.value = 'edit';
  editingCaseId.value = c.id;
  form.clearErrors();
  form.title = c.title;
  form.description = c.description;
  form.scam_type = c.scam_type;
  form.threat_level = c.threat_level;
  form.keywords = Array.isArray(c.keywords) ? [...c.keywords] : [];
  form.method = c.method || '';
  form.rules = Array.isArray(c.rules) ? [...c.rules] : [];
  form.source_url = c.source_url || '';
  form.is_active = c.is_active !== false;
  newKeyword.value = '';
  newRule.value = '';
  showModal.value = true;
};

// 關閉視窗
const closeModal = () => {
  showModal.value = false;
};

// 新增關鍵字
const addKeyword = () => {
  const tag = newKeyword.value.trim();
  if (tag && !form.keywords.includes(tag)) {
    form.keywords.push(tag);
    newKeyword.value = '';
  }
};

// 移除關鍵字
const removeKeyword = (index) => {
  form.keywords.splice(index, 1);
};

// 新增防範守則
const addRule = () => {
  const r = newRule.value.trim();
  if (r && !form.rules.includes(r)) {
    form.rules.push(r);
    newRule.value = '';
  }
};

// 移除防範守則
const removeRule = (index) => {
  form.rules.splice(index, 1);
};

// 提交表單
const submitForm = async () => {
  form.clearErrors();
  try {
    if (modalType.value === 'create') {
      const response = await axios.post('/api/scam/cases', form.data());
      if (response.data?.success) {
        showModal.value = false;
        loadCases();
      }
    } else {
      const response = await axios.put(`/api/scam/cases/${editingCaseId.value}`, form.data());
      if (response.data?.success) {
        showModal.value = false;
        loadCases();
      }
    }
  } catch (error) {
    if (error.response?.data?.errors) {
      form.setError(error.response.data.errors);
    } else {
      alert('儲存案例失敗：' + (error.response?.data?.message || error.message));
    }
  }
};

// 刪除案例
const deleteCase = async (c) => {
  if (!confirm(`確定要永久刪除案例 [ ${c.title} ] 嗎？`)) {
    return;
  }
  try {
    const response = await axios.delete(`/api/scam/cases/${c.id}`);
    if (response.data?.success) {
      loadCases();
    }
  } catch (error) {
    alert('刪除案例失敗：' + (error.response?.data?.message || error.message));
  }
};

onMounted(loadCases);
</script>

<style scoped>
.cases-manager-page {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page-hero {
  background: var(--bg-card);
  border: var(--glass-border);
  padding: 2rem;
  box-shadow: var(--glow-safe);
  position: relative;
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.hero-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  letter-spacing: 1px;
}

.hero-subtitle {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.add-btn {
  padding: 0.8rem 1.5rem;
  font-size: 0.8rem;
}

.cases-section {
  background: var(--bg-card);
  border: var(--glass-border);
  padding: 1.5rem;
  position: relative;
}

.status-box {
  padding: 3rem 0;
  text-align: center;
  color: var(--color-text-muted);
}

.table-container {
  overflow-x: auto;
}

.cyber-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.cyber-table th, .cyber-table td {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.85rem;
}

.cyber-table th {
  color: var(--color-safe);
  font-weight: bold;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(0, 242, 254, 0.2);
}

.cyber-table tbody tr {
  transition: all 0.2s;
}

.cyber-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

.col-title {
  font-weight: bold;
  color: var(--color-text-main);
}

.col-desc {
  color: var(--color-text-muted);
}

.type-tag {
  background: rgba(0, 242, 254, 0.08);
  border: 1px solid rgba(0, 242, 254, 0.2);
  color: var(--color-safe);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

/* 威脅標籤顏色 */
.threat-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}
.lbl-safe {
  background: rgba(0, 242, 254, 0.1);
  color: var(--color-safe);
  border: 1px solid var(--color-safe);
  box-shadow: 0 0 5px rgba(0, 242, 254, 0.2);
}
.lbl-warning {
  background: rgba(241, 196, 15, 0.1);
  color: var(--color-warning);
  border: 1px solid var(--color-warning);
  box-shadow: 0 0 5px rgba(241, 196, 15, 0.2);
}
.lbl-danger {
  background: rgba(255, 8, 68, 0.1);
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
  box-shadow: 0 0 5px rgba(255, 8, 68, 0.2);
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.action-btn {
  background: transparent;
  border: none;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.edit-btn {
  color: var(--color-warning);
}
.edit-btn:hover {
  text-shadow: var(--glow-warning);
  color: #ffffff;
}
.delete-btn {
  color: var(--color-danger);
}
.delete-btn:hover {
  text-shadow: var(--glow-danger);
  color: #ffffff;
}

/* Modal 樣式 */
.modal-cyber-panel {
  background: #08071e;
  border: 1px solid rgba(0, 242, 254, 0.25);
  box-shadow: var(--glow-safe);
  padding: 2rem;
  border-radius: 8px;
  position: relative;
  color: var(--color-text-main);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  letter-spacing: 1px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-row {
  display: flex;
  gap: 1.5rem;
}

.flex-1 {
  flex: 1;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cyber-label {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.input-container {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s;
}

.input-container:focus-within {
  border-color: var(--color-safe);
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.15);
}

.input-prefix {
  padding-left: 1rem;
  color: var(--color-safe);
  font-weight: bold;
}

.cyber-input, .cyber-select, .cyber-textarea {
  background: transparent;
  border: none;
  color: var(--color-text-main);
  padding: 0.7rem 1rem 0.7rem 0.5rem;
  width: 100%;
  outline: none;
  font-size: 0.85rem;
  font-family: inherit;
}

.cyber-select {
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg fill='white' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 30px;
  color: var(--color-text-main);
}

.cyber-select option {
  background: #08071e;
  color: var(--color-text-main);
}

.cyber-textarea {
  resize: vertical;
}

/* 標籤管理 */
.tags-manager, .rules-manager {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-item {
  background: rgba(0, 242, 254, 0.08);
  border: 1px solid rgba(0, 242, 254, 0.25);
  color: var(--color-safe);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.remove-tag-btn {
  background: transparent;
  border: none;
  color: var(--color-danger);
  font-weight: bold;
  cursor: pointer;
  padding: 0;
  font-size: 10px;
}

.tag-input-row, .rule-input-row {
  display: flex;
  gap: 0.75rem;
}

.tag-input-container, .rule-input-container {
  flex: 1;
}

.cyber-btn-sec {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: var(--color-text-muted);
  padding: 0.6rem 1.25rem;
  font-size: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
}

.cyber-btn-sec:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: #ffffff;
}

/* 規則管理 */
.rules-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  list-style: none;
}

.rule-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.rule-num {
  color: var(--color-safe);
  font-weight: bold;
}

.rule-text {
  flex: 1;
  color: var(--color-text-main);
}

.remove-rule-btn {
  background: transparent;
  border: none;
  color: var(--color-danger);
  font-size: 0.7rem;
  cursor: pointer;
}

.remove-rule-btn:hover {
  text-shadow: var(--glow-danger);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.submit-btn {
  min-width: 150px;
  padding: 0.65rem 1.5rem;
  font-size: 0.75rem;
}

/* 幾何四角裝飾 */
.card-corner {
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: var(--color-safe);
  border-style: solid;
  pointer-events: none;
}
.top-left { top: 8px; left: 8px; border-width: 1.5px 0 0 1.5px; }
.top-right { top: 8px; right: 8px; border-width: 1.5px 1.5px 0 0; }
.bottom-left { bottom: 8px; left: 8px; border-width: 0 0 1.5px 1.5px; }
.bottom-right { bottom: 8px; right: 8px; border-width: 0 1.5px 1.5px 0; }

.top-left-warning { top: 8px; left: 8px; border-width: 1.5px 0 0 1.5px; border-color: var(--color-warning); }
.top-right-warning { top: 8px; right: 8px; border-width: 1.5px 1.5px 0 0; border-color: var(--color-warning); }
.bottom-left-warning { bottom: 8px; left: 8px; border-width: 0 0 1.5px 1.5px; border-color: var(--color-warning); }
.bottom-right-warning { bottom: 8px; right: 8px; border-width: 0 1.5px 1.5px 0; border-color: var(--color-warning); }
</style>

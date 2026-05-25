<template>
  <div class="scanner-card cyber-card" :class="{ 'shake-active': isShaking }">
    <!-- 頁籤切換 -->
    <div class="scanner-tabs">
      <button 
        type="button" 
        class="tab-btn text-mono" 
        :class="{ active: activeTab === 'text' }"
        @click="switchTab('text')"
      >
        [ 文字辨識 ]
      </button>
      <button 
        type="button" 
        class="tab-btn text-mono" 
        :class="{ active: activeTab === 'url' }"
        @click="switchTab('url')"
      >
        [ 網址安全 ]
      </button>
      <button 
        type="button" 
        class="tab-btn text-mono" 
        :class="{ active: activeTab === 'image' }"
        @click="switchTab('image')"
      >
        [ 截圖分析 ]
      </button>
    </div>

    <!-- 輸入區主體 -->
    <div class="scanner-body">
      <!-- 文字輸入分頁 -->
      <div v-show="activeTab === 'text'" class="input-wrapper">
        <textarea 
          v-model="textInput" 
          placeholder="請將可疑的簡訊、LINE 訊息或社群貼文內容貼在此處進行 AI 分析..."
          class="cyber-input cyber-textarea"
          :class="{ 'border-danger': errorMsg }"
          @input="clearError"
        ></textarea>
      </div>

      <!-- 網址輸入分頁 -->
      <div v-show="activeTab === 'url'" class="input-wrapper">
        <div class="url-input-container">
          <span class="url-prefix text-mono">URL://</span>
          <input 
            type="text" 
            v-model="urlInput"
            placeholder="請輸入可疑的網址（例如：http://gov.tw-scam.xyz）..."
            class="cyber-input url-field"
            :class="{ 'border-danger': errorMsg }"
            @input="clearError"
          />
        </div>
      </div>

      <!-- 圖片拖曳上傳分頁 -->
      <div v-show="activeTab === 'image'" class="input-wrapper">
        <div 
          class="drag-drop-zone"
          :class="{ 'drag-over': isDragging, 'has-file': imagePreview, 'border-danger': errorMsg }"
          @dragover.prevent="onDragOver"
          @dragleave="onDragLeave"
          @drop.prevent="onDrop"
          @click="triggerFileInput"
        >
          <input 
            type="file" 
            ref="fileInput" 
            class="hidden-file-input" 
            accept="image/*"
            @change="onFileSelected"
          />
          
          <div v-if="!imagePreview" class="drag-placeholder">
            <span class="drag-icon">
              <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-safe); filter: drop-shadow(0 0 5px rgba(0, 242, 254, 0.4)); margin-bottom: 8px;">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </span>
            <p class="drag-text">將對話截圖拖曳至此處，或點擊以瀏覽檔案</p>
            <p class="drag-tip text-mono">SUPPORTED: PNG, JPG, WEBP (MAX 5MB)</p>
          </div>

          <div v-else class="image-preview-container" @click.stop>
            <img :src="imagePreview" alt="詐騙對話截圖預覽" class="preview-img" />
            <button type="button" class="remove-img-btn" @click="clearImage">
              ✕ 移除檔案
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 錯誤顯示區 -->
    <div v-if="errorMsg" class="error-panel text-mono text-glow-danger">
      [SYSTEM ERROR]: {{ errorMsg }}
    </div>

    <!-- 底部操作按鈕 -->
    <div class="scanner-footer">
      <button 
        type="button" 
        class="cyber-btn analyze-btn" 
        :disabled="isSubmitDisabled"
        @click="initializeScan"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="currentColor" style="margin-right: 8px; display: inline-block; vertical-align: middle;">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        INITIALIZE SCAN
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const emit = defineEmits(['start-scan']);

const activeTab = ref('text');
const textInput = ref('');
const urlInput = ref('');
const imageFile = ref(null);
const imagePreview = ref('');
const fileInput = ref(null);

const isDragging = ref(false);
const isShaking = ref(false);
const errorMsg = ref('');

// 判斷按鈕是否休眠
const isSubmitDisabled = computed(() => {
  if (activeTab.value === 'text' && !textInput.value.trim()) return true;
  if (activeTab.value === 'url' && !urlInput.value.trim()) return true;
  if (activeTab.value === 'image' && !imagePreview.value) return true;
  return false;
});

const switchTab = (tab) => {
  activeTab.value = tab;
  clearError();
};

const clearError = () => {
  errorMsg.value = '';
};

// 觸發抖動動畫
const triggerShake = (msg) => {
  errorMsg.value = msg;
  isShaking.value = true;
  setTimeout(() => {
    isShaking.value = false;
  }, 800);
};

// 圖片選擇與上傳邏輯
const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFile = (file) => {
  clearError();
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    triggerShake('圖像辨識組件僅支援 PNG/JPG/WEBP 格式。');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    triggerShake('影像檔案超出 5MB 限制，請壓縮後重試。');
    return;
  }

  imageFile.value = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

const onFileSelected = (e) => {
  const file = e.target.files[0];
  handleFile(file);
};

const onDragOver = () => {
  isDragging.value = true;
};

const onDragLeave = () => {
  isDragging.value = false;
};

const onDrop = (e) => {
  isDragging.value = false;
  const file = e.dataTransfer.files[0];
  handleFile(file);
};

const clearImage = () => {
  imageFile.value = null;
  imagePreview.value = '';
  if (fileInput.value) fileInput.value.value = '';
  clearError();
};

// 啟動分析
const initializeScan = () => {
  clearError();
  let payload = { type: activeTab.value, content: '' };

  if (activeTab.value === 'text') {
    if (!textInput.value.trim()) {
      triggerShake('未偵測到可分析之文字資料。');
      return;
    }
    payload.content = textInput.value;
  } else if (activeTab.value === 'url') {
    if (!urlInput.value.trim()) {
      triggerShake('未偵測到可分析之網址資料。');
      return;
    }
    // 簡易網址驗證
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
    if (!urlPattern.test(urlInput.value)) {
      triggerShake('網址結構異常，可能無法取得伺服器響應。');
      return;
    }
    payload.content = normalizeUrl(urlInput.value);
  } else if (activeTab.value === 'image') {
    if (!imagePreview.value) {
      triggerShake('未偵測到可分析之圖像資料。');
      return;
    }
    payload.content = imagePreview.value; // 傳送 Base64
    payload.imageFile = imageFile.value; // 傳送真實檔案物件
    payload.file = imageFile.value; // 備用欄位
  }

  emit('start-scan', payload);
};

const normalizeUrl = (value) => {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};
</script>

<style scoped>
.scanner-card {
  width: 100%;
  border-radius: 12px;
  background: var(--bg-card);
  border: var(--glass-border);
  padding: 1.5rem;
  transition: all 0.3s ease;
}

/* 震動動畫樣式 */
.shake-active {
  animation: shake 0.6s ease-in-out;
  border-color: var(--color-danger) !important;
  box-shadow: var(--glow-danger) !important;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
  20%, 40%, 60%, 80% { transform: translateX(6px); }
}

/* 頁籤切換 */
.scanner-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 0.75rem;
}

.tab-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  transition: all 0.3s;
  border-radius: 4px;
}

.tab-btn:hover {
  color: var(--color-safe);
  text-shadow: 0 0 5px rgba(0, 242, 254, 0.3);
}

.tab-btn.active {
  color: var(--color-safe);
  text-shadow: 0 0 8px rgba(0, 242, 254, 0.6);
  background: rgba(0, 242, 254, 0.06);
  border: 1px solid rgba(0, 242, 254, 0.15);
}

/* 輸入框主體 */
.scanner-body {
  margin-bottom: 1.5rem;
}

.cyber-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--color-text-main);
  border-radius: 6px;
  padding: 1rem;
  outline: none;
  font-size: 0.95rem;
  transition: all 0.3s;
}

.cyber-input:focus {
  border-color: var(--color-safe);
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.15);
}

.cyber-textarea {
  min-height: 180px;
  resize: vertical;
  line-height: 1.6;
}

/* 網址輸入框 */
.url-input-container {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.3s;
}

.url-input-container:focus-within {
  border-color: var(--color-safe);
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.15);
}

.url-prefix {
  padding: 0 1rem;
  color: var(--color-safe);
  font-weight: bold;
  letter-spacing: 1px;
}

.url-field {
  border: none;
  background: transparent;
  padding: 1rem 1rem 1rem 0;
  width: 100%;
}

.url-field:focus {
  border: none;
  box-shadow: none;
}

/* 圖片拖曳上傳 */
.drag-drop-zone {
  width: 100%;
  min-height: 180px;
  border: 1.5px dashed rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.drag-drop-zone:hover, .drag-drop-zone.drag-over {
  border-color: var(--color-safe);
  background: rgba(0, 242, 254, 0.03);
}

.drag-placeholder {
  text-align: center;
  padding: 2rem;
}

.drag-icon {
  font-size: 2.2rem;
  display: block;
  margin-bottom: 0.75rem;
}

.drag-text {
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  color: var(--color-text-main);
}

.drag-tip {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.hidden-file-input {
  display: none;
}

.image-preview-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
}

.preview-img {
  max-height: 200px;
  max-width: 100%;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;
}

.remove-img-btn {
  background: rgba(255, 8, 68, 0.1);
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  padding: 0.4rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.3s;
}

.remove-img-btn:hover {
  background: var(--color-danger);
  color: white;
}

/* 邊框警告顏色 */
.border-danger {
  border-color: var(--color-danger) !important;
}

/* 錯誤顯示面板 */
.error-panel {
  background: rgba(255, 8, 68, 0.08);
  border: 1px solid rgba(255, 8, 68, 0.2);
  border-radius: 4px;
  padding: 0.75rem 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
}

/* 底部按鈕 */
.scanner-footer {
  display: flex;
  justify-content: flex-end;
}

.analyze-btn {
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
}
</style>

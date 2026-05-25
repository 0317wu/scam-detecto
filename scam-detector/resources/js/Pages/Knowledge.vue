<template>
  <CyberLayout>
    <div class="knowledge-page">
      <!-- 頂部宣傳 Banner -->
      <header class="knowledge-hero cyber-card text-center">
        <h2 class="hero-title text-mono text-glow-safe">[ AI_DEFENSE_ARCHIVES / 防詐防禦資料庫 ]</h2>
        <p class="hero-subtitle text-mono">收錄最新詐騙案例與解碼剖析，幫助您在資訊迷霧中建構安全防禦盾牌。</p>
      </header>

      <!-- 文章卡片列表 -->
      <section class="archives-grid">
        <div v-if="isLoading" class="archive-status cyber-card text-mono">
          [ LOADING_ARCHIVES ] 正在同步後端詐騙案例資料...
        </div>

        <div v-else-if="loadError" class="archive-status cyber-card text-mono status-error">
          [ ARCHIVE_SYNC_FAILED ] {{ loadError }}
        </div>

        <div v-else-if="articles.length === 0" class="archive-status cyber-card text-mono">
          [ NO_ARCHIVES_AVAILABLE ] 目前後端尚未建立公開案例。
        </div>

        <article 
          v-for="article in articles" 
          :key="article.id" 
          class="archive-card cyber-card"
          :class="{ expanded: expandedId === article.id }"
          @click="toggleExpand(article.id)"
          tabindex="0"
          @keydown.enter="toggleExpand(article.id)"
          :aria-expanded="expandedId === article.id"
        >
          <div class="archive-header">
            <div class="header-main">
              <!-- 狀態指示呼吸燈 -->
              <span class="threat-dot" :class="'threat-' + article.threat"></span>
              <div class="title-group">
                <span class="archive-code text-mono text-glow-safe">ARCHIVE_{{ article.archiveCode }} //</span>
                <h3 class="archive-title">{{ article.title }}</h3>
              </div>
            </div>
            
            <div class="header-aside text-mono">
              <span class="threat-label">THREAT_LEVEL:</span>
              <span class="threat-value" :class="'text-' + article.threat">{{ article.threat.toUpperCase() }}</span>
              <span class="expand-icon">{{ expandedId === article.id ? '▲' : '▼' }}</span>
            </div>
          </div>

          <p class="archive-summary">{{ article.summary }}</p>

          <!-- 展開的詳細剖析 -->
          <div v-show="expandedId === article.id" class="archive-details" @click.stop>
            <div class="details-divider"></div>
            
            <!-- 核心犯罪手法 -->
            <div class="detail-section">
              <h4 class="detail-subtitle text-mono">[ CORE_METHOD / 核心犯罪手法 ]</h4>
              <p class="detail-desc">{{ article.method }}</p>
            </div>

            <!-- 關鍵字防守眼 -->
            <div class="detail-section">
              <h4 class="detail-subtitle text-mono">[ SCAM_KEYWORDS / 詐騙關鍵字 ]</h4>
              <div class="keyword-tags text-mono">
                <span v-for="(kw, idx) in article.keywords" :key="idx" class="kw-tag">
                  #{{ kw }}
                </span>
              </div>
            </div>

            <!-- 防範守則 -->
            <div class="detail-section">
              <h4 class="detail-subtitle text-mono text-glow-safe">[ SHIELD_RULES / 安全防禦守則 ]</h4>
              <ul class="rule-list">
                <li v-for="(rule, idx) in article.rules" :key="idx" class="rule-item">
                  <span class="rule-num text-mono">0{{ idx + 1 }}.</span> {{ rule }}
                </li>
              </ul>
            </div>

            <a
              v-if="article.sourceUrl"
              :href="article.sourceUrl"
              class="source-link text-mono"
              target="_blank"
              rel="noopener noreferrer"
            >
              [ SOURCE_TRACE ] 查看來源
            </a>
          </div>
        </article>
      </section>
    </div>
  </CyberLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import axios from 'axios';
import CyberLayout from '@/Layouts/CyberLayout.vue';

const expandedId = ref(null);
const articles = ref([]);
const isLoading = ref(true);
const loadError = ref('');

const toggleExpand = (id) => {
  if (expandedId.value === id) {
    expandedId.value = null;
  } else {
    expandedId.value = id;
  }
};

const toArchiveArticle = (item, index) => {
  return {
    id: item.id,
    archiveCode: String(index + 1).padStart(2, '0'),
    title: item.title,
    summary: item.description,
    threat: item.threat_level || 'warning',
    keywords: item.keywords || [],
    method: item.method || '後端尚未提供此案例的詳細手法說明。',
    rules: item.rules || [],
    sourceUrl: item.source_url,
    createdAt: item.created_at,
  };
};

const loadCases = async () => {
  isLoading.value = true;
  loadError.value = '';

  try {
    const response = await axios.get('/api/scam/cases');
    const cases = response.data?.data?.cases ?? [];
    articles.value = cases.map(toArchiveArticle);
  } catch (error) {
    console.error('Failed to load scam cases', error);
    loadError.value = '無法取得後端案例資料，請確認 Laravel API 服務是否正常。';
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadCases);
</script>

<style scoped>
.knowledge-page {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Hero Section */
.knowledge-hero {
  background: var(--bg-card);
  border: var(--glass-border);
  padding: 2.5rem 1.5rem;
  box-shadow: var(--glow-safe);
}

.hero-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.hero-subtitle {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  letter-spacing: 0.5px;
}

/* 卡片列表 */
.archives-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.archive-status {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.status-error {
  color: var(--color-danger);
}

.archive-card {
  cursor: pointer;
  outline: none;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.archive-card:focus-visible {
  outline: 2px solid var(--color-safe);
  outline-offset: 4px;
}

/* 卡片頭部 */
.archive-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.archive-code {
  font-weight: bold;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}

.archive-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text-main);
}

.header-aside {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.threat-label {
  letter-spacing: 0.5px;
}

.threat-value {
  font-weight: bold;
}

.expand-icon {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  margin-left: 0.5rem;
}

/* 呼吸燈指示點 */
.threat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.threat-danger {
  background: var(--color-danger);
  box-shadow: 0 0 8px var(--color-danger);
  animation: dot-pulse 1.5s infinite alternate;
}

.threat-warning {
  background: var(--color-warning);
  box-shadow: 0 0 8px var(--color-warning);
  animation: dot-pulse 1.8s infinite alternate;
}

@keyframes dot-pulse {
  from { opacity: 0.4; }
  to { opacity: 1; }
}

/* 文章摘要 */
.archive-summary {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-left: 1.25rem;
  transition: color 0.3s;
}

.archive-card:hover .archive-summary {
  color: var(--color-text-main);
}

/* 展開詳細內容 */
.archive-details {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  animation: slide-down 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.details-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
  width: 100%;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-subtitle {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  font-weight: 600;
  letter-spacing: 1px;
}

.detail-desc {
  font-size: 0.88rem;
  color: var(--color-text-muted);
  line-height: 1.6;
}

/* 關鍵字標籤 */
.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.kw-tag {
  font-size: 0.7rem;
  color: var(--color-warning);
  background: rgba(241, 196, 15, 0.06);
  border: 1px solid rgba(241, 196, 15, 0.15);
  padding: 0.15rem 0.5rem;
  border-radius: 3px;
  text-shadow: 0 0 5px rgba(241, 196, 15, 0.15);
}

/* 安全守則 */
.rule-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.rule-item {
  font-size: 0.88rem;
  color: var(--color-text-main);
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.rule-num {
  color: var(--color-safe);
  font-weight: bold;
}

.source-link {
  align-self: flex-start;
  color: var(--color-safe);
  font-size: 0.75rem;
  text-decoration: none;
  letter-spacing: 0.6px;
}

.source-link:hover {
  text-shadow: 0 0 8px rgba(0, 242, 254, 0.4);
}

/* 狀態色 */
.text-danger { color: var(--color-danger); text-shadow: 0 0 5px rgba(255, 8, 68, 0.3); }
.text-warning { color: var(--color-warning); text-shadow: 0 0 5px rgba(241, 196, 15, 0.3); }

/* 當卡片展開時的視覺微調 */
.archive-card.expanded {
  border-color: rgba(0, 242, 254, 0.25);
  background: var(--bg-card-hover);
  box-shadow: var(--glow-safe);
}

@media (max-width: 600px) {
  .archive-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .header-aside {
    width: 100%;
    justify-content: space-between;
  }
  .archive-summary {
    margin-left: 0;
  }
}
</style>

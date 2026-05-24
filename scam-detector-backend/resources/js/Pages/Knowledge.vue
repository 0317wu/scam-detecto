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
                <span class="archive-code text-mono text-glow-safe">ARCHIVE_0{{ article.id }} //</span>
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
          </div>
        </article>
      </section>
    </div>
  </CyberLayout>
</template>

<script setup>
import { ref } from 'vue';
import CyberLayout from '@/Layouts/CyberLayout.vue';

const expandedId = ref(null);

const toggleExpand = (id) => {
  if (expandedId.value === id) {
    expandedId.value = null;
  } else {
    expandedId.value = id;
  }
};

// 詐騙文章 Mock 數據
const articles = ref([
  {
    id: 1,
    title: '假冒政府機關退稅簡訊',
    summary: '歹徒發送簡訊假冒國稅局或監理所，宣稱有退稅款未領或罰金未繳，引導點擊可疑短網頁輸入卡號。',
    threat: 'danger',
    keywords: ['退稅領取', '國稅局', '監理所', '逾期未繳', '補繳費'],
    method: '利用民眾貪小便宜或害怕受罰的心理，發送急迫性的字眼（如即將逾期、最後通知），並附上高仿真的虛假網址。使用者點擊後會進入要求輸入身分證號、信用卡資訊的釣魚表單，進而盜刷信用卡或竊取個資。',
    rules: [
      '政府機關的官方域名必以「.gov.tw」結尾，絕不會使用 .xyz, .top 等異常域名。',
      '政府退稅或繳費均有法定通知流程，絕不會透過「簡訊」發送點擊連結直接辦理。',
      '如有疑慮，請撥打「165」專線，或至該機關官方入口網站查詢，切勿直接從簡訊連結進入。'
    ]
  },
  {
    id: 2,
    title: '飆股推薦與名師投資群組',
    summary: '以社群廣告或私訊，假借財經專家名義推薦飆股、保證獲利，誘導加入 LINE 私密群組進行殺豬盤詐騙。',
    threat: 'danger',
    keywords: ['穩賺不賠', '飆股推薦', '限時免費', '加LINE明牌', '代操盤'],
    method: '詐騙集團在 FB 或 YouTube 投放廣告，假冒如曹興誠、謝金河等名人。將受害者拉進 LINE 群組後，由「助理」或「老師」每日分析行情、報明牌。隨後指引受害者下載假的投資 APP。初期故意讓受害者小額獲利出金以獲取信任，等投入巨額資金後，便以申報稅金、操作失誤等名義拒絕出金，甚至直接封鎖群組。',
    rules: [
      '所有標榜「保證獲利」、「穩賺不賠」、「高回報無風險」的投資管道 100% 均為詐騙。',
      '請勿下載任何非官方 App Store / Google Play 商店的虛假投資 APP，其數據均可由後台修改。',
      '理財請尋求金管會核准的合法券商，切勿聽信 LINE 群組內所謂「投顧名師」的私人操作指引。'
    ]
  },
  {
    id: 3,
    title: '物流快遞包裹異常通知',
    summary: '假冒中華郵政、黑貓宅急便等，以簡訊宣稱包裹寄送失敗，要求點擊連結重新確認配送資訊或支付資費。',
    threat: 'warning',
    keywords: ['包裹寄送失敗', '重新確認地址', '補繳運費', '中華郵政', '黑貓宅急便'],
    method: '此為典型釣魚手段，利用網購盛行民眾常有包裹的習慣。點擊簡訊內的縮網址後，會被引導至高仿真的快遞網站，頁面提示需要輸入信用卡資訊補繳幾十元的「超重費」或「重配費」。一旦輸入卡號與簡訊驗證碼 (OTP)，歹徒便在後台綁定 Apple Pay 等進行大額盜刷。',
    rules: [
      '收到包裹異常簡訊，請先查核您是否有網購寄送中的包裹。',
      '快遞公司通常會直接撥打電話聯繫，絕不會發送簡訊連結要求線上刷卡繳交微額差價。',
      '若點擊進入網頁，在未經確認前，請勿隨意填寫並送出信用卡 OTP 簡訊驗證碼。'
    ]
  },
  {
    id: 4,
    title: '解除分期付款設定陷阱',
    summary: '假冒電商客服來電，謊稱因為系統出錯或實習生設定錯誤，導致扣款重複，要求至 ATM 或網銀解除設定。',
    threat: 'danger',
    keywords: ['重複扣款', '自動扣款', '解除設定', 'ATM操作', '實習生錯誤'],
    method: '詐騙集團透過不法管道取得民眾的電商消費紀錄，假冒該電商客服或銀行人員致電。宣稱因為系統設定錯誤，會每月自動從信用卡重複扣款。受害者慌張之下，歹徒便佯稱要引導其前往 ATM 或登入網路銀行執行「解除設定」，實則是引導受害者執行「轉帳匯款」程序，將資金匯至人頭帳戶。',
    rules: [
      'ATM 與網路銀行僅有「提款」與「匯出」功能，絕對沒有任何「解除重複扣款」或「身份驗證」的功能。',
      '凡來電號碼開頭有「+886」或「+」者，均為境外竄改來電，請直接掛斷。',
      '接獲此類客服電話，請主動掛斷，並撥打該電商官網提供的官方客服電話或 165 求證。'
    ]
  }
]);
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

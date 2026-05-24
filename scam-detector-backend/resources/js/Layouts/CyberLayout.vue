<template>
  <div class="cyber-container">
    <!-- 背景裝飾 -->
    <div class="cyber-grid"></div>
    <div class="cyber-bg-glow"></div>
    <div class="cyber-bg-glow-2"></div>

    <!-- 頂部防禦儀表條 -->
    <header class="cyber-header">
      <div class="header-logo">
        <span class="logo-bracket">[</span>
        <span class="logo-text text-mono text-glow-safe">AI SHIELD SCANNER</span>
        <span class="logo-bracket">]</span>
      </div>
      
      <div class="header-status-panel text-mono">
        <div class="status-item">
          <span class="status-label">SYS_STATUS:</span>
          <span class="status-val text-glow-safe">ONLINE</span>
        </div>
        <div class="status-divider">|</div>
        <div class="status-item">
          <span class="status-label">DEFENSE_CORE:</span>
          <span class="status-val text-glow-safe">100% SECURE</span>
        </div>
        <div class="status-divider">|</div>
        <div class="status-item clock-container">
          <span class="clock-time">{{ currentTime }}</span>
        </div>
      </div>
    </header>

    <div class="cyber-main-wrapper">
      <!-- 導航側邊欄 -->
      <nav class="cyber-sidebar">
        <div class="sidebar-links">
          <Link 
            href="/" 
            class="nav-btn text-mono" 
            :class="{ active: $page.url === '/' || $page.url === '/dashboard' }"
          >
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <circle cx="12" cy="12" r="4"></circle>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
            </span>
            <span class="nav-text">ANALYZER</span>
          </Link>
          
          <Link 
            href="/history" 
            class="nav-btn text-mono" 
            :class="{ active: $page.url.startsWith('/history') }"
          >
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </span>
            <span class="nav-text">HISTORY</span>
          </Link>
          
          <Link 
            href="/knowledge" 
            class="nav-btn text-mono" 
            :class="{ active: $page.url.startsWith('/knowledge') }"
          >
            <span class="nav-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </span>
            <span class="nav-text">ARCHIVES</span>
          </Link>
        </div>

        <div class="sidebar-auth-panel text-mono">
          <!-- 已登入 -->
          <div v-if="$page.props.auth && $page.props.auth.user" class="auth-logged-in">
            <span class="auth-title">OPERATOR:</span>
            <span class="auth-user-name text-glow-safe">{{ $page.props.auth.user.name }}</span>
            <Link 
              href="/logout" 
              method="post" 
              as="button" 
              class="cyber-auth-btn logout-btn"
            >
              [ DISCONNECT ]
            </Link>
          </div>
          <!-- 未登入 -->
          <div v-else class="auth-logged-out">
            <span class="auth-title">CORE: OFFLINE</span>
            <div class="auth-btn-group">
              <Link href="/login" class="cyber-auth-btn login-btn">[ LOGIN ]</Link>
              <Link href="/register" class="cyber-auth-btn reg-btn">[ REGISTER ]</Link>
            </div>
          </div>
        </div>


      </nav>

      <!-- 主要內容區域 -->
      <main class="cyber-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { Link } from '@inertiajs/vue3';
import { ref, onMounted, onUnmounted } from 'vue';

const currentTime = ref('');
let timer = null;

const updateTime = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  currentTime.value = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

onMounted(() => {
  updateTime();
  timer = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.cyber-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
  z-index: 1;
}

/* 頂部 Header 樣式 */
.cyber-header {
  height: 60px;
  background: rgba(8, 7, 30, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 242, 254, 0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.logo-bracket {
  color: rgba(0, 242, 254, 0.4);
  font-size: 1.4rem;
  font-weight: 300;
}

.logo-text {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 2px;
  margin: 0 0.5rem;
}

.header-status-panel {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-val {
  font-weight: bold;
}

.status-divider {
  margin: 0 1rem;
  color: rgba(255, 255, 255, 0.1);
}

.clock-time {
  color: var(--color-safe);
  font-size: 0.9rem;
  font-weight: 600;
  text-shadow: 0 0 5px rgba(0, 242, 254, 0.3);
}

/* 主要佈局 */
.cyber-main-wrapper {
  display: flex;
  flex: 1;
  position: relative;
}

/* 側邊導航欄 */
.cyber-sidebar {
  width: 240px;
  background: rgba(5, 3, 20, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2rem 1rem;
  position: sticky;
  top: 60px;
  height: calc(100vh - 60px);
  z-index: 5;
}

.sidebar-links {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-decoration: none;
  color: var(--color-text-muted);
  padding: 0.85rem 1.25rem;
  border-radius: 6px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.nav-btn::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: var(--color-safe);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.nav-btn:hover {
  color: #ffffff;
  background: rgba(0, 242, 254, 0.05);
  border-color: rgba(0, 242, 254, 0.2);
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.1);
}

.nav-btn.active {
  color: var(--color-safe);
  background: rgba(0, 242, 254, 0.08);
  border-color: rgba(0, 242, 254, 0.25);
  box-shadow: var(--glow-safe);
}

.nav-btn.active::before {
  transform: scaleY(1);
}

.nav-icon {
  font-size: 1.1rem;
}

.nav-text {
  font-weight: 500;
  letter-spacing: 1px;
}

.sidebar-footer {
  text-align: center;
  font-size: 0.75rem;
  opacity: 0.6;
  letter-spacing: 1px;
}

/* 內容區 */
.cyber-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  height: calc(100vh - 60px);
}

@media (max-width: 768px) {
  .cyber-main-wrapper {
    flex-direction: column;
  }
  
  .cyber-sidebar {
    width: 100%;
    height: auto;
    position: static;
    flex-direction: row;
    padding: 0.75rem 1rem;
  }
  
  .sidebar-links {
    flex-direction: row;
    width: 100%;
    justify-content: space-around;
  }
  
  .sidebar-footer {
    display: none;
  }
  
  .cyber-content {
    height: auto;
  }
  
  .cyber-header {
    padding: 0 1rem;
  }
  
  .header-status-panel {
    display: none;
  }
}

/* 側邊欄會員面板 */
.sidebar-auth-panel {
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.auth-title {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 0.25rem;
}

.auth-user-name {
  font-size: 0.9rem;
  font-weight: bold;
  word-break: break-all;
  display: block;
  margin-bottom: 0.5rem;
}

.auth-btn-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cyber-auth-btn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s;
  padding: 0.25rem 0;
  text-align: left;
  display: block;
  width: 100%;
  font-family: 'Share Tech Mono', monospace;
}

.cyber-auth-btn:hover {
  color: var(--color-safe);
  text-shadow: 0 0 5px rgba(0, 242, 254, 0.4);
}

.logout-btn:hover {
  color: var(--color-danger);
  text-shadow: 0 0 5px rgba(255, 8, 68, 0.4);
}
</style>

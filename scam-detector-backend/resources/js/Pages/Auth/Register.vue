<script setup>
import { Head, Link, useForm } from '@inertiajs/vue3';

const form = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
});

const submit = () => {
    form.post(route('register'), {
        onFinish: () => form.reset('password', 'password_confirmation'),
    });
};
</script>

<template>
    <div class="auth-page">
        <Head title="啟動新防衛核心" />

        <!-- 科技背景 -->
        <div class="cyber-grid"></div>
        <div class="cyber-bg-glow"></div>
        <div class="cyber-bg-glow-2"></div>

        <!-- 註冊卡片主體 -->
        <div class="auth-card cyber-card">
            <!-- 幾何邊界線裝飾 -->
            <div class="card-corner top-left"></div>
            <div class="card-corner top-right"></div>
            <div class="card-corner bottom-left"></div>
            <div class="card-corner bottom-right"></div>

            <div class="auth-header text-center">
                <div class="auth-logo text-mono text-glow-safe">[ AI_SHIELD: INITIALIZE_CORE ]</div>
                <p class="auth-subtitle text-mono">請建立新操作員認證以啟動防衛核心</p>
            </div>

            <form @submit.prevent="submit" class="auth-form">
                <!-- 姓名欄位 -->
                <div class="form-group">
                    <label for="name" class="cyber-label text-mono">OPERATOR_NAME / 姓名與代號</label>
                    <div class="input-container">
                        <span class="input-prefix text-mono">></span>
                        <input 
                            id="name"
                            type="text"
                            v-model="form.name"
                            placeholder="輸入使用者姓名..."
                            class="cyber-input"
                            required
                            autofocus
                            autocomplete="name"
                        />
                    </div>
                    <span v-if="form.errors.name" class="error-msg text-mono text-glow-danger">
                        [AUTH_ERROR]: {{ form.errors.name }}
                    </span>
                </div>

                <!-- 電子郵件 -->
                <div class="form-group">
                    <label for="email" class="cyber-label text-mono">EMAIL_ADDRESS / 電子郵件</label>
                    <div class="input-container">
                        <span class="input-prefix text-mono">></span>
                        <input 
                            id="email"
                            type="email"
                            v-model="form.email"
                            placeholder="輸入常用信箱..."
                            class="cyber-input"
                            required
                            autocomplete="username"
                        />
                    </div>
                    <span v-if="form.errors.email" class="error-msg text-mono text-glow-danger">
                        [AUTH_ERROR]: {{ form.errors.email }}
                    </span>
                </div>

                <!-- 密碼 -->
                <div class="form-group">
                    <label for="password" class="cyber-label text-mono">SECURITY_PASSWORD / 設定安全密碼</label>
                    <div class="input-container">
                        <span class="input-prefix text-mono">></span>
                        <input 
                            id="password"
                            type="password"
                            v-model="form.password"
                            placeholder="設定 8 位數以上密碼..."
                            class="cyber-input"
                            required
                            autocomplete="new-password"
                        />
                    </div>
                    <span v-if="form.errors.password" class="error-msg text-mono text-glow-danger">
                        [AUTH_ERROR]: {{ form.errors.password }}
                    </span>
                </div>

                <!-- 確認密碼 -->
                <div class="form-group">
                    <label for="password_confirmation" class="cyber-label text-mono">CONFIRM_PASSWORD / 重複輸入密碼</label>
                    <div class="input-container">
                        <span class="input-prefix text-mono">></span>
                        <input 
                            id="password_confirmation"
                            type="password"
                            v-model="form.password_confirmation"
                            placeholder="再次輸入密碼以確認..."
                            class="cyber-input"
                            required
                            autocomplete="new-password"
                        />
                    </div>
                    <span v-if="form.errors.password_confirmation" class="error-msg text-mono text-glow-danger">
                        [AUTH_ERROR]: {{ form.errors.password_confirmation }}
                    </span>
                </div>

                <!-- 操作區 -->
                <div class="form-actions">
                    <Link 
                        :href="route('login')" 
                        class="cyber-btn-sec text-mono"
                    >
                        [ RETURN_TO_LOGIN ]
                    </Link>

                    <button 
                        type="submit" 
                        class="cyber-btn submit-btn" 
                        :class="{ 'opacity-25': form.processing }"
                        :disabled="form.processing"
                    >
                        INITIALIZE CORE
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
.auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    position: relative;
    background-color: var(--bg-primary);
}

.auth-card {
    width: 100%;
    max-width: 460px;
    padding: 2.5rem 2rem;
    border-radius: 12px;
    box-shadow: var(--glow-safe);
    animation: card-slide-in 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
}

@keyframes card-slide-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* 幾何四角裝飾 */
.card-corner {
  position: absolute;
  width: 12px;
  height: 12px;
  border-color: var(--color-safe);
  border-style: solid;
  pointer-events: none;
}
.top-left { top: 8px; left: 8px; border-width: 1.5px 0 0 1.5px; }
.top-right { top: 8px; right: 8px; border-width: 1.5px 1.5px 0 0; }
.bottom-left { bottom: 8px; left: 8px; border-width: 0 0 1.5px 1.5px; }
.bottom-right { bottom: 8px; right: 8px; border-width: 0 1.5px 1.5px 0; }

.auth-header {
    margin-bottom: 2rem;
}

.auth-logo {
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: 2px;
    margin-bottom: 0.5rem;
}

.auth-subtitle {
    font-size: 0.75rem;
    color: var(--color-text-muted);
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.cyber-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-weight: 600;
    letter-spacing: 0.5px;
}

/* 輸入框結構 */
.input-container {
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.4);
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

.cyber-input {
    background: transparent;
    border: none;
    color: var(--color-text-main);
    padding: 0.8rem 1rem 0.8rem 0.5rem;
    width: 100%;
    outline: none;
    font-size: 0.9rem;
}

.error-msg {
    font-size: 0.75rem;
    margin-top: 0.25rem;
}

/* 操作按鈕 */
.form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.25rem;
    gap: 1rem;
}

.cyber-btn-sec {
    text-decoration: none;
    text-align: center;
    padding: 0.75rem 1rem;
    font-size: 0.75rem;
    border-radius: 4px;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--color-text-muted);
    transition: all 0.3s;
}

.cyber-btn-sec:hover {
    border-color: rgba(255, 255, 255, 0.35);
    color: #ffffff;
}

.submit-btn {
    flex: 1;
    font-size: 0.85rem;
    padding: 0.75rem;
}

.opacity-25 {
    opacity: 0.25;
}
</style>

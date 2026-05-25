<script setup>
import { Head, Link, useForm } from '@inertiajs/vue3';
import { ref } from 'vue';

defineProps({
    canResetPassword: {
        type: Boolean,
    },
    status: {
        type: String,
    },
});

const form = useForm({
    email: '',
    password: '',
    remember: false,
});

const submit = () => {
    form.post(route('login'), {
        onFinish: () => form.reset('password'),
    });
};
</script>

<template>
    <div class="auth-page">
        <Head title="登入防衛系統" />

        <!-- 科技背景 -->
        <div class="cyber-grid"></div>
        <div class="cyber-bg-glow"></div>
        <div class="cyber-bg-glow-2"></div>

        <!-- 登入卡片主體 -->
        <div class="auth-card cyber-card">
            <!-- 幾何四角裝飾 -->
            <div class="card-corner top-left"></div>
            <div class="card-corner top-right"></div>
            <div class="card-corner bottom-left"></div>
            <div class="card-corner bottom-right"></div>

            <div class="auth-header text-center">
                <div class="auth-logo text-mono text-glow-safe">[ AI_SHIELD: AUTH_CORE ]</div>
                <p class="auth-subtitle text-mono">請進行身份驗證以連接防衛矩陣</p>
            </div>

            <div v-if="status" class="status-success text-mono text-glow-safe">
                [SUCCESS]: {{ status }}
            </div>

            <form @submit.prevent="submit" class="auth-form">
                <!-- 帳號欄位 -->
                <div class="form-group">
                    <label for="email" class="cyber-label text-mono">EMAIL_ADDRESS / 電子郵件</label>
                    <div class="input-container">
                        <span class="input-prefix text-mono">></span>
                        <input 
                            id="email"
                            type="email"
                            v-model="form.email"
                            placeholder="輸入註冊信箱..."
                            class="cyber-input"
                            required
                            autofocus
                            autocomplete="username"
                        />
                    </div>
                    <span v-if="form.errors.email" class="error-msg text-mono text-glow-danger">
                        [AUTH_ERROR]: {{ form.errors.email }}
                    </span>
                </div>

                <!-- 密碼欄位 -->
                <div class="form-group">
                    <div class="label-row">
                        <label for="password" class="cyber-label text-mono">ACCESS_PASSWORD / 安全密碼</label>
                        <Link
                            v-if="canResetPassword"
                            :href="route('password.request')"
                            class="forgot-link text-mono"
                        >
                          [ FORGOT? ]
                        </Link>
                    </div>
                    <div class="input-container">
                        <span class="input-prefix text-mono">></span>
                        <input 
                            id="password"
                            type="password"
                            v-model="form.password"
                            placeholder="輸入訪問密碼..."
                            class="cyber-input"
                            required
                            autocomplete="current-password"
                        />
                    </div>
                    <span v-if="form.errors.password" class="error-msg text-mono text-glow-danger">
                        [AUTH_ERROR]: {{ form.errors.password }}
                    </span>
                </div>

                <!-- 記住我 -->
                <div class="form-group remember-group">
                    <label class="remember-label text-mono">
                        <input 
                            type="checkbox" 
                            v-model="form.remember" 
                            class="cyber-checkbox"
                        />
                        <span class="checkbox-text">KEEP_CONNECTED / 保持連線</span>
                    </label>
                </div>

                <!-- 按鈕操作區 -->
                <div class="form-actions">
                    <Link 
                        :href="route('register')" 
                        class="cyber-btn-sec text-mono"
                    >
                        [ REGISTER_NEW_CORE ]
                    </Link>

                    <button 
                        type="submit" 
                        class="cyber-btn submit-btn" 
                        :class="{ 'opacity-25': form.processing }"
                        :disabled="form.processing"
                    >
                        VALIDATE IDENTITY
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
    max-width: 450px;
    padding: 2.5rem 2rem;
    border-radius: 12px;
    box-shadow: var(--glow-safe);
    animation: card-slide-in 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
}

@keyframes card-slide-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* 幾何四角邊線 */
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
    font-size: 1.3rem;
    font-weight: 700;
    letter-spacing: 2px;
    margin-bottom: 0.5rem;
}

.auth-subtitle {
    font-size: 0.75rem;
    color: var(--color-text-muted);
}

.status-success {
    background: rgba(0, 242, 254, 0.08);
    border: 1px solid rgba(0, 242, 254, 0.2);
    border-radius: 4px;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
    font-size: 0.8rem;
}

.auth-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
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

.label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.forgot-link {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    text-decoration: none;
    transition: color 0.3s;
}

.forgot-link:hover {
    color: var(--color-safe);
    text-shadow: 0 0 5px rgba(0, 242, 254, 0.4);
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
    padding: 0.85rem 1rem 0.85rem 0.5rem;
    width: 100%;
    outline: none;
    font-size: 0.9rem;
}

.error-msg {
    font-size: 0.75rem;
    margin-top: 0.25rem;
}

/* 記住我 */
.remember-group {
    flex-direction: row;
}

.remember-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    user-select: none;
}

.cyber-checkbox {
    appearance: none;
    width: 14px;
    height: 14px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.4);
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    outline: none;
    transition: all 0.3s;
}

.cyber-checkbox:checked {
    border-color: var(--color-safe);
    background: rgba(0, 242, 254, 0.1);
    box-shadow: 0 0 5px var(--color-safe);
}

.cyber-checkbox:checked::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--color-safe);
    font-size: 10px;
    font-weight: bold;
}

.checkbox-text {
    transition: color 0.3s;
}

.remember-label:hover .checkbox-text {
    color: var(--color-text-main);
}

/* 操作按鈕 */
.form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
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

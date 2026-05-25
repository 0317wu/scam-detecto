<script setup>
import { Link, useForm, usePage } from '@inertiajs/vue3';

defineProps({
    mustVerifyEmail: {
        type: Boolean,
    },
    status: {
        type: String,
    },
});

const user = usePage().props.auth.user;

const form = useForm({
    name: user.name,
    email: user.email,
});
</script>

<template>
    <section>
        <header class="form-header">
            <h3 class="section-title text-mono text-glow-safe">[ PROFILE_INFORMATION / 基本資料 ]</h3>
            <p class="section-desc text-mono">更新您的帳戶基本名稱與登入電子郵件地址。</p>
        </header>

        <form
            @submit.prevent="form.patch(route('profile.update'))"
            class="cyber-form"
        >
            <!-- 姓名欄位 -->
            <div class="form-group">
                <label for="name" class="cyber-label text-mono">OPERATOR_NAME / 姓名</label>
                <div class="input-container">
                    <span class="input-prefix text-mono">></span>
                    <input
                        id="name"
                        type="text"
                        class="cyber-input"
                        v-model="form.name"
                        required
                        autofocus
                        autocomplete="name"
                    />
                </div>
                <span v-if="form.errors.name" class="error-msg text-mono text-glow-danger">
                    [ERROR]: {{ form.errors.name }}
                </span>
            </div>

            <!-- 信箱欄位 -->
            <div class="form-group">
                <label for="email" class="cyber-label text-mono">EMAIL_ADDRESS / 電子郵件</label>
                <div class="input-container">
                    <span class="input-prefix text-mono">></span>
                    <input
                        id="email"
                        type="email"
                        class="cyber-input"
                        v-model="form.email"
                        required
                        autocomplete="username"
                    />
                </div>
                <span v-if="form.errors.email" class="error-msg text-mono text-glow-danger">
                    [ERROR]: {{ form.errors.email }}
                </span>
            </div>

            <!-- 電子郵件驗證提示 (Laravel Breeze 預設) -->
            <div v-if="mustVerifyEmail && user.email_verified_at === null" class="verify-alert text-mono">
                <p>
                    您的電子郵件地址尚未驗證。
                    <Link
                        :href="route('verification.send')"
                        method="post"
                        as="button"
                        class="verify-link"
                    >
                        點擊此處重新發送驗證郵件。
                    </Link>
                </p>

                <div
                    v-show="status === 'verification-link-sent'"
                    class="status-success-text"
                >
                    [SYSTEM_ALERT] 全新的驗證連結已寄出至您的信箱。
                </div>
            </div>

            <!-- 動作與成功提示 -->
            <div class="form-actions">
                <button 
                    type="submit" 
                    class="cyber-btn"
                    :disabled="form.processing"
                >
                    SAVE CONFIGURATION / 儲存設定
                </button>

                <Transition
                    enter-active-class="transition ease-in-out"
                    enter-from-class="opacity-0"
                    leave-active-class="transition ease-in-out"
                    leave-to-class="opacity-0"
                >
                    <p
                        v-if="form.recentlySuccessful"
                        class="success-msg text-mono text-glow-safe"
                    >
                        [SUCCESS] 設定已同步至核心資料庫。
                    </p>
                </Transition>
            </div>
        </form>
    </section>
</template>

<style scoped>
.form-header {
    margin-bottom: 1.5rem;
}

.section-title {
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: 1px;
    margin-bottom: 0.25rem;
}

.section-desc {
    font-size: 0.75rem;
    color: var(--color-text-muted);
}

.cyber-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
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
    padding: 0.75rem 1rem 0.75rem 0.5rem;
    width: 100%;
    outline: none;
    font-size: 0.9rem;
    font-family: inherit;
}

.error-msg {
    font-size: 0.75rem;
    margin-top: 0.25rem;
}

.verify-alert {
    background: rgba(241, 196, 15, 0.08);
    border: 1px solid rgba(241, 196, 15, 0.2);
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-size: 0.75rem;
    color: var(--color-text-main);
}

.verify-link {
    background: transparent;
    border: none;
    color: var(--color-warning);
    text-decoration: underline;
    cursor: pointer;
    font-weight: bold;
}

.verify-link:hover {
    color: #ffffff;
}

.status-success-text {
    margin-top: 0.5rem;
    color: var(--color-safe);
}

.form-actions {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-top: 0.5rem;
}

.cyber-btn {
    /* 使用全域定義的 .cyber-btn，這裡可提供微調 */
    min-width: 180px;
    padding: 0.75rem 1.5rem;
    font-size: 0.8rem;
    letter-spacing: 1px;
}

.success-msg {
    font-size: 0.75rem;
    color: var(--color-safe);
}
</style>

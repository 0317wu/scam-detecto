<script setup>
import { useForm } from '@inertiajs/vue3';
import { ref } from 'vue';

const passwordInput = ref(null);
const currentPasswordInput = ref(null);

const form = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
});

const updatePassword = () => {
    form.put(route('password.update'), {
        preserveScroll: true,
        onSuccess: () => form.reset(),
        onError: () => {
            if (form.errors.password) {
                form.reset('password', 'password_confirmation');
                passwordInput.value.focus();
            }
            if (form.errors.current_password) {
                form.reset('current_password');
                currentPasswordInput.value.focus();
            }
        },
    });
};
</script>

<template>
    <section>
        <header class="form-header">
            <h3 class="section-title text-mono text-glow-safe">[ SECURITY_CREDENTIALS / 安全驗證密碼 ]</h3>
            <p class="section-desc text-mono">確保您的帳戶使用的是隨機且高強度的安全密碼，以維持核心防線的穩固。</p>
        </header>

        <form @submit.prevent="updatePassword" class="cyber-form">
            <!-- 目前密碼 -->
            <div class="form-group">
                <label for="current_password" class="cyber-label text-mono">CURRENT_PASSWORD / 目前密碼</label>
                <div class="input-container">
                    <span class="input-prefix text-mono">></span>
                    <input
                        id="current_password"
                        ref="currentPasswordInput"
                        v-model="form.current_password"
                        type="password"
                        class="cyber-input"
                        autocomplete="current-password"
                    />
                </div>
                <span v-if="form.errors.current_password" class="error-msg text-mono text-glow-danger">
                    [ERROR]: {{ form.errors.current_password }}
                </span>
            </div>

            <!-- 新密碼 -->
            <div class="form-group">
                <label for="password" class="cyber-label text-mono">NEW_PASSWORD / 新建密碼</label>
                <div class="input-container">
                    <span class="input-prefix text-mono">></span>
                    <input
                        id="password"
                        ref="passwordInput"
                        v-model="form.password"
                        type="password"
                        class="cyber-input"
                        autocomplete="new-password"
                    />
                </div>
                <span v-if="form.errors.password" class="error-msg text-mono text-glow-danger">
                    [ERROR]: {{ form.errors.password }}
                </span>
            </div>

            <!-- 確認密碼 -->
            <div class="form-group">
                <label for="password_confirmation" class="cyber-label text-mono">CONFIRM_PASSWORD / 確認新密碼</label>
                <div class="input-container">
                    <span class="input-prefix text-mono">></span>
                    <input
                        id="password_confirmation"
                        v-model="form.password_confirmation"
                        type="password"
                        class="cyber-input"
                        autocomplete="new-password"
                    />
                </div>
                <span v-if="form.errors.password_confirmation" class="error-msg text-mono text-glow-danger">
                    [ERROR]: {{ form.errors.password_confirmation }}
                </span>
            </div>

            <!-- 按鈕操作與成功提示 -->
            <div class="form-actions">
                <button 
                    type="submit" 
                    class="cyber-btn"
                    :disabled="form.processing"
                >
                    UPDATE CREDENTIALS / 更新安全憑證
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
                        [SUCCESS] 安全憑證已成功變更。
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

.form-actions {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-top: 0.5rem;
}

.cyber-btn {
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

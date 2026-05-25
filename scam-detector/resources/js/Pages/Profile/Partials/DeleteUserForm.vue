<script setup>
import Modal from '@/Components/Modal.vue';
import { useForm } from '@inertiajs/vue3';
import { nextTick, ref } from 'vue';

const confirmingUserDeletion = ref(false);
const passwordInput = ref(null);

const form = useForm({
    password: '',
});

const confirmUserDeletion = () => {
    confirmingUserDeletion.value = true;
    nextTick(() => passwordInput.value.focus());
};

const deleteUser = () => {
    form.delete(route('profile.destroy'), {
        preserveScroll: true,
        onSuccess: () => closeModal(),
        onError: () => passwordInput.value.focus(),
        onFinish: () => form.reset(),
    });
};

const closeModal = () => {
    confirmingUserDeletion.value = false;
    form.clearErrors();
    form.reset();
};
</script>

<template>
    <section class="delete-section">
        <header class="form-header">
            <h3 class="section-title text-mono text-glow-danger">[ PURGE_CORE_ACCOUNT / 銷毀核心帳戶 ]</h3>
            <p class="section-desc text-mono">注意：此動作為不可逆之毀滅性指令。帳戶一旦銷毀，所有掃描紀錄、歷史日誌與關聯數據將會被永久抹除。</p>
        </header>

        <button 
            type="button" 
            class="cyber-btn-danger text-mono" 
            @click="confirmUserDeletion"
        >
            PURGE ACCOUNT / 執行帳戶銷毀
        </button>

        <Modal :show="confirmingUserDeletion" @close="closeModal">
            <div class="modal-cyber-panel text-mono">
                <!-- 裝飾角 -->
                <div class="card-corner top-left-danger"></div>
                <div class="card-corner top-right-danger"></div>
                <div class="card-corner bottom-left-danger"></div>
                <div class="card-corner bottom-right-danger"></div>

                <h2 class="alert-title text-glow-danger">
                    [WARNING: CORE_PURGE_REQUESTED]
                </h2>

                <p class="alert-desc">
                    您確定要銷毀您的操作員帳戶嗎？此動作將立即切斷您與系統防衛主機的所有連線，所有數據將無法還原。請輸入安全密碼以進行核准驗證：
                </p>

                <div class="form-group mt-6">
                    <label for="modal_password" class="cyber-label">VERIFICATION_PASSWORD / 安全密碼</label>
                    <div class="input-container">
                        <span class="input-prefix">></span>
                        <input
                            id="modal_password"
                            ref="passwordInput"
                            v-model="form.password"
                            type="password"
                            class="cyber-input"
                            placeholder="請輸入密碼以驗證身份..."
                            @keyup.enter="deleteUser"
                        />
                    </div>
                    <span v-if="form.errors.password" class="error-msg text-glow-danger">
                        [ERROR]: {{ form.errors.password }}
                    </span>
                </div>

                <div class="modal-actions mt-6">
                    <button 
                        type="button" 
                        class="cyber-btn-sec" 
                        @click="closeModal"
                    >
                        [ CANCEL / 取消 ]
                    </button>

                    <button
                        type="button"
                        class="cyber-btn-danger-confirm"
                        :class="{ 'opacity-25': form.processing }"
                        :disabled="form.processing"
                        @click="deleteUser"
                    >
                        CONFIRM PURGE / 授權銷毀
                    </button>
                </div>
            </div>
        </Modal>
    </section>
</template>

<style scoped>
.delete-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-header {
    margin-bottom: 1rem;
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

/* 霓虹紅色按鈕 */
.cyber-btn-danger {
    background: transparent;
    border: 1px solid var(--color-danger);
    color: var(--color-danger);
    box-shadow: 0 0 5px rgba(255, 8, 68, 0.1);
    border-radius: 4px;
    padding: 0.75rem 1.5rem;
    font-size: 0.8rem;
    font-weight: bold;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.3s;
    text-align: center;
    max-width: 250px;
    font-family: 'Share Tech Mono', monospace;
}

.cyber-btn-danger:hover {
    background: rgba(255, 8, 68, 0.1);
    box-shadow: var(--glow-danger);
    color: #ffffff;
}

/* 彈出框科幻面板 */
.modal-cyber-panel {
    background: #08071e;
    border: 1px solid rgba(255, 8, 68, 0.3);
    box-shadow: var(--glow-danger);
    padding: 2.5rem 2rem;
    border-radius: 8px;
    position: relative;
    color: var(--color-text-main);
}

.alert-title {
    color: var(--color-danger);
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 1rem;
    letter-spacing: 1px;
}

.alert-desc {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    line-height: 1.6;
    margin-bottom: 1.5rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.cyber-label {
    font-size: 0.7rem;
    color: var(--color-text-muted);
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
    border-color: var(--color-danger);
    box-shadow: 0 0 10px rgba(255, 8, 68, 0.15);
}

.input-prefix {
    padding-left: 1rem;
    color: var(--color-danger);
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

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
}

.cyber-btn-sec {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: var(--color-text-muted);
    padding: 0.65rem 1.25rem;
    font-size: 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    font-family: 'Share Tech Mono', monospace;
}

.cyber-btn-sec:hover {
    border-color: rgba(255, 255, 255, 0.4);
    color: #ffffff;
}

.cyber-btn-danger-confirm {
    background: var(--color-danger);
    border: none;
    color: #ffffff;
    padding: 0.65rem 1.25rem;
    font-size: 0.75rem;
    font-weight: bold;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 0 8px rgba(255, 8, 68, 0.2);
    font-family: 'Share Tech Mono', monospace;
}

.cyber-btn-danger-confirm:hover {
    box-shadow: var(--glow-danger);
    filter: brightness(1.1);
}

.opacity-25 {
    opacity: 0.25;
}

/* 幾何角裝飾 */
.card-corner {
    position: absolute;
    width: 8px;
    height: 8px;
    border-color: var(--color-danger);
    border-style: solid;
    pointer-events: none;
}
.top-left-danger { top: 6px; left: 6px; border-width: 1.5px 0 0 1.5px; }
.top-right-danger { top: 6px; right: 6px; border-width: 1.5px 1.5px 0 0; }
.bottom-left-danger { bottom: 6px; left: 6px; border-width: 0 0 1.5px 1.5px; }
.bottom-right-danger { bottom: 6px; right: 6px; border-width: 0 1.5px 1.5px 0; }
</style>

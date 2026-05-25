<script setup>
import { Head } from '@inertiajs/vue3';
import CyberLayout from '@/Layouts/CyberLayout.vue';
import DeleteUserForm from './Partials/DeleteUserForm.vue';
import UpdatePasswordForm from './Partials/UpdatePasswordForm.vue';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm.vue';

defineProps({
    mustVerifyEmail: {
        type: Boolean,
    },
    status: {
        type: String,
    },
});
</script>

<template>
    <Head title="操作員設定中心" />

    <CyberLayout>
        <div class="profile-page">
            <!-- 頂部頁頭 -->
            <header class="profile-hero cyber-card text-center">
                <div class="card-corner top-left"></div>
                <div class="card-corner top-right"></div>
                <div class="card-corner bottom-left"></div>
                <div class="card-corner bottom-right"></div>
                
                <h2 class="hero-title text-mono text-glow-safe">[ OPERATOR_CONFIG / 操作員參數設定中心 ]</h2>
                <p class="hero-subtitle text-mono">在此調整您的安全憑證與系統訪問權限。</p>
            </header>

            <!-- 內容區塊 -->
            <div class="profile-sections">
                <!-- 帳號資訊設定 -->
                <div class="cyber-card profile-card">
                    <div class="card-corner top-left"></div>
                    <div class="card-corner top-right"></div>
                    <div class="card-corner bottom-left"></div>
                    <div class="card-corner bottom-right"></div>
                    
                    <UpdateProfileInformationForm
                        :must-verify-email="mustVerifyEmail"
                        :status="status"
                    />
                </div>

                <!-- 安全密碼更新 -->
                <div class="cyber-card profile-card">
                    <div class="card-corner top-left"></div>
                    <div class="card-corner top-right"></div>
                    <div class="card-corner bottom-left"></div>
                    <div class="card-corner bottom-right"></div>
                    
                    <UpdatePasswordForm />
                </div>

                <!-- 銷毀核心帳戶 -->
                <div class="cyber-card profile-card card-danger-border">
                    <div class="card-corner top-left-danger"></div>
                    <div class="card-corner top-right-danger"></div>
                    <div class="card-corner bottom-left-danger"></div>
                    <div class="card-corner bottom-right-danger"></div>
                    
                    <DeleteUserForm />
                </div>
            </div>
        </div>
    </CyberLayout>
</template>

<style scoped>
.profile-page {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.profile-hero {
    background: var(--bg-card);
    border: var(--glass-border);
    padding: 2rem 1.5rem;
    box-shadow: var(--glow-safe);
    position: relative;
}

.hero-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
}

.hero-subtitle {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.profile-sections {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.profile-card {
    background: var(--bg-card);
    border: var(--glass-border);
    padding: 2rem;
    position: relative;
    border-radius: 8px;
}

.card-danger-border {
    border-color: rgba(255, 8, 68, 0.2) !important;
}

/* 幾何四邊框裝飾 */
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

.top-left-danger { top: 8px; left: 8px; border-width: 1.5px 0 0 1.5px; border-color: var(--color-danger); border-style: solid; position: absolute; width: 10px; height: 10px; }
.top-right-danger { top: 8px; right: 8px; border-width: 1.5px 1.5px 0 0; border-color: var(--color-danger); border-style: solid; position: absolute; width: 10px; height: 10px; }
.bottom-left-danger { bottom: 8px; left: 8px; border-width: 0 0 1.5px 1.5px; border-color: var(--color-danger); border-style: solid; position: absolute; width: 10px; height: 10px; }
.bottom-right-danger { bottom: 8px; right: 8px; border-width: 0 1.5px 1.5px 0; border-color: var(--color-danger); border-style: solid; position: absolute; width: 10px; height: 10px; }
</style>

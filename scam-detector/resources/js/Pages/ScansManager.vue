<script setup>
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout.vue';
import { Head } from '@inertiajs/vue3';
import { ref, onMounted } from 'vue';
import axios from 'axios';
import PrimaryButton from '@/Components/PrimaryButton.vue';

const scans = ref({ data: [], current_page: 1, last_page: 1 });
const loading = ref(true);

const fetchScans = async (page = 1) => {
    loading.value = true;
    try {
        const response = await axios.get(`/api/scans?page=${page}`);
        scans.value = response.data.data;
    } catch (error) {
        console.error('Error fetching scans:', error);
        alert('無法取得掃描紀錄');
    } finally {
        loading.value = false;
    }
};

const convertToRule = async (scan) => {
    if (!confirm('確定要將此掃描紀錄轉為詐騙案例規則嗎？')) return;

    try {
        const payload = {
            title: scan.scam_type || '自動收錄案例',
            description: scan.summary || scan.content || '無描述',
            scam_type: scan.scam_type || '未知',
            threat_level: scan.risk_level || 'warning',
            keywords: scan.risk_factors || [],
            is_active: true
        };

        await axios.post('/api/cases', payload);
        alert('成功轉為規則！');
    } catch (error) {
        console.error('Error converting to rule:', error);
        alert('轉為規則失敗：' + (error.response?.data?.message || error.message));
    }
};

const truncate = (text, length = 30) => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
};

onMounted(() => {
    fetchScans();
});
</script>

<template>
    <Head title="Scans Manager" />

    <AuthenticatedLayout>
        <template #header>
            <h2 class="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                掃描紀錄總管 (Human-in-the-Loop)
            </h2>
        </template>

        <div class="py-12">
            <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div class="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                    <div class="p-6 text-gray-900 dark:text-gray-100">
                        <div v-if="loading" class="text-center py-4">載入中...</div>
                        
                        <div v-else class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead class="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">類型 / 內容</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">風險 / 分類</th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">時間</th>
                                        <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    <tr v-for="scan in scans.data" :key="scan.id">
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">#{{ scan.id }}</td>
                                        <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            <div class="font-medium text-gray-900 dark:text-gray-100">{{ scan.input_type }}</div>
                                            <div class="text-xs">{{ truncate(scan.content || scan.url || scan.ocr_text) }}</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                                                :class="{
                                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': scan.risk_level === 'danger',
                                                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': scan.risk_level === 'warning',
                                                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': scan.risk_level === 'safe'
                                                }">
                                                {{ scan.risk_level }}
                                            </span>
                                            <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ scan.scam_type }}</div>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {{ new Date(scan.created_at).toLocaleString() }}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                v-if="scan.risk_level === 'danger' || scan.risk_level === 'warning'"
                                                @click="convertToRule(scan)" 
                                                class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">
                                                轉為規則
                                            </button>
                                        </td>
                                    </tr>
                                    <tr v-if="scans.data.length === 0">
                                        <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">目前沒有掃描紀錄</td>
                                    </tr>
                                </tbody>
                            </table>
                            
                            <!-- 分頁控制 -->
                            <div class="mt-4 flex items-center justify-between" v-if="scans.last_page > 1">
                                <button 
                                    @click="fetchScans(scans.current_page - 1)" 
                                    :disabled="scans.current_page === 1"
                                    class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
                                    上一頁
                                </button>
                                <span class="text-sm text-gray-700 dark:text-gray-300">
                                    第 {{ scans.current_page }} 頁，共 {{ scans.last_page }} 頁
                                </span>
                                <button 
                                    @click="fetchScans(scans.current_page + 1)" 
                                    :disabled="scans.current_page === scans.last_page"
                                    class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
                                    下一頁
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </AuthenticatedLayout>
</template>

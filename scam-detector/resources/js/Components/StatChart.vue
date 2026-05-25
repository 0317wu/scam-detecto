<template>
  <div class="chart-container">
    <Doughnut 
      v-if="type === 'doughnut'" 
      :data="chartData" 
      :options="mergedOptions" 
    />
    <Line 
      v-else-if="type === 'line'" 
      :data="chartData" 
      :options="mergedOptions" 
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { 
  Chart as ChartJS, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement,
  Filler
} from 'chart.js';
import { Doughnut, Line } from 'vue-chartjs';

// 註冊 ChartJS 組件
ChartJS.register(
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement,
  Filler
);

const props = defineProps({
  type: {
    type: String,
    required: true,
    default: 'doughnut' // doughnut | line
  },
  chartData: {
    type: Object,
    required: true
  },
  options: {
    type: Object,
    default: () => ({})
  }
});

// 全域科幻暗黑樣式配置
const defaultOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: props.type === 'doughnut' ? {
        top: 15,
        bottom: 15,
        left: 20,
        right: 20
      } : {
        top: 5,
        bottom: 5,
        left: 5,
        right: 5
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8', // text-muted
          font: {
            family: "'Outfit', sans-serif",
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: '#0c0b25',
        borderColor: 'rgba(0, 242, 254, 0.3)',
        borderWidth: 1,
        titleColor: '#00f2fe',
        titleFont: {
          family: "'Share Tech Mono', monospace"
        },
        bodyColor: '#f8fafc',
        bodyFont: {
          family: "'Outfit', sans-serif"
        },
        padding: 10,
        cornerRadius: 4,
        displayColors: true
      }
    },
    scales: props.type === 'line' ? {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.04)'
        },
        ticks: {
          color: '#94a3b8',
          font: {
            family: "'Share Tech Mono', monospace"
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.04)'
        },
        ticks: {
          color: '#94a3b8',
          font: {
            family: "'Share Tech Mono', monospace"
          }
        }
      }
    } : {}
  };
});

const mergedOptions = computed(() => {
  return {
    ...defaultOptions.value,
    ...props.options
  };
});
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 180px;
}
</style>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { CheckmarkCircleOutline, RefreshOutline, WarningOutline } from '@vicons/ionicons5';

type HealthResponse = {
  status: string;
  service: string;
  timestamp: string;
};

const loading = ref(false);
const health = ref<HealthResponse | null>(null);
const error = ref('');
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

async function checkHealth() {
  loading.value = true;
  error.value = '';

  try {
    const response = await fetch(`${apiBaseUrl}/health`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    health.value = await response.json();
  } catch (err) {
    health.value = null;
    error.value = err instanceof Error ? err.message : 'API 请求失败';
  } finally {
    loading.value = false;
  }
}

onMounted(checkHealth);
</script>

<template>
  <div class="page-stack">
    <n-grid :cols="4" :x-gap="16" :y-gap="16" responsive="screen">
      <n-grid-item>
        <n-card :bordered="false" class="metric-card">
          <n-statistic label="内容数量" value="128" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card :bordered="false" class="metric-card">
          <n-statistic label="活动进行中" value="6" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card :bordered="false" class="metric-card">
          <n-statistic label="商品上架" value="342" />
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card :bordered="false" class="metric-card">
          <n-statistic label="页面模板" value="18" />
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-card :bordered="false" class="panel-card">
      <template #header>
        <div class="card-title">API 连接状态</div>
      </template>

      <n-space vertical size="large">
        <div class="status-row">
          <n-spin v-if="loading" size="small" />
          <n-icon v-else-if="health" size="28" color="#18a058">
            <CheckmarkCircleOutline />
          </n-icon>
          <n-icon v-else size="28" color="#d03050">
            <WarningOutline />
          </n-icon>

          <div>
            <div class="status-text">
              <span v-if="loading">正在连接 API...</span>
              <span v-else-if="health">API 连接成功</span>
              <span v-else>API 连接失败</span>
            </div>
            <div class="status-meta">
              <span v-if="health">{{ health.service }} · {{ health.timestamp }}</span>
              <span v-else-if="error">{{ error }}</span>
              <span v-else>等待检测</span>
            </div>
          </div>
        </div>

        <n-space align="center">
          <n-tag v-if="health" type="success" round>{{ health.status }}</n-tag>
          <n-tag v-else type="error" round>offline</n-tag>
          <n-button :loading="loading" secondary @click="checkHealth">
            <template #icon>
              <n-icon>
                <RefreshOutline />
              </n-icon>
            </template>
            重新检测
          </n-button>
        </n-space>
      </n-space>
    </n-card>
  </div>
</template>

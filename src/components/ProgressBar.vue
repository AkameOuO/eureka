<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  collected: number
  total: number
}

const props = defineProps<Props>()
const { t } = useI18n()

const percentage = computed(() => {
  if (props.total === 0) return 0
  return (props.collected / props.total) * 100
})
</script>

<template>
  <div class="progress-section">
    <div class="progress-info">
      <span class="progress-label">{{ t('header.progress') }}</span>
      <span class="progress-text">{{ props.collected }} / {{ props.total }}</span>
    </div>
    <div class="progress-bar-container">
      <div class="progress-bar-fill" :style="{ width: percentage + '%' }"></div>
    </div>
    <div class="progress-percentage">{{ percentage.toFixed(2) }}%</div>
  </div>
</template>

<style scoped>
.progress-section {
  padding: 15px 20px;
  background: var(--color-bg-default);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
}

.progress-label {
  font-weight: 600;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.progress-text {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: var(--color-border-primary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFB6D9 0%, #FFC0CB 100%);
  transition: width 0.3s ease;
}

.progress-percentage {
  text-align: right;
  font-size: 12px;
  color: var(--color-text-secondary);
  font-weight: 500;
}
</style>

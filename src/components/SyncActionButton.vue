<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface Emits {
  (e: 'open-sync'): void
}

const emit = defineEmits<Emits>()
const { t } = useI18n()

function openSyncModal(): void {
  emit('open-sync')
}
</script>

<template>
  <div class="sync-action">
    <button class="sync-action-button" @click="openSyncModal">
      {{ t('googleDrive.record_manager') }}
    </button>
  </div>
</template>

<style scoped>
.sync-action {
  padding: 0 20px 10px;
  background: var(--color-bg-default);
}

.sync-action-button {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: var(--color-bg-default);
  cursor: pointer;
  border-radius: var(--border-radius);
  transition: all var(--transition-speed);
  font-size: 13px;
  font-weight: 400;
  text-align: center;
}

.sync-action-button:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

@media (max-width: 768px) {
  .sync-action {
    padding: 0 15px 10px;
  }
}
</style>
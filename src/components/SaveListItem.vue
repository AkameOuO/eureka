<script setup lang="ts">
import { useI18n } from 'vue-i18n'

interface SaveItem {
  id: string
  name: string
  modifiedTime: string
}

interface Props {
  save: SaveItem
  disabled?: boolean
  formattedDate: string
}

type SaveAction = 'apply' | 'overwrite' | 'rename' | 'delete'

interface Emits {
  (e: 'action', action: SaveAction, saveName: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

function emitAction(action: SaveAction): void {
  emit('action', action, props.save.name)
}
</script>

<template>
  <div class="save-item">
    <div class="save-info">
      <div class="save-name">{{ save.name }}</div>
      <div class="save-date">{{ formattedDate }}</div>
    </div>
    <div class="save-actions">
      <button
        @click="emitAction('apply')"
        :disabled="disabled"
        class="action-btn apply-btn"
        :title="t('googleDrive.apply_save')"
      >
        {{ t('googleDrive.apply') }}
      </button>
      <button
        @click="emitAction('overwrite')"
        :disabled="disabled"
        class="action-btn overwrite-btn"
        :title="t('googleDrive.overwrite_save')"
      >
        {{ t('googleDrive.overwrite') }}
      </button>
      <button
        @click="emitAction('rename')"
        :disabled="disabled"
        class="action-btn rename-btn"
        :title="t('googleDrive.rename_save')"
      >
        {{ t('googleDrive.rename') }}
      </button>
      <button
        @click="emitAction('delete')"
        :disabled="disabled"
        class="action-btn delete-btn"
        :title="t('googleDrive.delete')"
      >
        {{ t('googleDrive.delete') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.save-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #e8e8e8;
  transition: all 0.2s ease;
  position: relative;
}

.save-item:last-child {
  border-bottom: none;
}

.save-item:hover {
  background: #f0f0f0;
}

.save-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.save-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.save-date {
  font-size: 11px;
  color: #999;
}

.save-actions {
  display: none;
  gap: 4px;
  margin-left: 8px;
  flex-shrink: 0;
}

.save-item:hover .save-actions {
  display: flex;
}

.action-btn {
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.apply-btn {
  background: #4caf50;
  color: white;
}

.apply-btn:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-1px);
}

.overwrite-btn {
  background: #e85a95;
  color: white;
  box-shadow: 0 2px 6px rgba(232, 90, 149, 0.35);
}

.overwrite-btn:hover:not(:disabled) {
  background: #d94a86;
  transform: translateY(-1px);
}

.rename-btn {
  background: #ffb74d;
  color: white;
}

.rename-btn:hover:not(:disabled) {
  background: #fb8c00;
  transform: translateY(-1px);
}

.delete-btn {
  background: #f44336;
  color: white;
}

.delete-btn:hover:not(:disabled) {
  background: #da190b;
  transform: translateY(-1px);
}
</style>
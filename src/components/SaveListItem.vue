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
        :aria-label="t('googleDrive.apply_save')"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="action-icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
          <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
        </svg>
      </button>
      <button
        @click="emitAction('overwrite')"
        :disabled="disabled"
        class="action-btn overwrite-btn"
        :title="t('googleDrive.overwrite_save')"
        :aria-label="t('googleDrive.overwrite_save')"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="action-icon" viewBox="0 0 16 16" aria-hidden="true">
          <path fill-rule="evenodd" d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383"/>
          <path fill-rule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708z"/>
        </svg>
      </button>
      <button
        @click="emitAction('rename')"
        :disabled="disabled"
        class="action-btn rename-btn"
        :title="t('googleDrive.rename_save')"
        :aria-label="t('googleDrive.rename_save')"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="action-icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
          <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/>
        </svg>
      </button>
      <button
        @click="emitAction('delete')"
        :disabled="disabled"
        class="action-btn delete-btn"
        :title="t('googleDrive.delete')"
        :aria-label="t('googleDrive.delete')"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="action-icon" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
          <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
        </svg>
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
  display: flex;
  gap: 4px;
  margin-left: 8px;
  flex-shrink: 0;
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

.action-icon {
  font-size: 14px;
  line-height: 1;
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
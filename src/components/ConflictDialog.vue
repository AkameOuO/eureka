<template>
  <div v-if="conflictData" class="conflict-dialog-overlay">
    <div class="conflict-dialog-container">
      <div class="dialog-header">
        <h2>{{ t('googleDrive.conflict_detected') }}</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="dialog-content">
        <p class="conflict-explanation">
          {{ t('googleDrive.conflict_explanation', { file: conflictData.fileName }) }}
        </p>

        <div class="versions-comparison">
          <!-- Local version -->
          <div class="version-panel">
            <h3>{{ t('googleDrive.local_version') }}</h3>
            <div class="version-info">
              <p class="info-label">{{ t('googleDrive.items') }}: {{ conflictData.local.length }}</p>
              <div class="items-preview">
                <div v-for="(item, idx) in conflictData.local.slice(0, 5)" :key="idx" class="item-preview">
                  {{ item }}
                </div>
                <div v-if="conflictData.local.length > 5" class="more-items">
                  +{{ conflictData.local.length - 5 }} {{ t('googleDrive.more_items') }}
                </div>
              </div>
            </div>
          </div>

          <!-- Remote version -->
          <div class="version-panel">
            <h3>{{ t('googleDrive.remote_version') }}</h3>
            <div class="version-info">
              <p class="info-label">{{ t('googleDrive.items') }}: {{ conflictData.remote.length }}</p>
              <div class="items-preview">
                <div v-for="(item, idx) in conflictData.remote.slice(0, 5)" :key="idx" class="item-preview">
                  {{ item }}
                </div>
                <div v-if="conflictData.remote.length > 5" class="more-items">
                  +{{ conflictData.remote.length - 5 }} {{ t('googleDrive.more_items') }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="resolution-options">
          <h3>{{ t('googleDrive.choose_action') }}</h3>
          <div class="option-descriptions">
            <div class="option">
              <input type="radio" id="keep-local" v-model="selectedOption" value="local" />
              <label for="keep-local">
                <span class="option-title">{{ t('googleDrive.keep_local') }}</span>
                <span class="option-desc">{{ t('googleDrive.keep_local_desc') }}</span>
              </label>
            </div>

            <div class="option">
              <input type="radio" id="keep-remote" v-model="selectedOption" value="remote" />
              <label for="keep-remote">
                <span class="option-title">{{ t('googleDrive.keep_remote') }}</span>
                <span class="option-desc">{{ t('googleDrive.keep_remote_desc') }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <button @click="$emit('close')" class="btn btn-secondary">{{ t('googleDrive.cancel') }}</button>
        <button @click="confirmResolution" class="btn btn-primary">{{ t('googleDrive.confirm') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  conflictData: {
    local: any[]
    remote: any[]
    fileName: string
  } | null
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  resolve: [version: 'local' | 'remote']
}>()

const selectedOption = ref<'local' | 'remote'>('local')

function confirmResolution(): void {
  emit('resolve', selectedOption.value)
  selectedOption.value = 'local'
}
</script>

<style scoped>
.conflict-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.conflict-dialog-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 40px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
}

.dialog-header h2 {
  margin: 0;
  font-size: 20px;
  color: #e65100;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #e65100;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: rgba(230, 81, 0, 0.1);
}

.dialog-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.conflict-explanation {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.versions-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.version-panel {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 16px;
  background-color: #f5f5f5;
}

.version-panel h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.version-info .info-label {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #666;
}

.items-preview {
  max-height: 120px;
  overflow-y: auto;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
}

.item-preview {
  padding: 4px;
  font-size: 12px;
  color: #666;
  border-bottom: 1px solid #f0f0f0;
  word-break: break-word;
}

.item-preview:last-child {
  border-bottom: none;
}

.more-items {
  padding: 4px;
  font-size: 12px;
  color: #999;
  font-style: italic;
}

.resolution-options {
  margin-bottom: 24px;
}

.resolution-options h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.option-descriptions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.option:hover {
  background-color: #f9f9f9;
}

.option input[type='radio'] {
  margin-top: 2px;
  cursor: pointer;
}

.option label {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
}

.option-title {
  font-weight: 500;
  font-size: 14px;
  color: #333;
}

.option-desc {
  font-size: 12px;
  color: #999;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  background-color: #fafafa;
}

.btn {
  padding: 8px 24px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #1976d2;
  color: white;
}

.btn-primary:hover {
  background-color: #1565c0;
}

.btn-secondary {
  background-color: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background-color: #bdbdbd;
}

@media (max-width: 600px) {
  .versions-comparison {
    grid-template-columns: 1fr;
  }

  .conflict-dialog-container {
    width: 95%;
    max-height: 90vh;
  }
}
</style>

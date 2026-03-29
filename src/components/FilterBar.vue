<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { exportData, importData, getStorage } from '../storage'

interface Props {
  visibleRarities: number[]
  hideCompleted: boolean
}

interface Emits {
  (e: 'filter-change', rarities: number[], completed: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const rarities = ref<number[]>([3, 4, 5])
const hideCompleted = ref<boolean>(false)
const showExportModal = ref<boolean>(false)
const showImportModal = ref<boolean>(false)
const exportContent = ref<string>('')
const importContent = ref<string>('')
const importMessage = ref<string>('')

watch(
  () => props.visibleRarities,
  (newVal) => {
    rarities.value = newVal
  }
)

watch(
  () => props.hideCompleted,
  (newVal) => {
    hideCompleted.value = newVal
  }
)

function updateFilters(): void {
  emit('filter-change', rarities.value, hideCompleted.value)
}

function toggleRarity(rarity: number): void {
  const index = rarities.value.indexOf(rarity)
  if (index > -1) {
    rarities.value.splice(index, 1)
  } else {
    rarities.value.push(rarity)
    rarities.value.sort()
  }
  updateFilters()
}

function toggleHideCompleted(): void {
  hideCompleted.value = !hideCompleted.value
  updateFilters()
}

function openExportModal(): void {
  exportContent.value = exportData()
  showExportModal.value = true
}

function closeExportModal(): void {
  showExportModal.value = false
}

function copyExportContent(): void {
  navigator.clipboard.writeText(exportContent.value).then(() => {
    alert(t('message.copySuccess') || 'Copied!')
  })
}

function downloadExport(): void {
  const blob = new Blob([exportContent.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `eureka-collection-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function openImportModal(): void {
  importContent.value = ''
  importMessage.value = ''
  showImportModal.value = true
}

function closeImportModal(): void {
  showImportModal.value = false
}

function importFromText(): void {
  if (!importContent.value.trim()) {
    importMessage.value = t('message.importError') || 'Please paste JSON content'
    return
  }

  if (importData(importContent.value)) {
    importMessage.value = t('message.importSuccess') || 'Imported successfully!'
    setTimeout(() => {
      closeImportModal()
      window.location.reload()
    }, 1500)
  } else {
    importMessage.value = t('message.importError') || 'Invalid JSON format'
  }
}

function handleImportFile(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const json = e.target?.result as string
    importContent.value = json
    importFromText()
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="filter-bar">
    <!-- Rarity Filter -->
    <div class="filter-section">
      <h3 class="filter-title">{{ t('filter.rarity') }}</h3>
      <div class="button-group">
        <button
          v-for="rarity in [3, 4, 5]"
          :key="rarity"
          :class="{ active: rarities.includes(rarity) }"
          @click="toggleRarity(rarity)"
          class="filter-button"
        >
          {{ rarity }}⭐
        </button>
      </div>
    </div>

    <!-- Hide Completed Toggle -->
    <div class="filter-section">
      <label class="checkbox-label">
        <input
          type="checkbox"
          :checked="hideCompleted"
          @change="toggleHideCompleted"
        />
        <span>{{ t('filter.hideCompleted') }}</span>
      </label>
    </div>

    <!-- Import/Export -->
    <div class="filter-section">
      <button @click="openExportModal" class="btn-export">
        {{ t('button.export') }}
      </button>
      <button @click="openImportModal" class="btn-import">
        {{ t('button.import') }}
      </button>
    </div>

    <!-- Export Modal -->
    <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ t('button.export') }}</h2>
          <button class="close-btn" @click="closeExportModal">×</button>
        </div>
        <div class="modal-body">
          <p class="modal-hint">{{ t('message.exportHint') || 'Copy the content below or download as file' }}</p>
          <div class="export-textarea-wrapper">
            <textarea
              class="export-content"
              :value="exportContent"
              readonly
              @click="(e) => (e.currentTarget as HTMLTextAreaElement).select()"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button class="btn-primary" @click="copyExportContent">
              {{ t('button.copy') || 'Copy' }}
            </button>
            <button class="btn-primary" @click="downloadExport">
              {{ t('button.download') || 'Download' }}
            </button>
            <button class="btn-secondary" @click="closeExportModal">
              {{ t('button.close') || 'Close' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="closeImportModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ t('button.import') }}</h2>
          <button class="close-btn" @click="closeImportModal">×</button>
        </div>
        <div class="modal-body">
          <p class="modal-hint">{{ t('message.importHint') || 'Paste JSON content or upload a file' }}</p>

          <!-- File Upload -->
          <div class="import-file-section">
            <label class="btn-file">
              {{ t('button.selectFile') || 'Choose File' }}
              <input
                type="file"
                accept=".json"
                @change="handleImportFile"
                style="display: none"
              />
            </label>
          </div>

          <div class="divider">{{ t('button.or') || 'OR' }}</div>

          <!-- Text Input -->
          <div class="import-textarea-wrapper">
            <textarea
              v-model="importContent"
              class="import-content"
              :placeholder="t('message.importPlaceholder') || 'Paste JSON content here...'"
            ></textarea>
          </div>

          <!-- Message -->
          <div v-if="importMessage" :class="['import-message', importMessage.includes('success') || importMessage.includes('successfully') ? 'success' : 'error']">
            {{ importMessage }}
          </div>

          <div class="modal-actions">
            <button class="btn-primary" @click="importFromText">
              {{ t('button.import') }}
            </button>
            <button class="btn-secondary" @click="closeImportModal">
              {{ t('button.close') || 'Close' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: var(--color-bg-default);
  border-radius: 0;
  border: none;
  margin: 0;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.button-group {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.filter-button {
  padding: 8px 12px;
  border: 1px solid var(--color-border-secondary);
  background: var(--color-bg-default);
  cursor: pointer;
  border-radius: var(--border-radius);
  transition: all var(--transition-speed);
  font-size: 13px;
  color: var(--color-text-primary);
  text-align: left;
}

.filter-button:hover {
  border-color: var(--color-text-tertiary);
  background: var(--color-bg-hover);
}

.filter-button.active {
  background: var(--color-primary-light);
  color: var(--color-text-secondary);
  border-color: var(--color-primary-light);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text-primary);
  font-weight: 400;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  accent-color: var(--color-text-primary);
  width: 16px;
  height: 16px;
}

.btn-export,
.btn-import {
  padding: 8px 12px;
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: var(--color-bg-default);
  cursor: pointer;
  border-radius: var(--border-radius);
  transition: all var(--transition-speed);
  font-size: 13px;
  font-weight: 400;
  width: 100%;
  text-align: center;
}

.btn-export:hover,
.btn-import:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--color-bg-default);
  border-radius: var(--modal-border-radius);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid var(--color-border-primary);
}

.modal-header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--color-text-primary);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-speed);
}

.close-btn:hover {
  color: var(--color-text-primary);
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
  box-sizing: border-box;
}

.modal-hint {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.export-textarea-wrapper,
.import-textarea-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-content,
.import-content {
  width: 100%;
  height: 200px;
  padding: 10px;
  border: 1px solid var(--color-border-secondary);
  border-radius: var(--border-radius);
  font-family: 'Courier New', monospace;
  font-size: 12px;
  resize: vertical;
  color: var(--color-text-primary);
  background: var(--color-bg-subtle);
  box-sizing: border-box;
}

.export-content:read-only {
  background: var(--color-bg-subtle);
  cursor: text;
}

.export-content:read-only:focus {
  background: var(--color-bg-default);
  outline: none;
  border-color: var(--color-primary);
}

.import-file-section {
  display: flex;
  gap: 10px;
}

.btn-file {
  flex: 1;
  padding: 10px 12px;
  border: 1px dashed var(--color-primary);
  background: var(--color-primary-lightest);
  color: var(--color-primary);
  cursor: pointer;
  border-radius: var(--border-radius);
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  transition: all var(--transition-speed);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
}

.btn-file:hover {
  background: var(--color-primary);
  color: var(--color-bg-default);
}

.divider {
  text-align: center;
  color: var(--color-text-tertiary);
  font-size: 12px;
  margin: 10px 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background: var(--color-border-primary);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.import-message {
  padding: 10px 12px;
  border-radius: var(--border-radius);
  font-size: 13px;
  text-align: center;
}

.import-message.success {
  background: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success-border);
}

.import-message.error {
  background: var(--color-error-bg);
  color: var(--color-error-text);
  border: 1px solid var(--color-error-border);
}

.modal-actions {
  display: flex;
  gap: 10px;
  padding-top: 10px;
}

.btn-primary {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--color-primary);
  background: var(--color-primary);
  color: var(--color-bg-default);
  cursor: pointer;
  border-radius: var(--border-radius);
  transition: all var(--transition-speed);
  font-size: 13px;
  font-weight: 500;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.btn-secondary {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--color-border-secondary);
  background: var(--color-bg-default);
  color: var(--color-text-primary);
  cursor: pointer;
  border-radius: var(--border-radius);
  transition: all var(--transition-speed);
  font-size: 13px;
  font-weight: 500;
}

.btn-secondary:hover {
  border-color: var(--color-text-tertiary);
  background: var(--color-bg-hover);
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 15px;
    padding: 15px;
  }

  .filter-section {
    flex: 1;
    min-width: 150px;
  }

  .button-group {
    flex-direction: row;
  }
}
</style>

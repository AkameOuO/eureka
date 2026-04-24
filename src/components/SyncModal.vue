<template>
  <div v-if="isOpen" class="sync-modal-overlay" @click.self="closeModal">
    <div class="sync-modal-container">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>{{ t('googleDrive.record_manager') }}</h2>
        <button class="close-btn" @click="closeModal">×</button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <!-- Tabs -->
        <div class="modal-tabs">
          <button
            class="tab-button"
            :class="{ active: activeTab === 'sync' }"
            @click="activeTab = 'sync'"
          >
            ☁️ {{ t('googleDrive.sync_manager') }}
          </button>
          <button
            class="tab-button"
            :class="{ active: activeTab === 'import-export' }"
            @click="activeTab = 'import-export'"
          >
            📁 {{ t('button.import') }}/{{ t('button.export') }}
          </button>
        </div>

        <!-- Sync Tab -->
        <div v-if="activeTab === 'sync'" class="tab-content">
        <!-- Auth Section -->
        <section class="auth-section">
          <h3>{{ t('googleDrive.authentication') }}</h3>

          <div v-if="!accessToken" class="auth-status not-signed-in">
            <div class="status-icon">⚠</div>
            <div class="status-text">{{ t('googleDrive.not_signed_in') }}</div>
            <div class="status-hint">{{ t('googleDrive.sign_in_drive_required') }}</div>
            <button @click="handleRequestPermission" class="btn btn-primary">
              {{ t('googleDrive.sign_in') }}
            </button>
          </div>

          <div v-else class="auth-status authorized">
            <div class="auth-main">
              <div class="status-icon">✓</div>
              <div>
                <div class="status-text">{{ t('googleDrive.authorized') }}</div>
                <div v-if="userProfile" class="user-info-compact">
                  <img v-if="userProfile.picture" :src="userProfile.picture" :alt="userProfile.name" class="user-avatar-small" />
                  <div>
                    <div class="user-name-small">{{ userProfile.name }}</div>
                    <div class="user-email-small">{{ userProfile.email }}</div>
                  </div>
                </div>
              </div>
            </div>
            <button @click="handleSignOut" class="btn btn-secondary btn-small">
              {{ t('googleDrive.sign_out') }}
            </button>
          </div>
        </section>

        <!-- Save Manager Section -->
        <section v-if="isSignedIn && accessToken" class="save-manager-section">
          <h3>{{ t('googleDrive.save_manager') }}</h3>

          <!-- Sync Status -->
          <div v-if="syncError" class="error-message">
            {{ syncError }}
            <button class="close-btn" @click="clearError">×</button>
          </div>

          <!-- Current Save Display -->
          <div class="form-group save-block">
            <div class="save-block-header">
              <label class="save-block-label">{{ t('googleDrive.current_save') }}:</label>
            </div>
            <div class="save-block-content current-save-display">
              <SaveListItem
                v-if="currentSaveItem"
                :save="currentSaveItem"
                :formatted-date="formatDate(currentSaveItem.modifiedTime)"
                :disabled="syncState === 'syncing'"
                @action="handleSaveItemAction"
              />
              <div v-else class="current-save-empty">
                <div class="current-save-empty-title">
                  {{ t('googleDrive.no_applied_save') }}
                </div>
              </div>
            </div>
          </div>

          <!-- Available Saves List -->
          <div class="saves-list-section save-block">
            <div class="save-block-header saves-list-header">
              <label class="save-block-label">{{ t('googleDrive.available_saves') }}:</label>
              <button
                @click="refreshSavesList"
                :disabled="syncState === 'syncing'"
                class="refresh-icon-btn"
                :title="t('googleDrive.refresh')"
                aria-label="Refresh saves"
              >
                ⟳
              </button>
            </div>
            <div class="save-block-content saves-list">
              <div v-if="saves.length === 0" class="no-saves">
                {{ t('googleDrive.no_saves_yet') }}
              </div>
              <SaveListItem
                v-for="save in saves"
                :key="save.id"
                :save="save"
                :formatted-date="formatDate(save.modifiedTime)"
                :disabled="syncState === 'syncing'"
                @action="handleSaveItemAction"
              />
            </div>
          </div>

          <!-- New Save Input -->
          <div class="form-group save-block new-save-section">
            <div class="save-block-header">
              <label for="new-save-input" class="save-block-label">{{ t('googleDrive.new_save') }}:</label>
            </div>
            <div class="save-block-content new-save-content">
              <input
                id="new-save-input"
                v-model="newSaveName"
                type="text"
                :placeholder="t('googleDrive.enter_save_name')"
                class="save-input"
                @keyup.enter="createAndUploadSave"
              />
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button
              @click="createEmptySave"
              :disabled="!newSaveName || syncState === 'syncing'"
              class="btn btn-primary"
            >
              <span v-if="syncState !== 'syncing'">{{ t('googleDrive.create_empty_save') }}</span>
              <span v-else>{{ t('googleDrive.syncing') }}...</span>
            </button>
            <button
              @click="createAndUploadSave"
              :disabled="!newSaveName || syncState === 'syncing'"
              class="btn btn-success"
            >
              <span v-if="syncState !== 'syncing'">{{ t('googleDrive.create_and_upload') }}</span>
              <span v-else>{{ t('googleDrive.syncing') }}...</span>
            </button>
          </div>
        </section>
        </div>

        <!-- Import/Export Tab -->
        <div v-if="activeTab === 'import-export'" class="tab-content">
          <!-- Export Section -->
          <section class="export-section">
            <h3>{{ t('button.export') }}</h3>
            <p class="section-hint">{{ t('message.exportHint') }}</p>
            <div class="export-textarea-wrapper">
              <textarea
                class="export-content"
                :value="exportContent"
                readonly
                @click="(e) => (e.currentTarget as HTMLTextAreaElement).select()"
              ></textarea>
            </div>
            <div class="export-actions">
              <button class="btn btn-primary" @click="copyExportContent">
                {{ t('button.copy') }}
              </button>
              <button class="btn btn-primary" @click="downloadExport">
                {{ t('button.download') }}
              </button>
            </div>
          </section>

          <!-- Divider -->
          <div class="divider">{{ t('button.or') }}</div>

          <!-- Import Section -->
          <section class="import-section">
            <h3>{{ t('button.import') }}</h3>
            <p class="section-hint">{{ t('message.importHint') }}</p>

            <!-- File Upload -->
            <div class="import-file-section">
              <label class="btn-file">
                {{ t('button.selectFile') }}
                <input
                  type="file"
                  accept=".json"
                  @change="handleImportFile"
                  style="display: none"
                />
              </label>
            </div>

            <div class="divider">{{ t('button.or') }}</div>

            <!-- Text Input -->
            <div class="import-textarea-wrapper">
              <textarea
                v-model="importContent"
                class="import-content"
                :placeholder="t('message.importPlaceholder')"
              ></textarea>
            </div>

            <div class="import-actions">
              <button class="btn btn-primary" @click="importFromText">
                {{ t('button.import') }}
              </button>
            </div>
          </section>
        </div>
      </div>

      <!-- Modal Footer -->
      <div v-if="renameDialogOpen" class="rename-dialog-overlay">
        <div class="rename-dialog" @click.stop>
          <h4>{{ t('googleDrive.rename_dialog_title') }}</h4>
          <label for="rename-input" class="rename-dialog-label">{{ t('googleDrive.rename_dialog_label') }}</label>
          <input
            id="rename-input"
            ref="renameInputRef"
            v-model="renameTargetName"
            type="text"
            class="save-input rename-input"
            @keyup.enter="confirmRenameSave"
          />
          <div class="rename-dialog-actions">
            <button class="btn btn-secondary" @click="cancelRenameSave">{{ t('button.cancel') }}</button>
            <button class="btn btn-primary" @click="confirmRenameSave">{{ t('button.confirm') }}</button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="closeModal" class="btn btn-secondary">{{ t('googleDrive.close') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGoogleDriveSync } from '@/composables/useGoogleDriveSync'
import { useGoogleDriveAuth } from '@/composables/useGoogleDriveAuth'
import { useCollection } from '@/composables/useCollection'
import { useToast } from '@/composables/useToast'
import SaveListItem from '@/components/SaveListItem.vue'

const { t } = useI18n()
const { success: toastSuccess, error: toastError } = useToast()
const { syncState, syncError, saves, currentSave, conflictData, listSaves, uploadSave, renameSave, downloadSave, deleteSave, resolveConflict, clearError } = useGoogleDriveSync()
const { isSignedIn, accessToken, userProfile, signOut, requestAccessToken } = useGoogleDriveAuth()
const { collection, exportData, importData } = useCollection()

interface Props {
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const newSaveName = ref('')
const activeTab = ref<'sync' | 'import-export'>('sync')
const exportContent = ref<string>('')
const importContent = ref<string>('')
const renameDialogOpen = ref(false)
const renameSourceName = ref('')
const renameTargetName = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

type SaveAction = 'apply' | 'overwrite' | 'rename' | 'delete'

// Ensure collection is always an array
const collectionData = computed(() => {
  if (!collection.value || !Array.isArray(collection.value)) {
    console.warn('SyncModal: collection is not an array, using empty array')
    return []
  }
  return collection.value
})

const currentSaveItem = computed(() => {
  if (!currentSave.value) return null
  return saves.value.find((save) => save.name === currentSave.value) ?? null
})

watch(renameDialogOpen, async (isOpen) => {
  if (!isOpen) return

  await nextTick()
  renameInputRef.value?.focus()
  renameInputRef.value?.select()
})

/**
 * Format date for display
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Download selected save and replace local collection
 */
async function downloadSelectedSave(saveName: string): Promise<void> {
  if (!saveName.trim()) return

  const data = await downloadSave(saveName)
  if (data && Array.isArray(data)) {
    console.log(`Downloaded ${data.length} items, updating local collection...`)
    // Use collection import flow to keep reactive state and localStorage in sync.
    const imported = importData(JSON.stringify({ collection: data }))
    if (!imported) {
      toastError(t('message.importError'))
      return
    }
    await refreshSavesList()
    toastSuccess(t('googleDrive.download_success'))
  }
}

/**
 * Create new save and upload current collection
 */
async function createAndUploadSave(): Promise<void> {
  if (!newSaveName.value.trim()) return

  const saveName = newSaveName.value.trim()

  if (saves.value.some((save) => save.name === saveName)) {
    toastError(t('googleDrive.save_already_exists'))
    return
  }

  if (!isSignedIn.value) {
    toastError(t('googleDrive.not_signed_in'))
    return
  }

  if (!accessToken.value) {
    toastError(t('googleDrive.no_access_token'))
    return
  }

  const success = await uploadSave(saveName, collectionData.value)

  if (success) {
    newSaveName.value = ''
    await refreshSavesList()
    toastSuccess(t('googleDrive.upload_success'))
  }
}

/**
 * Create an empty save file with valid JSON structure ([])
 */
async function createEmptySave(): Promise<void> {
  if (!newSaveName.value.trim()) return

  const saveName = newSaveName.value.trim()

  if (saves.value.some((save) => save.name === saveName)) {
    toastError(t('googleDrive.save_already_exists'))
    return
  }

  if (!isSignedIn.value) {
    toastError(t('googleDrive.not_signed_in'))
    return
  }

  if (!accessToken.value) {
    toastError(t('googleDrive.no_access_token'))
    return
  }

  const success = await uploadSave(saveName, [])
  if (success) {
    newSaveName.value = ''
    await refreshSavesList()
    toastSuccess(t('googleDrive.empty_save_created'))
  }
}

/**
 * Rename a save file
 */
async function renameSaveItem(saveName: string): Promise<void> {
  renameSourceName.value = saveName
  renameTargetName.value = saveName
  renameDialogOpen.value = true
}

async function confirmRenameSave(): Promise<void> {
  const saveName = renameSourceName.value.trim()
  const trimmedName = renameTargetName.value.trim()

  if (!saveName || !trimmedName) {
    toastError(t('googleDrive.rename_invalid'))
    return
  }

  if (trimmedName === saveName) {
    renameDialogOpen.value = false
    return
  }

  if (saves.value.some((save) => save.name === trimmedName)) {
    toastError(t('googleDrive.save_already_exists'))
    return
  }

  const success = await renameSave(saveName, trimmedName)
  if (success) {
    renameDialogOpen.value = false
    toastSuccess(t('googleDrive.rename_success'))
  }
}

function cancelRenameSave(): void {
  renameDialogOpen.value = false
  renameSourceName.value = ''
  renameTargetName.value = ''
}

/**
 * Overwrite existing save with current collection
 */
async function overwriteSave(saveName: string): Promise<void> {
  if (!saveName.trim()) return

  const success = await uploadSave(saveName, collectionData.value)
  if (success) {
    await refreshSavesList()
    toastSuccess(t('googleDrive.overwrite_success'))
  }
}

/**
 * Delete save by name
 */
async function deleteSelectedSave(saveName: string): Promise<void> {
  if (!saveName.trim()) return

  const success = await deleteSave(saveName)
  if (success) {
    await refreshSavesList()
    toastSuccess(t('googleDrive.deleted_save', { name: saveName }))
  }
}

function handleSaveItemAction(action: SaveAction, saveName: string): void {
  switch (action) {
    case 'apply':
      void downloadSelectedSave(saveName)
      break
    case 'overwrite':
      void overwriteSave(saveName)
      break
    case 'rename':
      void renameSaveItem(saveName)
      break
    case 'delete':
      void deleteSelectedSave(saveName)
      break
  }
}

/**
 * Refresh saves list from Drive
 */
async function refreshSavesList(): Promise<void> {
  console.log('Refreshing saves list...')
  await listSaves()
  console.log('Saves list refreshed, count:', saves.value.length)
}

/**
 * Load saves when signed in
 */
watch([isSignedIn, accessToken], async ([signed, token]) => {
  if (signed && token) {
    console.log('User signed in, loading saves list...')
    await refreshSavesList()
  }
})

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (!isOpen) return

    if (isSignedIn.value && accessToken.value) {
      await refreshSavesList()
    }

    if (activeTab.value === 'import-export') {
      prepareExport()
    }
  }
)

/**
 * Watch for tab changes
 */
watch(activeTab, (newTab) => {
  if (newTab === 'import-export') {
    prepareExport()
  }
})

/**
 * Handle request permission
 */
function handleRequestPermission(): void {
  requestAccessToken()
}

/**
 * Handle sign out
 */
function handleSignOut(): void {
  signOut()
  newSaveName.value = ''
  toastSuccess(t('googleDrive.signed_out'))
}

/**
 * Export functionality
 */
function prepareExport(): void {
  exportContent.value = exportData()
}

function copyExportContent(): void {
  navigator.clipboard.writeText(exportContent.value).then(() => {
    toastSuccess(t('message.copySuccess'))
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

/**
 * Import functionality
 */
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

function importFromText(): void {
  if (!importContent.value.trim()) {
    toastError(t('message.importError'))
    return
  }

  if (importData(importContent.value)) {
    toastSuccess(t('message.importSuccess'))
    importContent.value = ''
    // Reset file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  } else {
    toastError(t('message.importError'))
  }
}

/**
 * Close modal
 */
function closeModal(): void {
  emit('close')
}
</script>

<style scoped>
.sync-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.sync-modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #333;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.modal-content {
  flex: 1;
  padding: 16px 24px;
  overflow-y: auto;
}

/* Modal Tabs */
.modal-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 2px solid #e0e0e0;
  margin-bottom: 16px;
}

.tab-button {
  padding: 10px 16px;
  border: none;
  background: transparent;
  color: #666;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
}

.tab-button:hover {
  color: #333;
}

.tab-button.active {
  color: #FFB6D9;
  border-bottom-color: #FFB6D9;
}

.tab-content {
  animation: fadeIn 0.2s ease;
}

/* Import/Export Styles */
.export-section,
.import-section {
  margin-bottom: 24px;
}

.export-section h3,
.import-section h3 {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: #333;
  font-weight: 600;
  border: none;
  padding: 0;
}

.section-hint {
  font-size: 12px;
  color: #666;
  margin: 0 0 12px 0;
}

.export-textarea-wrapper,
.import-textarea-wrapper {
  margin-bottom: 12px;
}

.export-content,
.import-content {
  width: 100%;
  min-height: 120px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-family: monospace;
  font-size: 12px;
  color: #333;
  background: #f9f9f9;
  box-sizing: border-box;
}

.export-content:focus,
.import-content:focus {
  outline: none;
  border-color: #FFB6D9;
  background: white;
}

.export-actions,
.import-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.import-file-section {
  margin-bottom: 12px;
}

.btn-file {
  display: inline-block;
  padding: 8px 12px;
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.2s ease;
}

.btn-file:hover {
  background: #e0e0e0;
  border-color: #999;
}

.divider {
  text-align: center;
  color: #999;
  font-size: 12px;
  margin: 12px 0;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: #ddd;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

section {
  margin-bottom: 24px;
}

section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
  font-weight: 600;
  border-bottom: 2px solid #FFB6D9;
  padding-bottom: 8px;
}

/* Auth Section Styles */
.auth-section {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 8px;
}

.auth-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px;
  border-radius: 8px;
  gap: 8px;
}

.auth-status.not-signed-in {
  background: #fff3e0;
  border: 1px solid #ffe0b2;
}

.auth-status.need-permission {
  background: #f3e5f5;
  border: 1px solid #e1bee7;
}

.auth-status.authorized {
  background: #e8f5e9;
  border: 1px solid #c8e6c9;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  padding: 10px 12px;
}

.auth-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.status-icon {
  font-size: 32px;
}

.auth-status.authorized .status-icon {
  font-size: 20px;
}

.status-text {
  font-weight: 600;
  font-size: 14px;
  color: #333;
}

.status-hint {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.user-info-compact {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 0;
}

.user-avatar-small {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name-small {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.user-email-small {
  font-size: 11px;
  color: #999;
}

/* Form Groups */
.form-group {
  margin-bottom: 14px;
}

.save-block {
  margin-bottom: 14px;
}

.save-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.save-block-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.save-block-content {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fafafa;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.save-select,
.save-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  color: #333;
  background: white;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.save-select:focus,
.save-input:focus {
  outline: none;
  border-color: #FFB6D9;
  box-shadow: 0 0 0 3px rgba(255, 182, 217, 0.1);
}

.current-save-display {
  overflow: hidden;
}

.current-save-empty {
  padding: 12px 14px;
  color: #666;
}

.current-save-empty-title {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.rename-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.rename-dialog {
  width: min(92vw, 360px);
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rename-dialog h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.rename-dialog-label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.rename-input {
  width: 100%;
}

.rename-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.current-save-empty-hint {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #888;
}

/* Saves List Section */
.saves-list-section {
  margin: 16px 0;
}

.saves-list-header {
  margin-bottom: 8px;
}

.saves-list {
  max-height: 300px;
  overflow-y: auto;
}

.new-save-content {
  padding: 8px;
}

.no-saves {
  padding: 16px;
  text-align: center;
  color: #999;
  font-size: 12px;
}

.refresh-icon-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #d9d9d9;
  border-radius: 999px;
  background: white;
  color: #666;
  font-size: 14px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-icon-btn:hover:not(:disabled) {
  color: #333;
  border-color: #bbb;
  background: #f7f7f7;
}

.refresh-icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Error Message */
.error-message {
  background: #ffebee;
  border: 1px solid #ffcdd2;
  color: #c62828;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 12px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.btn {
  padding: 10px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #e85a95;
  color: white;
  box-shadow: 0 2px 6px rgba(232, 90, 149, 0.35);
}

.btn-primary:hover:not(:disabled) {
  background: #d94a86;
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-success {
  background: #4caf50;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #45a049;
}

.btn-danger {
  background: #f44336;
  color: white;
  grid-column: span 2;
}

.btn-danger:hover:not(:disabled) {
  background: #da190b;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #d0d0d0;
}

.btn-small {
  padding: 6px 8px;
  font-size: 11px;
  margin-top: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Modal Footer */
.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

/* Google Button Container */
.google-button-container {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}

.google-button-container :deep(div) {
  display: flex;
  justify-content: center;
}

/* Responsive */
@media (max-width: 600px) {
  .sync-modal-container {
    width: 95%;
    max-height: 80vh;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-header h2 {
    font-size: 18px;
  }

  .modal-content {
    padding: 16px;
  }

  .action-buttons {
    justify-content: stretch;
  }

  .action-buttons .btn {
    width: 100%;
  }

  .auth-status.authorized {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>

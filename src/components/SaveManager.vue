<template>
  <div class="save-manager">
    <div class="save-manager-header">
      <h3>{{ t('googleDrive.save_manager') }}</h3>
      <span v-if="syncState === 'syncing'" class="sync-icon spinning">⟳</span>
      <span v-else-if="syncState === 'success'" class="sync-icon success">✓</span>
      <span v-else-if="syncState === 'error'" class="sync-icon error">✗</span>
    </div>

    <!-- Error message -->
    <div v-if="syncError" class="error-message">
      {{ syncError }}
      <button class="close-btn" @click="clearError">×</button>
    </div>

    <!-- Main controls -->
    <div class="save-controls">
      <!-- Current save display -->
      <div class="current-save">
        <label>{{ t('googleDrive.current_save') }}:</label>
        <span class="save-name">{{ currentSave || t('googleDrive.unsaved') }}</span>
      </div>

      <!-- Saves list -->
      <div class="saves-list">
        <label>{{ t('googleDrive.available_saves') }}:</label>
        <select v-model="selectedSave" class="save-select">
          <option value="">{{ t('googleDrive.select_save') }}</option>
          <option v-for="save in saves" :key="save.id" :value="save.name">
            {{ save.name }} ({{ formatDate(save.modifiedTime) }})
          </option>
        </select>
      </div>

      <!-- New save input -->
      <div class="new-save-section">
        <label>{{ t('googleDrive.new_save') }}:</label>
        <input
          v-model="newSaveName"
          type="text"
          :placeholder="t('googleDrive.enter_save_name')"
          class="save-input"
          @keyup.enter="createAndUploadSave"
        />
      </div>

      <!-- Action buttons -->
      <div class="action-buttons">
        <button
          @click="uploadCurrentSave"
          :disabled="!currentSave || syncState === 'syncing'"
          class="btn btn-primary"
        >
          <span v-if="syncState !== 'syncing'">{{ t('googleDrive.upload') }}</span>
          <span v-else>{{ t('googleDrive.syncing') }}...</span>
        </button>

        <button
          @click="downloadSelectedSave"
          :disabled="!selectedSave || syncState === 'syncing'"
          class="btn btn-primary"
        >
          <span v-if="syncState !== 'syncing'">{{ t('googleDrive.download') }}</span>
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

        <button
          @click="deleteSelectedSave"
          :disabled="!selectedSave || syncState === 'syncing'"
          class="btn btn-danger"
        >
          {{ t('googleDrive.delete') }}
        </button>

        <button @click="refreshSavesList" :disabled="syncState === 'syncing'" class="btn btn-secondary">
          {{ t('googleDrive.refresh') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useGoogleDriveSync } from '@/composables/useGoogleDriveSync'
import { useGoogleDriveAuth } from '@/composables/useGoogleDriveAuth'
import { useCollection } from '@/composables/useCollection'
import { useToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { success: toastSuccess, error: toastError } = useToast()
const { syncState, syncError, saves, currentSave, conflictData, listSaves, uploadSave, downloadSave, deleteSave, resolveConflict, clearError } = useGoogleDriveSync()
const { isSignedIn, accessToken, error: authError } = useGoogleDriveAuth()
const { collection } = useCollection()

const selectedSave = ref('')
const newSaveName = ref('')

// Ensure collection is always an array
const collectionData = computed(() => {
  if (!collection.value || !Array.isArray(collection.value)) {
    console.warn('SaveManager: collection is not an array, using empty array')
    return []
  }
  return collection.value
})

/**
 * Auto-refresh saves list when user signs in
 */
watch([isSignedIn, accessToken], async ([signed, token]) => {
  if (signed && token) {
    console.log('User signed in with access token, loading saves list...')
    await refreshSavesList()
  }
})

/**
 * Load saves on component mount if already signed in
 */
onMounted(async () => {
  if (isSignedIn.value && accessToken.value) {
    console.log('Component mounted and user is signed in, loading saves...')
    await refreshSavesList()
  }
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
 * Upload current collection to Drive with current save name
 */
async function uploadCurrentSave(): Promise<void> {
  if (!currentSave.value) return

  const success = await uploadSave(currentSave.value, collectionData.value)
  if (success) {
    await refreshSavesList()
  }
}

/**
 * Download selected save and replace local collection
 */
async function downloadSelectedSave(): Promise<void> {
  if (!selectedSave.value) return

  const data = await downloadSave(selectedSave.value)
  if (data && Array.isArray(data)) {
    console.log(`Downloaded ${data.length} items, updating local collection...`)
    // Update local collection with downloaded data
    collection.value = data
    selectedSave.value = ''
    await refreshSavesList()
    toastSuccess(t('googleDrive.download_success'))
  }
}

/**
 * Create new save and upload current collection
 */
async function createAndUploadSave(): Promise<void> {
  if (!newSaveName.value.trim()) return

  if (!isSignedIn.value) {
    toastError(t('googleDrive.not_signed_in'))
    return
  }

  if (!accessToken.value) {
    toastError(t('googleDrive.no_access_token'))
    return
  }

  const saveName = newSaveName.value.trim()
  const success = await uploadSave(saveName, collectionData.value)

  if (success) {
    newSaveName.value = ''
    selectedSave.value = saveName
    await refreshSavesList()
    toastSuccess(t('googleDrive.upload_success'))
  }
}

/**
 * Delete selected save
 */
async function deleteSelectedSave(): Promise<void> {
  if (!selectedSave.value) return

  // Store the save name before showing confirmation
  const saveName = selectedSave.value

  // Show a simple info toast and proceed with deletion
  // (In a real app, you might want a confirmation modal)
  const success = await deleteSave(saveName)
  if (success) {
    selectedSave.value = ''
    await refreshSavesList()
    toastSuccess(t('googleDrive.deleted_save', { name: saveName }))
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
 * Resolve conflict by keeping local version
 */
function keepLocal(): void {
  const result = resolveConflict('local')
  if (result) {
    // TODO: Handle kept data
  }
}

/**
 * Resolve conflict by keeping remote version
 */
async function keepRemote(): Promise<void> {
  const result = resolveConflict('remote')
  if (result) {
    // TODO: Update local collection with remote data
  }
}
</script>

<style scoped>
.save-manager {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  background-color: #fafafa;
}

.save-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e0e0e0;
}

.save-manager-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.sync-icon {
  font-size: 20px;
  font-weight: bold;
}

.sync-icon.spinning {
  animation: spin 1s linear infinite;
  color: #1976d2;
}

.sync-icon.success {
  color: #4caf50;
}

.sync-icon.error {
  color: #f44336;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  background-color: #ffebee;
  border: 1px solid #ef5350;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #c62828;
  font-size: 14px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #c62828;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #b71c1c;
}

.conflict-dialog {
  background-color: #fff3e0;
  border: 2px solid #ff9800;
  border-radius: 4px;
  padding: 16px;
  margin-bottom: 16px;
}

.conflict-dialog h4 {
  margin: 0 0 8px 0;
  color: #e65100;
  font-size: 16px;
}

.conflict-dialog p {
  margin: 0 0 12px 0;
  color: #e65100;
  font-size: 14px;
}

.conflict-buttons {
  display: flex;
  gap: 8px;
}

.save-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.current-save,
.saves-list,
.new-save-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.current-save label,
.saves-list label,
.new-save-section label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.save-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  padding: 4px 8px;
  background-color: #e3f2fd;
  border-radius: 4px;
  display: inline-block;
}

.save-select,
.save-input {
  padding: 8px 12px;
  border: 1px solid #bdbdbd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.save-select:focus,
.save-input:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #1976d2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1565c0;
  box-shadow: 0 2px 4px rgba(25, 118, 210, 0.3);
}

.btn-secondary {
  background-color: #757575;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #616161;
}

.btn-success {
  background-color: #4caf50;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #388e3c;
}

.btn-danger {
  background-color: #f44336;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #d32f2f;
}
</style>

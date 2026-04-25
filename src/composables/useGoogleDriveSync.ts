import { ref, computed } from 'vue'
import { useGoogleDriveAuth } from './useGoogleDriveAuth'
import { devLog } from '@/utils/devLog'

/**
 * Google Drive Sync Composable
 * Handles file operations with Google Drive appdata folder using REST API
 */

const EUREKA_FOLDER_NAME = 'eureka'
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3'
const CURRENT_SAVE_KEY = 'eureka-current-save'

function getCurrentSaveFromStorage(): string | null {
  try {
    const value = localStorage.getItem(CURRENT_SAVE_KEY)
    return value && value.trim().length > 0 ? value : null
  } catch {
    return null
  }
}

function persistCurrentSave(saveName: string | null): void {
  try {
    if (saveName) {
      localStorage.setItem(CURRENT_SAVE_KEY, saveName)
    } else {
      localStorage.removeItem(CURRENT_SAVE_KEY)
    }
  } catch {
    // Ignore storage persistence failures to keep sync flow resilient.
  }
}

function setCurrentSave(saveName: string | null): void {
  currentSave.value = saveName
  persistCurrentSave(saveName)
}

// State
const syncState = ref<'idle' | 'syncing' | 'success' | 'error'>('idle')
const syncError = ref<string | null>(null)
const saves = ref<Array<{ id: string; name: string; modifiedTime: string }>>([])
const currentSave = ref<string | null>(getCurrentSaveFromStorage())
const conflictData = ref<{
  local: any
  remote: any
  fileName: string
} | null>(null)

/**
 * Make an API call to Google Drive
 */
async function apiCall(
  method: string,
  endpoint: string,
  options?: RequestInit
): Promise<any> {
  const { accessToken, isSignedIn } = useGoogleDriveAuth()

  if (!isSignedIn.value) {
    throw new Error('Not signed in. Please sign in first to use Drive API.')
  }

  if (!accessToken.value) {
    console.error('Access token not available', {
      isSignedIn: isSignedIn.value,
      tokenNull: accessToken.value === null,
      tokenUndefined: accessToken.value === undefined,
    })
    throw new Error('No access token available. Please sign in again.')
  }

  const url = `${DRIVE_API_BASE}${endpoint}`
  devLog(`[Drive API] ${method} ${endpoint}`, { tokenLength: accessToken.value.length })

  // Merge headers properly - Authorization MUST be the last property set
  const mergedHeaders: HeadersInit = {
    ...(options?.headers || {}),
    Authorization: `Bearer ${accessToken.value}`,
  }

  devLog('Request headers:', {
    hasAuth: !!(mergedHeaders as Record<string, string>).Authorization,
    contentType: (mergedHeaders as Record<string, any>)['Content-Type'],
  })

  const response = await fetch(url, {
    method,
    ...options,
    headers: mergedHeaders,  // Must be AFTER ...options to avoid being overwritten
  })

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`
    try {
      const errorBody = await response.json()
      errorMessage = errorBody.error?.message || errorMessage
      console.error('Drive API error response:', errorBody)
      if (errorBody.error?.errors) {
        console.error('API error details:', errorBody.error.errors)
      }
    } catch {
      // Ignore error parsing errors
    }
    throw new Error(errorMessage)
  }

  // Handle empty responses
  if (response.status === 204) {
    return null
  }

  return response.json()
}

/**
 * Get or create the eureka folder in appdata
 */
async function getOrCreateEurekaFolder(): Promise<string> {
  try {
    // Search for existing eureka folder in appdata
    const query = encodeURIComponent(
      `name='${EUREKA_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
    )
    devLog('Searching for eureka folder...')
    const response = await apiCall('GET', `/files?spaces=appDataFolder&q=${query}&fields=files(id, name)&pageSize=1`)

    if (response.files && response.files.length > 0) {
      devLog('Eureka folder found:', response.files[0].id)
      return response.files[0].id
    }

    // Create folder if it doesn't exist
    devLog('Eureka folder not found, creating new folder...')
    const createResponse = await apiCall('POST', '/files?fields=id', {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: EUREKA_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['appDataFolder'],
      }),
    })

    devLog('Eureka folder created:', createResponse.id)
    return createResponse.id
  } catch (error) {
    console.error('Error in getOrCreateEurekaFolder:', error)
    throw new Error(`Failed to access eureka folder: ${error}`)
  }
}

/**
 * List all save files in eureka folder
 */
async function listSaves(): Promise<void> {
  syncState.value = 'syncing'
  syncError.value = null

  try {
    const folderId = await getOrCreateEurekaFolder()

    const query = encodeURIComponent(
      `'${folderId}' in parents and mimeType='application/json' and trashed=false`
    )
    const response = await apiCall('GET', `/files?spaces=appDataFolder&q=${query}&fields=files(id, name, modifiedTime)&pageSize=100`)

    saves.value =
      response.files?.map((file: any) => ({
        id: file.id,
        name: file.name.replace(/\.json$/, ''),
        modifiedTime: file.modifiedTime,
      })).sort(
        (a: { modifiedTime: string }, b: { modifiedTime: string }) =>
          new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
      ) || []

    // Keep the current save only when it still exists; otherwise clear it.
    if (currentSave.value && !saves.value.some((save) => save.name === currentSave.value)) {
      setCurrentSave(null)
    }

    syncState.value = 'success'
  } catch (error) {
    syncError.value = `Failed to list saves: ${error}`
    syncState.value = 'error'
    console.error('Error listing saves:', error)
  }
}

/**
 * Upload collection to Drive
 */
async function uploadSave(saveName: string, collectionData: string[]): Promise<boolean> {
  syncState.value = 'syncing'
  syncError.value = null

  try {
    const folderId = await getOrCreateEurekaFolder()
    const fileName = `${saveName}.json`
    const fileContent = JSON.stringify(collectionData, null, 2)

    // Check if file already exists
    const query = encodeURIComponent(`'${folderId}' in parents and name='${fileName}' and trashed=false`)
    const existingFiles = await apiCall('GET', `/files?spaces=appDataFolder&q=${query}&fields=files(id)&pageSize=1`)

    let fileId: string

    if (existingFiles.files && existingFiles.files.length > 0) {
      // File exists - update it
      fileId = existingFiles.files[0].id
      devLog(`File already exists: ${fileId}`)
    } else {
      // Create new file
      devLog('Creating new file...')

      const createResponse = await apiCall('POST', '/files', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: fileName,
          parents: [folderId],
          mimeType: 'application/json',
        }),
      })

      fileId = createResponse.id
      devLog('File created:', fileId)
    }

    // Update file content using simple media upload
    devLog('Uploading file content...')
    devLog(`File content to upload: ${fileContent.length} bytes`)

    const { accessToken } = useGoogleDriveAuth()
    if (!accessToken.value) {
      throw new Error('No access token available')
    }

    // Use simple media upload (uploadType=media)
    // Note: media upload requires the /upload/ endpoint, not the standard /drive/ endpoint
    const uploadUrl = `${DRIVE_API_BASE.replace('/drive/v3', '/upload/drive/v3')}/files/${fileId}?uploadType=media`
    devLog(`Uploading to: ${uploadUrl}`)

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
      },
      body: fileContent,
    })

    devLog(`Upload response status: ${uploadResponse.status} ${uploadResponse.statusText}`)

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('Upload error response:', errorText)
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`)
    }

    const uploadResult = await uploadResponse.json()
    devLog('Upload result:', {
      id: uploadResult?.id,
      name: uploadResult?.name,
      size: uploadResult?.size,
    })

    setCurrentSave(saveName)
    syncState.value = 'success'
    devLog(`Upload successful: ${fileName}`)
    await listSaves()
    return true
  } catch (error) {
    syncError.value = `Failed to upload save: ${error}`
    syncState.value = 'error'
    console.error('Error uploading save:', error)
    return false
  }
}

/**
 * Rename an existing save file in Drive
 */
async function renameSave(oldSaveName: string, newSaveName: string): Promise<boolean> {
  syncState.value = 'syncing'
  syncError.value = null

  try {
    const folderId = await getOrCreateEurekaFolder()
    const oldFileName = `${oldSaveName}.json`
    const newFileName = `${newSaveName}.json`

    if (oldSaveName === newSaveName) {
      syncState.value = 'success'
      return true
    }

    const duplicateQuery = encodeURIComponent(`'${folderId}' in parents and name='${newFileName}' and trashed=false`)
    const duplicateFiles = await apiCall('GET', `/files?spaces=appDataFolder&q=${duplicateQuery}&fields=files(id)&pageSize=1`)

    if (duplicateFiles.files && duplicateFiles.files.length > 0) {
      syncError.value = `Save name already exists: ${newSaveName}`
      syncState.value = 'error'
      return false
    }

    const query = encodeURIComponent(`'${folderId}' in parents and name='${oldFileName}' and trashed=false`)
    const fileList = await apiCall('GET', `/files?spaces=appDataFolder&q=${query}&fields=files(id)&pageSize=1`)

    if (!fileList.files || fileList.files.length === 0) {
      syncError.value = `Save file not found: ${oldSaveName}`
      syncState.value = 'error'
      return false
    }

    const fileId = fileList.files[0].id
    await apiCall('PATCH', `/files/${fileId}?fields=id,name`, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newFileName,
      }),
    })

    if (currentSave.value === oldSaveName) {
      setCurrentSave(newSaveName)
    }

    syncState.value = 'success'
    await listSaves()
    return true
  } catch (error) {
    syncError.value = `Failed to rename save: ${error}`
    syncState.value = 'error'
    console.error('Error renaming save:', error)
    return false
  }
}

/**
 * Download collection from Drive
 */
async function downloadSave(saveName: string): Promise<string[] | null> {
  syncState.value = 'syncing'
  syncError.value = null

  try {
    const folderId = await getOrCreateEurekaFolder()
    const fileName = `${saveName}.json`

    // Find file
    const query = encodeURIComponent(`'${folderId}' in parents and name='${fileName}' and trashed=false`)
    const fileList = await apiCall('GET', `/files?spaces=appDataFolder&q=${query}&fields=files(id, modifiedTime, size, mimeType)&pageSize=1`)

    if (!fileList.files || fileList.files.length === 0) {
      syncError.value = `Save file not found: ${saveName}`
      syncState.value = 'error'
      return null
    }

    const fileMetadata = fileList.files[0]
    const fileId = fileMetadata.id
    const fileModifiedTime = fileMetadata.modifiedTime
    const fileSize = fileMetadata.size

    devLog(`Found file: ${fileId}, size: ${fileSize}, mimeType: ${fileMetadata.mimeType}`)

    // Get file content using media download
    const { accessToken } = useGoogleDriveAuth()

    if (!accessToken.value) {
      throw new Error('No access token available for download')
    }

    devLog(`Downloading file with token length: ${accessToken.value.length}`)

    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
    const contentResponse = await fetch(downloadUrl, {
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        'Accept': 'application/json',
      },
    })

    devLog(`Download response status: ${contentResponse.status} ${contentResponse.statusText}`)

    if (!contentResponse.ok) {
      const errorText = await contentResponse.text()
      console.error('Download error response:', errorText)
      throw new Error(`Failed to download file: ${contentResponse.status} ${contentResponse.statusText}`)
    }

    // Parse the text content as JSON
    const textContent = await contentResponse.text()

    devLog(`Downloaded text length: ${textContent.length}, first 100 chars: ${textContent.substring(0, 100)}`)

    if (!textContent || textContent.trim().length === 0) {
      throw new Error('Downloaded file is empty')
    }

    const remoteData = JSON.parse(textContent) as string[]

    if (!Array.isArray(remoteData)) {
      throw new Error(`Downloaded data is not an array, got: ${typeof remoteData}`)
      syncError.value = 'Conflict detected between local and remote versions'
      return null
    }

    setCurrentSave(saveName)
    localStorage.setItem(`eureka-save-time-${saveName}`, fileModifiedTime)
    syncState.value = 'success'
    devLog(`Download successful: ${remoteData.length} items`)
    return remoteData
  } catch (error) {
    syncError.value = `Failed to download save: ${error}`
    syncState.value = 'error'
    console.error('Error downloading save:', error)
    return null
  }
}

/**
 * Delete a save file from Drive
 */
async function deleteSave(saveName: string): Promise<boolean> {
  syncState.value = 'syncing'
  syncError.value = null

  try {
    const folderId = await getOrCreateEurekaFolder()
    const fileName = `${saveName}.json`

    const query = encodeURIComponent(`'${folderId}' in parents and name='${fileName}' and trashed=false`)
    const fileList = await apiCall('GET', `/files?spaces=appDataFolder&q=${query}&fields=files(id)&pageSize=1`)

    if (!fileList.files || fileList.files.length === 0) {
      syncError.value = `File not found: ${saveName}`
      syncState.value = 'error'
      return false
    }

    const fileId = fileList.files[0].id

    await apiCall('DELETE', `/files/${fileId}`)

    if (currentSave.value === saveName) {
      setCurrentSave(null)
    }

    syncState.value = 'success'
    await listSaves()
    return true
  } catch (error) {
    syncError.value = `Failed to delete save: ${error}`
    syncState.value = 'error'
    console.error('Error deleting save:', error)
    return false
  }
}

/**
 * Handle conflict by choosing which version to keep
 */
function resolveConflict(keepVersion: 'local' | 'remote'): any | null {
  if (!conflictData.value) {
    return null
  }

  const result = keepVersion === 'local' ? conflictData.value.local : conflictData.value.remote

  conflictData.value = null
  syncState.value = 'idle'
  syncError.value = null

  return result
}

/**
 * Clear sync error
 */
function clearError(): void {
  syncError.value = null
  if (syncState.value === 'error') {
    syncState.value = 'idle'
  }
}

export function useGoogleDriveSync() {
  return {
    // State
    syncState: computed(() => syncState.value),
    syncError: computed(() => syncError.value),
    saves: computed(() => saves.value),
    currentSave: computed(() => currentSave.value),
    conflictData: computed(() => conflictData.value),

    // Methods
    listSaves,
    uploadSave,
    renameSave,
    downloadSave,
    deleteSave,
    resolveConflict,
    clearError,
  }
}

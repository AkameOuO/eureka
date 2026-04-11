import { ref } from 'vue'
import type { Settings } from '../types'

const SETTINGS_KEY = 'eureka-settings'

const DEFAULT_SETTINGS: Settings = {
  visibleRarities: [3, 4, 5],
  hideCompleted: false,
  locale: 'zh_tw'
}

function getSettingsFromStorage(): Settings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY)
    if (!data) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) } as Settings
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettingsToStorage(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    console.error('Failed to save settings')
  }
}

// 單一實例
let settingsInstance: ReturnType<typeof createSettings> | null = null

function createSettings() {
  const settings = ref<Settings>(getSettingsFromStorage())

  const updateSettings = (partial: Partial<Settings>): void => {
    settings.value = { ...settings.value, ...partial }
    saveSettingsToStorage(settings.value)
  }

  const updateVisibleRarities = (rarities: number[]): void => {
    updateSettings({ visibleRarities: rarities })
  }

  const updateHideCompleted = (hide: boolean): void => {
    updateSettings({ hideCompleted: hide })
  }

  const updateLocale = (locale: string): void => {
    updateSettings({ locale })
  }

  const resetToDefaults = (): void => {
    settings.value = DEFAULT_SETTINGS
    saveSettingsToStorage(settings.value)
  }

  const refreshSettings = (): void => {
    settings.value = getSettingsFromStorage()
  }

  return {
    settings,
    updateSettings,
    updateVisibleRarities,
    updateHideCompleted,
    updateLocale,
    resetToDefaults,
    refreshSettings
  }
}

export function useSettings() {
  if (!settingsInstance) {
    settingsInstance = createSettings()
  }
  return settingsInstance
}

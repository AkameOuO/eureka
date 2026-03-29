import type { LocalStorage, Settings } from './types'

const STORAGE_KEY = 'eureka-collection'

const DEFAULT_STORAGE: LocalStorage = {
  collection: [],
  settings: {
    visibleRarities: [3, 4, 5],
    hideCompleted: false
  }
}

export function getStorage(): LocalStorage {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return DEFAULT_STORAGE
    return JSON.parse(data)
  } catch {
    return DEFAULT_STORAGE
  }
}

export function setStorage(data: LocalStorage): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function addToCollection(id: string): void {
  const storage = getStorage()
  if (!storage.collection.includes(id)) {
    storage.collection.push(id)
    setStorage(storage)
  }
}

export function removeFromCollection(id: string): void {
  const storage = getStorage()
  storage.collection = storage.collection.filter(item => item !== id)
  setStorage(storage)
}

export function isCollected(id: string): boolean {
  const storage = getStorage()
  return storage.collection.includes(id)
}

export function updateSettings(settings: Partial<Settings>): void {
  const storage = getStorage()
  storage.settings = { ...storage.settings, ...settings }
  setStorage(storage)
}

export function exportData(): string {
  const storage = getStorage()
  return JSON.stringify({ collection: storage.collection }, null, 2)
}

export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString)
    if (!data.collection || !Array.isArray(data.collection)) {
      throw new Error('Invalid data format')
    }
    const storage = getStorage()
    storage.collection = data.collection
    setStorage(storage)
    return true
  } catch {
    return false
  }
}

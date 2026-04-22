import { ref, computed } from 'vue'

const COLLECTION_KEY = 'eureka-collection'
const DEFAULT_COLLECTION: string[] = []

function getCollectionFromStorage(): string[] {
  try {
    const data = localStorage.getItem(COLLECTION_KEY)
    if (!data) return DEFAULT_COLLECTION
    const parsed = JSON.parse(data)
    // Ensure it's an array
    if (!Array.isArray(parsed)) {
      console.warn('Invalid collection data in localStorage, resetting to default')
      return DEFAULT_COLLECTION
    }
    return parsed
  } catch (err) {
    console.warn('Failed to parse collection from storage:', err)
    return DEFAULT_COLLECTION
  }
}

function saveCollectionToStorage(collection: string[]): void {
  try {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection))
  } catch {
    console.error('Failed to save collection')
  }
}

// 單一實例
let collectionInstance: ReturnType<typeof createCollection> | null = null

function createCollection() {
  const collection = ref<string[]>(getCollectionFromStorage())

  const addToCollection = (id: string): void => {
    if (!collection.value.includes(id)) {
      collection.value.push(id)
      saveCollectionToStorage(collection.value)
    }
  }

  const removeFromCollection = (id: string): void => {
    collection.value = collection.value.filter(item => item !== id)
    saveCollectionToStorage(collection.value)
  }

  const isCollected = (id: string): boolean => {
    return collection.value.includes(id)
  }

  const toggleCollection = (id: string): void => {
    if (isCollected(id)) {
      removeFromCollection(id)
    } else {
      addToCollection(id)
    }
  }

  const exportData = (): string => {
    return JSON.stringify({ collection: collection.value }, null, 2)
  }

  const importData = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString)
      if (!data.collection || !Array.isArray(data.collection)) {
        throw new Error('Invalid data format')
      }
      collection.value = data.collection
      saveCollectionToStorage(collection.value)
      return true
    } catch {
      return false
    }
  }

  const cleanCollection = (validIds: Set<string>, validColors: Set<string>): void => {
    // Ensure collection.value is an array
    if (!Array.isArray(collection.value)) {
      console.warn('collection.value is not an array, resetting')
      collection.value = []
      saveCollectionToStorage(collection.value)
      return
    }

    const slots = new Set(['head', 'hand', 'foot'])
    const cleanedCollection = collection.value.filter(item => {
      const parts = item.split('_')
      if (parts.length < 3) return false

      const slot = parts.pop()
      const color = parts.pop()
      const eurekaId = parts.join('_')

      return eurekaId && color && slot && validIds.has(eurekaId) && validColors.has(color) && slots.has(slot)
    })

    if (cleanedCollection.length !== collection.value.length) {
      collection.value = cleanedCollection
      saveCollectionToStorage(collection.value)
    }
  }

  const collectionSize = computed(() => collection.value.length)

  const refreshCollection = (): void => {
    collection.value = getCollectionFromStorage()
  }

  return {
    collection,
    addToCollection,
    removeFromCollection,
    isCollected,
    toggleCollection,
    exportData,
    importData,
    cleanCollection,
    collectionSize,
    refreshCollection
  }
}

export function useCollection() {
  if (!collectionInstance) {
    collectionInstance = createCollection()
  }
  return collectionInstance
}

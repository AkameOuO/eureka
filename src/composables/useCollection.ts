import { ref, computed } from 'vue'
import { registerStorageSync } from '@/utils/storageSync'

const COLLECTION_KEY = 'eureka-collection'
const COLLECTION_UPDATED_AT_KEY = 'eureka-collection-updated-at'
const COLLECTION_STATE_KEY = 'eureka-collection-state-v2'
const DEFAULT_COLLECTION: string[] = []
const STORAGE_LOCK_KEY = 'eureka-collection-lock'
const LOCK_TTL_MS = 2000

interface CollectionState {
  collection: string[]
  updatedAt: string | null
  revision: number
  writerId: string
}

const TAB_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

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

function getCollectionUpdatedAtFromStorage(): string | null {
  try {
    return localStorage.getItem(COLLECTION_UPDATED_AT_KEY)
  } catch {
    return null
  }
}

function isValidCollectionState(value: unknown): value is CollectionState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<CollectionState>
  return Array.isArray(candidate.collection)
    && typeof candidate.revision === 'number'
    && typeof candidate.writerId === 'string'
}

function getCollectionStateFromStorage(): CollectionState {
  try {
    const stateRaw = localStorage.getItem(COLLECTION_STATE_KEY)
    if (stateRaw) {
      const parsed = JSON.parse(stateRaw)
      if (isValidCollectionState(parsed)) {
        return {
          collection: parsed.collection,
          updatedAt: parsed.updatedAt ?? null,
          revision: parsed.revision,
          writerId: parsed.writerId,
        }
      }
    }
  } catch (err) {
    console.warn('Failed to parse collection state from storage:', err)
  }

  return {
    collection: getCollectionFromStorage(),
    updatedAt: getCollectionUpdatedAtFromStorage(),
    revision: 0,
    writerId: 'legacy',
  }
}

function saveCollectionToStorage(collection: string[], revision: number): string | null {
  try {
    const updatedAt = new Date().toISOString()
    const state: CollectionState = {
      collection,
      updatedAt,
      revision,
      writerId: TAB_ID,
    }

    localStorage.setItem(COLLECTION_STATE_KEY, JSON.stringify(state))
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(collection))
    localStorage.setItem(COLLECTION_UPDATED_AT_KEY, updatedAt)
    return updatedAt
  } catch {
    console.error('Failed to save collection')
    return null
  }
}

function compareStateFreshness(a: CollectionState, b: CollectionState): number {
  if (a.revision !== b.revision) {
    return a.revision - b.revision
  }

  const aTime = a.updatedAt ?? ''
  const bTime = b.updatedAt ?? ''
  if (aTime !== bTime) {
    return aTime.localeCompare(bTime)
  }

  return 0
}

function acquireStorageLock(): boolean {
  const now = Date.now()

  try {
    const raw = localStorage.getItem(STORAGE_LOCK_KEY)
    if (raw) {
      const [owner, expiresAtRaw] = raw.split(':')
      const expiresAt = Number.parseInt(expiresAtRaw ?? '', 10)
      if (owner && Number.isFinite(expiresAt) && expiresAt > now && owner !== TAB_ID) {
        return false
      }
    }

    localStorage.setItem(STORAGE_LOCK_KEY, `${TAB_ID}:${now + LOCK_TTL_MS}`)
    const verify = localStorage.getItem(STORAGE_LOCK_KEY)
    return verify?.startsWith(`${TAB_ID}:`) ?? false
  } catch {
    return false
  }
}

function releaseStorageLock(): void {
  try {
    const raw = localStorage.getItem(STORAGE_LOCK_KEY)
    if (raw?.startsWith(`${TAB_ID}:`)) {
      localStorage.removeItem(STORAGE_LOCK_KEY)
    }
  } catch {
    // ignore
  }
}

// 單一實例
let collectionInstance: ReturnType<typeof createCollection> | null = null

function createCollection() {
  const initialState = getCollectionStateFromStorage()
  const collection = ref<string[]>(initialState.collection)
  const collectionUpdatedAt = ref<string | null>(initialState.updatedAt)
  const collectionRevision = ref<number>(initialState.revision)

  const applyStateIfNewer = (candidate: CollectionState): void => {
    const current: CollectionState = {
      collection: collection.value,
      updatedAt: collectionUpdatedAt.value,
      revision: collectionRevision.value,
      writerId: TAB_ID,
    }

    if (compareStateFreshness(candidate, current) > 0) {
      collection.value = candidate.collection
      collectionUpdatedAt.value = candidate.updatedAt
      collectionRevision.value = candidate.revision
    }
  }

  const refreshCollection = (): void => {
    const next = getCollectionStateFromStorage()
    applyStateIfNewer(next)
  }

  const mutateCollection = (mutator: (base: string[]) => string[]): void => {
    if (!acquireStorageLock()) {
      // Another tab is writing now; pull latest and apply on top.
      refreshCollection()
    }

    try {
      const latest = getCollectionStateFromStorage()
      const nextCollection = mutator([...latest.collection])
      const nextRevision = latest.revision + 1
      const updatedAt = saveCollectionToStorage(nextCollection, nextRevision)
      if (!updatedAt) {
        return
      }

      collection.value = nextCollection
      collectionUpdatedAt.value = updatedAt
      collectionRevision.value = nextRevision
    } finally {
      releaseStorageLock()
    }
  }

  registerStorageSync({
    watchedKeys: [COLLECTION_STATE_KEY, COLLECTION_KEY, COLLECTION_UPDATED_AT_KEY],
    onSync: refreshCollection,
  })

  const addToCollection = (id: string): void => {
    mutateCollection((base) => {
      if (!base.includes(id)) {
        base.push(id)
      }
      return base
    })
  }

  const removeFromCollection = (id: string): void => {
    mutateCollection((base) => base.filter(item => item !== id))
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
      mutateCollection(() => data.collection)
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
      mutateCollection(() => [])
      return
    }

    mutateCollection((base) => {
      const slots = new Set(['head', 'hand', 'foot'])
      return base.filter(item => {
        const parts = item.split('_')
        if (parts.length < 3) return false

        const slot = parts.pop()
        const color = parts.pop()
        const eurekaId = parts.join('_')

        return eurekaId && color && slot && validIds.has(eurekaId) && validColors.has(color) && slots.has(slot)
      })
    })
  }

  const collectionSize = computed(() => collection.value.length)

  return {
    collection,
    collectionUpdatedAt,
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

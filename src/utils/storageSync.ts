interface StorageSyncOptions {
  watchedKeys: string[]
  onSync: () => void
  includeVisibilityChange?: boolean
}

/**
 * Register cross-tab and page-resume sync hooks for localStorage-backed state.
 * Returns a cleanup function for optional teardown.
 */
export function registerStorageSync(options: StorageSyncOptions): () => void {
  const watchedKeySet = new Set(options.watchedKeys)

  const handleStorageEvent = (event: StorageEvent): void => {
    if (event.storageArea !== localStorage) return
    if (event.key !== null && !watchedKeySet.has(event.key)) {
      return
    }

    options.onSync()
  }

  const handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      options.onSync()
    }
  }

  window.addEventListener('storage', handleStorageEvent)

  if (options.includeVisibilityChange !== false) {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  return () => {
    window.removeEventListener('storage', handleStorageEvent)

    if (options.includeVisibilityChange !== false) {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }
}
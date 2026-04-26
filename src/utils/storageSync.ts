interface StorageSyncOptions {
  watchedKeys: string[]
  onSync: () => void
  includeVisibilityChange?: boolean
  includePageShow?: boolean
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

  const handlePageShow = (event: PageTransitionEvent): void => {
    // `pageshow` fires on every page load. Only sync on BFCache restore.
    if (!event.persisted) {
      return
    }

    options.onSync()
  }

  window.addEventListener('storage', handleStorageEvent)

  if (options.includeVisibilityChange !== false) {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }

  if (options.includePageShow !== false) {
    window.addEventListener('pageshow', handlePageShow)
  }

  return () => {
    window.removeEventListener('storage', handleStorageEvent)

    if (options.includeVisibilityChange !== false) {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }

    if (options.includePageShow !== false) {
      window.removeEventListener('pageshow', handlePageShow)
    }
  }
}
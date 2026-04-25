import { ref, computed, watch } from 'vue'
import { registerStorageSync } from '@/utils/storageSync'
import { devLog } from '@/utils/devLog'

/**
 * Google Identity Services Authentication Composable
 * Handles GIS initialization, login/logout, and access token management
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
]
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'

// Storage keys
const STORAGE_KEY_TOKEN = 'eureka_google_access_token'
const STORAGE_KEY_TOKEN_EXPIRY = 'eureka_google_token_expiry'

// State
const isInitialized = ref(false)
const isSignedIn = ref(false)
const accessToken = ref<string | null>(null)
const isAuthTimedOut = ref(false)
const error = ref<string | null>(null)
const isLoading = ref(false)
const tokenExpiryAt = ref<number | null>(null)

watch(accessToken, (value) => {
  if (typeof value === 'string') {
    console.error('[Auth][watch accessToken]', value.slice(0, 8))
    return
  }

  console.error('[Auth][watch accessToken]', value)
})

function setAccessToken(nextValue: string | null, reason: string): void {
  const previousValue = accessToken.value
  accessToken.value = nextValue

  if (nextValue === null) {
    console.error('[Auth][setAccessToken -> null]', {
      reason,
      previousPreview: typeof previousValue === 'string' ? previousValue.slice(0, 8) : previousValue,
      stack: new Error().stack,
    })
    return
  }

  console.error('[Auth][setAccessToken -> string]', {
    reason,
    preview: nextValue.slice(0, 8),
  })
}

// Declare Google global types for better TypeScript support
declare let google: any

// OAuth client reference (will be set during initialization)
let tokenClient: any = null
let gisScriptPromise: Promise<void> | null = null
let scopeRetryAttempted = false
let tokenExpiryTimer: ReturnType<typeof setTimeout> | null = null
let authSyncListenersRegistered = false
let isAuthRequestInFlight = false
let authRequestTimeout: ReturnType<typeof setTimeout> | null = null

function clearAuthRequestTimeout(): void {
  if (!authRequestTimeout) return
  clearTimeout(authRequestTimeout)
  authRequestTimeout = null
}

function startAuthRequestGuard(): void {
  isAuthRequestInFlight = true
  clearAuthRequestTimeout()

  // Avoid getting stuck in "in-flight" state when user dismisses auth prompt.
  authRequestTimeout = setTimeout(() => {
    isAuthRequestInFlight = false
    clearAuthRequestTimeout()
  }, 30_000)
}

function finishAuthRequestGuard(): void {
  isAuthRequestInFlight = false
  clearAuthRequestTimeout()
}

function clearTokenExpiryTimer(): void {
  if (!tokenExpiryTimer) return
  clearTimeout(tokenExpiryTimer)
  tokenExpiryTimer = null
}

function scheduleTokenExpiryTimer(): void {
  clearTokenExpiryTimer()

  if (!accessToken.value || !tokenExpiryAt.value) {
    return
  }

  const msUntilExpiry = tokenExpiryAt.value - Date.now()
  const delay = Math.max(msUntilExpiry, 0)

  tokenExpiryTimer = setTimeout(() => {
    clearAccessTokenOnly(true)
  }, delay)
}

function loadGoogleIdentityServices(): Promise<void> {
  const googleApi = (window as Window & { google?: any }).google

  if (googleApi) {
    return Promise.resolve()
  }

  if (gisScriptPromise) {
    return gisScriptPromise
  }

  gisScriptPromise = new Promise((resolve, reject) => {
    const scriptSelector = 'script[src="https://accounts.google.com/gsi/client"]'
    const existingScript = document.querySelector(scriptSelector) as HTMLScriptElement | null

    const handleLoad = () => {
      const loadedGoogleApi = (window as Window & { google?: any }).google
      if (loadedGoogleApi) {
        resolve()
      } else {
        reject(new Error('Google Identity Services script loaded but window.google is unavailable'))
      }
    }

    const handleError = () => {
      reject(new Error('Failed to load Google Identity Services script'))
    }

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad, { once: true })
      existingScript.addEventListener('error', handleError, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = handleLoad
    script.onerror = handleError
    document.head.appendChild(script)
  })

  return gisScriptPromise
}

/**
 * Load persisted auth state from localStorage
 */
function loadPersistedAuthState(): { hasValidToken: boolean; hasSavedAuthState: boolean } {
  try {
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN)
    const savedExpiry = localStorage.getItem(STORAGE_KEY_TOKEN_EXPIRY)
    let hasValidToken = false
    let hasExpiredToken = false
    const hasSavedAuthState = Boolean(savedToken || savedExpiry)

    // Check if token is still valid (not expired)
    if (savedToken && savedExpiry) {
      const expiryTime = parseInt(savedExpiry, 10)
      const now = Date.now()

      if (Number.isFinite(expiryTime) && now < expiryTime) {
        setAccessToken(savedToken, 'loadPersistedAuthState:restore-valid-token')
        tokenExpiryAt.value = expiryTime
        isAuthTimedOut.value = false
        hasValidToken = true
        devLog('Restored access token from localStorage')
      } else {
        devLog('Saved token expired, clearing')
        localStorage.removeItem(STORAGE_KEY_TOKEN)
        localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY)
        hasExpiredToken = true
      }
    }

    if (hasValidToken) {
      isSignedIn.value = true
      scheduleTokenExpiryTimer()
    } else {
      clearTokenExpiryTimer()
      setAccessToken(null, 'loadPersistedAuthState:no-valid-token')
      tokenExpiryAt.value = null
      isSignedIn.value = false
      isAuthTimedOut.value = hasExpiredToken
    }

    return { hasValidToken, hasSavedAuthState }
  } catch (err) {
    console.error('Error loading persisted auth state:', err)
    return { hasValidToken: false, hasSavedAuthState: false }
  }
}

async function validateAccessTokenScopes(token: string): Promise<boolean> {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(token)}`)

    if (!response.ok) {
      return false
    }

    const tokenInfo = await response.json()
    const scopes = String(tokenInfo.scope || '')
      .split(' ')
      .map((scope) => scope.trim())
      .filter(Boolean)

    return scopes.includes(DRIVE_SCOPE)
  } catch (err) {
    console.warn('Unable to validate access token scopes:', err)
    return false
  }
}

function clearAccessTokenOnly(markAsTimedOut = false): void {
  clearTokenExpiryTimer()
  setAccessToken(null, `clearAccessTokenOnly:markAsTimedOut=${markAsTimedOut}`)
  tokenExpiryAt.value = null
  isSignedIn.value = false
  isAuthTimedOut.value = markAsTimedOut

  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY)
  } catch {
    // Ignore storage cleanup failures.
  }
}

/**
 * Save auth state to localStorage
 */
function persistAuthState(expiresInSeconds?: number) {
  try {
    devLog('[Auth][persist] start', {
      hasToken: !!accessToken.value,
      expiresInSeconds,
    })

    if (accessToken.value) {
      devLog('[Auth][persist] writing access token', {
        tokenLength: accessToken.value.length,
      })
      localStorage.setItem(STORAGE_KEY_TOKEN, accessToken.value)

      const safeExpiresInSeconds = Math.max(60, expiresInSeconds ?? 3600)
      const expiryTime = Date.now() + safeExpiresInSeconds * 1000
      tokenExpiryAt.value = expiryTime

      devLog('[Auth][persist] writing expiry', {
        safeExpiresInSeconds,
        expiryTime,
        expiryISO: new Date(expiryTime).toISOString(),
      })
      localStorage.setItem(STORAGE_KEY_TOKEN_EXPIRY, expiryTime.toString())

      const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN)
      const savedExpiry = localStorage.getItem(STORAGE_KEY_TOKEN_EXPIRY)
      devLog('[Auth][persist] verify storage', {
        tokenSaved: !!savedToken,
        savedTokenLength: savedToken?.length ?? 0,
        expirySaved: !!savedExpiry,
        savedExpiry,
      })

      scheduleTokenExpiryTimer()
      devLog('[Auth][persist] schedule token expiry timer done')
    } else {
      devLog('[Auth][persist] skipped because token is empty')
    }
  } catch (err) {
    console.error('Error persisting auth state:', err)
  }
}

/**
 * Initialize Google Identity Services
 */
async function initializeGIS() {
  try {
    await loadGoogleIdentityServices()
  } catch (err) {
    console.error('Google Identity Services SDK not loaded', err)
    error.value = 'Failed to load Google Identity Services'
    return
  }

  if (!CLIENT_ID) {
    console.error('VITE_GOOGLE_CLIENT_ID is not set')
    error.value = 'Google Client ID not configured'
    return
  }

  try {
    // Initialize OAuth 2.0 token client for Drive API access (implicit grant)
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES.join(' '),
      callback: handleTokenResponse,
    })

    isInitialized.value = true
    error.value = null
    registerAuthStateSyncListeners()

    // Try to restore persisted auth state
    syncAuthStateFromStorage()

    if (accessToken.value) {
      const tokenIsValid = await validateAccessTokenScopes(accessToken.value)
      if (!tokenIsValid) {
        console.warn('Restored token does not include the Drive scope, clearing cached token')
        clearAccessTokenOnly()
      }
    }
  } catch (err) {
    console.error('Error initializing GIS:', err)
    error.value = 'Failed to initialize Google Identity Services'
  }
}

/**
 * Handle OAuth token response
 */
async function handleTokenResponse(response: any) {
  finishAuthRequestGuard()

  devLog('Token response received:', {
    hasAccessToken: !!response.access_token,
    hasError: !!response.error,
    keys: Object.keys(response),
  })

  if (response.error) {
    console.error('OAuth error:', response.error, response.error_description || '')
    error.value = `OAuth error: ${response.error}`
    return
  }

  if (response.access_token) {
    setAccessToken(response.access_token, 'handleTokenResponse:received-access-token')
    devLog('Successfully obtained access token for Drive API')

    const tokenHasDriveScope = await validateAccessTokenScopes(response.access_token)
    if (!tokenHasDriveScope) {
      console.warn('Drive scope is missing from the access token')
      clearAccessTokenOnly()

      if (!scopeRetryAttempted) {
        scopeRetryAttempted = true
        error.value = null
        await requestAccessTokenFlow(true)
        return
      }

      error.value = 'Google authorization did not include Drive access. Please try again.'
      return
    }

    scopeRetryAttempted = false

    isSignedIn.value = true
    isAuthTimedOut.value = false
    error.value = null

    // Save token to localStorage
    persistAuthState(response.expires_in)
  } else {
    console.warn('Token response received but no access_token found', response)
    error.value = 'Failed to obtain access token'
  }
}

/**
 * Request an access token from Google.
 *
 * prompt behaviour:
 *   forceAccountSelection → 'select_account' (let user pick account)
 *   normal sign-in        → ''               (GIS decides whether consent UI is required)
 */
async function requestAccessTokenFlow(forceAccountSelection = false): Promise<void> {
  if (!isInitialized.value) {
    await initializeGIS()
  }

  if (!tokenClient) {
    error.value = 'Google authorization is not ready'
    return
  }

  startAuthRequestGuard()

  tokenClient.requestAccessToken({
    prompt: forceAccountSelection ? 'select_account' : '',
    scope: SCOPES.join(' '),
  })
}

async function signIn() {
  devLog('Manual sign-in triggered')
  await requestAccessTokenFlow()
}

async function switchAccount() {
  devLog('Switch account triggered')
  await requestAccessTokenFlow(true)
}

/**
 * Get current access token
 */
async function getAccessToken(): Promise<string | null> {
  if (tokenExpiryAt.value && Date.now() >= tokenExpiryAt.value) {
    clearAccessTokenOnly(true)
  }

  if (!accessToken.value) {
    console.warn('No access token available. Please sign in first.')
    return null
  }

  return accessToken.value
}

/**
 * Refresh access token
 */
async function refreshAccessToken(): Promise<boolean> {
  try {
    return await getAccessToken() !== null
  } catch (err) {
    console.error('Error refreshing token:', err)
    return false
  }
}

/**
 * Sign out from Google
 */
function signOut() {
  try {
    clearTokenExpiryTimer()
    isSignedIn.value = false
    setAccessToken(null, 'signOut:manual-sign-out')
    tokenExpiryAt.value = null
    isAuthTimedOut.value = false
    error.value = null
    scopeRetryAttempted = false

    // Clear persisted auth state
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY)
  } catch (err) {
    console.error('Error during sign-out:', err)
    error.value = 'Failed to sign out'
  }
}

/**
 * Check if user is currently signed in
 */
function checkSignInStatus(): boolean {
  return isSignedIn.value
}

function clearAuthError(): void {
  error.value = null
}

export function useGoogleDriveAuth() {
  registerAuthStateSyncListeners()

  // Initialize on first use
  if (!isInitialized.value) {
    void initializeGIS()
  }

  return {
    // State
    isInitialized: computed(() => isInitialized.value),
    isSignedIn: computed(() => isSignedIn.value),
    accessToken: computed(() => accessToken.value),
    isAuthTimedOut: computed(() => isAuthTimedOut.value),
    error: computed(() => error.value),
    isLoading: computed(() => isLoading.value),

    // Methods
    signIn,
    switchAccount,
    signOut,
    getAccessToken,
    refreshAccessToken,
    checkSignInStatus,
    clearAuthError,
    initializeGIS,
    requestAccessTokenFlow,
  }
}

function syncAuthStateFromStorage(): void {
  if (isAuthRequestInFlight) {
    devLog('Skip auth state sync during in-flight auth request')
    return
  }

  loadPersistedAuthState()
}

function registerAuthStateSyncListeners(): void {
  if (authSyncListenersRegistered) {
    return
  }

  registerStorageSync({
    watchedKeys: [STORAGE_KEY_TOKEN, STORAGE_KEY_TOKEN_EXPIRY],
    onSync: syncAuthStateFromStorage,
  })
  authSyncListenersRegistered = true
}
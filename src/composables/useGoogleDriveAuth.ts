import { ref, computed } from 'vue'

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
const STORAGE_KEY_PROFILE = 'eureka_google_profile'
const STORAGE_KEY_TOKEN_EXPIRY = 'eureka_google_token_expiry'
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000

// State
const isInitialized = ref(false)
const isSignedIn = ref(false)
const accessToken = ref<string | null>(null)
const userProfile = ref<{ name: string; email: string; picture: string } | null>(null)
const error = ref<string | null>(null)
const isLoading = ref(false)
const tokenExpiryAt = ref<number | null>(null)

// Declare Google global types for better TypeScript support
declare let google: any

// OAuth client reference (will be set during initialization)
let tokenClient: any = null
let gisScriptPromise: Promise<void> | null = null
let scopeRetryAttempted = false
let refreshTimer: ReturnType<typeof setTimeout> | null = null
let isSilentRefreshRequest = false

function clearRefreshTimer(): void {
  if (!refreshTimer) return
  clearTimeout(refreshTimer)
  refreshTimer = null
}

function scheduleTokenRefresh(): void {
  clearRefreshTimer()

  if (!accessToken.value || !tokenExpiryAt.value) {
    return
  }

  const msUntilRefresh = tokenExpiryAt.value - Date.now() - TOKEN_REFRESH_BUFFER_MS
  const delay = Math.max(msUntilRefresh, 0)

  refreshTimer = setTimeout(() => {
    void requestAccessTokenFlow(false, true)
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
function loadPersistedAuthState(): { hasValidToken: boolean; hasSavedProfile: boolean } {
  try {
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN)
    const savedProfile = localStorage.getItem(STORAGE_KEY_PROFILE)
    const savedExpiry = localStorage.getItem(STORAGE_KEY_TOKEN_EXPIRY)
    let hasValidToken = false
    let hasSavedProfile = false

    // Check if token is still valid (not expired)
    if (savedToken && savedExpiry) {
      const expiryTime = parseInt(savedExpiry, 10)
      const now = Date.now()

      if (now < expiryTime) {
        accessToken.value = savedToken
        tokenExpiryAt.value = expiryTime
        hasValidToken = true
        console.log('Restored access token from localStorage')
      } else {
        console.log('Saved token expired, clearing')
        localStorage.removeItem(STORAGE_KEY_TOKEN)
        localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY)
        tokenExpiryAt.value = null
      }
    }

    if (savedProfile) {
      userProfile.value = JSON.parse(savedProfile)
      hasSavedProfile = true
      if (userProfile.value) {
        console.log('Restored user profile from localStorage')
      }
    }

    if (hasValidToken) {
      isSignedIn.value = true
      scheduleTokenRefresh()
    }

    return { hasValidToken, hasSavedProfile }
  } catch (err) {
    console.error('Error loading persisted auth state:', err)
    return { hasValidToken: false, hasSavedProfile: false }
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

function clearAccessTokenOnly(): void {
  clearRefreshTimer()
  accessToken.value = null
  tokenExpiryAt.value = null
  isSignedIn.value = false
  userProfile.value = null

  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY)
    localStorage.removeItem(STORAGE_KEY_PROFILE)
  } catch {
    // Ignore storage cleanup failures.
  }
}

/**
 * Save auth state to localStorage
 */
function persistAuthState(expiresInSeconds?: number) {
  try {
    if (accessToken.value) {
      localStorage.setItem(STORAGE_KEY_TOKEN, accessToken.value)
      const safeExpiresInSeconds = Math.max(60, expiresInSeconds ?? 3600)
      const expiryTime = Date.now() + safeExpiresInSeconds * 1000
      tokenExpiryAt.value = expiryTime
      localStorage.setItem(STORAGE_KEY_TOKEN_EXPIRY, expiryTime.toString())
      scheduleTokenRefresh()
    }

    if (userProfile.value) {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(userProfile.value))
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

    // Try to restore persisted auth state
    const restoredState = loadPersistedAuthState()

    if (accessToken.value) {
      const tokenIsValid = await validateAccessTokenScopes(accessToken.value)
      if (!tokenIsValid) {
        console.warn('Restored token does not include the Drive scope, clearing cached token')
        clearAccessTokenOnly()
      }
    } else if (restoredState.hasSavedProfile) {
      // Attempt a silent token refresh when we have prior sign-in state.
      void requestAccessTokenFlow(false, true)
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
  console.log('Token response received:', {
    hasAccessToken: !!response.access_token,
    hasError: !!response.error,
    keys: Object.keys(response),
  })

  if (response.error) {
    console.error('OAuth error:', response.error, response.error_description || '')
    if (isSilentRefreshRequest) {
      isSilentRefreshRequest = false
      // Silent refresh can fail when Google session is unavailable.
      // Clear expired token state and require interactive sign-in.
      clearAccessTokenOnly()
      error.value = null
      return
    }

    error.value = `OAuth error: ${response.error}`
    return
  }

  if (response.access_token) {
    isSilentRefreshRequest = false
    accessToken.value = response.access_token
    console.log('Successfully obtained access token for Drive API')

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

    userProfile.value = null

    isSignedIn.value = true
    error.value = null

    // Save token/profile to localStorage
    persistAuthState(response.expires_in)
  } else {
    console.warn('Token response received but no access_token found', response)
    error.value = 'Failed to obtain access token'
  }
}

/**
 * Sign in with Google
 * This now triggers the single OAuth consent flow for both identity and Drive access.
 */
async function requestAccessTokenFlow(forceAccountSelection = false, silent = false): Promise<void> {
  if (!isInitialized.value) {
    await initializeGIS()
  }

  if (!tokenClient) {
    error.value = 'Google authorization is not ready'
    return
  }

  isSilentRefreshRequest = silent

  tokenClient.requestAccessToken({
    prompt: silent ? '' : forceAccountSelection ? 'consent select_account' : 'consent',
    scope: SCOPES.join(' '),
  })
}

async function signIn() {
  console.log('Manual sign-in triggered')
  await requestAccessTokenFlow()
}

/**
 * Get current access token
 */
async function getAccessToken(): Promise<string | null> {
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
    const googleApi = (window as Window & { google?: any }).google
    if (googleApi?.accounts?.oauth2?.revoke && accessToken.value) {
      googleApi.accounts.oauth2.revoke(accessToken.value, () => {
        console.log('Access token revoked')
      })
    }

    clearRefreshTimer()
    isSignedIn.value = false
    accessToken.value = null
    tokenExpiryAt.value = null
    userProfile.value = null
    error.value = null
    scopeRetryAttempted = false

    // Clear persisted auth state
    localStorage.removeItem(STORAGE_KEY_TOKEN)
    localStorage.removeItem(STORAGE_KEY_PROFILE)
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

export function useGoogleDriveAuth() {
  // Initialize on first use
  if (!isInitialized.value) {
    void initializeGIS()
  }

  return {
    // State
    isInitialized: computed(() => isInitialized.value),
    isSignedIn: computed(() => isSignedIn.value),
    accessToken: computed(() => accessToken.value),
    userProfile: computed(() => userProfile.value),
    error: computed(() => error.value),
    isLoading: computed(() => isLoading.value),

    // Methods
    signIn,
    signOut,
    getAccessToken,
    refreshAccessToken,
    checkSignInStatus,
    initializeGIS,
    requestAccessToken: requestAccessTokenFlow,
  }
}

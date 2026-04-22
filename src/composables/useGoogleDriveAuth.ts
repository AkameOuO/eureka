import { ref, computed } from 'vue'

/**
 * Google Identity Services Authentication Composable
 * Handles GIS initialization, login/logout, and access token management
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const SCOPES = ['https://www.googleapis.com/auth/drive.appdata']

// Storage keys
const STORAGE_KEY_TOKEN = 'eureka_google_access_token'
const STORAGE_KEY_PROFILE = 'eureka_google_profile'
const STORAGE_KEY_TOKEN_EXPIRY = 'eureka_google_token_expiry'

// State
const isInitialized = ref(false)
const isSignedIn = ref(false)
const accessToken = ref<string | null>(null)
const userProfile = ref<{ name: string; email: string; picture: string } | null>(null)
const error = ref<string | null>(null)
const isLoading = ref(false)

// Declare Google global types for better TypeScript support
declare let google: any

// OAuth client reference (will be set during initialization)
let oAuthCodeClient: any = null
let tokenClient: any = null
let gisScriptPromise: Promise<void> | null = null

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
function loadPersistedAuthState() {
  try {
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN)
    const savedProfile = localStorage.getItem(STORAGE_KEY_PROFILE)
    const savedExpiry = localStorage.getItem(STORAGE_KEY_TOKEN_EXPIRY)

    // Check if token is still valid (not expired)
    if (savedToken && savedExpiry) {
      const expiryTime = parseInt(savedExpiry, 10)
      const now = Date.now()

      if (now < expiryTime) {
        accessToken.value = savedToken
        console.log('Restored access token from localStorage')
      } else {
        console.log('Saved token expired, clearing')
        localStorage.removeItem(STORAGE_KEY_TOKEN)
        localStorage.removeItem(STORAGE_KEY_TOKEN_EXPIRY)
      }
    }

    if (savedProfile) {
      userProfile.value = JSON.parse(savedProfile)
      if (userProfile.value) {
        isSignedIn.value = true
        console.log('Restored user profile from localStorage')
      }
    }
  } catch (err) {
    console.error('Error loading persisted auth state:', err)
  }
}

/**
 * Save auth state to localStorage
 */
function persistAuthState() {
  try {
    if (accessToken.value) {
      localStorage.setItem(STORAGE_KEY_TOKEN, accessToken.value)
      // Token expires in about 1 hour (3600 seconds), save expiry time
      const expiryTime = Date.now() + 3600 * 1000
      localStorage.setItem(STORAGE_KEY_TOKEN_EXPIRY, expiryTime.toString())
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
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
    })

    // Initialize OAuth 2.0 token client for Drive API access (implicit grant)
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES.join(' '),
      callback: handleTokenResponse,
    })

    isInitialized.value = true
    error.value = null

    // Try to restore persisted auth state
    loadPersistedAuthState()
  } catch (err) {
    console.error('Error initializing GIS:', err)
    error.value = 'Failed to initialize Google Identity Services'
  }
}

/**
 * Handle credential response from Google Sign-In
 */
function handleCredentialResponse(response: any) {
  try {
    // Decode JWT to get user info
    const token = response.credential
    const decoded = decodeToken(token)

    userProfile.value = {
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture,
    }

    isSignedIn.value = true
    error.value = null

    // Save user profile to localStorage
    persistAuthState()

    // Now request Drive API access token with explicit prompt
    if (tokenClient) {
      console.log('Requesting access token for Drive API')
      tokenClient.requestAccessToken({ prompt: 'consent' })
    }
  } catch (err) {
    console.error('Error handling credential response:', err)
    error.value = 'Failed to process sign-in'
    isSignedIn.value = false
    userProfile.value = null
  }
}

/**
 * Handle OAuth token response
 */
function handleTokenResponse(response: any) {
  console.log('Token response received:', {
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
    accessToken.value = response.access_token
    error.value = null
    console.log('Successfully obtained access token for Drive API')

    // Save token to localStorage
    persistAuthState()
  } else {
    console.warn('Token response received but no access_token found', response)
    error.value = 'Failed to obtain access token'
  }
}

/**
 * Decode JWT token (basic decode without verification)
 */
function decodeToken(token: string) {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) {
      throw new Error('Invalid token format')
    }
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (err) {
    console.error('Error decoding token:', err)
    throw err
  }
}

/**
 * Sign in with Google
 * Now handled by Google's renderButton(), but kept for manual sign-in if needed
 */
async function signIn() {
  console.log('Manual sign-in triggered')
  // This is now handled by Google's renderButton in Header component
  // But can be called manually if needed
}

/**
 * Handle Google Sign-In prompt completion
 * Called after user completes sign-in flow
 */
function handleSignInCompletion() {
  if (isSignedIn.value && userProfile.value && tokenClient) {
    console.log('Sign-in completed, requesting access token...')
    tokenClient.requestAccessToken({ prompt: 'consent' })
  }
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
    if (googleApi?.accounts?.id) {
      google.accounts.id.disableAutoSelect()
    }

    isSignedIn.value = false
    accessToken.value = null
    userProfile.value = null
    error.value = null

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
    requestAccessToken: () => tokenClient?.requestAccessToken({ prompt: 'consent' }),
  }
}

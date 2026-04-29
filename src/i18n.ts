import type { I18n, I18nOptions } from 'vue-i18n'
import { createI18n } from 'vue-i18n'
import { languageCodes, defaultLanguage } from '../locales/config'
import en from '../locales/en.json'
import zh_tw from '../locales/zh_tw.json'

// 所有可用的語言資源映射
// 添加新語言時：1) 在上方導入新語言 JSON，2) 在此映射中添加，3) 在 locales/config.ts 中添加語言配置
const messageMap = {
  en,
  zh_tw
} as const

// 獲取瀏覽器語言
function getBrowserLocale(): string {
  const navLang = navigator.language
  // 檢查是否是繁体中文
  if (navLang.startsWith('zh')) {
    return 'zh_tw'
  }
  return defaultLanguage
}

// 從 localStorage 獲取用戶設定的語言
function getSavedLocale(): string | null {
  try {
    // 與 useSettings 保持相同的 storage key
    const stored = localStorage.getItem('eureka-settings')
    if (stored) {
      const data = JSON.parse(stored)
      return data?.locale || data?.settings?.locale || null
    }
  } catch {
    return null
  }
  return null
}

function getStoredLocaleRecord(): Record<string, unknown> | null {
  try {
    const stored = localStorage.getItem('eureka-settings')
    if (!stored) return null
    const parsed = JSON.parse(stored)
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>
    }
  } catch {
    return null
  }
  return null
}

function saveLocaleToSettings(locale: string): void {
  try {
    const key = 'eureka-settings'
    const base = getStoredLocaleRecord() || {}
    // support both flat and nested shapes
    if (base && typeof base === 'object') {
      base.locale = locale
      const nestedSettings = base.settings as { locale?: string } | undefined
      if (nestedSettings && typeof nestedSettings === 'object') {
        nestedSettings.locale = locale
        base.settings = nestedSettings
      }
    }
    localStorage.setItem(key, JSON.stringify(base))
  } catch {}
}

function pathToLocaleFromPathname(pathname: string): string | null {
  // 解析第一個 path segment，如 /en 或 /zh-tw
  const seg = (pathname || '').split('/').filter(Boolean)[0]
  if (!seg) return null
  if (seg.toLowerCase() === 'en') return 'en'
  if (seg.toLowerCase() === 'zh-tw' || seg.toLowerCase() === 'zh_tw' || seg.toLowerCase() === 'zh') return 'zh_tw'
  return null
}

// 驗證語言代碼是否有效
function isValidLocale(locale: string): boolean {
  return languageCodes.includes(locale)
}

// 構建 messages 物件（只包含配置中定義的語言）
type MessageKey = keyof typeof messageMap

const messages = languageCodes.reduce(
  (acc, code) => {
    if (code in messageMap) {
      acc[code as MessageKey] = messageMap[code as MessageKey]
    }
    return acc
  },
  {} as Record<MessageKey, any>
)

// 確定初始語言
// 先檢查 URL path 是否帶語言碼（/en, /zh-tw）
let detectedLocale: string | null = null
try {
  detectedLocale = pathToLocaleFromPathname(window?.location?.pathname || '')
} catch {}

let locale = detectedLocale || getSavedLocale() || getBrowserLocale()
if (!isValidLocale(locale)) {
  locale = defaultLanguage
}

// 若沒有既有設定，將初始推定語言寫回 settings，避免與 useSettings 預設值不同步
if (!getSavedLocale()) {
  saveLocaleToSettings(locale)
}

// 如果從 path 偵測到語言，儲存進 settings 並清理網址（不重新導向）
if (detectedLocale && isValidLocale(detectedLocale)) {
  saveLocaleToSettings(detectedLocale)
  try {
    const segments = window.location.pathname.split('/').filter(Boolean)
    const remainingPath = segments.length > 1 ? '/' + segments.slice(1).join('/') : '/'
    const newUrl = remainingPath + window.location.search + window.location.hash
    window.history.replaceState({}, '', newUrl)
  } catch {}
}

const i18nConfig: I18nOptions = {
  legacy: false,
  locale,
  fallbackLocale: defaultLanguage,
  messages
}

export const i18n: I18n = createI18n(i18nConfig)
export { languageCodes, defaultLanguage } from '../locales/config'

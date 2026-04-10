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
    const stored = localStorage.getItem('eureka-collection')
    if (stored) {
      const data = JSON.parse(stored)
      return data.settings?.locale || null
    }
  } catch {
    return null
  }
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
let locale = getSavedLocale() || getBrowserLocale()
if (!isValidLocale(locale)) {
  locale = defaultLanguage
}

const i18nConfig: I18nOptions = {
  legacy: false,
  locale,
  fallbackLocale: defaultLanguage,
  messages
}

export const i18n: I18n = createI18n(i18nConfig)
export { languageCodes, defaultLanguage } from '../locales/config'

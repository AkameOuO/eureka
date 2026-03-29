/**
 * 語言配置
 * 在此添加新語言，系統會自動加載
 */

export interface LanguageConfig {
  code: string      // 語言代碼（用於 i18n）
  name: string      // 語言名稱（用於 UI 顯示）
  nativeName: string // 原文語言名稱
  flag?: string     // 可選：旗幟 emoji
}

export const languages: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧'
  },
  {
    code: 'zh_tw',
    name: 'Traditional Chinese',
    nativeName: '繁體中文',
    flag: '🇹🇼'
  }
  // 添加新語言時，按照上述格式添加，系統會自動加載對應的 JSON 文件
  // 例如：
  // {
  //   code: 'ja',
  //   name: 'Japanese',
  //   nativeName: '日本語',
  //   flag: '🇯🇵'
  // }
]

export const languageCodes = languages.map(lang => lang.code)
export const defaultLanguage = 'en'

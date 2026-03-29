/**
 * 多語言工具函數
 */

/**
 * 獲取多語言對象中的值
 * @param obj - 包含語言鍵值的對象，如 { en: "...", zh_tw: "..." }
 * @param locale - 當前語言代碼
 * @param fallback - 備選語言代碼（如果目標語言不存在）
 * @returns 對應語言的值
 */
export function getLocalizedValue(
  obj: Record<string, string> | undefined,
  locale: string,
  fallback: string = 'en'
): string {
  if (!obj) return ''

  // 首先嘗試使用目標語言
  if (obj[locale]) {
    return obj[locale]
  }

  // 備選使用備選語言
  if (obj[fallback]) {
    return obj[fallback]
  }

  // 如果都不存在，返回第一個可用的值
  const firstValue = Object.values(obj)[0]
  return firstValue || ''
}

/**
 * 獲取多語言對象中的值（直接提供語言列表）
 * 用於當你知道所有可能的語言時
 * @param obj - 多語言對象
 * @param locale - 當前語言
 * @param languages - 按優先級排列的語言代碼列表
 * @returns 對應語言的值
 */
export function getLocalizedValueWithPriority(
  obj: Record<string, string> | undefined,
  locale: string,
  languages: string[]
): string {
  if (!obj) return ''

  // 按優先級查找
  for (const lang of [locale, ...languages]) {
    if (obj[lang]) {
      return obj[lang]
    }
  }

  // 備選返回第一個可用值
  const firstValue = Object.values(obj)[0]
  return firstValue || ''
}

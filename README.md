# Eureka 收集追踪器（Eureka Collection Tracker）

一個優雅的 Vue 3 應用，用於追踪和管理游戲裝備（Eureka）的收集進度。

## 功能特性

### 📊 核心功能
- **進度追踪** - 實時顯示收集進度和百分比（精確到小數點後兩位）
- **裝備管理** - 40+ 種裝備，支持多種顏色和部位（頭、手、腳）選擇
- **智能篩選** - 按稀有度（3⭐、4⭐、5⭐）和區域篩選，隱藏已完成裝備選項
- **區域分組** - 心願原野、伊贊之土兩大區域組織

### 🌐 多語言支持
- **靈活的語言系統** - 通過配置輕鬆添加新語言，無需修改組件代碼
- **預設語言** - 繁體中文、英文
- **完整多語言化** - UI 文本、裝備名稱、區域名稱、來源描述全部支持
- **動態語言選擇器** - 自動根據配置生成語言列表
- **智能圖標支持** - 語言選擇器可顯示旗幟 emoji 和原文語言名稱

### 💾 數據管理
- **本地儲存** - 使用 localStorage 自動保存收集紀錄
- **數據驗證** - 自動清理不存在的項目，確保數據完整性
- **導入/導出** - 支持 JSON 格式的收集紀錄備份和恢復
  - 匯出：複製到剪貼板或下載 JSON 文件
  - 匯入：上傳文件或貼上 JSON 內容

### 🎨 設計與樣式
- **粉紅漸層主題** - 優雅的粉紅色配色（#E91E63）應用於頂部導航
- **CSS 變量系統** - 集中管理所有顏色和設計常數
- **動態顏色** - 裝備顏色單元格使用漸層背景和動態文字顏色
- **響應式佈局** - 左側固定sidebar（300px）+ 彈性內容區域

## 技術棧

| 技術 | 版本 |
|-----|------|
| Vue | 3.5.30 |
| TypeScript | 5.9.3 |
| Vite | 7.3.1 |
| vue-i18n | 9.13.0 |

## 目錄結構

```
eureka/
├── src/
│   ├── components/
│   │   ├── Header.vue           # 頂部導航，動態語言選擇器
│   │   ├── FilterBar.vue        # 左側邊欄：篩選器、進度、導入/導出
│   │   ├── ProgressBar.vue      # 進度顯示組件
│   │   ├── AreaTabs.vue         # 區域選擇標籤
│   │   └── EurekaTable.vue      # 主表格：裝備展示和複選框
│   ├── styles/
│   │   └── variables.css        # CSS 變量定義（顏色、大小、過度效果）
│   ├── utils/
│   │   └── i18nHelpers.ts       # 多語言工具函數
│   ├── i18n.ts                  # vue-i18n 初始化配置
│   ├── types.ts                 # TypeScript 類型定義
│   ├── storage.ts               # localStorage 操作和導入/導出
│   ├── App.vue                  # 根組件：布局和數據管理
│   └── main.ts                  # 應用入口
├── locales/
│   ├── config.ts                # 語言配置（定義可用語言列表）
│   ├── zh_tw.json               # 繁體中文翻譯
│   └── en.json                  # 英文翻譯
├── public/
│   └── data/
│       └── eurekas.json         # 裝備數據庫
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## 安裝與運行

### 環境要求
- Node.js 16+
- npm 或 yarn 包管理器

### 安裝步驟

```bash
# 1. 克隆或下載項目
cd eureka

# 2. 安裝依賴
npm install

# 3. 開發服務器
npm run dev

# 4. 構建生產版本
npm run build

# 5. 預覽生產構建
npm run preview
```

開發服務器預設運行在 `http://localhost:5173`

## 使用指南

### 基本操作

1. **選擇裝備顏色** - 在表格中勾選相應的複選框標記為已收集
2. **篩選裝備**
   - 點擊左側稀有度按鈕（3⭐、4⭐、5⭐）
   - 勾選「隱藏已完成」僅顯示未完成的項目
   - 點擊區域標籤切換區域

3. **追踪進度** - 上方紫色進度條顯示整體收集進度

### 導出數據

1. 點擊「匯出」按鈕打開導出modal
2. 選擇操作：
   - **複製** - 複製 JSON 到剪貼板
   - **下載** - 下載為 `.json` 文件
3. 關閉modal

### 導入數據

1. 點擊「匯入」按鈕打開導入modal
2. 選擇方式：
   - **上傳文件** - 選擇之前導出的 JSON 文件
   - **貼上內容** - 直接貼上 JSON 文本
3. 系統自動驗證並清理無效項目
4. 導入成功後頁面自動重新載入

## 數據結構

### 裝備數據 (eurekas.json)

```json
{
  "eurekas": [
    {
      "id": "first_snow",
      "name": {
        "en": "First Snow",
        "zh_tw": "初雪"
      },
      "colors": ["white", "blue", "green", "pink", "iridescent"],
      "rarity": 5,
      "source": {
        "en": "",
        "zh_tw": ""
      },
      "area": "wishfield"
    }
  ],
  "colors": {
    "white": {
      "name": { "en": "White", "zh_tw": "白色" },
      "style": {
        "background": "#F5F5F5",
        "font": "#333333"
      }
    },
    "iridescent": {
      "name": { "en": "Iridescent", "zh_tw": "彩色" },
      "style": {
        "background": "linear-gradient(90deg, #FFB9C1 0%, #FFD4B4 25%, #FFFF99 50%, #A6FF9C 75%, #B4D7FF 100%)",
        "font": "#333333"
      }
    }
  },
  "areas": {
    "wishfield": { "en": "Wishfield", "zh_tw": "心願原野" }
  }
}
```

### Local Storage 結構

```json
{
  "collection": [
    "first_snow_white_head",
    "first_snow_white_hand",
    "first_snow_blue_foot"
  ],
  "settings": {
    "visibleRarities": [3, 4, 5],
    "hideCompleted": false
  }
}
```

## 主要組件說明

### Header.vue
- 應用標題和粉紅漸層樣式
- 語言選擇下拉菜單
- Emits: `locale-change` 事件

### ProgressBar.vue
- 顯示收集進度條和百分比
- Props: `collected` (已收集數), `total` (總數)
- 百分比精確到小數點後兩位

### FilterBar.vue
- 稀有度過濾（3⭐、4⭐、5⭐）
- 隱藏已完成開關
- 導入/導出 modal 對話框
- Emits: `filter-change` 事件

### AreaTabs.vue
- 區域標籤導航（全部、心願原野、伊贊之土）
- Emits: `area-change` 事件

### EurekaTable.vue
- 主表格組件展示所有裝備
- 動態顏色背景和文字顏色
- 三列複選框（頭、手、腳）
- Emits: `toggle` 事件（複選框改變）

## CSS 變量系統

所有顏色和設計常數定義在 `src/styles/variables.css`：

```css
/* 主色調 */
--color-primary: #E91E63;
--color-primary-dark: #C2185B;
--color-primary-light: #F8BBD0;

/* 文字顏色 */
--color-text-primary: #333333;
--color-text-secondary: #666666;
--color-text-tertiary: #999999;

/* 邊框和背景 */
--color-border-primary: #EEEEEE;
--color-bg-default: #FFFFFF;
--color-bg-hover: #F5F5F5;

/* 其他常數 */
--border-radius: 4px;
--modal-border-radius: 8px;
--transition-speed: 0.2s;
```

## 配置說明

### 國際化 (i18n) - 添加新語言

#### 快速步驟

1. **創建язы言言文件**
   ```bash
   # 複製英文翻譯作為範本
   cp locales/en.json locales/ja.json
   # 編輯 locales/ja.json 翻譯所有文字
   ```

2. **更新語言配置** - 編輯 `locales/config.ts`
   ```typescript
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
     },
     {
       code: 'ja',          // ← 添加新語言
       name: 'Japanese',
       nativeName: '日本語',
       flag: '🇯🇵'
     }
   ]
   ```

3. **導入語言資源** - 編輯 `src/i18n.ts`
   ```typescript
   import ja from '../locales/ja.json'  // ← 添加導入

   const messageMap: Record<string, object> = {
     en,
     zh_tw,
     ja    // ← 添加映射
   }
   ```

4. **完成！** - 不需要修改任何組件，系統會自動識別新語言

#### 多語言文本工具

使用 `src/utils/i18nHelpers.ts` 中的工具函數來獲取多語言值：

```typescript
import { getLocalizedValue } from './utils/i18nHelpers'

// 使用範例
const areaName = getLocalizedValue(areaObject, locale.value)
// 自動根據當前語言返回對應值，不存在時回退到 'en'
```

### 裝備數據

編輯 `public/data/eurekas.json` 來：
- 添加/修改裝備
- 調整顏色樣式（背景為純色或 CSS 漸層，文字顏色自動對比）
- 更新區域信息（支持多語言）
- 編輯來源描述（現已支持多語言 `{"en": "", "zh_tw": ""}` 格式）

**裝備配置示例：**
```json
{
  "id": "first_snow",
  "name": {
    "en": "First Snow",
    "zh_tw": "初雪",
    "ja": "初雪"  // 添加新語言
  },
  "colors": ["white", "blue"],
  "rarity": 5,
  "source": {
    "en": "Source description",
    "zh_tw": "來源描述",
    "ja": "ソースの説明"  // 添加新語言
  },
  "area": "wishfield"
}
```

### 主題色

修改 `src/styles/variables.css` 中的 `--color-primary` 值來改變應用主色調。

### 類型定義

`src/types.ts` 定義了所有 TypeScript 接口：
- `Eureka` - 裝備類型（包含多語言字段）
- `EurekasData` - 完整的裝備數據結構
- `LocalStorage` - localStorage 數據格式
- 更新於：修復 `source` 字段為多語言對象

## 數據驗證

應用會在網頁載入和導入時自動执行數據驗證：

1. 檢查 collection 中的每個項目
2. 驗證 eureka id、顏色、部位都存在於數據庫中
3. 移除無效項目並保存到 localStorage
4. 格式: `{eureka_id}_{color}_{slot}`（支持 eureka_id 中包含下劃線）

## 技術亮點

### 多語言架構
- **零組件修改** - 添加新語言無需修改任何 Vue 組件
- **集中管理** - 所有語言定義在 `locales/config.ts`
- **向後兼容** - `getLocalizedValue()` 支持回退機制
- **動態UI** - Header 組件自動根據配置生成語言選擇器

### 數據驗證
- **自動清理** - 導入/載入時自動移除無效 collection 項目
- **格式支持** - 支持 eureka_id 中包含下劃線的複雜 ID
- **類型安全** - 完整的 TypeScript 類型檢查

### 性能優化
- **CSS 變量系統** - 集中主題管理
- **模態對話框** - 導入/導出不佔用額外空間
- **自動圖片隱藏** - 缺失圖片自動隱藏

## 功能限制和已知問題

- 目前不支持圖像上傳（可在 eurekas.json 中配置圖像路徑）
- 導入/導出只處理收集紀錄，不包含篩選設定
- 進度百分比基於全局 collection，不分區域估算
- 集合中支持的最大項目數受 localStorage 大小限制（通常 5-10MB）

## 開發指南

### 代碼結構

- **組件層** (`src/components/`) - Vue 單文件組件，專注於 UI
- **工具層** (`src/utils/`) - 可重用的工具函數（i18n 輔助、存儲操作等）
- **配置層** (`locales/`, `src/styles/`) - 語言、樣式、主題配置
- **數據層** (`src/types.ts`, `src/storage.ts`) - 類型定義和數據管理

### TypeScript 類型檢查

所有文件已通過 TypeScript 靜態檢查：
```bash
npm run type-check
```

### 新增組件時的多語言做法

1. 在 `locales/*.json` 中添加所需文本
2. 在組件中使用 `useI18n()` 的 `t()` 函數
3. 對於多語言對象，使用 `getLocalizedValue()` 工具函數

```typescript
import { useI18n } from 'vue-i18n'
import { getLocalizedValue } from '@/utils/i18nHelpers'

const { locale, t } = useI18n()

const name = getLocalizedValue(multilingualObject, locale.value)
```

## 貢獻和反饋

如有建議或發現問題，歡迎透過以下方式反饋：
1. 檢查數據完整性
2. 確認瀏覽器兼容性（建議使用現代瀏覽器）
3. 清理 localStorage 並重新加載頁面
4. 檢查 TypeScript 類型錯誤

## 許可證

此項目為個人項目。

---

**最後更新**: 2026年3月29日
**Latest Features**: 靈活的多語言系統、完整的 TypeScript 支持、自動數據驗證、彩虹漸層顏色系統

## 快速開發命令

```bash
# 開發
npm run dev

# 構建
npm run build

# 預覽
npm run preview

# 檢查類型（TypeScript）
npm run type-check
```

## 瀏覽器支持

- Chrome/Edge (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- 支持現代 ES2020+ 特性

---

祝您使用愉快！🎉

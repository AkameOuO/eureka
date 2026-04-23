<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EurekasData } from './types'
import { useCollection } from './composables/useCollection'
import { useSettings } from './composables/useSettings'
import { useGoogleDriveSync } from './composables/useGoogleDriveSync'
import { getLocalizedValue } from './utils/i18nHelpers'
import EurekaTable from './components/EurekaTable.vue'
import FilterBar from './components/FilterBar.vue'
import AreaTabs from './components/AreaTabs.vue'
import Header from './components/Header.vue'
import ProgressBar from './components/ProgressBar.vue'
import ToastContainer from './components/ToastContainer.vue'
import SyncModal from './components/SyncModal.vue'
import ConflictDialog from './components/ConflictDialog.vue'

const { locale, t } = useI18n()
const { collection, toggleCollection, cleanCollection } = useCollection()
const { settings, updateSettings } = useSettings()
const { conflictData, resolveConflict } = useGoogleDriveSync()

// Sync modal state
const isSyncModalOpen = ref(false)

// 確保 collection 總是陣列
const collectionValue = computed(() => {
  if (!collection.value || !Array.isArray(collection.value)) {
    console.warn('App.vue: collection is not an array, using empty array')
    return []
  }
  return collection.value
})
const data = ref<EurekasData | null>(null)
const selectedArea = ref<string>('all')
const visibleRarities = computed(() => settings.value.visibleRarities)
const hideCompleted = computed(() => settings.value.hideCompleted)
const searchName = ref<string>('')

onMounted(async () => {
  try {
    const response = await fetch('/data/eurekas.json')
    data.value = await response.json()

    // 驗證並清理 collection 中的無效項目
    if (data.value) {
      const validEurekaIds = new Set(data.value.eurekas.map(e => e.id))
      const validColors = new Set(Object.keys(data.value.colors))
      cleanCollection(validEurekaIds, validColors)
    }
  } catch (error) {
    console.error('Failed to load eurekas data:', error)
  }
})

const filteredEurekas = computed(() => {
  if (!data.value) return []

  return data.value.eurekas.filter(eureka => {
    // Area 篩選
    if (selectedArea.value !== 'all' && eureka.area !== selectedArea.value) {
      return false
    }

    // 稀有度篩選
    if (!visibleRarities.value.includes(eureka.rarity)) {
      return false
    }

    // 隱藏已完成
    if (hideCompleted.value) {
      const completedCount = eureka.colors.length * 3 // 3 slots per color
      const collectedCount = eureka.colors.reduce((count, color) => {
        return (
          count +
          (collectionValue.value.includes(`${eureka.id}_${color}_head`) ? 1 : 0) +
          (collectionValue.value.includes(`${eureka.id}_${color}_hand`) ? 1 : 0) +
          (collectionValue.value.includes(`${eureka.id}_${color}_foot`) ? 1 : 0)
        )
      }, 0)
      if (completedCount === collectedCount) {
        return false
      }
    }

    // 名稱搜尋
    if (searchName.value.trim()) {
      const searchLower = searchName.value.toLowerCase().trim()
      const enName = eureka.name.en?.toLowerCase() || ''
      const zhName = eureka.name.zh_tw?.toLowerCase() || ''
      if (!enName.includes(searchLower) && !zhName.includes(searchLower)) {
        return false
      }
    }

    return true
  })
})

const totalProgress = computed(() => {
  return {
    collected: collectionValue.value.length,
    total: data.value ? data.value.eurekas.reduce((sum, e) => sum + e.colors.length * 3, 0) : 0
  }
})

const areas = computed(() => {
  if (!data.value) return []
  return Object.entries(data.value.areas).map(([key, value]) => ({
    key,
    name: getLocalizedValue(value as Record<string, string>, locale.value)
  }))
})

function handleAreaChange(area: string): void {
  selectedArea.value = area
}

function handleFilterChange(rarities: number[], completed: boolean, name?: string): void {
  updateSettings({
    visibleRarities: rarities,
    hideCompleted: completed
  })
  if (name !== undefined) {
    searchName.value = name
  }
}

function handleLocaleChange(newLocale: string): void {
  locale.value = newLocale as any
  updateSettings({ locale: newLocale })
}

function handleDataChanged(): void {
  // 現在是單一實例模式，FilterBar 修改的 collection 就是這裡的同一個 ref
  // 無需手動更新，Vue 響應式系統會自動處理
}
</script>

<template>
  <div id="app" class="app">
    <Header
      @locale-change="handleLocaleChange"
      @open-sync-modal="isSyncModalOpen = true"
    />

    <!-- 同步 Modal -->
    <SyncModal
      :is-open="isSyncModalOpen"
      @close="isSyncModalOpen = false"
    />

    <!-- 衝突對話框 -->
    <ConflictDialog
      :conflict-data="conflictData"
      @close="() => {}"
      @resolve="(version) => resolveConflict(version)"
    />

    <!-- 全局 Toast 通知 -->
    <ToastContainer />

    <div class="content-wrapper">
      <!-- 左侧：Filter -->
      <aside class="sidebar">
        <ProgressBar
          :collected="totalProgress.collected"
          :total="totalProgress.total"
        />
        <FilterBar
          :visible-rarities="visibleRarities"
          :hide-completed="hideCompleted"
          :search-name="searchName"
          @filter-change="handleFilterChange"
          @data-changed="handleDataChanged"
          @open-record-modal="isSyncModalOpen = true"
        />
      </aside>

      <!-- 右侧：AreaTabs + Table -->
      <main class="main-content">
        <AreaTabs
          :areas="areas"
          :selected-area="selectedArea"
          @area-change="handleAreaChange"
        />

        <EurekaTable
          v-if="data"
          :eurekas="filteredEurekas"
          :data="data"
          :collection="collectionValue"
          @toggle="toggleCollection"
        />

        <div v-else class="loading">
          {{ t('header.title') }}...
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
  color: #333;
  background: white;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  display: flex;
  flex: 1;
  gap: 0;
  padding: 0 15%;
}

.sidebar {
  width: 300px;
  background: white;
  border-right: 1px solid #eee;
  overflow-y: auto;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #C2185B;
}

@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
    padding: 0;

  }

  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #eee;
  }
}
</style>

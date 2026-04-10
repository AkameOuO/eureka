<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EurekasData, LocalStorage } from './types'
import { getStorage, setStorage, addToCollection, removeFromCollection, updateSettings } from './storage'
import { getLocalizedValue } from './utils/i18nHelpers'
import EurekaTable from './components/EurekaTable.vue'
import FilterBar from './components/FilterBar.vue'
import AreaTabs from './components/AreaTabs.vue'
import Header from './components/Header.vue'
import ProgressBar from './components/ProgressBar.vue'

const { locale, t } = useI18n()
const data = ref<EurekasData | null>(null)
const storage = ref<LocalStorage>(getStorage())
const selectedArea = ref<string>('all')
const visibleRarities = ref<number[]>(storage.value.settings.visibleRarities)
const hideCompleted = ref<boolean>(storage.value.settings.hideCompleted)

onMounted(async () => {
  try {
    const response = await fetch('/data/eurekas.json')
    data.value = await response.json()

    // 驗證並清理 collection 中的無效項目
    if (data.value) {
      const validEurekaIds = new Set(data.value.eurekas.map(e => e.id))
      const validColors = new Set(Object.keys(data.value.colors))
      const slots = new Set(['head', 'hand', 'foot'])

      const cleanedCollection = storage.value.collection.filter(item => {
        const parts = item.split('_')
        if (parts.length < 3) return false

        const slot = parts.pop()
        const color = parts.pop()
        const eurekaId = parts.join('_')

        return eurekaId && color && slot && validEurekaIds.has(eurekaId) && validColors.has(color) && slots.has(slot)
      })

      if (cleanedCollection.length !== storage.value.collection.length) {
        storage.value.collection = cleanedCollection
        setStorage(storage.value)
      }
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
          (storage.value.collection.includes(`${eureka.id}_${color}_head`) ? 1 : 0) +
          (storage.value.collection.includes(`${eureka.id}_${color}_hand`) ? 1 : 0) +
          (storage.value.collection.includes(`${eureka.id}_${color}_foot`) ? 1 : 0)
        )
      }, 0)
      if (completedCount === collectedCount) {
        return false
      }
    }

    return true
  })
})

const totalProgress = computed(() => {
  return {
    collected: storage.value.collection.length,
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

function toggleCollection(id: string): void {
  if (storage.value.collection.includes(id)) {
    removeFromCollection(id)
  } else {
    addToCollection(id)
  }
  storage.value = getStorage()
}

function handleAreaChange(area: string): void {
  selectedArea.value = area
}

function handleFilterChange(rarities: number[], completed: boolean): void {
  visibleRarities.value = rarities
  hideCompleted.value = completed
  updateSettings({
    visibleRarities: rarities,
    hideCompleted: completed
  })
}

function handleLocaleChange(newLocale: string): void {
  locale.value = newLocale as any
  updateSettings({ locale: newLocale })
}

function handleDataChanged(): void {
  // 重新讀取 localStorage 的最新資料，Vue 響應式系統自動更新 UI
  storage.value = getStorage()
}
</script>

<template>
  <div id="app" class="app">
    <Header
      @locale-change="handleLocaleChange"
    />

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
          @filter-change="handleFilterChange"
          @data-changed="handleDataChanged"
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
          :collection="storage.collection"
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
  padding: 0 10%;
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

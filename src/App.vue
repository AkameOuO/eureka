<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { EurekasData } from './types'
import eurekasData from 'virtual:eurekas-data'
import { useCollection } from './composables/useCollection'
import { useSettings } from './composables/useSettings'
import { useGoogleDriveSync } from './composables/useGoogleDriveSync'
import { getLocalizedValue } from './utils/i18nHelpers'
import EurekaTable from './components/EurekaTable.vue'
import FilterBar from './components/FilterBar.vue'
import AreaTabs from './components/AreaTabs.vue'
import Header from './components/Header.vue'
import ProgressBar from './components/ProgressBar.vue'
import SyncActionButton from './components/SyncActionButton.vue'
import AppFooter from './components/AppFooter.vue'
import ToastContainer from './components/ToastContainer.vue'
import SyncModal from './components/SyncModal.vue'
import ConflictDialog from './components/ConflictDialog.vue'

const { locale, t } = useI18n()
const { collection, toggleCollection, cleanCollection } = useCollection()
const { settings, updateSettings } = useSettings()
const { conflictData, resolveConflict } = useGoogleDriveSync()

// Sync modal state
const isSyncModalOpen = ref(false)
const isMobileFilterOpen = ref(false)

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
const selectedLabels = computed(() => settings.value.selectedLabels)
const searchName = ref<string>('')

watch(
  () => locale.value,
  () => {
    document.title = t('app.tabTitle')
  },
  { immediate: true }
)

onMounted(() => {
  data.value = eurekasData as EurekasData

  // 驗證並清理 collection 中的無效項目
  const validEurekaIds = new Set(data.value.eurekas.map(e => e.id))
  const validColors = new Set(Object.keys(data.value.colors))
  cleanCollection(validEurekaIds, validColors)
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

    // 標籤篩選（OR）
    if (selectedLabels.value.length > 0) {
      const eurekaLabels = Array.isArray(eureka.labels) ? eureka.labels : []
      const matched = selectedLabels.value.some((labelKey) => eurekaLabels.includes(labelKey))
      if (!matched) {
        return false
      }
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

const labelOptions = computed(() => {
  if (!data.value?.labels) return []
  return Object.entries(data.value.labels).map(([key, label]) => ({
    key,
    name: locale.value === 'zh_tw' ? label.name.zh_tw : label.name.en,
    background: label.colors.background,
    text: label.colors.text
  }))
})

function handleAreaChange(area: string): void {
  selectedArea.value = area
}

function handleFilterChange(rarities: number[], completed: boolean, name?: string, labels?: string[]): void {
  updateSettings({
    visibleRarities: rarities,
    hideCompleted: completed,
    selectedLabels: labels ?? []
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

function openMobileFilters(): void {
  isMobileFilterOpen.value = true
}

function closeMobileFilters(): void {
  isMobileFilterOpen.value = false
}

function toggleMobileFilters(): void {
  isMobileFilterOpen.value = !isMobileFilterOpen.value
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
        <SyncActionButton @open-sync="isSyncModalOpen = true" />
        <button
          v-if="!isMobileFilterOpen"
          class="mobile-filter-toggle"
          :class="{ 'is-open': isMobileFilterOpen }"
          @click="toggleMobileFilters"
          :aria-label="t('filter.openFilters')"
          :title="t('filter.openFilters')"
          :aria-expanded="isMobileFilterOpen"
        >
          <svg class="mobile-filter-toggle__icon" :class="{ 'is-open': isMobileFilterOpen }" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5"/>
          </svg>
          <span class="sr-only">{{ t('filter.openFilters') }}</span>
        </button>
        <FilterBar
          class="sidebar-filter"
          :visible-rarities="visibleRarities"
          :hide-completed="hideCompleted"
          :search-name="searchName"
          :label-options="labelOptions"
          :selected-labels="selectedLabels"
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
          :collection="collectionValue"
          @toggle="toggleCollection"
        />

        <div v-else class="loading">
          {{ t('header.title') }}...
        </div>
      </main>
    </div>

    <transition name="mobile-filter-overlay-fade">
      <div v-if="isMobileFilterOpen" class="mobile-filter-overlay" @click.self="closeMobileFilters">
        <section class="mobile-filter-drawer">
          <div class="mobile-filter-drawer__header">
            <h3>{{ t('filter.mobileFilters') }}</h3>
            <button class="mobile-filter-close" @click="closeMobileFilters" :aria-label="t('filter.closeFilters')">×</button>
          </div>
          <FilterBar
            :visible-rarities="visibleRarities"
            :hide-completed="hideCompleted"
            :search-name="searchName"
            :label-options="labelOptions"
            :selected-labels="selectedLabels"
            @filter-change="handleFilterChange"
            @data-changed="handleDataChanged"
          />
        </section>
      </div>
    </transition>

    <AppFooter />
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
  margin-bottom: 16px;
}

.sidebar {
  max-width: 340px;
  width: 35%;
  background: white;
  border-right: 1px solid #eee;
  position: sticky;
  top: 12px;
  align-self: flex-start;
  max-height: calc(100vh - 24px);
  overflow-y: auto;
}

.mobile-filter-toggle {
  display: none;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: visible;
  min-width: 0;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #C2185B;
}

.mobile-filter-overlay {
  display: none;
}

@media (max-width: 1200px) {
  .content-wrapper {
    padding: 0 5%;
  }
}

@media (max-width: 992px) {
  .content-wrapper {
    padding: 0;
  }
}

@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
    padding: 0;
    margin-bottom: 12px;
  }

  .sidebar {
    max-width: unset;
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #eee;
    position: static;
    top: auto;
    align-self: auto;
    max-height: none;
    overflow: visible;
  }

  .sidebar-filter {
    display: none;
  }

  .mobile-filter-toggle {
    display: inline-flex;
    position: fixed;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    z-index: 1300;
    align-items: center;
    justify-content: center;
    width: 76px;
    height: 38px;
    border: 1px solid #e0e0e0;
    border-bottom: none;
    border-radius: 999px 999px 0 0;
    background: #fff;
    color: #c2185b;
    cursor: pointer;
    box-shadow: 0 -4px 14px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
  }

  .mobile-filter-toggle.is-open {
    background: #fce4ec;
    border-color: #f4bfd3;
  }

  .mobile-filter-toggle__icon {
    width: 16px;
    height: 16px;
    transition: transform 0.2s ease;
  }

  .mobile-filter-toggle__icon.is-open {
    transform: rotate(180deg);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
  }

  .mobile-filter-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 1200;
  }

  .mobile-filter-overlay-fade-enter-active,
  .mobile-filter-overlay-fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .mobile-filter-overlay-fade-enter-active .mobile-filter-drawer,
  .mobile-filter-overlay-fade-leave-active .mobile-filter-drawer {
    transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.32s ease;
  }

  .mobile-filter-overlay-fade-enter-from,
  .mobile-filter-overlay-fade-leave-to {
    opacity: 0;
  }

  .mobile-filter-overlay-fade-enter-from .mobile-filter-drawer,
  .mobile-filter-overlay-fade-leave-to .mobile-filter-drawer {
    transform: translateY(calc(100% + 16px));
    opacity: 0.7;
  }

  .mobile-filter-overlay-fade-enter-to .mobile-filter-drawer,
  .mobile-filter-overlay-fade-leave-from .mobile-filter-drawer {
    transform: translateY(0);
    opacity: 1;
  }

  .mobile-filter-drawer {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    max-height: 80vh;
    overflow-y: auto;
    background: #fff;
    border-radius: 14px 14px 0 0;
    box-shadow: 0 -10px 28px rgba(0, 0, 0, 0.2);
    transform: translateY(0);
    will-change: transform, opacity;
  }

  .mobile-filter-drawer__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px 8px;
    border-bottom: 1px solid #f0f0f0;
  }

  .mobile-filter-drawer__header h3 {
    margin: 0;
    font-size: 14px;
    color: #333;
  }

  .mobile-filter-close {
    border: none;
    background: transparent;
    color: #666;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
  }
}
</style>

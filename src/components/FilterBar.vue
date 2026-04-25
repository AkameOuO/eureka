<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  visibleRarities: number[]
  hideCompleted: boolean
  searchName?: string
  labelOptions?: Array<{ key: string; name: string; background: string; text: string }>
  selectedLabels?: string[]
}

interface Emits {
  (e: 'filter-change', rarities: number[], completed: boolean, name?: string, labels?: string[]): void
  (e: 'data-changed'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

const rarities = ref<number[]>([3, 4, 5])
const hideCompleted = ref<boolean>(false)
const searchName = ref<string>('')
const selectedLabels = ref<string[]>([])

watch(
  () => props.visibleRarities,
  (newVal) => {
    rarities.value = newVal
  }
)

watch(
  () => props.hideCompleted,
  (newVal) => {
    hideCompleted.value = newVal
  }
)

watch(
  () => props.searchName,
  (newVal) => {
    if (newVal !== undefined) {
      searchName.value = newVal
    }
  }
)

watch(
  () => props.selectedLabels,
  (newVal) => {
    selectedLabels.value = newVal ? [...newVal] : []
  },
  { immediate: true }
)

function updateFilters(): void {
  emit('filter-change', rarities.value, hideCompleted.value, searchName.value, selectedLabels.value)
}

function toggleRarity(rarity: number): void {
  const index = rarities.value.indexOf(rarity)
  if (index > -1) {
    rarities.value.splice(index, 1)
  } else {
    rarities.value.push(rarity)
    rarities.value.sort()
  }
  updateFilters()
}

function toggleHideCompleted(): void {
  hideCompleted.value = !hideCompleted.value
  updateFilters()
}

function toggleLabel(labelKey: string): void {
  const index = selectedLabels.value.indexOf(labelKey)
  if (index > -1) {
    selectedLabels.value.splice(index, 1)
  } else {
    selectedLabels.value.push(labelKey)
  }
  updateFilters()
}
</script>

<template>
  <div class="filter-bar">
    <!-- Search by Name -->
    <div class="filter-section">
      <h3 class="filter-title">{{ t('filter.name') }}</h3>
      <input
        v-model="searchName"
        type="text"
        :placeholder="t('filter.searchByName')"
        @input="updateFilters"
        class="search-input"
      />
    </div>

    <!-- Rarity Filter -->
    <div class="filter-section">
      <h3 class="filter-title">{{ t('filter.rarity') }}</h3>
      <div class="button-group">
        <button
          v-for="rarity in [3, 4, 5]"
          :key="rarity"
          :class="{ active: rarities.includes(rarity) }"
          @click="toggleRarity(rarity)"
          class="filter-button"
        >
          {{ rarity }}⭐
        </button>
      </div>
    </div>

    <!-- Hide Completed Toggle -->
    <div class="filter-section">
      <label class="checkbox-label">
        <input
          type="checkbox"
          :checked="hideCompleted"
          @change="toggleHideCompleted"
        />
        <span>{{ t('filter.hideCompleted') }}</span>
      </label>
    </div>

    <!-- Label Filter (OR) -->
    <div v-if="labelOptions && labelOptions.length > 0" class="filter-section">
      <h3 class="filter-title">{{ t('filter.label') }}</h3>
      <div class="button-group label-group">
        <button
          v-for="label in labelOptions"
          :key="label.key"
          :class="{ 'is-selected': selectedLabels.includes(label.key) }"
          @click="toggleLabel(label.key)"
          class="filter-button label-button"
          :style="{ background: label.background, color: label.text, borderColor: label.text }"
        >
          {{ label.name }}
        </button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
  background: var(--color-bg-default);
  border-radius: 0;
  border: none;
  margin: 0;
}

.filter-bar > .filter-section:first-child {
  margin-bottom: 10px;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.filter-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.button-group {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.label-group {
  flex-wrap: wrap;
}

.filter-button {
  padding: 8px 12px;
  border: 1px solid var(--color-border-secondary);
  background: var(--color-bg-default);
  cursor: pointer;
  border-radius: var(--border-radius);
  transition: all var(--transition-speed);
  font-size: 13px;
  color: var(--color-text-primary);
  text-align: left;
}

.filter-button:hover {
  border-color: var(--color-text-tertiary);
  background: var(--color-bg-hover);
}

.filter-button.active {
  background: var(--color-primary-light);
  color: var(--color-text-secondary);
  border-color: var(--color-primary-light);
}

.label-button {
  position: relative;
  text-align: center;
  font-weight: 600;
}

.label-button:hover {
  filter: brightness(0.98);
}

.label-button.is-selected {
  transform: translateY(-1px);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.15);
}

.label-button.is-selected::after {
  content: '✓';
  position: absolute;
  top: -7px;
  right: -7px;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: var(--color-primary-light);
  border: 1px solid #fff;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--color-text-primary);
  font-weight: 400;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  accent-color: var(--color-text-primary);
  width: 16px;
  height: 16px;
}

.search-input {
  display: block;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid var(--color-border-secondary);
  background: var(--color-bg-default);
  color: var(--color-text-primary);
  border-radius: var(--border-radius);
  font-size: 13px;
  transition: all var(--transition-speed);
}

.search-input:hover {
  border-color: var(--color-text-tertiary);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

@media (max-width: 768px) {
  .filter-bar {
    gap: 12px;
    padding: 15px;
  }

  .filter-section {
    flex: 1;
    min-width: 100%;
  }

  .button-group {
    flex-direction: row;
  }
}
</style>

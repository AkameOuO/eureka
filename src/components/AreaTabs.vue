<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  areas: Array<{ key: string; name: string }>
  selectedArea?: string
}

interface Emits {
  (e: 'area-change', key: string): void
}

const props = withDefaults(defineProps<Props>(), {
  selectedArea: 'all'
})
const emit = defineEmits<Emits>()
const { t } = useI18n()

const current = ref<string>(props.selectedArea)

watch(
  () => props.selectedArea,
  (newVal) => {
    current.value = newVal
  }
)

function selectArea(key: string): void {
  current.value = key
  emit('area-change', key)
}
</script>

<template>
  <div class="area-tabs-container">
    <div class="tabs-list">
      <button
        class="tab"
        :class="{ active: current === 'all' }"
        @click="selectArea('all')"
      >
        {{ t('filter.all') }}
      </button>
      <button
        v-for="area in areas"
        :key="area.key"
        class="tab"
        :class="{ active: current === area.key }"
        @click="selectArea(area.key)"
      >
        {{ area.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.area-tabs-container {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  border-bottom: 1px solid #eee;
  padding: 0;
  margin-bottom: 0;
  flex-shrink: 0;
}

.tabs-list {
  display: flex;
  gap: 0;
  padding: 0;
  align-items: flex-end;
}

.tab {
  padding: 12px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #999;
  position: relative;
  transition: all 0.2s ease;
  border-bottom: 3px solid transparent;
  margin-bottom: -1px;
}

.tab:hover {
  color: #333;
  background: #f5f5f5;
}

.tab.active {
  color: #333;
  border-bottom-color: #333;
  background: transparent;
  font-weight: 600;
}

.tab:not(:last-child) {
  border-right: 1px solid #f0f0f0;
}

@media (max-width: 768px) {
  .tabs-list {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .tab {
    padding: 10px 16px;
    font-size: 13px;
    white-space: nowrap;
  }
}
</style>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Eureka, EurekasData } from '../types'

interface Props {
  eurekas: Eureka[]
  data: EurekasData
  collection: string[]
}

interface Emits {
  (e: 'toggle', id: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { locale, t } = useI18n()

const slots = ['head', 'hand', 'foot']

function toggleSlot(eurekaId: string, color: string, slot: string): void {
  emit('toggle', `${eurekaId}_${color}_${slot}`)
}

function getColorName(colorKey: string, data: EurekasData): string {
  const color = data.colors[colorKey]
  if (!color) return colorKey
  return locale.value === 'zh_tw' ? color.name.zh_tw : color.name.en
}

function getSlotName(slot: string): string {
  const slotMap: Record<string, string> = {
    head: 'table.head',
    hand: 'table.hand',
    foot: 'table.foot'
  }
  const key = slotMap[slot] || slot
  return t(key)
}

function getEurekaName(eureka: Eureka): string {
  return locale.value === 'zh_tw' ? eureka.name.zh_tw : eureka.name.en
}

function getCollectedCount(eureka: Eureka): number {
  if (!props.collection || !Array.isArray(props.collection)) return 0
  let count = 0
  eureka.colors.forEach(color => {
    slots.forEach(slot => {
      if (props.collection?.includes(`${eureka.id}_${color}_${slot}`)) {
        count++
      }
    })
  })
  return count
}

function getTotalCount(eureka: Eureka): number {
  return eureka.colors.length * slots.length
}

function getRarityStars(rarity: number): string {
  return '★'.repeat(Math.max(0, rarity))
}

function getEurekaLabels(eureka: Eureka): Array<{ key: string; name: string; background: string; text: string }> {
  if (!eureka.labels || eureka.labels.length === 0) return []

  return eureka.labels
    .map((labelKey) => {
      const labelDef = props.data.labels?.[labelKey]
      if (!labelDef) return null

      return {
        key: labelKey,
        name: locale.value === 'zh_tw' ? labelDef.name.zh_tw : labelDef.name.en,
        background: labelDef.colors.background,
        text: labelDef.colors.text,
      }
    })
    .filter((label): label is { key: string; name: string; background: string; text: string } => label !== null)
}

function getColorBackground(colorStyle: Record<string, any>): string {
  // Use provided background directly when available.
  if (colorStyle.background) {
    return colorStyle.background
  }

  // Generate a gradient from hue and CSS variables.
  if (colorStyle.hue !== undefined) {
    return `linear-gradient(var(--color-gradient-direction), hsl(${colorStyle.hue}, var(--color-gradient-saturation-top), var(--color-gradient-lightness-top)), hsl(${colorStyle.hue}, var(--color-gradient-saturation-bottom), var(--color-gradient-lightness-bottom)))`
  }

  return 'transparent'
}
</script>

<template>
  <div class="table-container">
    <table v-if="eurekas.length > 0" class="eureka-table">
      <thead>
        <tr>
          <th rowspan="2">{{ t('table.eureka') }}</th>
          <th rowspan="2">{{ t('table.color') }}</th>
          <th colspan="3">{{ t('table.slot') }}</th>
        </tr>
        <tr>
          <th>{{ getSlotName('head') }}</th>
          <th>{{ getSlotName('hand') }}</th>
          <th>{{ getSlotName('foot') }}</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="(eureka, eurekaIndex) in eurekas" :key="eureka.id">
          <tr v-for="(color, colorIndex) in eureka.colors" :key="`${eureka.id}-${color}`" :class="{ 'eureka-divider': colorIndex === 0 }">
            <!-- Equipment info column (shown only on the first color row). -->
            <td v-if="colorIndex === 0" class="eureka-cell" :rowspan="eureka.colors.length">
              <div class="eureka-info">
                <div class="eureka-name">{{ getEurekaName(eureka) }}</div>
                <div class="eureka-meta">
                  <span class="eureka-rarity">{{ getRarityStars(eureka.rarity) }}</span>
                  <div v-if="getEurekaLabels(eureka).length > 0" class="eureka-labels">
                    <span
                      v-for="label in getEurekaLabels(eureka)"
                      :key="label.key"
                      class="eureka-label"
                      :style="{ background: label.background, color: label.text, borderColor: label.text }"
                    >
                      {{ label.name }}
                    </span>
                  </div>
                </div>
                <div class="eureka-progress">
                  {{ t('header.progress') }} {{ getCollectedCount(eureka) }} / {{ getTotalCount(eureka) }}
                </div>
              </div>
            </td>

            <!-- Color column -->
            <td v-if="data.colors[color]" class="color-cell" :style="{ background: getColorBackground(data.colors[color].style), color: data.colors[color].style.text }">
              {{ getColorName(color, data) }}
            </td>

            <!-- Slot checkbox column (head, hand, foot) -->
            <td class="slot-cell" v-for="slot in slots" :key="`${eureka.id}-${color}-${slot}`">
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  :checked="props.collection?.includes(`${eureka.id}_${color}_${slot}`) ?? false"
                  @change="toggleSlot(eureka.id, color, slot)"
                />
              </label>
            </td>

          </tr>
        </template>
      </tbody>
    </table>

    <div v-else class="no-data">
      No eureka data available
    </div>
  </div>
</template>

<style scoped>
.table-container {
  overflow-x: auto;
  margin-top: 0;
  /* padding: 0 20px 20px 20px; */
}

.eureka-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border: 1px solid #eee;
}

.eureka-table thead {
  background: var(--color-primary-light);
  font-weight: 600;
  border-bottom: 2px solid #E91E63;
  color: #C2185B;
}

.eureka-table th {
  padding: 12px;
  text-align: center;
  border-right: 1px solid #f0f0f0;
  font-size: 14px;
}

.eureka-table th:last-child {
  border-right: none;
}

.eureka-table tbody tr {
  border-bottom: 1px solid #f5f5f5;
}

.eureka-table tbody tr.eureka-divider {
  border-top: 2px solid #dddddd;
}

.eureka-table tbody tr:hover {
  background: #fafafa;
}

.eureka-table td {
  padding: 12px;
  border-right: 1px solid #f0f0f0;
  font-size: 14px;
}

.eureka-table td:last-child {
  border-right: none;
}

/* 装备信息列 */
.eureka-cell {
  background: #f9f9f9;
  font-weight: 500;
  min-width: 220px;
  vertical-align: middle;
  text-align: center;
}

.eureka-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.eureka-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.eureka-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.eureka-rarity {
  color: #f5b301;
  font-size: 13px;
  letter-spacing: 1px;
}

.eureka-labels {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.eureka-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
}

.eureka-images {
  display: flex;
  gap: 6px;
}

.eureka-image {
  width: 50px;
  height: 50px;
  border-radius: 4px;
  background: #e0e0e0;
  object-fit: cover;
  border: 1px solid #ddd;
}

.eureka-progress {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  font-weight: 400;
}

/* 颜色列 */
.color-cell {
  text-align: center;
  font-weight: 600;
  min-width: 80px;
  vertical-align: middle;
}

/* 部位列（checkbox） */
.slot-cell {
  text-align: center;
  width: 60px;
  vertical-align: middle;
}

.checkbox-label {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
  accent-color: #E91E63;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
}

@media (max-width: 768px) {
  .eureka-table th,
  .eureka-table td {
    padding: 8px;
    font-size: 12px;
  }

  .eureka-cell {
    min-width: 150px;
  }

  .eureka-name {
    font-size: 13px;
  }

  .eureka-rarity {
    font-size: 12px;
  }

  .eureka-label {
    font-size: 10px;
    padding: 2px 6px;
  }
}
</style>

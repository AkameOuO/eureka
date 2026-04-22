<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { languages } from '../../locales/config'

interface Emits {
  (e: 'locale-change', locale: string): void
  (e: 'open-sync-modal'): void
}

const emit = defineEmits<Emits>()
const { locale, t } = useI18n()

const isDropdownOpen = ref(false)

function changeLocale(newLocale: string): void {
  emit('locale-change', newLocale)
  isDropdownOpen.value = false
}

function getLocaleLabel(): string {
  const currentLang = languages.find(lang => lang.code === locale.value)
  return currentLang?.nativeName || locale.value
}
</script>

<template>
  <header class="header">
    <div class="header-left">
      <h1>{{ t('header.title') }}</h1>
    </div>

    <div class="header-right">
      <!-- Language Dropdown -->
      <div class="locale-dropdown">
        <button
          class="dropdown-toggle"
          @click="isDropdownOpen = !isDropdownOpen"
        >
          {{ getLocaleLabel() }}
          <span class="arrow" :class="{ open: isDropdownOpen }">▼</span>
        </button>
        <div v-if="isDropdownOpen" class="dropdown-menu">
          <button
            v-for="lang in languages"
            :key="lang.code"
            class="dropdown-item"
            :class="{ active: locale === lang.code }"
            @click="changeLocale(lang.code)"
          >
            {{ lang.flag && `${lang.flag} ` }}{{ lang.nativeName }}
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0 0 30px 0;
  padding: 20px;
  background: linear-gradient(135deg, #FFB6D9 0%, #FFC0CB 100%);
  box-shadow: 0 2px 8px rgba(233, 30, 99, 0.15);
}

.header-left h1 {
  margin: 0;
  font-size: 28px;
  color: #C2185B;
  font-weight: 700;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.locale-dropdown {
  position: relative;
}

.dropdown-toggle {
  padding: 10px 16px;
  background: white;
  border: 2px solid #E91E63;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  color: #C2185B;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  font-size: 14px;
}

.dropdown-toggle:hover {
  background: #FCE4EC;
  border-color: #C2185B;
}

.dropdown-toggle:active {
  background: #F8BBD0;
}

.arrow {
  display: inline-block;
  font-size: 11px;
  transition: transform 0.2s ease;
}

.arrow.open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border: 2px solid #E91E63;
  border-radius: 6px;
  min-width: 160px;
  box-shadow: 0 4px 12px rgba(233, 30, 99, 0.2);
  z-index: 1000;
  overflow: hidden;
}

.dropdown-item {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #C2185B;
  font-weight: 500;
  font-size: 14px;
  text-align: left;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background: #FCE4EC;
}

.dropdown-item.active {
  background: #F8BBD0;
  color: #8B1A62;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
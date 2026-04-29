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

function onLocaleLinkClick(newLocale: string): void {
  const path = newLocale === 'zh_tw' ? '/zh-tw' : `/${newLocale}`
  try {
    window.history.pushState({}, '', path)
  } catch {}
  emit('locale-change', newLocale)
  isDropdownOpen.value = false
}
</script>

<template>
  <header class="header">
    <div class="header-left">
      <img src="/favicon.svg" alt="logo" class="header-icon" />
      <h1>{{ t('header.title') }}</h1>
      <span class="header-beta">BETA</span>
    </div>

    <div class="header-right">
      <div class="locale-dropdown">
        <button
          class="dropdown-toggle"
          @click="isDropdownOpen = !isDropdownOpen"
          aria-label="Change language"
          title="Change language"
        >
          <svg class="globe-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8" />
            <path d="M3 12h18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            <path d="M12 3c2.8 2.4 4.2 5.4 4.2 9S14.8 18.6 12 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            <path d="M12 3c-2.8 2.4-4.2 5.4-4.2 9S9.2 18.6 12 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          <span class="arrow" :class="{ open: isDropdownOpen }">▼</span>
        </button>
        <div v-if="isDropdownOpen" class="dropdown-menu">
          <a
            v-for="lang in languages"
            :key="lang.code"
            class="dropdown-item"
            :class="{ active: locale === lang.code }"
            :href="lang.code === 'zh_tw' ? '/zh-tw' : `/${lang.code}`"
            @click.prevent="onLocaleLinkClick(lang.code)"
          >
            {{ lang.flag && `${lang.flag} ` }}{{ lang.nativeName }}
          </a>
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
  background: var(--color-primary-light);
  box-shadow: 0 2px 8px rgba(233, 30, 99, 0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.header-left h1 {
  margin: 0;
  font-size: 28px;
  color: #C2185B;
  font-weight: 700;
}

.header-beta {
  align-self: flex-end;
  margin-bottom: 3px;
  font-size: 14px;
  font-style: italic;
  font-weight: 600;
  letter-spacing: 0.8px;
  color: #8B1A62;
  opacity: 0.9;
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
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 0;
  cursor: pointer;
  font-weight: 600;
  color: #C2185B;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  font-size: 14px;
}

.globe-icon {
  width: 18px;
  height: 18px;
  display: block;
}

.dropdown-toggle:hover {
  color: #8B1A62;
}

.dropdown-toggle:active {
  color: #6f124f;
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
  display: block;
  text-decoration: none;
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
    gap: 12px;
    padding: 16px;
  }

  .header-left {
    min-width: 0;
  }

  .header-left h1 {
    font-size: 24px;
    line-height: 1.1;
  }

  .header-beta {
    font-size: 12px;
    margin-bottom: 2px;
  }

  .header-icon {
    width: 32px;
    height: 32px;
  }

  .header-right {
    margin-left: auto;
    justify-content: flex-end;
  }

  .dropdown-toggle {
    padding: 7px 10px;
    font-size: 13px;
    gap: 6px;
  }
}
</style>
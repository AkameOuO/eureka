<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const { t, locale } = useI18n()

// 根據當前語言決定使用的連結版本
const privacyPolicyUrl = computed(() => locale.value === 'zh_tw' ? '/zh-tw/privacy-policy/' : '/en/privacy-policy/')
const termsOfServiceUrl = computed(() => locale.value === 'zh_tw' ? '/zh-tw/terms-of-service/' : '/en/terms-of-service/')
const feedbackFormUrl = import.meta.env.VITE_FEEDBACK_FORM_URL || ''
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer__content">
      <p class="app-footer__text">
        <strong>{{ t('header.title') }}</strong>
        <span>{{ t('app.description') }}</span>
      </p>
      <p class="app-footer__disclaimer">{{ t('app.unofficialDisclaimer') }}</p>
      <p class="app-footer__copyright">© 2026 AkameOuO</p>
    </div>
    <div v-if="feedbackFormUrl" class="app-footer__feedback">
      <div class="app-footer__feedback-copy">
        <p class="app-footer__feedback-title">{{ t('app.feedbackTitle') }}</p>
        <p class="app-footer__feedback-text">{{ t('app.feedbackDescription') }}</p>
      </div>
      <a class="app-footer__feedback-link" :href="feedbackFormUrl" target="_blank" rel="noopener noreferrer">
        {{ t('app.feedbackAction') }}
      </a>
    </div>
    <div class="app-footer__links">
      <a class="app-footer__link" :href="privacyPolicyUrl" target="_blank" rel="noopener noreferrer">
        {{ t('app.privacyPolicy') }}
      </a>
      <a class="app-footer__link" :href="termsOfServiceUrl" target="_blank" rel="noopener noreferrer">
        {{ t('app.termsOfService') }}
      </a>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding: 14px 15%;
  border-top: 1px solid #f2d7e3;
  background: #fffafc;
  color: #5f5560;
  font-size: 12px;
  line-height: 1.6;
}

.app-footer__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-footer__feedback {
  flex: 0 1 320px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #f2d7e3;
  border-radius: 14px;
  background: linear-gradient(180deg, #fff 0%, #fff7fb 100%);
  box-shadow: 0 8px 18px rgba(194, 24, 91, 0.06);
  min-width: 0;
  box-sizing: border-box;
}

.app-footer__feedback-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.app-footer__feedback-title {
  margin: 0;
  color: #8f1241;
  font-weight: 700;
  font-size: 12px;
}

.app-footer__feedback-text {
  margin: 0;
  color: #7c6f77;
  font-size: 11px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.app-footer__feedback-link {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: #c2185b;
  color: #fff;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.app-footer__feedback-link:hover {
  background: #a9154f;
}

.app-footer__text {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0 8px;
}

.app-footer__copyright {
  margin: 0;
  color: #766a73;
}

.app-footer__disclaimer {
  margin: 0;
  color: #8a7d86;
  font-size: 11px;
  line-height: 1.5;
}

.app-footer__text span {
  white-space: normal;
}

.app-footer__text strong {
  color: #8f1241;
}

.app-footer__link {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 11px;
  border-radius: 999px;
  border: 1px solid #f2d7e3;
  background: #fff;
  color: #c2185b;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
}

.app-footer__link:hover {
  background: #fff0f6;
}

.app-footer__links {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 1200px) {
  .app-footer__feedback {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 10px 12px;
  }

  .app-footer__feedback-link {
    width: fit-content;
    max-width: 100%;
    padding: 6px 10px;
    font-size: 11px;
    align-self: flex-start;
    white-space: normal;
  }

  .app-footer__feedback-text {
    line-height: 1.45;
  }
}

@media (max-width: 768px) {
  .app-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 12px 15px;
  }

  .app-footer__text {
    font-size: 11px;
  }

  .app-footer__content {
    width: 100%;
    gap: 1px;
  }

  .app-footer__feedback {
    width: 100%;
    max-width: 100%;
    flex-basis: auto;
  }

  .app-footer__links {
    width: 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}
</style>
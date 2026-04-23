<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
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
    <a class="app-footer__link" href="/privacy-policy.html" target="_blank" rel="noopener noreferrer">
      {{ t('app.privacyPolicy') }}
    </a>
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

@media (max-width: 768px) {
  .app-footer {
    flex-direction: column;
    align-items: flex-start;
    padding: 14px 15px;
  }

  .app-footer__text {
    font-size: 11px;
  }

  .app-footer__content {
    width: 100%;
  }
}
</style>
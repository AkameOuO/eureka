<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toast } = useToast()
</script>

<template>
  <transition name="toast-fade">
    <div v-if="toast.visible" :class="['toast-container', toast.type]">
      <span class="toast-message">{{ toast.message }}</span>
    </div>
  </transition>
</template>

<style scoped>
/* 全局 Toast */
.toast-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 2000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-width: 300px;
  text-align: center;
  justify-content: center;
}

.toast-container.success {
  background: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success-border);
}

.toast-container.error {
  background: var(--color-error-bg);
  color: var(--color-error-text);
  border: 1px solid var(--color-error-border);
}

.toast-container.info {
  background: var(--color-info-bg, #e3f2fd);
  color: var(--color-info-text, #1976d2);
  border: 1px solid var(--color-info-border, #90caf9);
}

.toast-message {
  flex: 1;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}
</style>

import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

function inlineEurekasData() {
  const virtualModuleId = 'virtual:eurekas-data'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`
  const dataFilePath = fileURLToPath(new URL('./data/eurekas.json', import.meta.url))

  return {
    name: 'inline-eurekas-data',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
      return null
    },
    load(id: string) {
      if (id !== resolvedVirtualModuleId) {
        return null
      }

      const rawContent = readFileSync(dataFilePath, 'utf-8')
      const minifiedContent = JSON.stringify(JSON.parse(rawContent))
      return `export default ${minifiedContent}`
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    inlineEurekasData(),
    vueDevTools(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        privacyPolicy: fileURLToPath(new URL('./zh-tw/privacy-policy/index.html', import.meta.url)),
        privacyPolicy_en: fileURLToPath(new URL('./en/privacy-policy/index.html', import.meta.url)),
        termsOfService: fileURLToPath(new URL('./zh-tw/terms-of-service/index.html', import.meta.url)),
        termsOfService_en: fileURLToPath(new URL('./en/terms-of-service/index.html', import.meta.url)),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})

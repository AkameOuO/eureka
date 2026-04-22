import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  message: string
  type: ToastType
  visible: boolean
}

let toastInstance: ReturnType<typeof createToast> | null = null
let toastTimer: number

function createToast() {
  const toast = ref<ToastState>({
    message: '',
    type: 'info',
    visible: false
  })

  const show = (message: string, type: ToastType = 'info', duration = 2000): void => {
    toast.value = {
      message,
      type,
      visible: true
    }

    clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => {
      toast.value.visible = false
    }, duration)
  }

  const success = (message: string, duration?: number): void => {
    show(message, 'success', duration)
  }

  const error = (message: string, duration?: number): void => {
    show(message, 'error', duration)
  }

  const info = (message: string, duration?: number): void => {
    show(message, 'info', duration)
  }

  const hide = (): void => {
    clearTimeout(toastTimer)
    toast.value.visible = false
  }

  return {
    toast,
    show,
    success,
    error,
    info,
    hide
  }
}

export function useToast() {
  if (!toastInstance) {
    toastInstance = createToast()
  }
  return toastInstance
}

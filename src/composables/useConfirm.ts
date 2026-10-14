import { ref } from 'vue'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmText?: string
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void
}

/** Shared state for the single ConfirmDialog mounted in AdminLayout. */
const request = ref<ConfirmRequest | null>(null)

export function useConfirm() {
  /** Resolves true when the user confirms, false when they cancel. */
  function confirm(options: ConfirmOptions): Promise<boolean> {
    request.value?.resolve(false)
    return new Promise((resolve) => {
      request.value = { ...options, resolve }
    })
  }

  function settle(confirmed: boolean) {
    request.value?.resolve(confirmed)
    request.value = null
  }

  return { request, confirm, settle }
}

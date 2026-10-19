import { ref } from 'vue'

export interface Notice {
  id: number
  kind: 'success' | 'error'
  text: string
}

/** Shared state for the single AdminNotifier mounted in AdminLayout. */
const notice = ref<Notice | null>(null)
let nextId = 1

export function useNotify() {
  function show(kind: Notice['kind'], text: string) {
    notice.value = { id: nextId++, kind, text }
  }

  return {
    notice,
    success: (text: string) => show('success', text),
    /** Shows the error's own message when it has one, after a plain-language lead-in. */
    error: (lead: string, cause?: unknown) => {
      const detail = cause instanceof Error && cause.message ? ` ${cause.message}` : ''
      show('error', `${lead}${detail}`)
    },
    dismiss: () => {
      notice.value = null
    },
  }
}

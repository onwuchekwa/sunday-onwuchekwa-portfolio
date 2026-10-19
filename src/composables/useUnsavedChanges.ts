import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useConfirm } from '@/composables/useConfirm'

/**
 * Tracks whether `source` differs from what was last loaded or saved, and asks before
 * leaving the page (in the app or by closing the tab) while it does.
 *
 * Call `markSaved()` after loading and after each successful save. Until the first call
 * nothing counts as changed, so a page that is still loading never warns.
 */
export function useUnsavedChanges(source: () => unknown) {
  const { confirm } = useConfirm()
  const baseline = ref<string | null>(null)

  const isDirty = computed(() => baseline.value !== null && JSON.stringify(source()) !== baseline.value)

  function markSaved() {
    baseline.value = JSON.stringify(source())
  }

  /** Resolves true when there's nothing to lose or the user chooses to discard it. */
  async function confirmDiscard(): Promise<boolean> {
    if (!isDirty.value) return true
    return confirm({
      title: 'Discard unsaved changes?',
      message: 'Your edits on this page haven’t been saved yet.',
      confirmText: 'Discard changes',
    })
  }

  onBeforeRouteLeave(() => confirmDiscard())

  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!isDirty.value) return
    event.preventDefault()
    // Older browsers show the prompt only when returnValue is set.
    event.returnValue = ''
  }
  onMounted(() => window.addEventListener('beforeunload', onBeforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', onBeforeUnload))

  return { isDirty, markSaved, confirmDiscard }
}

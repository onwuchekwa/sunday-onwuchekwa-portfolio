/**
 * Tracks the public content reads in flight, so startup can tell when a page has its data.
 *
 * Each built page ships with a snapshot of its content (scripts/prerender-content.mjs). The app
 * renders hidden behind it and takes over once its own reads have finished, so visitors never
 * see an empty page in between.
 */
let pending = 0
let waiters: (() => void)[] = []

export function trackLoad<T>(load: Promise<T>): Promise<T> {
  pending++
  return load.finally(() => {
    pending--
    if (pending === 0) {
      // A finished read can start another (e.g. a view loading more after settings); let it.
      setTimeout(() => {
        if (pending > 0) return
        waiters.forEach((resolve) => resolve())
        waiters = []
      })
    }
  })
}

/** Resolves true once no reads are in flight, or false after `timeoutMs`. */
export function whenLoadsSettle(timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    const done = () => resolve(true)
    setTimeout(() => resolve(false), timeoutMs)
    if (pending === 0) setTimeout(() => (pending === 0 ? done() : waiters.push(done)))
    else waiters.push(done)
  })
}

/** Swap the static snapshot for the live app. The build's snapshot step waits on `appReady`. */
export function revealApp(settled: boolean): void {
  document.getElementById('prerendered')?.remove()
  document.getElementById('prerender-style')?.remove()
  document.documentElement.dataset.appReady = settled ? 'settled' : 'timeout'
}

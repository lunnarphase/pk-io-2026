import { vi } from 'vitest'

export function installMockIntersectionObserver() {
  let observerCallback: IntersectionObserverCallback
  let lastObserver: IntersectionObserver | undefined
  const observe = vi.fn()
  const disconnect = vi.fn()
  const unobserve = vi.fn()

  class MockIntersectionObserver {
    constructor(cb: IntersectionObserverCallback) {
      observerCallback = cb
      lastObserver = this as unknown as IntersectionObserver
    }

    observe = observe
    disconnect = disconnect
    unobserve = unobserve
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

  return {
    observe,
    disconnect,
    triggerIntersect(target: Element, isIntersecting = true) {
      observerCallback(
        [{ isIntersecting, target } as IntersectionObserverEntry],
        lastObserver!,
      )
    },
  }
}

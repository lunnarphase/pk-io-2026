import { useEffect, useRef } from 'react'

export function useLoadMoreOnIntersect(
  onLoadMore: () => void,
  enabled: boolean,
): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null)
  const onLoadMoreRef = useRef(onLoadMore)

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMoreRef.current()
        }
      },
      { rootMargin: '240px', threshold: 0 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled])

  return ref
}

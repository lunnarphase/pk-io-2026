import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useLoadMoreOnIntersect } from '@/hooks/useLoadMoreOnIntersect'
import { installMockIntersectionObserver } from '@/test/mock-intersection-observer'

describe('useLoadMoreOnIntersect', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function Sentinel({ enabled }: { enabled: boolean }) {
    const onLoadMore = vi.fn()
    const ref = useLoadMoreOnIntersect(onLoadMore, enabled)
    return <div ref={ref} data-testid="sentinel" />
  }

  it('does not observe when disabled', () => {
    const { observe } = installMockIntersectionObserver()
    render(<Sentinel enabled={false} />)
    expect(observe).not.toHaveBeenCalled()
  })

  it('observes sentinel element when enabled', () => {
    const { observe } = installMockIntersectionObserver()
    render(<Sentinel enabled={true} />)
    expect(observe).toHaveBeenCalledWith(screen.getByTestId('sentinel'))
  })

  it('calls onLoadMore when sentinel intersects', () => {
    const { triggerIntersect } = installMockIntersectionObserver()
    const onLoadMore = vi.fn()
    function HookHost() {
      const ref = useLoadMoreOnIntersect(onLoadMore, true)
      return <div ref={ref} data-testid="sentinel" />
    }
    render(<HookHost />)
    triggerIntersect(screen.getByTestId('sentinel'))
    expect(onLoadMore).toHaveBeenCalledTimes(1)
  })
})

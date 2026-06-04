import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { installMockIntersectionObserver } from '@/test/mock-intersection-observer'

describe('useIntersectionObserver', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function Target() {
    const [ref, visible] = useIntersectionObserver<HTMLDivElement>()
    return (
      <div>
        <div ref={ref} data-testid="target" />
        <span data-testid="visible">{visible ? 'yes' : 'no'}</span>
      </div>
    )
  }

  it('starts not visible', () => {
    installMockIntersectionObserver()
    render(<Target />)
    expect(screen.getByTestId('visible')).toHaveTextContent('no')
  })

  it('becomes visible on intersection', () => {
    const { triggerIntersect, observe } = installMockIntersectionObserver()
    render(<Target />)
    const el = screen.getByTestId('target')
    expect(observe).toHaveBeenCalledWith(el)
    act(() => {
      triggerIntersect(el)
    })
    expect(screen.getByTestId('visible')).toHaveTextContent('yes')
  })
})

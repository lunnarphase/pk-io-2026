import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

/** TipTap / ProseMirror expects layout APIs missing in jsdom. */
if (!document.elementFromPoint) {
  document.elementFromPoint = () => null
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.clearAllMocks()
})

import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ExternalUnavailableBanner } from '@/features/external/ExternalUnavailableBanner'
import { renderWithProviders } from '@/test/test-utils'

describe('ExternalUnavailableBanner', () => {
  it('explains missing external API configuration', () => {
    renderWithProviders(<ExternalUnavailableBanner />)
    expect(
      screen.getByText(/Katalog zewnętrznych przepisów jest chwilowo niedostępny/i),
    ).toBeInTheDocument()
  })
})

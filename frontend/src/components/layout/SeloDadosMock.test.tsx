import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SeloDadosMock } from './SeloDadosMock'

describe('SeloDadosMock', () => {
  it('renderiza o texto "Dados de demonstração"', () => {
    render(<SeloDadosMock />)
    expect(screen.getByText('Dados de demonstração')).toBeInTheDocument()
  })
})

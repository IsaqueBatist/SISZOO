import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouteErrorBoundary } from './RouteErrorBoundary'

function ComponenteQueQuebra(): never {
  // Representa uma rota lazy cujo chunk falhou ao carregar/avaliar (ex.:
  // falha de rede ao baixar o import() dinâmico) — o boundary precisa tratar
  // qualquer erro de render da subárvore, não só esse caso específico.
  throw new Error('Falha ao carregar o chunk da rota')
}

describe('RouteErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza os filhos normalmente quando não há erro', () => {
    render(
      <RouteErrorBoundary>
        <div>Conteúdo da rota</div>
      </RouteErrorBoundary>,
    )

    expect(screen.getByText('Conteúdo da rota')).toBeInTheDocument()
  })

  it('mostra uma UI de retry em vez de quebrar a árvore quando a rota falha ao carregar', () => {
    render(
      <RouteErrorBoundary>
        <ComponenteQueQuebra />
      </RouteErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/não foi possível carregar esta página/i)
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
  })

  it('tenta novamente recarregando a página', async () => {
    const reloadMock = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload: reloadMock })
    const user = userEvent.setup()

    render(
      <RouteErrorBoundary>
        <ComponenteQueQuebra />
      </RouteErrorBoundary>,
    )

    await user.click(screen.getByRole('button', { name: /tentar novamente/i }))

    expect(reloadMock).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })
})

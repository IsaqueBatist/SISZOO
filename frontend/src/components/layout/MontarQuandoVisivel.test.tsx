import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MontarQuandoVisivel } from './MontarQuandoVisivel'

type Callback = (entradas: Array<{ isIntersecting: boolean }>) => void

function instalarObserverFalso() {
  const instancias: Array<{ callback: Callback; disconnect: ReturnType<typeof vi.fn> }> = []
  class ObserverFalso {
    callback: Callback
    disconnect = vi.fn()
    observe = vi.fn()
    constructor(callback: Callback) {
      this.callback = callback
      instancias.push(this)
    }
  }
  vi.stubGlobal('IntersectionObserver', ObserverFalso)
  return instancias
}

describe('MontarQuandoVisivel', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reserva o espaço e só monta os filhos quando o bloco fica visível', () => {
    const instancias = instalarObserverFalso()
    const { container } = render(
      <MontarQuandoVisivel alturaReservada={220}>
        <p>Gráfico</p>
      </MontarQuandoVisivel>,
    )

    expect(screen.queryByText('Gráfico')).not.toBeInTheDocument()
    expect(container.firstElementChild).toHaveStyle({ minHeight: '220px' })

    act(() => instancias[0].callback([{ isIntersecting: false }]))
    expect(screen.queryByText('Gráfico')).not.toBeInTheDocument()

    act(() => instancias[0].callback([{ isIntersecting: true }]))
    expect(screen.getByText('Gráfico')).toBeInTheDocument()
    expect(instancias[0].disconnect).toHaveBeenCalled()
  })

  it('sem IntersectionObserver monta na hora', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    render(
      <MontarQuandoVisivel alturaReservada={220}>
        <p>Gráfico</p>
      </MontarQuandoVisivel>,
    )

    expect(screen.getByText('Gráfico')).toBeInTheDocument()
  })
})

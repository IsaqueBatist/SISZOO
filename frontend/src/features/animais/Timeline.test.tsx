import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Timeline } from './Timeline'
import type { EventoTimeline } from './useTimelineAnimal'

function evento(sobrescrever: Partial<EventoTimeline> & Pick<EventoTimeline, 'id' | 'tipo' | 'data' | 'titulo'>): EventoTimeline {
  return {
    por: 'Dra. Ana',
    retificado: false,
    ...sobrescrever,
  }
}

describe('Timeline', () => {
  it('renderiza os eventos em ordem decrescente de data, mesmo recebendo a lista fora de ordem', () => {
    const eventos: EventoTimeline[] = [
      evento({ id: '1', tipo: 'vacina', data: '2026-01-10', titulo: 'Vacina V10 aplicada' }),
      evento({ id: '2', tipo: 'medicamento', data: '2026-03-05', titulo: 'Início: Fenobarbital 30mg' }),
      // Mesma data que o evento acima, tipo diferente — cobre comparação
      // entre datas iguais/próximas, não só bem espaçadas.
      evento({ id: '3', tipo: 'procedimento', data: '2026-03-05', titulo: 'Castração' }),
      evento({ id: '4', tipo: 'entrada', data: '2026-01-01', titulo: 'Entrada no CCZ' }),
    ]

    render(<Timeline eventos={eventos} carregando={false} fimDoHistorico={true} erro={false} onCarregarMais={vi.fn()} />)

    const titulos = screen.getAllByText(/Vacina V10 aplicada|Início: Fenobarbital 30mg|Castração|Entrada no CCZ/).map((el) => el.textContent)

    expect(titulos).toEqual(['Início: Fenobarbital 30mg', 'Castração', 'Vacina V10 aplicada', 'Entrada no CCZ'])
  })

  it('exibe um ícone distinto por tipo de evento', () => {
    const eventos: EventoTimeline[] = [
      evento({ id: '1', tipo: 'vacina', data: '2026-03-01', titulo: 'Vacina V10 aplicada' }),
      evento({ id: '2', tipo: 'procedimento', data: '2026-02-01', titulo: 'Castração' }),
      evento({ id: '3', tipo: 'medicamento', data: '2026-01-01', titulo: 'Início: Fenobarbital 30mg' }),
      evento({ id: '4', tipo: 'entrada', data: '2025-12-01', titulo: 'Entrada no CCZ' }),
    ]

    const { container } = render(
      <Timeline eventos={eventos} carregando={false} fimDoHistorico={true} erro={false} onCarregarMais={vi.fn()} />,
    )

    const iconesPorTipo = ['vacina', 'cirurgia', 'medicamento', 'entrada'].map(
      (classe) => container.querySelector(`.timeline-item.${classe} .bullet svg`)?.innerHTML,
    )

    expect(iconesPorTipo.every(Boolean)).toBe(true)
    // Cada tipo deve renderizar um ícone com marcação SVG diferente dos demais.
    expect(new Set(iconesPorTipo).size).toBe(iconesPorTipo.length)
  })

  it('mostra estado vazio amigável quando não há eventos', () => {
    render(<Timeline eventos={[]} carregando={false} fimDoHistorico={true} erro={false} onCarregarMais={vi.fn()} />)

    expect(screen.getByText('Nenhum evento registrado')).toBeInTheDocument()
  })

  it('mostra alerta de erro quando o carregamento falha', () => {
    render(<Timeline eventos={[]} carregando={false} fimDoHistorico={false} erro={true} onCarregarMais={vi.fn()} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível carregar o histórico.')
  })

  it('mostra o skeleton de carregamento inicial quando ainda não há eventos', () => {
    const { container } = render(
      <Timeline eventos={[]} carregando={true} fimDoHistorico={false} erro={false} onCarregarMais={vi.fn()} />,
    )

    expect(container.querySelector('.skel')).toBeInTheDocument()
  })

  it('aciona onCarregarMais ao clicar em "Carregar mais" e mostra "Fim do histórico" quando não há mais páginas', async () => {
    const onCarregarMais = vi.fn()
    const { rerender } = render(
      <Timeline
        eventos={[evento({ id: '1', tipo: 'vacina', data: '2026-01-01', titulo: 'Vacina V10 aplicada' })]}
        carregando={false}
        fimDoHistorico={false}
        erro={false}
        onCarregarMais={onCarregarMais}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Carregar mais 20 eventos' }))
    expect(onCarregarMais).toHaveBeenCalledTimes(1)

    rerender(
      <Timeline
        eventos={[evento({ id: '1', tipo: 'vacina', data: '2026-01-01', titulo: 'Vacina V10 aplicada' })]}
        carregando={false}
        fimDoHistorico={true}
        erro={false}
        onCarregarMais={onCarregarMais}
      />,
    )

    expect(screen.getByText('Fim do histórico')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Carregar mais 20 eventos' })).not.toBeInTheDocument()
  })
})

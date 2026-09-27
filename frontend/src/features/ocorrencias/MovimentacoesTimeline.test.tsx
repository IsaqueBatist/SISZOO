import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MovimentacoesTimeline } from './MovimentacoesTimeline'
import type { MovimentacaoOcorrencia } from './ocorrencias.types'

function movimentacao(sobrescrever: Partial<MovimentacaoOcorrencia> & Pick<MovimentacaoOcorrencia, 'id' | 'tipoMovimentacao' | 'data'>): MovimentacaoOcorrencia {
  return {
    descricao: null,
    usuarioNome: 'Rafael Santos',
    ...sobrescrever,
  }
}

describe('MovimentacoesTimeline', () => {
  it('ordena as movimentações por data decrescente, mesmo recebendo a lista fora de ordem', () => {
    const movimentacoes: MovimentacaoOcorrencia[] = [
      movimentacao({ id: '1', tipoMovimentacao: 'registrada', data: '2026-05-10T11:00:00Z' }),
      movimentacao({ id: '2', tipoMovimentacao: 'encerrada', data: '2026-05-12T16:00:00Z' }),
      movimentacao({ id: '3', tipoMovimentacao: 'equipe_despachada', data: '2026-05-11T09:00:00Z' }),
    ]

    render(<MovimentacoesTimeline movimentacoes={movimentacoes} />)

    const titulos = screen
      .getAllByText(/Ocorrência registrada|Ocorrência encerrada|Equipe despachada/)
      .map((el) => el.textContent)

    expect(titulos).toEqual(['Ocorrência encerrada', 'Equipe despachada', 'Ocorrência registrada'])
  })

  it('formata data/hora em DD/MM/AAAA e exibe o autor de cada movimentação', () => {
    render(
      <MovimentacoesTimeline
        movimentacoes={[
          movimentacao({ id: '1', tipoMovimentacao: 'registrada', data: '2026-05-10T11:00:00Z', usuarioNome: 'Rafael Santos' }),
          movimentacao({ id: '2', tipoMovimentacao: 'equipe_despachada', data: '2026-05-11T09:00:00Z', usuarioNome: 'Sistema' }),
        ]}
      />,
    )

    expect(screen.getByText('10/05/2026 · 08:00')).toBeInTheDocument()
    expect(screen.getByText('Por Rafael Santos')).toBeInTheDocument()
    expect(screen.getByText('Por Sistema')).toBeInTheDocument()
  })

  it('mostra estado vazio amigável quando não há movimentações', () => {
    render(<MovimentacoesTimeline movimentacoes={[]} />)

    expect(screen.getByText('Nenhuma movimentação registrada')).toBeInTheDocument()
  })
})

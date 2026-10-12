import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MovimentacoesTimeline } from './MovimentacoesTimeline'
import type { MovimentacaoOcorrencia } from '../types/ocorrencias.types'

// Datas no formato da API: LocalDateTime sem fuso, já no horário do CCZ.
function movimentacao(sobrescrever: Partial<MovimentacaoOcorrencia> & Pick<MovimentacaoOcorrencia, 'id' | 'tipoMovimentacao' | 'data'>): MovimentacaoOcorrencia {
  return {
    statusAnterior: null,
    statusNovo: null,
    descricao: null,
    usuarioId: 'u1000000-0000-0000-0000-000000000001',
    usuarioNome: 'Rafael Santos',
    ...sobrescrever,
  }
}

describe('MovimentacoesTimeline', () => {
  it('ordena as movimentações por data decrescente, mesmo recebendo a lista fora de ordem', () => {
    const movimentacoes: MovimentacaoOcorrencia[] = [
      movimentacao({ id: '1', tipoMovimentacao: 'REGISTRADA', data: '2026-05-10T08:00:00' }),
      movimentacao({ id: '2', tipoMovimentacao: 'ENCERRADA', data: '2026-05-12T13:00:00.123456' }),
      movimentacao({ id: '3', tipoMovimentacao: 'EQUIPE_DESPACHADA', data: '2026-05-11T06:00:00.5' }),
    ]

    render(<MovimentacoesTimeline movimentacoes={movimentacoes} />)

    const titulos = screen
      .getAllByText(/Ocorrência registrada|Ocorrência encerrada|Equipe despachada/)
      .map((el) => el.textContent)

    expect(titulos).toEqual(['Ocorrência encerrada', 'Equipe despachada', 'Ocorrência registrada'])
  })

  it('formata data/hora em DD/MM/AAAA · HH:mm sem deslocar fuso e exibe o autor de cada movimentação', () => {
    render(
      <MovimentacoesTimeline
        movimentacoes={[
          movimentacao({ id: '1', tipoMovimentacao: 'REGISTRADA', data: '2026-05-10T08:00:00.004432', usuarioNome: 'Rafael Santos' }),
          movimentacao({ id: '2', tipoMovimentacao: 'EQUIPE_DESPACHADA', data: '2026-05-11T06:00:00', usuarioNome: 'Sistema' }),
        ]}
      />,
    )

    expect(screen.getByText('10/05/2026 · 08:00')).toBeInTheDocument()
    expect(screen.getByText('Por Rafael Santos')).toBeInTheDocument()
    expect(screen.getByText('Por Sistema')).toBeInTheDocument()
  })

  it('mostra a transição de status quando a movimentação muda o status', () => {
    render(
      <MovimentacoesTimeline
        movimentacoes={[
          movimentacao({
            id: '1',
            tipoMovimentacao: 'EQUIPE_DESPACHADA',
            data: '2026-05-11T06:00:00',
            statusAnterior: 'ABERTA',
            statusNovo: 'EM_ATENDIMENTO',
          }),
        ]}
      />,
    )

    expect(screen.getByText(/Aberta → Em atendimento/)).toBeInTheDocument()
  })

  it('mostra nota interna com a descrição', () => {
    render(
      <MovimentacoesTimeline
        movimentacoes={[
          movimentacao({ id: '1', tipoMovimentacao: 'NOTA_INTERNA', data: '2026-05-11T06:00:00', descricao: 'Morador ausente.' }),
        ]}
      />,
    )

    expect(screen.getByText('Nota interna')).toBeInTheDocument()
    expect(screen.getByText(/Morador ausente\./)).toBeInTheDocument()
  })

  it('mostra estado vazio amigável quando não há movimentações', () => {
    render(<MovimentacoesTimeline movimentacoes={[]} />)

    expect(screen.getByText('Nenhuma movimentação registrada')).toBeInTheDocument()
  })
})

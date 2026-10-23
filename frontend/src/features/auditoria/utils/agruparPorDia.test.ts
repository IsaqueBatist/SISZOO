import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EventoAuditoria } from '../types/auditoria.types'
import { agruparPorDia } from './agruparPorDia'

function evento(sobrescrever: Partial<EventoAuditoria>): EventoAuditoria {
  return {
    id: 'id',
    usuarioEmail: 'usuaria@itu.sp.gov.br',
    acao: 'CRIACAO',
    entidade: 'usuario',
    entidadeId: 'id-entidade',
    ocorreuEm: '2026-05-20T12:00:00',
    ...sobrescrever,
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('agruparPorDia', () => {
  it('agrupa em Hoje, Ontem e data (DD/MM/AAAA), do mais recente ao mais antigo', () => {
    vi.useFakeTimers()
    // Meio-dia em America/Sao_Paulo (UTC-3) = 15h UTC.
    vi.setSystemTime(new Date('2026-05-20T15:00:00Z'))

    const grupos = agruparPorDia([
      evento({ id: '1', ocorreuEm: '2026-05-20T10:00:00' }), // hoje
      evento({ id: '2', ocorreuEm: '2026-05-19T10:00:00' }), // ontem
      evento({ id: '3', ocorreuEm: '2026-05-17T10:00:00' }), // data
    ])

    expect(grupos.map((g) => g.rotulo)).toEqual(['Hoje', 'Ontem', '17/05/2026'])
    expect(grupos[0].eventos.map((e) => e.id)).toEqual(['1'])
  })

  it('dentro do mesmo grupo, ordena do evento mais recente para o mais antigo', () => {
    const grupos = agruparPorDia([
      evento({ id: 'mais-antigo', ocorreuEm: '2026-05-20T08:00:00' }),
      evento({ id: 'mais-recente', ocorreuEm: '2026-05-20T18:00:00' }),
    ])

    expect(grupos).toHaveLength(1)
    expect(grupos[0].eventos.map((e) => e.id)).toEqual(['mais-recente', 'mais-antigo'])
  })

  it('agrupa a hora local em America/Sao_Paulo, não UTC (22h local ainda é o mesmo dia)', () => {
    vi.useFakeTimers()
    // "Hoje" = 2026-05-20T22:00-03:00 = 2026-05-21T01:00Z.
    vi.setSystemTime(new Date('2026-05-21T01:00:00Z'))

    const grupos = agruparPorDia([evento({ id: '1', ocorreuEm: '2026-05-20T22:30:00' })])

    expect(grupos[0].rotulo).toBe('Hoje')
  })

  it('lista vazia devolve nenhum grupo', () => {
    expect(agruparPorDia([])).toEqual([])
  })
})

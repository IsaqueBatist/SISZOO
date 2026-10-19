import { describe, expect, it } from 'vitest'
import type { EventoAuditoria } from '../types/auditoria.types'
import { agruparPorModulo } from './agruparPorModulo'

function evento(id: string, entidade: string): EventoAuditoria {
  return { id, usuarioEmail: 'teste@itu.sp.gov.br', acao: 'CRIACAO', entidade, entidadeId: null, ocorreuEm: '2026-10-19T10:00:00' }
}

describe('agruparPorModulo', () => {
  it('agrupa eventos pelo módulo correspondente à entidade', () => {
    const grupos = agruparPorModulo([
      evento('1', 'ocorrencia'),
      evento('2', 'usuario'),
      evento('3', 'anexo_ocorrencia'),
    ])

    expect(grupos).toHaveLength(2)
    expect(grupos[0]).toMatchObject({ modulo: 'OCORRENCIAS_DENUNCIAS', rotulo: 'Ocorrências e Denúncias' })
    expect(grupos[0].eventos.map((e) => e.id)).toEqual(['1', '3'])
    expect(grupos[1]).toMatchObject({ modulo: 'USUARIOS_ACESSO', rotulo: 'Usuários e Acesso' })
    expect(grupos[1].eventos.map((e) => e.id)).toEqual(['2'])
  })

  it('preserva a ordem de primeira aparição do módulo, não uma ordem fixa', () => {
    const grupos = agruparPorModulo([evento('1', 'processo_sanitario'), evento('2', 'vacinacao')])

    expect(grupos.map((g) => g.modulo)).toEqual(['PROCESSOS_SANITARIOS', 'GESTAO_ANIMAIS'])
  })

  it('agrupa entidades desconhecidas em OUTRO', () => {
    const grupos = agruparPorModulo([evento('1', 'algo_novo')])

    expect(grupos).toEqual([{ modulo: 'OUTRO', rotulo: 'Outros', eventos: [expect.objectContaining({ id: '1' })] }])
  })

  it('devolve lista vazia para lista vazia', () => {
    expect(agruparPorModulo([])).toEqual([])
  })
})

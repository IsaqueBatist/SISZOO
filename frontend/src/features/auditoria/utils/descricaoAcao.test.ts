import { describe, expect, it } from 'vitest'
import type { AcaoAuditoria } from '../types/auditoria.types'
import { descricaoAcao } from './descricaoAcao'

const TODAS_AS_ACOES: AcaoAuditoria[] = [
  'CRIACAO',
  'ATUALIZACAO',
  'DESATIVACAO',
  'REATIVACAO',
  'LOGIN',
  'LOGOUT',
  'EXPORTACAO',
  'ENCERRAMENTO',
  'VISUALIZACAO',
  'ACESSO_NEGADO',
]

describe('descricaoAcao', () => {
  it('tem verbo, ícone e tom definidos para os 10 valores reais do enum do backend', () => {
    for (const acao of TODAS_AS_ACOES) {
      const descricao = descricaoAcao(acao)
      expect(descricao.verbo).toBeTruthy()
      expect(descricao.icone).toBeTruthy()
      expect(['info', 'success', 'warning', 'danger']).toContain(descricao.tom)
    }
  })

  it('VISUALIZACAO (acesso a dado sigiloso, LGPD) usa o tom de maior destaque', () => {
    expect(descricaoAcao('VISUALIZACAO').tom).toBe('danger')
  })

  it('ACESSO_NEGADO (acesso a dado sigiloso recusado, T43) também usa o tom de maior destaque', () => {
    expect(descricaoAcao('ACESSO_NEGADO')).toEqual({ verbo: 'teve acesso negado a', icone: 'lock', tom: 'danger' })
  })
})

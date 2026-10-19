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
]

describe('descricaoAcao', () => {
  it('tem verbo, ícone e tom definidos para os 9 valores reais do enum do backend', () => {
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
})

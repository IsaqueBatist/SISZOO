import { describe, expect, it } from 'vitest'
import { violacaoPoliticaSenha } from '@/features/auth/utils/politicaSenha'
import { gerarSenhaTemporaria } from './senhaTemporaria'

describe('gerarSenhaTemporaria', () => {
  it('sempre cumpre a política de senha', () => {
    for (let i = 0; i < 200; i++) {
      const senha = gerarSenhaTemporaria()
      expect(senha).toHaveLength(14)
      expect(violacaoPoliticaSenha(senha, { email: 'maria.silva@itu.sp.gov.br', nomeExibicao: 'Maria Silva' })).toBeNull()
    }
  })

  it('não repete senhas nem mantém prefixo fixo', () => {
    const senhas = Array.from({ length: 200 }, gerarSenhaTemporaria)
    expect(new Set(senhas).size).toBe(200)
    expect(new Set(senhas.map((senha) => senha.slice(0, 4))).size).toBeGreaterThan(150)
  })
})

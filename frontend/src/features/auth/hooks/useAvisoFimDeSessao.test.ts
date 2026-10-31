import { describe, expect, it } from 'vitest'
import { expiracaoDoToken } from './useAvisoFimDeSessao'

describe('expiracaoDoToken', () => {
  it('lê o exp do JWT em milissegundos', () => {
    const carga = btoa(JSON.stringify({ exp: 1800000000 }))
    expect(expiracaoDoToken(`cabecalho.${carga}.assinatura`)).toBe(1800000000000)
  })

  it('token sem o formato de JWT não gera aviso nem quebra a tela', () => {
    expect(expiracaoDoToken('token-existente')).toBeNull()
  })
})

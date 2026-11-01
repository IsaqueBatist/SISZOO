import { describe, expect, it } from 'vitest'
import { expiracaoDoToken, tokenPertoDeVencer } from './token'

function token(exp: number) {
  return `cabecalho.${btoa(JSON.stringify({ exp }))}.assinatura`
}

describe('expiracaoDoToken', () => {
  it('lê o exp do JWT em milissegundos', () => {
    expect(expiracaoDoToken(token(1800000000))).toBe(1800000000000)
  })

  it('token sem o formato de JWT não quebra a tela', () => {
    expect(expiracaoDoToken('token-existente')).toBeNull()
  })
})

describe('tokenPertoDeVencer', () => {
  it('renova quando faltam menos de 30 segundos', () => {
    expect(tokenPertoDeVencer(token(1000), 975 * 1000)).toBe(true)
    expect(tokenPertoDeVencer(token(1000), 960 * 1000)).toBe(false)
  })

  it('token sem exp nunca é renovado antes da hora', () => {
    expect(tokenPertoDeVencer('token-existente')).toBe(false)
  })
})

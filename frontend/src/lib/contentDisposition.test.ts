import { describe, expect, it } from 'vitest'
import { extrairNomeArquivo } from './contentDisposition'

describe('extrairNomeArquivo', () => {
  it('prioriza a forma estendida filename* (RFC 5987) sobre filename simples', () => {
    const header = `attachment; filename="relatorio.csv"; filename*=UTF-8''vacina%C3%A7%C3%A3o.csv`
    expect(extrairNomeArquivo(header)).toBe('vacinação.csv')
  })

  it('cai no filename simples quando não há a forma estendida', () => {
    expect(extrairNomeArquivo('attachment; filename="relatorio.pdf"')).toBe('relatorio.pdf')
  })

  it('aceita filename sem aspas', () => {
    expect(extrairNomeArquivo('attachment; filename=relatorio.pdf')).toBe('relatorio.pdf')
  })

  it('devolve null quando o header está ausente', () => {
    expect(extrairNomeArquivo(undefined)).toBeNull()
    expect(extrairNomeArquivo(null)).toBeNull()
  })

  it('devolve null quando o header não tem nenhuma das duas formas', () => {
    expect(extrairNomeArquivo('attachment')).toBeNull()
  })
})

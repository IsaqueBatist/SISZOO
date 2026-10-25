import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import { queryClient } from './queryClient'

function erroHttp(status: number) {
  return new AxiosError('falha', 'ERR', undefined, undefined, {
    status,
    statusText: '',
    data: {},
    headers: {},
    config: { headers: new AxiosHeaders() },
  })
}

describe('queryClient (defaults da T45)', () => {
  const padrao = queryClient.getDefaultOptions().queries

  it('não refaz consultas ao voltar o foco da janela e mantém o staleTime padrão', () => {
    expect(padrao?.refetchOnWindowFocus).toBe(false)
    expect(padrao?.staleTime).toBeUndefined()
  })

  it('não repete erro 4xx e repete uma vez falha de rede ou 5xx', () => {
    const retry = padrao?.retry as (falhas: number, erro: unknown) => boolean

    expect(retry(0, erroHttp(403))).toBe(false)
    expect(retry(0, erroHttp(404))).toBe(false)
    expect(retry(0, erroHttp(422))).toBe(false)
    expect(retry(0, erroHttp(500))).toBe(true)
    expect(retry(1, erroHttp(500))).toBe(false)
    expect(retry(0, new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(true)
    expect(retry(1, new AxiosError('Network Error', 'ERR_NETWORK'))).toBe(false)
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import { buscarEnderecoPorCep } from './viaCep'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('buscarEnderecoPorCep', () => {
  it('devolve logradouro e bairro em caso de sucesso', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ logradouro: 'Rua das Flores', bairro: 'Centro' }),
      }),
    )

    const resultado = await buscarEnderecoPorCep('13300-000')

    expect(resultado).toEqual({ logradouro: 'Rua das Flores', bairro: 'Centro' })
  })

  it('CEP com formato válido mas inexistente ({erro: true}) devolve null, não sucesso', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ erro: true }),
      }),
    )

    const resultado = await buscarEnderecoPorCep('00000-000')

    expect(resultado).toBeNull()
  })

  it('erro de rede devolve null em vez de lançar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))

    const resultado = await buscarEnderecoPorCep('13300-000')

    expect(resultado).toBeNull()
  })

  it('CEP com formato inválido não chama a API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const resultado = await buscarEnderecoPorCep('123')

    expect(resultado).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('timeout aborta a chamada e devolve null em vez de travar o formulário', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn(
      (_url: string, options: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const promessa = buscarEnderecoPorCep('13300-000')
    await vi.advanceTimersByTimeAsync(5000)
    const resultado = await promessa

    expect(resultado).toBeNull()
  })
})

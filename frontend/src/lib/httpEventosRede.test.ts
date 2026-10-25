import { http as mswHttp, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { server } from '@/mocks/server'
import { API_BASE_URL } from './env'
import { EVENTO_REDE_FALHA, EVENTO_REDE_OK, http } from './http'

// O banner de conexão (T42) depende destes eventos: o interceptor é o único
// lugar que sabe se uma requisição chegou ao servidor.
function espiarEventos() {
  const falhas = vi.fn()
  const ok = vi.fn()
  window.addEventListener(EVENTO_REDE_FALHA, falhas)
  window.addEventListener(EVENTO_REDE_OK, ok)
  return {
    falhas,
    ok,
    parar() {
      window.removeEventListener(EVENTO_REDE_FALHA, falhas)
      window.removeEventListener(EVENTO_REDE_OK, ok)
    },
  }
}

describe('eventos de rede do interceptor', () => {
  let espia: ReturnType<typeof espiarEventos>

  afterEach(() => {
    espia?.parar()
  })

  it('resposta de sucesso avisa que a rede está de pé', async () => {
    server.use(mswHttp.get(`${API_BASE_URL}/ping`, () => HttpResponse.json({ ok: true })))
    espia = espiarEventos()

    await http.get('/ping')

    expect(espia.ok).toHaveBeenCalled()
    expect(espia.falhas).not.toHaveBeenCalled()
  })

  it('erro HTTP também é prova de rede de pé: 500 não é falha de conexão', async () => {
    server.use(mswHttp.get(`${API_BASE_URL}/ping`, () => new HttpResponse(null, { status: 500 })))
    espia = espiarEventos()

    await expect(http.get('/ping')).rejects.toThrow()

    expect(espia.ok).toHaveBeenCalled()
    expect(espia.falhas).not.toHaveBeenCalled()
  })

  it('requisição que morre sem resposta avisa falha de rede', async () => {
    server.use(mswHttp.get(`${API_BASE_URL}/ping`, () => HttpResponse.error()))
    espia = espiarEventos()

    await expect(http.get('/ping')).rejects.toThrow()

    expect(espia.falhas).toHaveBeenCalled()
    expect(espia.ok).not.toHaveBeenCalled()
  })

  it('requisição cancelada não é falha de rede (o TanStack Query cancela ao sair da tela)', async () => {
    server.use(mswHttp.get(`${API_BASE_URL}/ping`, () => HttpResponse.json({ ok: true })))
    espia = espiarEventos()
    const controlador = new AbortController()

    const requisicao = http.get('/ping', { signal: controlador.signal })
    controlador.abort()
    await expect(requisicao).rejects.toThrow()

    expect(espia.falhas).not.toHaveBeenCalled()
  })
})

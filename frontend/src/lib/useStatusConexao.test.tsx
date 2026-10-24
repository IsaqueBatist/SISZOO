import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EVENTO_REDE_FALHA, EVENTO_REDE_OK } from './http'
import { useStatusConexao } from './useStatusConexao'

function emitir(nome: string) {
  act(() => {
    window.dispatchEvent(new Event(nome))
  })
}

function emitirNoDocumento(nome: string) {
  act(() => {
    document.dispatchEvent(new Event(nome))
  })
}

function fingirOnLine(valor: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(valor)
}

function fingirVisibilidade(estado: DocumentVisibilityState) {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(estado)
}

describe('useStatusConexao', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sem motivo quando o navegador está online e nada falhou', () => {
    const { result } = renderHook(() => useStatusConexao())

    expect(result.current).toBeNull()
  })

  it('já começa avisando quando o navegador está offline no carregamento', () => {
    fingirOnLine(false)

    const { result } = renderHook(() => useStatusConexao())

    expect(result.current).toBe('navegador')
  })

  it('evento offline aponta o motivo navegador, e online limpa', () => {
    const { result } = renderHook(() => useStatusConexao())

    emitir('offline')
    expect(result.current).toBe('navegador')

    emitir('online')
    expect(result.current).toBeNull()
  })

  it('requisição morta sem resposta aponta falha de rede, e uma resposta limpa', () => {
    const { result } = renderHook(() => useStatusConexao())

    emitir(EVENTO_REDE_FALHA)
    expect(result.current).toBe('falha-de-rede')

    emitir(EVENTO_REDE_OK)
    expect(result.current).toBeNull()
  })

  it('o evento online também limpa a falha de rede inferida', () => {
    const { result } = renderHook(() => useStatusConexao())
    emitir(EVENTO_REDE_FALHA)

    emitir('online')

    expect(result.current).toBeNull()
  })

  it('voltar o foco para a janela limpa a falha de rede', () => {
    fingirVisibilidade('visible')
    const { result } = renderHook(() => useStatusConexao())
    emitir(EVENTO_REDE_FALHA)

    emitir('focus')

    expect(result.current).toBeNull()
  })

  it('a aba voltar a ficar visível limpa a falha de rede', () => {
    const visibilidade = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    const { result } = renderHook(() => useStatusConexao())
    emitir(EVENTO_REDE_FALHA)

    // Escondida ainda: o aviso fica.
    emitirNoDocumento('visibilitychange')
    expect(result.current).toBe('falha-de-rede')

    visibilidade.mockReturnValue('visible')
    emitirNoDocumento('visibilitychange')

    expect(result.current).toBeNull()
  })

  it('o navegador offline tem precedência sobre a falha de rede', () => {
    const { result } = renderHook(() => useStatusConexao())

    emitir(EVENTO_REDE_FALHA)
    emitir('offline')

    expect(result.current).toBe('navegador')

    // Uma resposta tardia não apaga o aviso enquanto o sistema diz que não há rede.
    emitir(EVENTO_REDE_OK)
    expect(result.current).toBe('navegador')
  })

  it('para de escutar ao desmontar', () => {
    const { result, unmount } = renderHook(() => useStatusConexao())

    unmount()
    emitir('offline')

    expect(result.current).toBeNull()
  })
})

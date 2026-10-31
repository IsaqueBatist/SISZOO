import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { limparFiltrosDeListas, useFiltrosLista } from './useFiltrosLista'

const PADRAO = { busca: '', status: '' }

beforeEach(() => sessionStorage.clear())

describe('useFiltrosLista', () => {
  it('filtros e página sobrevivem a sair da tela e voltar', () => {
    const primeira = renderHook(() => useFiltrosLista('teste', PADRAO))
    act(() => primeira.result.current.definirFiltros({ busca: 'Centro' }))
    act(() => primeira.result.current.irParaPagina(2))
    primeira.unmount()

    const { result } = renderHook(() => useFiltrosLista('teste', PADRAO))

    expect(result.current.filtros.busca).toBe('Centro')
    expect(result.current.pagina).toBe(2)
    expect(result.current.filtrosAtivos).toBe(true)
  })

  it('trocar um filtro volta à primeira página, e limpar volta ao padrão', () => {
    const { result } = renderHook(() => useFiltrosLista('teste', PADRAO))
    act(() => result.current.irParaPagina(3))
    act(() => result.current.definirFiltros({ status: 'ABERTA' }))
    expect(result.current.pagina).toBe(0)

    act(() => result.current.limparFiltros())
    expect(result.current.filtros).toEqual(PADRAO)
    expect(result.current.filtrosAtivos).toBe(false)
  })

  it('filtro vindo de um link vale mais que o guardado', () => {
    const primeira = renderHook(() => useFiltrosLista('teste', PADRAO))
    act(() => primeira.result.current.definirFiltros({ status: 'ABERTA' }))
    primeira.unmount()

    const { result } = renderHook(() => useFiltrosLista('teste', PADRAO, { busca: 'Rex' }))

    expect(result.current.filtros).toEqual({ busca: 'Rex', status: '' })
  })

  it('ao encerrar a sessão, o próximo usuário não herda a busca', () => {
    const primeira = renderHook(() => useFiltrosLista('teste', PADRAO))
    act(() => primeira.result.current.definirFiltros({ busca: 'Fulano' }))
    primeira.unmount()

    limparFiltrosDeListas()

    const { result } = renderHook(() => useFiltrosLista('teste', PADRAO))
    expect(result.current.filtros.busca).toBe('')
  })
})

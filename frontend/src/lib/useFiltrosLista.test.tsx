import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  classeDoFiltro,
  limparFiltrosDeListas,
  useFiltroDeLink,
  useFiltrosLista,
  useManterPaginaNoIntervalo,
} from './useFiltrosLista'

const PADRAO = { busca: '', status: '' }

beforeEach(() => sessionStorage.clear())

describe('useFiltroDeLink', () => {
  function roteador(entrada: string) {
    return ({ children }: { children: ReactNode }) => <MemoryRouter initialEntries={[entrada]}>{children}</MemoryRouter>
  }

  it('lê o valor e o retira da URL, preservando os demais parâmetros', () => {
    const { result } = renderHook(
      () => ({ valor: useFiltroDeLink('baiaId'), busca: useLocation().search }),
      { wrapper: roteador('/animais?baiaId=b1&outro=1') },
    )

    expect(result.current.valor).toBe('b1')
    expect(result.current.busca).toBe('?outro=1')
  })

  it('o que foi limpo depois não volta ao reabrir a lista: a URL já não traz o filtro', () => {
    const { result } = renderHook(
      () => {
        const baia = useFiltroDeLink('baiaId')
        return { ...useFiltrosLista('teste', { baia: '' }, baia ? { baia } : undefined), busca: useLocation().search }
      },
      { wrapper: roteador('/animais?baiaId=b1') },
    )
    expect(result.current.filtros.baia).toBe('b1')

    act(() => result.current.limparFiltros())

    expect(result.current.busca).toBe('')
    expect(JSON.parse(sessionStorage.getItem('siszoo_filtros:teste') as string).filtros.baia).toBe('')
  })
})

describe('useManterPaginaNoIntervalo', () => {
  it('leva para a última página quando a atual passou do total', () => {
    const irParaPagina = vi.fn()
    renderHook(() => useManterPaginaNoIntervalo(4, 2, irParaPagina))
    expect(irParaPagina).toHaveBeenCalledWith(1)
  })

  it('leva para a primeira quando a lista ficou vazia', () => {
    const irParaPagina = vi.fn()
    renderHook(() => useManterPaginaNoIntervalo(3, 0, irParaPagina))
    expect(irParaPagina).toHaveBeenCalledWith(0)
  })

  it('não mexe em página válida, nem antes de a resposta chegar', () => {
    const irParaPagina = vi.fn()
    renderHook(() => useManterPaginaNoIntervalo(1, 2, irParaPagina))
    renderHook(() => useManterPaginaNoIntervalo(1, undefined, irParaPagina))
    expect(irParaPagina).not.toHaveBeenCalled()
  })
})

describe('classeDoFiltro', () => {
  it('destaca só o que difere do padrão', () => {
    expect(classeDoFiltro('')).toBe('filter-select')
    expect(classeDoFiltro('felino')).toBe('filter-select ativo')
    expect(classeDoFiltro('ativas', 'ativas')).toBe('filter-select')
  })
})

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

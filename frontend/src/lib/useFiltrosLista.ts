import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const PREFIXO = 'siszoo_filtros:'

interface EstadoSalvo<T> {
  filtros: T
  pagina: number
}

function ler<T>(lista: string): EstadoSalvo<T> | null {
  try {
    const salvo = sessionStorage.getItem(PREFIXO + lista)
    return salvo ? (JSON.parse(salvo) as EstadoSalvo<T>) : null
  } catch {
    return null
  }
}

function gravar<T>(lista: string, estado: EstadoSalvo<T>) {
  try {
    sessionStorage.setItem(PREFIXO + lista, JSON.stringify(estado))
  } catch {
  }
}

export function limparFiltrosDeListas() {
  try {
    for (const chave of Object.keys(sessionStorage)) {
      if (chave.startsWith(PREFIXO)) sessionStorage.removeItem(chave)
    }
  } catch {
  }
}

export function useFiltrosLista<T extends Record<string, string>>(lista: string, padrao: T, inicial?: Partial<T>) {
  const [estado, setEstado] = useState<EstadoSalvo<T>>(() => {
    const salvo = ler<T>(lista)
    if (inicial) return { filtros: { ...padrao, ...inicial }, pagina: 0 }
    return salvo ? { filtros: { ...padrao, ...salvo.filtros }, pagina: salvo.pagina } : { filtros: padrao, pagina: 0 }
  })

  useEffect(() => {
    gravar(lista, estado)
  }, [lista, estado])

  const definirFiltros = useCallback((alteracao: Partial<T>) => {
    setEstado((atual) => ({ filtros: { ...atual.filtros, ...alteracao }, pagina: 0 }))
  }, [])

  const irParaPagina = useCallback((pagina: number) => {
    setEstado((atual) => ({ ...atual, pagina }))
  }, [])

  function limparFiltros() {
    setEstado({ filtros: padrao, pagina: 0 })
  }

  const filtrosAtivos = (Object.keys(padrao) as (keyof T)[]).some((chave) => estado.filtros[chave] !== padrao[chave])

  return { filtros: estado.filtros, pagina: estado.pagina, definirFiltros, irParaPagina, limparFiltros, filtrosAtivos }
}

export function useFiltroDeLink(parametro: string): string | null {
  const [searchParams, setSearchParams] = useSearchParams()
  const [valor] = useState(() => searchParams.get(parametro))

  useEffect(() => {
    if (!searchParams.has(parametro)) return
    setSearchParams(
      (atuais) => {
        atuais.delete(parametro)
        return atuais
      },
      { replace: true },
    )
  }, [parametro, searchParams, setSearchParams])

  return valor
}

export function useManterPaginaNoIntervalo(
  pagina: number,
  totalPaginas: number | undefined,
  irParaPagina: (pagina: number) => void,
) {
  useEffect(() => {
    if (totalPaginas !== undefined && pagina > 0 && pagina >= totalPaginas) {
      irParaPagina(Math.max(totalPaginas - 1, 0))
    }
  }, [pagina, totalPaginas, irParaPagina])
}

export function classeDoFiltro(valor: string, padrao = ''): string {
  return valor === padrao ? 'filter-select' : 'filter-select ativo'
}

export function useValorComAtraso(valor: string, atrasoMs = 300): string {
  const [atrasado, setAtrasado] = useState(valor)

  useEffect(() => {
    const timeout = setTimeout(() => setAtrasado(valor), atrasoMs)
    return () => clearTimeout(timeout)
  }, [valor, atrasoMs])

  return atrasado
}

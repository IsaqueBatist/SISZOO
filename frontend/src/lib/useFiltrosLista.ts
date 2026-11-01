import { useCallback, useEffect, useState } from 'react'

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
    // Segue só em memória: perde o filtro ao voltar, mas a tela continua.
  }
}

// Chamado ao encerrar a sessão: o próximo usuário da máquina não herda a busca.
export function limparFiltrosDeListas() {
  try {
    for (const chave of Object.keys(sessionStorage)) {
      if (chave.startsWith(PREFIXO)) sessionStorage.removeItem(chave)
    }
  } catch {
    // sessionStorage indisponível: não há o que limpar.
  }
}

// Busca, filtros e página de uma listagem, preservados ao abrir um registro e
// voltar. Ficam no sessionStorage, e não na URL: a busca de Ocorrências aceita
// nome de denunciante, que iria parar no histórico do navegador de uma máquina
// compartilhada. Morrem com a aba ou com o logout, como a sessão.
export function useFiltrosLista<T extends Record<string, string>>(lista: string, padrao: T, inicial?: Partial<T>) {
  const [estado, setEstado] = useState<EstadoSalvo<T>>(() => {
    const salvo = ler<T>(lista)
    // Link que chega com filtro próprio (Baias -> Animais) vale mais que o salvo.
    if (inicial) return { filtros: { ...padrao, ...inicial }, pagina: 0 }
    return salvo ? { filtros: { ...padrao, ...salvo.filtros }, pagina: salvo.pagina } : { filtros: padrao, pagina: 0 }
  })

  useEffect(() => {
    gravar(lista, estado)
  }, [lista, estado])

  // Trocar um filtro volta à primeira página.
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

// Valor atrasado para busca ao digitar: uma requisição por pausa, não por tecla.
export function useValorComAtraso(valor: string, atrasoMs = 300): string {
  const [atrasado, setAtrasado] = useState(valor)

  useEffect(() => {
    const timeout = setTimeout(() => setAtrasado(valor), atrasoMs)
    return () => clearTimeout(timeout)
  }, [valor, atrasoMs])

  return atrasado
}

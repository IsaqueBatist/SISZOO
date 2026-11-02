import { useSyncExternalStore } from 'react'

export type VarianteToast = 'sucesso' | 'erro' | 'atencao'

export interface Toast {
  id: number
  variante: VarianteToast
  titulo: string
  descricao?: string
}

const LIMITE_TOASTS = 3

const DURACAO_MS: Record<VarianteToast, number> = {
  sucesso: 5000,
  atencao: 5000,
  erro: 8000,
}

let toasts: Toast[] = []
let proximoId = 1
const ouvintes = new Set<() => void>()

function publicar(novos: Toast[]) {
  toasts = novos
  for (const ouvinte of ouvintes) ouvinte()
}

export function dispensarToast(id: number) {
  publicar(toasts.filter((toast) => toast.id !== id))
}

export function limparToasts() {
  publicar([])
}

function mostrar(variante: VarianteToast, titulo: string, descricao?: string) {
  if (toasts.some((toast) => toast.titulo === titulo && toast.variante === variante)) return
  const id = proximoId++
  publicar([...toasts, { id, variante, titulo, descricao }].slice(-LIMITE_TOASTS))
}

export const toast = {
  sucesso: (titulo: string, descricao?: string) => mostrar('sucesso', titulo, descricao),
  erro: (titulo: string, descricao?: string) => mostrar('erro', titulo, descricao),
  atencao: (titulo: string, descricao?: string) => mostrar('atencao', titulo, descricao),
  limpar: limparToasts,
}

export function duracaoDe(variante: VarianteToast): number {
  return DURACAO_MS[variante]
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte)
  return () => {
    ouvintes.delete(ouvinte)
  }
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(assinar, () => toasts)
}

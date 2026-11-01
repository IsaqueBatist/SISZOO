import { createContext } from 'react'

export type VarianteToast = 'sucesso' | 'erro' | 'info'

export interface Toast {
  id: string
  variante: VarianteToast
  titulo: string
  descricao?: string
}

// Só funções, todas estáveis: a identidade deste valor nunca muda, então
// nenhum consumidor re-renderiza quando um toast aparece ou some (a fila fica
// no estado do provider e é lida só pela lista).
export interface ToastContextValue {
  sucesso: (titulo: string, descricao?: string) => void
  erro: (titulo: string, descricao?: string) => void
  info: (titulo: string, descricao?: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

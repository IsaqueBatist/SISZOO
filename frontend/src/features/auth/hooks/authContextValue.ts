import { createContext } from 'react'
import type { RoleKey } from '@/lib/nav'
import type { LoginRequest, Usuario } from '../types/auth.types'

export interface AuthContextValue {
  user: Usuario | null
  token: string | null
  roleKey: RoleKey
  login: (credenciais: LoginRequest) => Promise<void>
  logout: () => void
  marcarSenhaAlterada: (senhaAlteradaEm: string) => void
  isLoading: boolean
  error: unknown
  // Enquanto a aba descobre se já existe sessão (nova aba, recarga): as rotas
  // esperam, em vez de mandar para o login quem já está conectado.
  carregandoSessao: boolean
  // A sessão caiu sozinha (401 ou inatividade), e não por logout: o login explica o motivo.
  sessaoExpirada: boolean
  expirouPorInatividade: boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

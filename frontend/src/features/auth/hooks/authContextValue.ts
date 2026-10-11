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
}

export const AuthContext = createContext<AuthContextValue | null>(null)

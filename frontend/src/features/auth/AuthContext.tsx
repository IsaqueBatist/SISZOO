import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { setAuthToken } from '../../lib/http'
import { login as loginRequest } from './authApi'
import type { LoginRequest, Usuario } from './auth.types'

export const SESSION_STORAGE_KEY = 'siszoo_auth'

interface SessaoArmazenada {
  token: string
  usuario: Usuario
}

interface AuthContextValue {
  user: Usuario | null
  token: string | null
  login: (credenciais: LoginRequest) => Promise<void>
  logout: () => void
  isLoading: boolean
  error: unknown
}

const AuthContext = createContext<AuthContextValue | null>(null)

function lerSessaoArmazenada(): SessaoArmazenada | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SessaoArmazenada) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [sessao, setSessao] = useState<SessaoArmazenada | null>(() => {
    const armazenada = lerSessaoArmazenada()
    if (armazenada) setAuthToken(armazenada.token)
    return armazenada
  })

  const mutation = useMutation({ mutationFn: loginRequest })

  async function login(credenciais: LoginRequest) {
    const resposta = await mutation.mutateAsync(credenciais)
    const novaSessao: SessaoArmazenada = { token: resposta.token, usuario: resposta.usuario }
    setSessao(novaSessao)
    setAuthToken(novaSessao.token)
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(novaSessao))
    } catch {
      /* sessionStorage indisponível */
    }
  }

  function logout() {
    setSessao(null)
    setAuthToken(null)
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
    } catch {
      /* sessionStorage indisponível */
    }
  }

  useEffect(() => {
    function handleUnauthorized() {
      logout()
      navigate('/login', { replace: true })
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [navigate])

  const value: AuthContextValue = {
    user: sessao?.usuario ?? null,
    token: sessao?.token ?? null,
    login,
    logout,
    isLoading: mutation.isPending,
    error: mutation.error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

import { useMutation } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAuthToken } from '@/lib/http'
import { roleKeyFromCargos } from '@/lib/nav'
import type { LoginRequest, Usuario } from '../types/auth.types'
import { login as loginRequest } from '../api/authApi'
import { AuthContext, type AuthContextValue } from './authContextValue'

export const SESSION_STORAGE_KEY = 'siszoo_auth'

interface SessaoArmazenada {
  token: string
  usuario: Usuario
}

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

  function marcarSenhaAlterada(senhaAlteradaEm: string) {
    setSessao((atual) => {
      if (!atual) return atual
      const novaSessao: SessaoArmazenada = {
        ...atual,
        usuario: { ...atual.usuario, senhaAlteradaEm },
      }
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(novaSessao))
      } catch {
        /* sessionStorage indisponível */
      }
      return novaSessao
    })
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
    roleKey: roleKeyFromCargos(sessao?.usuario.cargos ?? []),
    login,
    logout,
    marcarSenhaAlterada,
    isLoading: mutation.isPending,
    error: mutation.error,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

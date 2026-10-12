import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { setAuthToken } from '@/lib/http'
import { roleKeyFromCargos } from '@/lib/nav'
import { limparRascunhos } from '@/lib/rascunhoDb'
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
  const queryClient = useQueryClient()
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

  // O cache do React Query some nos dois casos (o próximo usuário não pode
  // ver dados do anterior). Rascunhos e anexos pendentes só no logout manual:
  // quando a sessão expira (401) no meio de um formulário, o mesmo usuário
  // entra de novo e retoma o rascunho — que tem escopo por usuário, então
  // ninguém mais o vê.
  const encerrarSessao = useCallback(
    ({ apagarRascunhos }: { apagarRascunhos: boolean }) => {
      // Antes de tudo: limparRascunhos cancela já, de forma síncrona, os
      // salvamentos agendados que recriariam o rascunho.
      if (apagarRascunhos) void limparRascunhos()
      setSessao(null)
      setAuthToken(null)
      try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
      } catch {
        /* sessionStorage indisponível */
      }
      void queryClient.cancelQueries().then(() => queryClient.clear())
    },
    [queryClient],
  )

  function logout() {
    encerrarSessao({ apagarRascunhos: true })
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
      encerrarSessao({ apagarRascunhos: false })
      navigate('/login', { replace: true })
    }

    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized)
  }, [navigate, encerrarSessao])

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

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/components/toast/toast'
import { setAuthToken } from '@/lib/http'
import { roleKeyFromCargos } from '@/lib/nav'
import { limparRascunhos } from '@/lib/rascunhoDb'
import { limparAtividade, registrarAtividade, registrarExtensao } from '@/lib/sessao/atividade'
import { avisarOutrasAbas, ouvirOutrasAbas } from '@/lib/sessao/canal'
import { encerrarNoServidor, EVENTO_SESSAO_RENOVADA, renovarSessao } from '@/lib/sessao/renovacao'
import { useSessaoAtiva } from '@/lib/sessao/useSessaoAtiva'
import { limparFiltrosDeListas } from '@/lib/useFiltrosLista'
import type { LoginRequest, LoginResponse, Usuario } from '../types/auth.types'
import { login as loginRequest } from '../api/authApi'
import { AuthContext, type AuthContextValue } from './authContextValue'

interface SessaoAtual {
  token: string
  usuario: Usuario
}

let sessaoEmMemoria: SessaoAtual | null = null

export function definirSessaoEmMemoria(sessao: SessaoAtual | null) {
  sessaoEmMemoria = sessao
  setAuthToken(sessao?.token ?? null)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [sessao, setSessao] = useState<SessaoAtual | null>(sessaoEmMemoria)
  const [carregandoSessao, setCarregandoSessao] = useState(sessaoEmMemoria === null)

  const [sessaoExpirada, setSessaoExpirada] = useState(false)
  const [expirouPorInatividade, setExpirouPorInatividade] = useState(false)

  const aplicarSessao = useCallback((nova: SessaoAtual | null) => {
    definirSessaoEmMemoria(nova)
    setSessao(nova)
  }, [])

  const mutation = useMutation({ mutationFn: loginRequest })
  const { mutateAsync } = mutation

  const login = useCallback(
    async (credenciais: LoginRequest) => {
      const resposta = await mutateAsync(credenciais)
      setSessaoExpirada(false)
      setExpirouPorInatividade(false)
      registrarAtividade()
      registrarExtensao()
      aplicarSessao({ token: resposta.token, usuario: resposta.usuario })
      avisarOutrasAbas('login')
    },
    [mutateAsync, aplicarSessao],
  )

  const encerrarSessao = useCallback(
    ({ apagarRascunhos }: { apagarRascunhos: boolean }) => {
      if (apagarRascunhos) void limparRascunhos()
      limparFiltrosDeListas()
      toast.limpar()
      aplicarSessao(null)
      void queryClient.cancelQueries().then(() => queryClient.clear())
    },
    [queryClient, aplicarSessao],
  )

  const logout = useCallback(() => {
    void encerrarNoServidor()
    limparAtividade()
    avisarOutrasAbas('logout')
    encerrarSessao({ apagarRascunhos: true })
  }, [encerrarSessao])

  const expirar = useCallback(
    (porInatividade: boolean) => {
      if (!sessaoEmMemoria) return
      const voltarPara = `${window.location.pathname}${window.location.search}`
      setSessaoExpirada(true)
      setExpirouPorInatividade(porInatividade)
      encerrarSessao({ apagarRascunhos: false })
      navigate('/login', { replace: true, state: { voltarPara } })
    },
    [navigate, encerrarSessao],
  )

  const expirarPorInatividade = useCallback(() => {
    avisarOutrasAbas('inatividade')
    expirar(true)
  }, [expirar])

  const expirarPorRecusa = useCallback(() => {
    avisarOutrasAbas('expirada')
    expirar(false)
  }, [expirar])

  useSessaoAtiva(sessao !== null, expirarPorInatividade, expirarPorRecusa)

  useEffect(() => {
    if (sessaoEmMemoria) return
    renovarSessao(true)
      .catch(() => undefined)
      .finally(() => setCarregandoSessao(false))
  }, [])

  useEffect(() => {
    function aoRenovar(evento: Event) {
      const { token, usuario } = (evento as CustomEvent<LoginResponse>).detail
      setSessaoExpirada(false)
      setExpirouPorInatividade(false)
      aplicarSessao({ token, usuario })
    }

    window.addEventListener(EVENTO_SESSAO_RENOVADA, aoRenovar)
    return () => window.removeEventListener(EVENTO_SESSAO_RENOVADA, aoRenovar)
  }, [aplicarSessao])

  useEffect(
    () =>
      ouvirOutrasAbas((mensagem) => {
        if (mensagem === 'login') {
          if (!sessaoEmMemoria) void renovarSessao(true).catch(() => undefined)
        } else if (mensagem === 'logout') {
          if (!sessaoEmMemoria) return
          encerrarSessao({ apagarRascunhos: true })
          navigate('/login', { replace: true })
        } else {
          expirar(mensagem === 'inatividade')
        }
      }),
    [encerrarSessao, expirar, navigate],
  )

  const marcarSenhaAlterada = useCallback((senhaAlteradaEm: string) => {
    setSessao((atual) => {
      if (!atual) return atual
      const novaSessao: SessaoAtual = {
        ...atual,
        usuario: { ...atual.usuario, senhaAlteradaEm },
      }
      sessaoEmMemoria = novaSessao
      return novaSessao
    })
  }, [])

  useEffect(() => {
    window.addEventListener('auth:unauthorized', expirarPorRecusa)
    return () => window.removeEventListener('auth:unauthorized', expirarPorRecusa)
  }, [expirarPorRecusa])

  const { isPending, error } = mutation
  const value: AuthContextValue = useMemo(
    () => ({
      user: sessao?.usuario ?? null,
      token: sessao?.token ?? null,
      roleKey: roleKeyFromCargos(sessao?.usuario.cargos ?? []),
      login,
      logout,
      marcarSenhaAlterada,
      isLoading: isPending,
      error,
      carregandoSessao,
      sessaoExpirada,
      expirouPorInatividade,
    }),
    [sessao, login, logout, marcarSenhaAlterada, isPending, error, carregandoSessao, sessaoExpirada, expirouPorInatividade],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

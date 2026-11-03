import { useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import { redefinirSenhaComToken, validarTokenRecuperacao } from '../api/authApi'
import { criarTrocarSenhaSchema, type TrocarSenhaFormValues } from '../schemas/trocarSenhaSchema'
import { AlertaErroEnvio } from '@/components/AlertaErroEnvio'
import { Icon } from '@/components/layout/Icon'
import { aplicarErrosDeCampo, mensagemDeRegraDaApi, statusHttpDoErro } from '@/lib/erroApi'
import { useTituloPagina } from '@/lib/useTituloPagina'
import { CriteriosSenha } from './CriteriosSenha'
import { PainelMarcaLogin } from './PainelMarcaLogin'
import './Login.css'

const schema = criarTrocarSenhaSchema({ email: '', nomeExibicao: '' })

export function RedefinirSenha() {
  const { token: tokenSessao, carregandoSessao } = useAuth()
  const [parametros] = useSearchParams()
  const token = parametros.get('token') ?? ''
  useTituloPagina('Redefinir senha')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [concluido, setConcluido] = useState(false)
  const [linkInvalido, setLinkInvalido] = useState(false)

  const validacao = useQuery({
    queryKey: ['recuperacao-senha', token],
    queryFn: async () => {
      await validarTokenRecuperacao({ token })
      return true
    },
    enabled: token !== '',
    retry: false,
    staleTime: Infinity,
  })

  const mutation = useMutation({ mutationFn: redefinirSenhaComToken })

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<TrocarSenhaFormValues>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { novaSenha: '', confirmarSenha: '' },
  })
  const novaSenha = watch('novaSenha')

  async function onSubmit(dados: TrocarSenhaFormValues) {
    try {
      await mutation.mutateAsync({ token, novaSenha: dados.novaSenha, confirmarSenha: dados.confirmarSenha })
      setConcluido(true)
    } catch (erro) {
      const status = statusHttpDoErro(erro)
      if (status === 410) {
        setLinkInvalido(true)
        return
      }
      if (aplicarErrosDeCampo(erro, setError, { novaSenha: 'novaSenha', confirmarSenha: 'confirmarSenha' }).length > 0) {
        return
      }
      if (status === 429) {
        setSubmitError(
          mensagemDeRegraDaApi(erro) ?? 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.',
        )
        return
      }
      setSubmitError(mensagemDeRegraDaApi(erro) ?? 'Não foi possível redefinir a senha. Verifique sua conexão e tente novamente.')
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(onSubmit)(event)
  }

  if (tokenSessao) return <Navigate to="/dashboard" replace />
  if (carregandoSessao) return <p role="status" className="carregando-sessao">Carregando sua sessão…</p>

  const tokenRecusado = token === '' || linkInvalido || (validacao.isError && statusHttpDoErro(validacao.error) === 410)
  const falhaAoValidar = validacao.isError && !tokenRecusado

  let conteudo
  if (concluido) {
    conteudo = (
      <div className="login-card">
        <div>
          <h1 className="login-titulo">Senha redefinida</h1>
          <p className="lead">Sua nova senha já está valendo. Entre com ela para continuar.</p>
        </div>
        <div className="alert success" role="status">
          <div className="alert-content">
            Por segurança, as sessões abertas anteriormente com esta conta foram encerradas.
          </div>
        </div>
        <Link to="/login" className="btn btn-primary btn-lg btn-block">
          Ir para o login
        </Link>
      </div>
    )
  } else if (tokenRecusado) {
    conteudo = (
      <div className="login-card">
        <div>
          <h1 className="login-titulo">Link inválido ou expirado</h1>
          <p className="lead">
            Este link de redefinição não vale mais. Ele pode ter expirado, já ter sido usado ou ter sido substituído
            por um pedido mais recente.
          </p>
        </div>
        <Link to="/esqueci-senha" className="btn btn-primary btn-lg btn-block">
          Solicitar um novo link
        </Link>
        <p className="login-ajuda">
          <Link to="/login">Voltar ao login</Link>
        </p>
      </div>
    )
  } else if (falhaAoValidar) {
    conteudo = (
      <div className="login-card">
        <div>
          <h1 className="login-titulo">Não foi possível verificar o link</h1>
          <p className="lead">Verifique sua conexão e tente novamente.</p>
        </div>
        <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => void validacao.refetch()}>
          Tentar novamente
        </button>
      </div>
    )
  } else if (validacao.isPending) {
    conteudo = <p role="status" className="carregando-sessao">Verificando o link…</p>
  } else {
    conteudo = (
      <form className="login-card" onSubmit={aoEnviar} noValidate>
        <div>
          <h1 className="login-titulo">Escolha uma nova senha</h1>
          <p className="lead">Os critérios abaixo do campo acompanham o que você digita.</p>
        </div>

        <AlertaErroEnvio mensagem={submitError} />

        <div className="field">
          <label htmlFor="novaSenha">
            Nova senha <span className="req">*</span>
          </label>
          <div className="input-with-icon">
            <span className="ico">
              <Icon name="lock" size={16} />
            </span>
            <input
              id="novaSenha"
              className={`input${errors.novaSenha ? ' error' : ''}`}
              aria-invalid={errors.novaSenha ? true : undefined}
              aria-describedby={errors.novaSenha ? 'novaSenha-erro' : undefined}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register('novaSenha')}
            />
          </div>
          {errors.novaSenha && <span className="err" id="novaSenha-erro">{errors.novaSenha.message}</span>}
          <CriteriosSenha senha={novaSenha} />
        </div>

        <div className="field">
          <label htmlFor="confirmarSenha">
            Confirmar nova senha <span className="req">*</span>
          </label>
          <div className="input-with-icon">
            <span className="ico">
              <Icon name="lock" size={16} />
            </span>
            <input
              id="confirmarSenha"
              className={`input${errors.confirmarSenha ? ' error' : ''}`}
              aria-invalid={errors.confirmarSenha ? true : undefined}
              aria-describedby={errors.confirmarSenha ? 'confirmarSenha-erro' : undefined}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register('confirmarSenha')}
            />
          </div>
          {errors.confirmarSenha && <span className="err" id="confirmarSenha-erro">{errors.confirmarSenha.message}</span>}
        </div>

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando…' : 'Salvar nova senha'}
        </button>

        <p className="login-ajuda">
          <Link to="/login">Voltar ao login</Link>
        </p>
      </form>
    )
  }

  return (
    <div className="login-shell">
      <PainelMarcaLogin />
      <section className="login-form-area">{conteudo}</section>
    </div>
  )
}

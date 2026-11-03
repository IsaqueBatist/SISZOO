import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import { solicitarRecuperacaoSenha } from '../api/authApi'
import { esqueciSenhaSchema, type EsqueciSenhaFormValues } from '../schemas/esqueciSenhaSchema'
import { AlertaErroEnvio } from '@/components/AlertaErroEnvio'
import { Icon } from '@/components/layout/Icon'
import { aplicarErrosDeCampo, mensagemDeRegraDaApi, statusHttpDoErro } from '@/lib/erroApi'
import { useTituloPagina } from '@/lib/useTituloPagina'
import { PainelMarcaLogin } from './PainelMarcaLogin'
import './Login.css'

export function EsqueciSenha() {
  const { token, carregandoSessao } = useAuth()
  useTituloPagina('Esqueci minha senha')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [emailEnviado, setEmailEnviado] = useState<string | null>(null)

  const mutation = useMutation({ mutationFn: solicitarRecuperacaoSenha })

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<EsqueciSenhaFormValues>({
    resolver: zodResolver(esqueciSenhaSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  })

  async function onSubmit(dados: EsqueciSenhaFormValues) {
    try {
      await mutation.mutateAsync({ email: dados.email })
      setEmailEnviado(dados.email)
    } catch (erro) {
      if (aplicarErrosDeCampo(erro, setError, { email: 'email' }).length > 0) return
      if (statusHttpDoErro(erro) === 429) {
        setSubmitError(
          mensagemDeRegraDaApi(erro) ?? 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.',
        )
        return
      }
      setSubmitError('Não foi possível enviar a solicitação. Verifique sua conexão e tente novamente.')
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(onSubmit)(event)
  }

  if (token) return <Navigate to="/dashboard" replace />
  if (carregandoSessao) return <p role="status" className="carregando-sessao">Carregando sua sessão…</p>

  return (
    <div className="login-shell">
      <PainelMarcaLogin />

      <section className="login-form-area">
        {emailEnviado ? (
          <div className="login-card">
            <div>
              <h1 className="login-titulo">Verifique seu e-mail</h1>
              <p className="lead">
                Se <strong>{emailEnviado}</strong> estiver cadastrado no SISZOO, você receberá em instantes uma
                mensagem com o link para redefinir a senha.
              </p>
            </div>

            <div className="alert info" role="status">
              <div className="alert-content">
                O link vale por 30 minutos e só pode ser usado uma vez. Se a mensagem não chegar, confira a caixa
                de spam ou fale com o Administrador do sistema.
              </div>
            </div>

            <Link to="/login" className="btn btn-primary btn-lg btn-block">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form className="login-card" onSubmit={aoEnviar} noValidate>
            <div>
              <h1 className="login-titulo">Esqueci minha senha</h1>
              <p className="lead">
                Informe o e-mail institucional da sua conta. Enviaremos um link para você escolher uma nova senha.
              </p>
            </div>

            <AlertaErroEnvio mensagem={submitError} />

            <div className="field">
              <label htmlFor="email">
                E-mail institucional <span className="req">*</span>
              </label>
              <div className="input-with-icon">
                <span className="ico">
                  <Icon name="mail" size={16} />
                </span>
                <input
                  id="email"
                  className={`input${errors.email ? ' error' : ''}`}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? 'email-erro' : undefined}
                  type="email"
                  placeholder="nome.sobrenome@itu.sp.gov.br"
                  autoComplete="username"
                  {...register('email')}
                />
              </div>
              {errors.email && <span className="err" id="email-erro">{errors.email.message}</span>}
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={mutation.isPending}>
              {mutation.isPending ? 'Enviando…' : 'Enviar link de redefinição'}
            </button>

            <p className="login-ajuda">
              <Link to="/login">Voltar ao login</Link>
            </p>
          </form>
        )}
      </section>
    </div>
  )
}

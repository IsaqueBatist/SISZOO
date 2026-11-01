import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import { loginSchema, type LoginFormValues } from '../schemas/loginSchema'
import { AlertaErroEnvio } from '@/components/AlertaErroEnvio'
import { Icon } from '@/components/layout/Icon'
import { useTituloPagina } from '@/lib/useTituloPagina'
import { PainelMarcaLogin } from './PainelMarcaLogin'
import './Login.css'

interface EstadoLogin {
  voltarPara?: string
}

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const estado = location.state as EstadoLogin | null
  const destino = estado?.voltarPara ?? '/dashboard'
  const { login, isLoading, token, carregandoSessao, sessaoExpirada, expirouPorInatividade } = useAuth()
  useTituloPagina('Entrar')
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  })

  async function onSubmit(dados: LoginFormValues) {
    try {
      await login(dados)
      navigate(destino, { replace: true })
    } catch (erro) {
      if (isAxiosError(erro) && erro.response?.status === 401) {
        setSubmitError('E-mail ou senha inválidos. Se o problema continuar, fale com o Administrador do sistema.')
      } else {
        setSubmitError('Não foi possível entrar. Verifique sua conexão e tente novamente.')
      }
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(onSubmit)(event)
  }

  // Sessão aberta: esta tela não tem o que oferecer.
  if (token) return <Navigate to={destino} replace />
  if (carregandoSessao) return <p role="status" className="carregando-sessao">Carregando sua sessão…</p>

  return (
    <div className="login-shell">
      <PainelMarcaLogin />

      <section className="login-form-area">
        <form className="login-card" onSubmit={aoEnviar} noValidate>
          <div>
            <h1 className="login-titulo">Boas-vindas ao SISZOO</h1>
            <p className="lead">Faça login com suas credenciais institucionais.</p>
          </div>

          {sessaoExpirada && !submitError && (
            <div className="alert warning" role="status">
              <span className="bullet" />
              <div className="alert-content">
                {expirouPorInatividade ? 'Sua sessão expirou por inatividade.' : 'Sua sessão expirou.'} Entre de novo para continuar de onde parou.
              </div>
            </div>
          )}

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
                className={`input${errors.email ? ' error' : ''}`} aria-invalid={errors.email ? true : undefined} aria-describedby={errors.email ? 'email-erro' : undefined}
                type="email"
                placeholder="nome.sobrenome@itu.sp.gov.br"
                autoComplete="username"
                {...register('email')}
              />
            </div>
            {errors.email && <span className="err" id="email-erro">{errors.email.message}</span>}
          </div>

          <div className="field">
            <label htmlFor="senha">
              Senha <span className="req">*</span>
            </label>
            <div className="input-with-icon">
              <span className="ico">
                <Icon name="lock" size={16} />
              </span>
              <input
                id="senha"
                className={`input${errors.senha ? ' error' : ''}`} aria-invalid={errors.senha ? true : undefined} aria-describedby={errors.senha ? 'senha-erro' : undefined}
                type={senhaVisivel ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('senha')}
              />
              <button
                type="button"
                className="right-btn"
                title={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
                aria-label={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={senhaVisivel}
                onClick={() => setSenhaVisivel((value) => !value)}
              >
                <Icon name="eye" size={16} />
              </button>
            </div>
            {errors.senha && <span className="err" id="senha-erro">{errors.senha.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={isLoading}>
            {isLoading ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="login-ajuda">
            <Link to="/esqueci-senha">Esqueci minha senha</Link>
          </p>

          <div className="login-foot">
            SISZOO <span className="version">v 1.2.0</span> · © 2026 Prefeitura Municipal de Itu
          </div>
        </form>
      </section>
    </div>
  )
}

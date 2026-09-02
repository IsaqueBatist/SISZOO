import { useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useAuth } from './AuthContext'
import { loginSchema, type LoginFormValues } from './loginSchema'
import { Icon } from '../../components/layout/Icon'
import './Login.css'

export function Login() {
  const navigate = useNavigate()
  const { login, isLoading } = useAuth()
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
      navigate('/dashboard', { replace: true })
    } catch (erro) {
      if (isAxiosError(erro) && erro.response?.status === 401) {
        setSubmitError('E-mail ou senha inválidos.')
      } else {
        setSubmitError('Não foi possível entrar. Verifique sua conexão e tente novamente.')
      }
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(onSubmit)(event)
  }

  return (
    <div className="login-shell">
      <section className="login-brand">
        <div className="paws">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="#fff" opacity={0.06} style={{ top: 80, left: 60 }}>
            <circle cx="6" cy="9" r="2" />
            <circle cx="10" cy="5" r="2" />
            <circle cx="14" cy="5" r="2" />
            <circle cx="18" cy="9" r="2" />
            <path d="M12 11c-3 0-5 2.5-5 5 0 2 1.5 3 3 3 1 0 1.5-.5 2-.5s1 .5 2 .5c1.5 0 3-1 3-3 0-2.5-2-5-5-5z" />
          </svg>
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="#fff"
            opacity={0.05}
            style={{ bottom: 100, right: 40, transform: 'rotate(20deg)' }}
          >
            <circle cx="6" cy="9" r="2" />
            <circle cx="10" cy="5" r="2" />
            <circle cx="14" cy="5" r="2" />
            <circle cx="18" cy="9" r="2" />
            <path d="M12 11c-3 0-5 2.5-5 5 0 2 1.5 3 3 3 1 0 1.5-.5 2-.5s1 .5 2 .5c1.5 0 3-1 3-3 0-2.5-2-5-5-5z" />
          </svg>
        </div>
        <div className="head">
          <div className="wm">
            <span className="mark">
              <Icon name="paw" size={22} />
            </span>
            SISZOO
          </div>
          <div className="tagline">CCZ Itu</div>
        </div>
        <div className="center">
          <h1>Sistema de Gestão do Centro de Controle de Zoonoses</h1>
          <p>
            Plataforma unificada para gestão de animais, ocorrências, investigações sanitárias e
            relatórios da Prefeitura Municipal de Itu.
          </p>
        </div>
        <div className="footer">
          <span>Prefeitura Municipal de Itu</span>
          <span>v 1.2.0 · 2026</span>
        </div>
      </section>

      <section className="login-form-area">
        <form className="login-card" onSubmit={aoEnviar} noValidate>
          <div>
            <h2>Bem-vinda ao SISZOO</h2>
            <p className="lead">Faça login com suas credenciais institucionais.</p>
          </div>

          {submitError && (
            <div className="alert danger" role="alert">
              <span className="bullet" />
              <div className="alert-content">{submitError}</div>
            </div>
          )}

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
                type="email"
                placeholder="nome.sobrenome@itu.sp.gov.br"
                autoComplete="username"
                {...register('email')}
              />
            </div>
            {errors.email && <span className="err">{errors.email.message}</span>}
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
                className={`input${errors.senha ? ' error' : ''}`}
                type={senhaVisivel ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('senha')}
              />
              <button
                type="button"
                className="right-btn"
                title="Mostrar senha"
                onClick={() => setSenhaVisivel((value) => !value)}
              >
                <Icon name="eye" size={16} />
              </button>
            </div>
            {errors.senha && <span className="err">{errors.senha.message}</span>}
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={isLoading}>
            {isLoading ? 'Entrando…' : 'Entrar'}
          </button>

          <div className="login-foot">
            SISZOO <span className="version">v 1.2.0</span> · © 2026 Prefeitura Municipal de Itu
          </div>
        </form>
      </section>
    </div>
  )
}

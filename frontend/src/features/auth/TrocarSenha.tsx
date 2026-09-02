import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useAuth } from './AuthContext'
import { trocarSenha } from './authApi'
import { trocarSenhaSchema, type TrocarSenhaFormValues } from './trocarSenhaSchema'
import { Icon } from '../../components/layout/Icon'
import './Login.css'

export function TrocarSenha() {
  const navigate = useNavigate()
  const { marcarSenhaAlterada } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const mutation = useMutation({ mutationFn: trocarSenha })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrocarSenhaFormValues>({
    resolver: zodResolver(trocarSenhaSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  })

  async function onSubmit(dados: TrocarSenhaFormValues) {
    try {
      await mutation.mutateAsync({ novaSenha: dados.novaSenha, confirmarSenha: dados.confirmarSenha })
      marcarSenhaAlterada(new Date().toISOString())
      navigate('/dashboard', { replace: true })
    } catch {
      setSubmitError('Não foi possível trocar a senha. Tente novamente.')
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(onSubmit)(event)
  }

  return (
    <div className="login-form-area" style={{ minHeight: '100vh' }}>
      <form className="login-card" onSubmit={aoEnviar} noValidate>
        <div>
          <h2>Troque sua senha</h2>
          <p className="lead">
            Por segurança, defina uma nova senha antes de continuar no primeiro acesso.
          </p>
        </div>

        {submitError && (
          <div className="alert danger" role="alert">
            <span className="bullet" />
            <div className="alert-content">{submitError}</div>
          </div>
        )}

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
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register('novaSenha')}
            />
          </div>
          {errors.novaSenha && <span className="err">{errors.novaSenha.message}</span>}
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
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register('confirmarSenha')}
            />
          </div>
          {errors.confirmarSenha && <span className="err">{errors.confirmarSenha.message}</span>}
        </div>

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  )
}

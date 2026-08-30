import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import { trocarSenha } from './authApi'
import { trocarSenhaSchema } from './trocarSenhaSchema'
import { Icon } from '../../components/layout/Icon'
import './Login.css'

interface FieldErrors {
  novaSenha?: string
  confirmarSenha?: string
}

export function TrocarSenha() {
  const navigate = useNavigate()
  const { marcarSenhaAlterada } = useAuth()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const mutation = useMutation({ mutationFn: trocarSenha })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    const resultado = trocarSenhaSchema.safeParse({ novaSenha, confirmarSenha })
    if (!resultado.success) {
      const erros: FieldErrors = {}
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0]
        if (campo === 'novaSenha' || campo === 'confirmarSenha') erros[campo] = issue.message
      }
      setFieldErrors(erros)
      return
    }

    setFieldErrors({})

    try {
      const resposta = await mutation.mutateAsync({ novaSenha: resultado.data.novaSenha })
      marcarSenhaAlterada(resposta.senhaAlteradaEm)
      navigate('/dashboard', { replace: true })
    } catch {
      setSubmitError('Não foi possível trocar a senha. Tente novamente.')
    }
  }

  return (
    <div className="login-form-area" style={{ minHeight: '100vh' }}>
      <form className="login-card" onSubmit={handleSubmit} noValidate>
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
              className={`input${fieldErrors.novaSenha ? ' error' : ''}`}
              type="password"
              placeholder="••••••••"
              value={novaSenha}
              onChange={(event) => setNovaSenha(event.target.value)}
              autoComplete="new-password"
            />
          </div>
          {fieldErrors.novaSenha && <span className="err">{fieldErrors.novaSenha}</span>}
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
              className={`input${fieldErrors.confirmarSenha ? ' error' : ''}`}
              type="password"
              placeholder="••••••••"
              value={confirmarSenha}
              onChange={(event) => setConfirmarSenha(event.target.value)}
              autoComplete="new-password"
            />
          </div>
          {fieldErrors.confirmarSenha && <span className="err">{fieldErrors.confirmarSenha}</span>}
        </div>

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  )
}

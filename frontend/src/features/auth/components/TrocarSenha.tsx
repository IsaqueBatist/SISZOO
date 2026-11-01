import { useMemo, useState, type FormEvent } from 'react'
import { mensagemDeRegraDaApi } from '@/lib/erroApi'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import { trocarSenha } from '../api/authApi'
import { criarTrocarSenhaSchema, type TrocarSenhaFormValues } from '../schemas/trocarSenhaSchema'
import { AlertaErroEnvio } from '@/components/AlertaErroEnvio'
import { Icon } from '@/components/layout/Icon'
import { useTituloPagina } from '@/lib/useTituloPagina'
import { CriteriosSenha } from './CriteriosSenha'
import './Login.css'

export function TrocarSenha() {
  const navigate = useNavigate()
  const { user, marcarSenhaAlterada } = useAuth()
  const [submitError, setSubmitError] = useState<string | null>(null)
  useTituloPagina('Trocar senha')

  const mutation = useMutation({ mutationFn: trocarSenha })

  // A rota é protegida (sempre há usuário); a política usa o nome da conta e
  // o nome de exibição de quem troca. O backend aplica a mesma regra.
  const dono = useMemo(
    () => ({ email: user?.email ?? '', nomeExibicao: user ? `${user.nome} ${user.sobrenome}` : '' }),
    [user],
  )
  const schema = useMemo(() => criarTrocarSenhaSchema(dono), [dono])

  const {
    register,
    handleSubmit,
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
      await mutation.mutateAsync({ novaSenha: dados.novaSenha, confirmarSenha: dados.confirmarSenha })
      marcarSenhaAlterada(new Date().toISOString())
      navigate('/dashboard', { replace: true })
    } catch (erro) {
      setSubmitError(mensagemDeRegraDaApi(erro) ?? 'Não foi possível trocar a senha. Tente novamente.')
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
              className={`input${errors.novaSenha ? ' error' : ''}`} aria-invalid={errors.novaSenha ? true : undefined} aria-describedby={errors.novaSenha ? 'novaSenha-erro' : undefined}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              {...register('novaSenha')}
            />
          </div>
          {errors.novaSenha && <span className="err" id="novaSenha-erro">{errors.novaSenha.message}</span>}
          <CriteriosSenha senha={novaSenha} dono={dono} />
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
              className={`input${errors.confirmarSenha ? ' error' : ''}`} aria-invalid={errors.confirmarSenha ? true : undefined} aria-describedby={errors.confirmarSenha ? 'confirmarSenha-erro' : undefined}
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
      </form>
    </div>
  )
}

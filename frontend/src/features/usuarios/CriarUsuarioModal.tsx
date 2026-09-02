import { useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Icon } from '../../components/layout/Icon'
import { useCriarUsuarioMutation } from './useUsuarios'
import { usuarioFormSchema, type UsuarioFormValues } from './usuarioFormSchema'
import { PERFIS_USUARIO, type PerfilUsuario } from './usuarios.types'

interface CriarUsuarioModalProps {
  onFechar: () => void
}

function gerarSenhaAleatoria(): string {
  const sufixo = Math.floor(1000 + Math.random() * 9000)
  return `Itu@${sufixo}!`
}

function dividirNomeCompleto(nomeCompleto: string): { nome: string; sobrenome: string } {
  const partes = nomeCompleto.trim().split(/\s+/)
  return { nome: partes[0], sobrenome: partes.slice(1).join(' ') }
}

export function CriarUsuarioModal({ onFechar }: CriarUsuarioModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null)

  const mutation = useCriarUsuarioMutation()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UsuarioFormValues>({
    resolver: zodResolver(usuarioFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      nomeCompleto: '',
      email: '',
      cargo: '',
      crmv: '',
      senhaInicial: gerarSenhaAleatoria(),
    },
  })

  const cargo = watch('cargo')

  async function onSubmit(dados: UsuarioFormValues) {
    const { nome, sobrenome } = dividirNomeCompleto(dados.nomeCompleto)

    try {
      await mutation.mutateAsync({
        nome,
        sobrenome,
        email: dados.email,
        cargo: dados.cargo as PerfilUsuario,
        crmv: dados.cargo === 'Veterinário' ? dados.crmv : undefined,
        senhaInicial: dados.senhaInicial,
      })
      onFechar()
    } catch {
      setSubmitError('Não foi possível criar o usuário. Tente novamente.')
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    void handleSubmit(onSubmit)(event)
  }

  return (
    <div className="modal-overlay" onClick={onFechar}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>Adicionar Usuário</h3>
          <button type="button" className="btn btn-ghost btn-sm btn-icon-only" onClick={onFechar} aria-label="Fechar">
            <Icon name="x" size={16} />
          </button>
        </div>

        <form onSubmit={aoEnviar} noValidate>
          <div className="modal-body">
            <div className="form-grid cols-1">
              {submitError && (
                <div className="alert danger" role="alert">
                  <span className="bullet" />
                  <div className="alert-content">{submitError}</div>
                </div>
              )}

              <div className="field">
                <label htmlFor="nomeCompleto">
                  Nome completo <span className="req">*</span>
                </label>
                <input
                  id="nomeCompleto"
                  className={`input${errors.nomeCompleto ? ' error' : ''}`}
                  type="text"
                  placeholder="Maria Silva Souza"
                  {...register('nomeCompleto')}
                />
                {errors.nomeCompleto && <span className="err">{errors.nomeCompleto.message}</span>}
              </div>

              <div className="field">
                <label htmlFor="email">
                  E-mail institucional <span className="req">*</span>
                </label>
                <input
                  id="email"
                  className={`input${errors.email ? ' error' : ''}`}
                  type="email"
                  placeholder="nome.sobrenome@itu.sp.gov.br"
                  {...register('email')}
                />
                {errors.email && <span className="err">{errors.email.message}</span>}
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="cargo">
                    Perfil <span className="req">*</span>
                  </label>
                  <select id="cargo" className={`select${errors.cargo ? ' error' : ''}`} {...register('cargo')}>
                    <option value="" disabled>
                      Selecione…
                    </option>
                    {PERFIS_USUARIO.map((perfil) => (
                      <option key={perfil} value={perfil}>
                        {perfil}
                      </option>
                    ))}
                  </select>
                  {errors.cargo && <span className="err">{errors.cargo.message}</span>}
                </div>

                {cargo === 'Veterinário' && (
                  <div className="field">
                    <label htmlFor="crmv">
                      CRMV <span className="req">*</span>
                    </label>
                    <input
                      id="crmv"
                      className={`input mono${errors.crmv ? ' error' : ''}`}
                      type="text"
                      placeholder="CRMV-SP 00000"
                      {...register('crmv')}
                    />
                    {errors.crmv && <span className="err">{errors.crmv.message}</span>}
                  </div>
                )}
              </div>

              <div className="field">
                <label htmlFor="senhaInicial">Senha inicial</label>
                <div className="flex gap-2">
                  <input
                    id="senhaInicial"
                    className={`input mono${errors.senhaInicial ? ' error' : ''}`}
                    type="text"
                    style={{ flex: 1 }}
                    {...register('senhaInicial')}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setValue('senhaInicial', gerarSenhaAleatoria())}
                  >
                    Gerar
                  </button>
                </div>
                {errors.senhaInicial && <span className="err">{errors.senhaInicial.message}</span>}
                <span className="hint">O usuário será obrigado a trocar a senha no primeiro acesso.</span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onFechar}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Criando…' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

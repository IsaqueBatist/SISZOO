import { useState, type FormEvent } from 'react'
import { Icon } from '../../components/layout/Icon'
import { useCriarUsuarioMutation } from './useUsuarios'
import { usuarioFormSchema } from './usuarioFormSchema'
import { PERFIS_USUARIO, type PerfilUsuario } from './usuarios.types'

interface CriarUsuarioModalProps {
  onFechar: () => void
}

interface FieldErrors {
  nomeCompleto?: string
  email?: string
  cargo?: string
  crmv?: string
  senhaInicial?: string
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
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [cargo, setCargo] = useState<PerfilUsuario | ''>('')
  const [crmv, setCrmv] = useState('')
  const [senhaInicial, setSenhaInicial] = useState(() => gerarSenhaAleatoria())
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const mutation = useCriarUsuarioMutation()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    const resultado = usuarioFormSchema.safeParse({
      nomeCompleto,
      email,
      cargo,
      crmv: crmv || undefined,
      senhaInicial,
    })

    if (!resultado.success) {
      const erros: FieldErrors = {}
      for (const issue of resultado.error.issues) {
        const campo = issue.path[0]
        if (campo === 'nomeCompleto' || campo === 'email' || campo === 'cargo' || campo === 'crmv' || campo === 'senhaInicial') {
          erros[campo] = issue.message
        }
      }
      setFieldErrors(erros)
      return
    }

    setFieldErrors({})
    const { nome, sobrenome } = dividirNomeCompleto(resultado.data.nomeCompleto)

    try {
      await mutation.mutateAsync({
        nome,
        sobrenome,
        email: resultado.data.email,
        cargo: resultado.data.cargo as PerfilUsuario,
        crmv: resultado.data.cargo === 'Veterinário' ? resultado.data.crmv : undefined,
        senhaInicial: resultado.data.senhaInicial,
      })
      onFechar()
    } catch {
      setSubmitError('Não foi possível criar o usuário. Tente novamente.')
    }
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

        <form onSubmit={handleSubmit} noValidate>
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
                  className={`input${fieldErrors.nomeCompleto ? ' error' : ''}`}
                  type="text"
                  placeholder="Maria Silva Souza"
                  value={nomeCompleto}
                  onChange={(event) => setNomeCompleto(event.target.value)}
                />
                {fieldErrors.nomeCompleto && <span className="err">{fieldErrors.nomeCompleto}</span>}
              </div>

              <div className="field">
                <label htmlFor="email">
                  E-mail institucional <span className="req">*</span>
                </label>
                <input
                  id="email"
                  className={`input${fieldErrors.email ? ' error' : ''}`}
                  type="email"
                  placeholder="nome.sobrenome@itu.sp.gov.br"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                {fieldErrors.email && <span className="err">{fieldErrors.email}</span>}
              </div>

              <div className="form-grid">
                <div className="field">
                  <label htmlFor="cargo">
                    Perfil <span className="req">*</span>
                  </label>
                  <select
                    id="cargo"
                    className={`select${fieldErrors.cargo ? ' error' : ''}`}
                    value={cargo}
                    onChange={(event) => setCargo(event.target.value as PerfilUsuario)}
                  >
                    <option value="" disabled>
                      Selecione…
                    </option>
                    {PERFIS_USUARIO.map((perfil) => (
                      <option key={perfil} value={perfil}>
                        {perfil}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.cargo && <span className="err">{fieldErrors.cargo}</span>}
                </div>

                {cargo === 'Veterinário' && (
                  <div className="field">
                    <label htmlFor="crmv">
                      CRMV <span className="req">*</span>
                    </label>
                    <input
                      id="crmv"
                      className={`input mono${fieldErrors.crmv ? ' error' : ''}`}
                      type="text"
                      placeholder="CRMV-SP 00000"
                      value={crmv}
                      onChange={(event) => setCrmv(event.target.value)}
                    />
                    {fieldErrors.crmv && <span className="err">{fieldErrors.crmv}</span>}
                  </div>
                )}
              </div>

              <div className="field">
                <label htmlFor="senhaInicial">Senha inicial</label>
                <div className="flex gap-2">
                  <input
                    id="senhaInicial"
                    className={`input mono${fieldErrors.senhaInicial ? ' error' : ''}`}
                    type="text"
                    style={{ flex: 1 }}
                    value={senhaInicial}
                    onChange={(event) => setSenhaInicial(event.target.value)}
                  />
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setSenhaInicial(gerarSenhaAleatoria())}>
                    Gerar
                  </button>
                </div>
                {fieldErrors.senhaInicial && <span className="err">{fieldErrors.senhaInicial}</span>}
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

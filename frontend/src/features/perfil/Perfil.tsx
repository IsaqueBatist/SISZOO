import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Icon } from '../../components/layout/Icon'
import { NAV_ALL, ROLES, isNavGroup, roleKeyFromCargos } from '../../lib/nav'
import { perfilFormSchema, type PerfilFormValues } from './perfilFormSchema'
import { useAtualizarTelefoneMutation, usePerfilQuery } from './usePerfil'
import './Perfil.css'

function formatarData(iso: string): string {
  const data = new Date(iso)
  return data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

export function Perfil() {
  const query = usePerfilQuery()
  const mutation = useAtualizarTelefoneMutation()

  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSucesso, setSubmitSucesso] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { telefone: '' },
  })

  // O backend hoje não devolve `telefone` em GET /usuarios/me (só aceita no
  // PATCH), então o campo começa vazio — não há valor de servidor para
  // sincronizar. Em caso de erro de rede o estado local não é limpo, então o
  // que foi digitado continua no campo e pode ser reenviado.
  async function onSubmit(dados: PerfilFormValues) {
    try {
      await mutation.mutateAsync({ telefone: dados.telefone })
      setSubmitSucesso(true)
    } catch {
      setSubmitError('Não foi possível salvar o telefone. Verifique a conexão e tente novamente.')
    }
  }

  function aoEnviar(event: FormEvent<HTMLFormElement>) {
    setSubmitError(null)
    setSubmitSucesso(false)
    void handleSubmit(onSubmit)(event)
  }

  if (query.isLoading) {
    return (
      <div className="page-header">
        <div className="title-block">
          <h1>Meu Perfil</h1>
          <p className="subtitle">Carregando...</p>
        </div>
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="page-header">
        <div className="title-block">
          <h1>Meu Perfil</h1>
        </div>
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar seu perfil. Tente novamente.</div>
        </div>
      </div>
    )
  }

  const usuario = query.data
  const nomeCompleto = `${usuario.nome} ${usuario.sobrenome}`
  const iniciais = `${usuario.nome[0] ?? ''}${usuario.sobrenome[0] ?? ''}`.toUpperCase()
  const roleKey = roleKeyFromCargos(usuario.cargos)
  const role = ROLES[roleKey]

  const permissoes = NAV_ALL.flatMap((entry) =>
    isNavGroup(entry) ? [] : [{ label: entry.label, liberado: role.access.includes(entry.id) }],
  )

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>Meu Perfil</h1>
          <p className="subtitle">Informações pessoais e permissões do seu perfil</p>
        </div>
        <div className="actions">
          <Link to="/configuracoes" className="btn btn-outline btn-sm">
            <Icon name="cog" size={14} />
            Preferências
          </Link>
        </div>
      </div>

      <div className="perfil-grid">
        <div className="col gap-4">
          <div className="card profile-card">
            <div className="profile-avatar">{iniciais}</div>
            <h2>{nomeCompleto}</h2>
            <div className="email">{usuario.email}</div>
            <div>
              <span className={`badge ${role.badgeCls}`}>{role.label.toUpperCase()}</span>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Dados de contato</h3>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="kv-list" style={{ padding: 16 }}>
                <div className="kv-row">
                  <span className="k">
                    <Icon name="mail" size={14} /> E-mail
                  </span>
                  <span className="v mono">{usuario.email}</span>
                </div>
                {usuario.crmv && (
                  <div className="kv-row">
                    <span className="k">Registro</span>
                    <span className="v mono">{usuario.crmv}</span>
                  </div>
                )}
                <div className="kv-row">
                  <span className="k">No SISZOO</span>
                  <span className="v mono">Desde {formatarData(usuario.criadoEm)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Atualizar telefone</h3>
            </div>
            <div className="card-body">
              {submitError && (
                <div className="alert danger" role="alert">
                  <span className="bullet" />
                  <div className="alert-content">{submitError}</div>
                </div>
              )}
              {submitSucesso && !submitError && (
                <div className="alert success" role="status">
                  <span className="bullet" />
                  <div className="alert-content">Telefone atualizado com sucesso.</div>
                </div>
              )}
              <form onSubmit={aoEnviar} noValidate>
                <div className="field">
                  <label htmlFor="telefone">Telefone</label>
                  <div className="input-with-icon">
                    <span className="ico">
                      <Icon name="phone" size={16} />
                    </span>
                    <input
                      id="telefone"
                      className={`input${errors.telefone ? ' error' : ''}`}
                      type="text"
                      placeholder="(11) 91234-5678"
                      {...register('telefone', { onChange: () => setSubmitSucesso(false) })}
                    />
                  </div>
                  {errors.telefone && <span className="err">{errors.telefone.message}</span>}
                </div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Salvando…' : 'Salvar telefone'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col gap-4">
          <div className="card">
            <div className="card-header">
              <h3>Permissões deste perfil</h3>
            </div>
            <div className="card-body" style={{ padding: 16 }}>
              {permissoes.map((permissao) => (
                <div className="permissao-row" key={permissao.label}>
                  <span className={permissao.liberado ? 'permissao-ok' : 'permissao-negado'}>
                    <Icon name={permissao.liberado ? 'check' : 'x'} size={14} />
                  </span>
                  <span className={permissao.liberado ? '' : 'permissao-negado-label'}>{permissao.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

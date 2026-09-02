import { useState, type FormEvent } from 'react'
import { Icon } from '../../components/layout/Icon'
import { aplicarPreferenciasVisuais } from '../../lib/theme'
import type { DensidadeUsuario, TemaUsuario } from './configuracoes.types'
import { preferenciasFormSchema } from './preferenciasFormSchema'
import { useAtualizarPreferenciasMutation, usePreferenciasQuery } from './useConfiguracoes'
import './Configuracoes.css'

type Aba = 'prefs' | 'notif'

const LABELS_DENSIDADE: Record<DensidadeUsuario, string> = {
  NORMAL: 'Padrão',
  COMPACTO: 'Compacto',
  CONFORTAVEL: 'Espaçoso',
}

const OPCOES_DENSIDADE: DensidadeUsuario[] = ['NORMAL', 'COMPACTO', 'CONFORTAVEL']

const OPCOES_TEMA: { valor: TemaUsuario; label: string; gradiente: string }[] = [
  { valor: 'LIGHT', label: 'Claro', gradiente: 'linear-gradient(135deg, #1B5E20, #2E7D32)' },
  { valor: 'DARK', label: 'Escuro', gradiente: 'linear-gradient(135deg, #0F1720, #2C3A4E)' },
]

interface FormState {
  tema: TemaUsuario
  densidade: DensidadeUsuario
  notifVacinaVencendo: boolean
  notifSuperlotacao: boolean
  notifResultadoLab: boolean
  notifEmailDiario: boolean
}

export function Configuracoes() {
  const query = usePreferenciasQuery()
  const mutation = useAtualizarPreferenciasMutation()

  const [aba, setAba] = useState<Aba>('prefs')
  const [form, setForm] = useState<FormState | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSucesso, setSubmitSucesso] = useState(false)

  // Seed único a partir do servidor, ajustado durante o render (sem efeito):
  // `form` só é null antes do primeiro carregamento, então essa checagem
  // nunca reexecuta depois de inicializado — nem quando query.data muda por
  // um PATCH bem-sucedido (setQueryData) — e assim nunca descarta a escolha
  // do usuário numa queda de rede.
  if (query.data && !form) {
    setForm({
      tema: query.data.tema,
      densidade: query.data.densidade,
      notifVacinaVencendo: query.data.notifVacinaVencendo,
      notifSuperlotacao: query.data.notifSuperlotacao,
      notifResultadoLab: query.data.notifResultadoLab,
      notifEmailDiario: query.data.notifEmailDiario,
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)
    setSubmitSucesso(false)
    if (!form) return

    const resultado = preferenciasFormSchema.safeParse(form)
    if (!resultado.success) return

    try {
      const resposta = await mutation.mutateAsync({
        ...resultado.data,
        notifAlertasCriticos: true,
      })
      aplicarPreferenciasVisuais(resposta)
      setSubmitSucesso(true)
    } catch {
      setSubmitError('Não foi possível salvar as preferências. Verifique a conexão e tente novamente.')
    }
  }

  if (query.isLoading) {
    return (
      <div className="page-header">
        <div className="title-block">
          <h1>Configurações</h1>
          <p className="subtitle">Carregando...</p>
        </div>
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="page-header">
        <div className="title-block">
          <h1>Configurações</h1>
        </div>
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar suas preferências. Tente novamente.</div>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="page-header">
        <div className="title-block">
          <h1>Configurações</h1>
          <p className="subtitle">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>Configurações</h1>
          <p className="subtitle">Preferências e notificações da sua conta</p>
        </div>
      </div>

      <form className="config-grid" onSubmit={handleSubmit} noValidate>
        <nav className="config-nav">
          <div className="cn-section">Conta</div>
          <button
            type="button"
            className={`config-nav-item${aba === 'prefs' ? ' active' : ''}`}
            onClick={() => setAba('prefs')}
          >
            <Icon name="user" size={14} />
            Preferências
          </button>
          <button
            type="button"
            className={`config-nav-item${aba === 'notif' ? ' active' : ''}`}
            onClick={() => setAba('notif')}
          >
            <Icon name="bell" size={14} />
            Notificações
          </button>
        </nav>

        <div>
          {submitError && (
            <div className="alert danger" role="alert">
              <span className="bullet" />
              <div className="alert-content">{submitError}</div>
            </div>
          )}
          {submitSucesso && !submitError && (
            <div className="alert success" role="status">
              <span className="bullet" />
              <div className="alert-content">Preferências salvas com sucesso.</div>
            </div>
          )}

          <div className={`config-section${aba === 'prefs' ? ' active' : ''}`}>
            <div className="card">
              <div className="card-header">
                <h3>Preferências</h3>
                <span className="sub">Ajustes da sua experiência</span>
              </div>
              <div className="card-body">
                <div className="pref-row">
                  <div>
                    <div className="title">Tema</div>
                    <div className="desc">Claro ou escuro para toda a interface</div>
                  </div>
                  <div className="pal-grid">
                    {OPCOES_TEMA.map((opcao) => (
                      <button
                        type="button"
                        key={opcao.valor}
                        className={`pal-chip${form.tema === opcao.valor ? ' active' : ''}`}
                        style={{ background: opcao.gradiente }}
                        title={opcao.label}
                        aria-label={opcao.label}
                        onClick={() => setForm({ ...form, tema: opcao.valor })}
                      />
                    ))}
                  </div>
                </div>
                <div className="pref-row">
                  <div>
                    <div className="title">Densidade da interface</div>
                    <div className="desc">Espaçamento entre elementos — afeta quanta informação cabe na tela</div>
                  </div>
                  <select
                    className="select"
                    style={{ width: 180 }}
                    value={form.densidade}
                    onChange={(event) => setForm({ ...form, densidade: event.target.value as DensidadeUsuario })}
                  >
                    {OPCOES_DENSIDADE.map((opcao) => (
                      <option key={opcao} value={opcao}>
                        {LABELS_DENSIDADE[opcao]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className={`config-section${aba === 'notif' ? ' active' : ''}`}>
            <div className="card">
              <div className="card-header">
                <h3>Notificações</h3>
                <span className="sub">Quando e como o SISZOO deve te avisar</span>
              </div>
              <div className="card-body">
                <div className="pref-row">
                  <div>
                    <div className="title">Alertas críticos</div>
                    <div className="desc">Casos urgentes com contato humano-animal — sempre ligado</div>
                  </div>
                  <label className="switch">
                    <input type="checkbox" checked disabled />
                    <span className="slider" />
                  </label>
                </div>
                <div className="pref-row">
                  <div>
                    <div className="title">Lembretes de vacinação</div>
                    <div className="desc">Avisar 7 dias antes de uma vacina vencer</div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={form.notifVacinaVencendo}
                      onChange={(event) => setForm({ ...form, notifVacinaVencendo: event.target.checked })}
                    />
                    <span className="slider" />
                  </label>
                </div>
                <div className="pref-row">
                  <div>
                    <div className="title">Superlotação de baias</div>
                    <div className="desc">Alertar quando uma baia atingir 80% de ocupação</div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={form.notifSuperlotacao}
                      onChange={(event) => setForm({ ...form, notifSuperlotacao: event.target.checked })}
                    />
                    <span className="slider" />
                  </label>
                </div>
                <div className="pref-row">
                  <div>
                    <div className="title">Resultados laboratoriais</div>
                    <div className="desc">Notificar imediatamente quando um resultado for registrado</div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={form.notifResultadoLab}
                      onChange={(event) => setForm({ ...form, notifResultadoLab: event.target.checked })}
                    />
                    <span className="slider" />
                  </label>
                </div>
                <div className="pref-row">
                  <div>
                    <div className="title">E-mail diário</div>
                    <div className="desc">Resumo do dia enviado às 18h</div>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={form.notifEmailDiario}
                      onChange={(event) => setForm({ ...form, notifEmailDiario: event.target.checked })}
                    />
                    <span className="slider" />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="config-footer">
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}

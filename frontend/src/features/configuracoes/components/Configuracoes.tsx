import { useEffect, useRef, useState, type FormEvent } from 'react'
import { AlertaErroEnvio } from '@/components/AlertaErroEnvio'
import { Switch } from '@/components/Switch'
import { Icon } from '@/components/layout/Icon'
import { aplicarPreferenciasVisuais } from '@/lib/theme'
import type { DensidadeUsuario, TemaUsuario } from '../types/configuracoes.types'
import { preferenciasFormSchema } from '../schemas/preferenciasFormSchema'
import { useAtualizarPreferenciasMutation, usePreferenciasQuery } from '../hooks/useConfiguracoes'
import './Configuracoes.css'

type Aba = 'prefs' | 'notif'

const LABELS_DENSIDADE: Record<DensidadeUsuario, string> = {
  NORMAL: 'Padrão',
  COMPACTO: 'Compacto',
  CONFORTAVEL: 'Espaçoso',
}

const OPCOES_DENSIDADE: DensidadeUsuario[] = ['NORMAL', 'COMPACTO', 'CONFORTAVEL']

const OPCOES_TEMA: { valor: TemaUsuario; label: string; amostra: string }[] = [
  { valor: 'LIGHT', label: 'Claro', amostra: '#FFFFFF' },
  { valor: 'DARK', label: 'Escuro', amostra: '#181F27' },
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
  const preferenciasSalvas = useRef(query.data)

  useEffect(() => {
    preferenciasSalvas.current = query.data
  }, [query.data])

  const temaEmVisualizacao = form?.tema
  const densidadeEmVisualizacao = form?.densidade

  useEffect(() => {
    if (temaEmVisualizacao && densidadeEmVisualizacao) {
      aplicarPreferenciasVisuais({ tema: temaEmVisualizacao, densidade: densidadeEmVisualizacao })
    }
  }, [temaEmVisualizacao, densidadeEmVisualizacao])

  useEffect(
    () => () => {
      if (preferenciasSalvas.current) aplicarPreferenciasVisuais(preferenciasSalvas.current)
    },
    [],
  )

  const alteracaoVisualNaoSalva =
    !!form && !!query.data && (form.tema !== query.data.tema || form.densidade !== query.data.densidade)

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
          <AlertaErroEnvio mensagem={submitError} />
          {submitSucesso && !submitError && (
            <div className="alert success" role="status">
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
                        aria-pressed={form.tema === opcao.valor}
                        onClick={() => {
                          setSubmitSucesso(false)
                          setForm({ ...form, tema: opcao.valor })
                        }}
                      >
                        <span className="amostra" style={{ background: opcao.amostra }} aria-hidden="true" />
                        {opcao.label}
                      </button>
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
                    aria-label="Densidade da interface"
                    style={{ width: 180 }}
                    value={form.densidade}
                    onChange={(event) => {
                      setSubmitSucesso(false)
                      setForm({ ...form, densidade: event.target.value as DensidadeUsuario })
                    }}
                  >
                    {OPCOES_DENSIDADE.map((opcao) => (
                      <option key={opcao} value={opcao}>
                        {LABELS_DENSIDADE[opcao]}
                      </option>
                    ))}
                  </select>
                </div>
                {alteracaoVisualNaoSalva && (
                  <p className="aviso-visualizacao" role="status">
                    Você está vendo a aparência escolhida. Clique em <strong>Salvar alterações</strong> para mantê-la; se
                    sair sem salvar, volta a anterior.
                  </p>
                )}
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
                  <Switch checked disabled onChange={() => undefined} aria-label="Alertas críticos" />
                </div>
                <div className="pref-row">
                  <div>
                    <div className="title">Lembretes de vacinação</div>
                    <div className="desc">Avisar 7 dias antes de uma vacina vencer</div>
                  </div>
                  <Switch
                    checked={form.notifVacinaVencendo}
                    onChange={(marcado) => setForm({ ...form, notifVacinaVencendo: marcado })}
                    aria-label="Lembretes de vacinação"
                  />
                </div>
                <div className="pref-row">
                  <div>
                    <div className="title">Superlotação de baias</div>
                    <div className="desc">Alertar quando uma baia atingir 80% de ocupação</div>
                  </div>
                  <Switch
                    checked={form.notifSuperlotacao}
                    onChange={(marcado) => setForm({ ...form, notifSuperlotacao: marcado })}
                    aria-label="Superlotação de baias"
                  />
                </div>
                <div className="pref-row">
                  <div>
                    <div className="title">Resultados laboratoriais</div>
                    <div className="desc">Notificar imediatamente quando um resultado for registrado</div>
                  </div>
                  <Switch
                    checked={form.notifResultadoLab}
                    onChange={(marcado) => setForm({ ...form, notifResultadoLab: marcado })}
                    aria-label="Resultados laboratoriais"
                  />
                </div>
                <div className="pref-row">
                  <div>
                    <div className="title">E-mail diário</div>
                    <div className="desc">Resumo do dia enviado às 18h</div>
                  </div>
                  <Switch
                    checked={form.notifEmailDiario}
                    onChange={(marcado) => setForm({ ...form, notifEmailDiario: marcado })}
                    aria-label="E-mail diário"
                  />
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

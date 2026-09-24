import { Link, useParams } from 'react-router-dom'
import { Icon } from '../../components/layout/Icon'
import { useAuth } from '../auth/AuthContext'
import { CardDenunciante } from './CardDenunciante'
import { CardEncerramento } from './CardEncerramento'
import { MovimentacoesTimeline } from './MovimentacoesTimeline'
import './OcorrenciaDetalhe.css'
import { badgeDeStatus, labelDeTipo } from './statusBadge'
import { useOcorrenciaQuery } from './useOcorrencias'

const FUSO_ITU = 'America/Sao_Paulo'

function formatarData(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: FUSO_ITU }).format(
    new Date(iso),
  )
}

function formatarTamanho(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function OcorrenciaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const { roleKey } = useAuth()
  const podeEncerrar = roleKey === 'admin' || roleKey === 'agente'

  const { data: ocorrencia, isLoading, isError } = useOcorrenciaQuery(id)

  if (isLoading) {
    return <p>Carregando ocorrência…</p>
  }

  if (isError || !ocorrencia || !id) {
    return (
      <>
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar esta ocorrência.</div>
        </div>
        <Link to="/ocorrencias" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
          ← Voltar para Ocorrências
        </Link>
      </>
    )
  }

  const statusBadge = badgeDeStatus(ocorrencia.statusOcorrencia)

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <Link to="/ocorrencias" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
            ← Voltar para Ocorrências
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
            <span className={`badge ${statusBadge.classe}`}>{statusBadge.label}</span>
            {ocorrencia.urgente && <span className="badge badge-urgent">🚨 URGENTE</span>}
            {ocorrencia.sigilosa && (
              <span className="badge badge-neutral">
                <Icon name="lock" size={12} /> Sigilosa
              </span>
            )}
          </div>
          <h1 style={{ fontFamily: 'var(--font-mono)', letterSpacing: 0 }}>Ocorrência {ocorrencia.protocolo}</h1>
          <p className="subtitle">
            {labelDeTipo(ocorrencia.tipoOcorrencia)} · {ocorrencia.bairro}
          </p>
        </div>
      </div>

      <div className="det-grid">
        <div className="col gap-4">
          <div className="card">
            <div className="card-header">
              <h3>Detalhes da Ocorrência</h3>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="field">
                  <label>Tipo</label>
                  <div>
                    <span className="badge" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                      {labelDeTipo(ocorrencia.tipoOcorrencia)}
                    </span>
                  </div>
                </div>
                <div className="field">
                  <label>Data / hora</label>
                  <div className="mono" style={{ fontSize: 14 }}>
                    {formatarData(ocorrencia.dataAbertura)}
                    {ocorrencia.horaAbertura ? ` · ${ocorrencia.horaAbertura}` : ''}
                  </div>
                </div>
                <div className="field full">
                  <label>Endereço</label>
                  <div>
                    {ocorrencia.endereco} · {ocorrencia.bairro}
                  </div>
                </div>
                <div className="field">
                  <label>Ponto de referência</label>
                  <div>{ocorrencia.pontoReferencia ?? '—'}</div>
                </div>
                <div className="field">
                  <label>Registrada por</label>
                  <div>{ocorrencia.registradoPorNome}</div>
                </div>
                <div className="field full">
                  <label>Descrição</label>
                  <div
                    style={{
                      padding: 12,
                      background: 'var(--color-surface-alt)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    {ocorrencia.descricao}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <div className="uppercase-label" style={{ marginBottom: 8 }}>
                  Localização aproximada
                </div>
                <div className="map-stub">{ocorrencia.bairro} · Itu/SP</div>
              </div>
            </div>
          </div>

          <CardDenunciante sigilosa={ocorrencia.sigilosa} denunciante={ocorrencia.denunciante} />

          <div className="card">
            <div className="card-header">
              <h3>Denunciado</h3>
            </div>
            <div className="card-body" style={{ paddingTop: 0 }}>
              {ocorrencia.denunciado === null ? (
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', paddingTop: 12 }}>
                  Não há denunciado identificado para esta ocorrência. O animal foi reportado como abandonado ou sem
                  proprietário visível.
                </p>
              ) : (
                <div className="form-grid" style={{ paddingTop: 12 }}>
                  <div className="field">
                    <label>Nome</label>
                    <div>{ocorrencia.denunciado.nome ?? '—'}</div>
                  </div>
                  <div className="field">
                    <label>CPF</label>
                    <div className="mono">{ocorrencia.denunciado.cpf ?? '—'}</div>
                  </div>
                  <div className="field">
                    <label>Telefone</label>
                    <div className="mono">{ocorrencia.denunciado.telefone ?? '—'}</div>
                  </div>
                  <div className="field full">
                    <label>Endereço</label>
                    <div>{ocorrencia.denunciado.endereco ?? '—'}</div>
                  </div>
                  {ocorrencia.denunciado.observacoes && (
                    <div className="field full">
                      <label>Observações</label>
                      <div>{ocorrencia.denunciado.observacoes}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Histórico de Movimentações</h3>
            </div>
            <div className="card-body">
              <MovimentacoesTimeline movimentacoes={ocorrencia.movimentacoes} />
            </div>
          </div>
        </div>

        <div className="col gap-4">
          {ocorrencia.processoVinculado && (
            <div className="vinc-card">
              <h4>Processo Sanitário Vinculado</h4>
              <div className="proto-big">{ocorrencia.processoVinculado.protocolo}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                {ocorrencia.processoVinculado.resultadoPendente ? 'Aguardando resultado' : ocorrencia.processoVinculado.statusProcesso}
              </div>
            </div>
          )}

          <CardEncerramento ocorrencia={ocorrencia} podeEncerrar={podeEncerrar} />

          <div className="card">
            <div className="card-header">
              <h3>Anexos</h3>
            </div>
            <div className="card-body" style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ocorrencia.anexos.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', padding: '4px 6px' }}>
                  Nenhum anexo registrado.
                </p>
              )}
              {ocorrencia.anexos.map((anexo) => (
                <div key={anexo.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, fontSize: 13 }}>
                  <Icon name="clipboard" size={16} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{anexo.nome}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {formatarTamanho(anexo.tamanho)} · {formatarData(anexo.criadoEm)}
                    </div>
                  </div>
                  <a href={anexo.url} className="btn btn-ghost btn-sm btn-icon-only" aria-label={`Baixar ${anexo.nome}`}>
                    <Icon name="chevronDown" size={14} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

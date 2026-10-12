import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '@/components/layout/Icon'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { statusHttpDoErro } from '@/lib/erroApi'
import { AvisoAnexosPendentes } from './AvisoAnexosPendentes'
import { CardDenunciante } from './CardDenunciante'
import { CardEncerramento } from './CardEncerramento'
import { MovimentacoesTimeline } from './MovimentacoesTimeline'
import type { AnexoOcorrencia, Ocorrencia } from '../types/ocorrencias.types'
import './OcorrenciaDetalhe.css'
import { baixarAnexo } from '../api/ocorrenciasApi'
import { badgeDeStatus, labelDeStatusProcesso } from '../utils/statusBadge'
import { formatarData, formatarHora } from '../utils/datas'
import { formatarProtocoloOcorrencia, formatarProtocoloProcesso } from '../utils/protocolo'
import { useIniciarAtendimentoMutation, useOcorrenciaQuery } from '../hooks/useOcorrencias'
import { useAnexosPendentes } from '../hooks/useAnexosPendentes'

// D15: anexos que não subiram no cadastro desta ocorrência (ficaram no
// IndexedDB deste navegador) podem ser reenviados daqui também.
function AnexosPendentesDaOcorrencia({ ocorrenciaId }: { ocorrenciaId: string }) {
  const queryClient = useQueryClient()
  const { pendencia, falhas, enviando, enviar, descartar } = useAnexosPendentes()

  if (!pendencia || pendencia.ocorrenciaId !== ocorrenciaId) return null

  async function reenviar() {
    if (!pendencia) return
    await enviar(pendencia)
    await queryClient.invalidateQueries({ queryKey: ['ocorrencias', 'detalhe', ocorrenciaId] })
  }

  return (
    <AvisoAnexosPendentes
      pendencia={pendencia}
      falhas={falhas}
      enviando={enviando}
      onReenviar={() => void reenviar()}
      onDescartar={() => void descartar()}
    />
  )
}

// Botão próprio (não inline em OcorrenciaDetalhe) porque a mutation só pode
// ser chamada depois que `ocorrencia` já existe — mesmo motivo de
// CardEncerramento ser um componente à parte: chamar o hook direto em
// OcorrenciaDetalhe violaria a regra dos hooks (ele fica depois do
// early-return de loading/erro).
function BotaoIniciarAtendimento({ ocorrencia, podeEscrever }: { ocorrencia: Ocorrencia; podeEscrever: boolean }) {
  const [erro, setErro] = useState<string | null>(null)
  const mutation = useIniciarAtendimentoMutation(ocorrencia.id)

  if (!podeEscrever || ocorrencia.statusOcorrencia !== 'ABERTA') return null

  async function handleClick() {
    setErro(null)
    try {
      await mutation.mutateAsync()
    } catch {
      setErro('Não foi possível iniciar o atendimento. Tente novamente.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <button type="button" className="btn btn-secondary btn-sm" onClick={handleClick} disabled={mutation.isPending}>
        {mutation.isPending ? 'Iniciando…' : 'Iniciar Atendimento'}
      </button>
      {erro && <span className="err">{erro}</span>}
    </div>
  )
}

function formatarTamanho(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// O download precisa do token, então não dá para usar <a href> direto: baixa
// o Blob, cria um object URL só para o clique e o revoga logo depois.
function salvarBlob(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

// Anexo de ocorrência sigilosa é restrito a quem pode ver o denunciante (o
// backend responde 403 para os demais): o cadeado só antecipa isso na tela.
function ListaAnexos({ ocorrencia }: { ocorrencia: Ocorrencia }) {
  const [erro, setErro] = useState<string | null>(null)
  const restrito = ocorrencia.sigilosa && !ocorrencia.podeVerDenunciante

  async function baixar(anexo: AnexoOcorrencia) {
    setErro(null)
    try {
      salvarBlob(await baixarAnexo(ocorrencia.id, anexo.id), anexo.nome)
    } catch (falha) {
      setErro(statusHttpDoErro(falha) === 403 ? 'Anexo restrito' : 'Não foi possível baixar o anexo. Tente novamente.')
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3>Anexos</h3>
      </div>
      <div className="card-body" style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {erro && (
          <div className="alert danger" role="alert">
            <span className="bullet" />
            <div className="alert-content">{erro}</div>
          </div>
        )}
        {ocorrencia.anexos.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', padding: '4px 6px' }}>Nenhum anexo registrado.</p>
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
            {restrito ? (
              <span role="img" aria-label="restrito" title="Anexo restrito" style={{ color: 'var(--color-text-muted)' }}>
                <Icon name="lock" size={14} />
              </span>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-icon-only"
                aria-label={`Baixar ${anexo.nome}`}
                onClick={() => void baixar(anexo)}
              >
                <Icon name="chevronDown" size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function OcorrenciaDetalhe() {
  const { id } = useParams<{ id: string }>()
  const { roleKey } = useAuth()
  const podeEscrever = roleKey === 'admin' || roleKey === 'agente'

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
      <AnexosPendentesDaOcorrencia ocorrenciaId={ocorrencia.id} />
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
            {ocorrencia.anonima && <span className="badge badge-neutral">Anônima</span>}
          </div>
          <h1 style={{ fontFamily: 'var(--font-mono)', letterSpacing: 0 }}>Ocorrência {formatarProtocoloOcorrencia(ocorrencia.protocolo)}</h1>
          <p className="subtitle">
            {ocorrencia.tipoOcorrenciaNome} · {ocorrencia.bairro}
          </p>
        </div>
        <div className="actions">
          <BotaoIniciarAtendimento ocorrencia={ocorrencia} podeEscrever={podeEscrever} />
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
                      {ocorrencia.tipoOcorrenciaNome}
                    </span>
                  </div>
                </div>
                <div className="field">
                  <label>Data / hora</label>
                  <div className="mono" style={{ fontSize: 14 }}>
                    {formatarData(ocorrencia.dataAbertura)}
                    {ocorrencia.horaAbertura ? ` · ${formatarHora(ocorrencia.horaAbertura)}` : ''}
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

          <CardDenunciante
            mascarado={ocorrencia.sigilosa && !ocorrencia.podeVerDenunciante}
            anonima={ocorrencia.anonima}
            denunciante={ocorrencia.denunciante}
          />

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
          {ocorrencia.processoVinculado ? (
            // Sem link para /processos/:id: aquela tela ainda é de demonstração (D40).
            <div className="vinc-card" style={{ display: 'block' }}>
              <h4>Processo Sanitário Vinculado</h4>
              <div className="proto-big">{formatarProtocoloProcesso(ocorrencia.processoVinculado.protocolo)}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>
                {labelDeStatusProcesso(ocorrencia.processoVinculado.statusProcesso)}
              </div>
            </div>
          ) : (
            // D40: o processo é aberto por esta tela pela API real (bloco do
            // detalhe); o wizard e o "vincular existente" do mock de processos
            // não alteram mais ocorrências reais.
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Nenhum processo sanitário vinculado.</p>
          )}

          <CardEncerramento ocorrencia={ocorrencia} podeEncerrar={podeEscrever} />

          <ListaAnexos ocorrencia={ocorrencia} />
        </div>
      </div>
    </>
  )
}

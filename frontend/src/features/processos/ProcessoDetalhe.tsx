import { Link, useParams } from 'react-router-dom'
import { Icon } from '../../components/layout/Icon'
import { DOENCA_OPCOES, labelDeDoenca, labelDeLaboratorio, SINTOMA_OPCOES } from './processosCatalogos'
import type { AmostraAnimal } from './processos.types'
import { badgeDeResultado, badgeDeStatusProcesso, classeDeDoenca } from './statusBadge'
import { useProcessoQuery } from './useProcessos'

const FUSO_ITU = 'America/Sao_Paulo'

function formatarData(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: FUSO_ITU }).format(
    new Date(iso),
  )
}

function formatarTamanho(bytes: number): string {
  return `${(bytes / 1024).toFixed(0)} KB`
}

function labelDeSintoma(valor: string): string {
  return SINTOMA_OPCOES.find((item) => item.valor === valor)?.label ?? valor
}

const DESFECHO_LABEL: Record<string, string> = {
  em_acompanhamento: 'Em acompanhamento',
  obito_natural: 'Óbito — Natural',
  obito_eutanasia: 'Óbito — Eutanásia',
  obito_outro: 'Óbito — Outro',
}

const TIPO_ABRIGO_LABEL: Record<string, string> = {
  intradomiciliar: 'Intradomiciliar',
  peridomiciliar: 'Peridomiciliar',
  silvestre: 'Silvestre',
  nao_identificado: 'Não identificado',
}

const STATUS_CLINICO_LABEL: Record<string, string> = {
  sintomatico: 'Sintomático',
  assintomatico: 'Assintomático',
  obito: 'Óbito',
}

// DER.md §3.5:557 — a origem "canil" referencia um Animal já cadastrado
// (link para a ficha); "externo" é um animal de campo, nunca entrou no
// canil, sem ficha para linkar.
function CardAmostra({ amostra, indice }: { amostra: AmostraAnimal; indice: number }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>Amostra {indice + 1}</h3>
        {amostra.origem === 'canil' ? (
          <Link to={`/animais/${amostra.animalId}`} className="btn btn-outline btn-sm">
            Ver ficha do animal
          </Link>
        ) : (
          <span className="badge badge-neutral">Animal de campo</span>
        )}
      </div>
      <div className="card-body">
        <div className="form-grid">
          <div className="field">
            <label>Sexo</label>
            <div>{amostra.sexo === 'macho' ? 'Macho' : amostra.sexo === 'femea' ? 'Fêmea' : 'Não identificado'}</div>
          </div>
          <div className="field">
            <label>Raça</label>
            <div>{amostra.raca ?? '—'}</div>
          </div>
          <div className="field">
            <label>Status clínico</label>
            <div>{STATUS_CLINICO_LABEL[amostra.statusClinico] ?? amostra.statusClinico}</div>
          </div>
          <div className="field">
            <label>Tipo de abrigo</label>
            <div>{TIPO_ABRIGO_LABEL[amostra.tipoAbrigo] ?? amostra.tipoAbrigo}</div>
          </div>
          <div className="field">
            <label>Data da coleta</label>
            <div className="mono">{formatarData(amostra.dataColeta)}</div>
          </div>
          <div className="field">
            <label>Material biológico</label>
            <div>{amostra.materialBiologico.replace('_', ' ')}</div>
          </div>
          {amostra.alteracaoComportamental && (
            <div className="field full">
              <label>Alteração comportamental</label>
              <div>{amostra.alteracaoComportamental}</div>
            </div>
          )}
          <div className="field full">
            <label>Sinais e sintomas</label>
            <div>
              {amostra.sintomas.length === 0
                ? '—'
                : amostra.sintomas.map((sintoma) => labelDeSintoma(sintoma)).join(', ')}
            </div>
          </div>
        </div>
        <div
          className={amostra.contatoHumano ? 'alert danger' : undefined}
          style={amostra.contatoHumano ? { marginTop: 'var(--space-3)' } : { marginTop: 'var(--space-3)', fontSize: 12, color: 'var(--color-text-secondary)' }}
        >
          {amostra.contatoHumano ? (
            <>
              <span className="bullet" />
              <div className="alert-content">
                <strong>Contato humano-animal confirmado</strong>
                {amostra.nivelContato ? ` — contato ${amostra.nivelContato}.` : '.'}
                {amostra.agrediuHumano ? ' O animal agrediu o munícipe.' : ''}
              </div>
            </>
          ) : (
            'Sem contato humano-animal registrado nesta amostra.'
          )}
        </div>
      </div>
    </div>
  )
}

export function ProcessoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const { data: processo, isLoading, isError } = useProcessoQuery(id)

  if (isLoading) {
    return <p>Carregando processo…</p>
  }

  if (isError) {
    return (
      <>
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar este processo sanitário.</div>
        </div>
        <Link to="/processos" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
          ← Voltar para Processos
        </Link>
      </>
    )
  }

  if (!id || !processo) {
    return (
      <>
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Processo sanitário não encontrado.</div>
        </div>
        <Link to="/processos" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
          ← Voltar para Processos
        </Link>
      </>
    )
  }

  const statusBadge = badgeDeStatusProcesso(processo.statusProcesso)
  const cid = processo.cid ?? DOENCA_OPCOES.find((item) => item.valor === processo.doenca)?.cid

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <Link to="/processos" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }}>
            ← Voltar para Processos
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
            <span className={`badge badge-disease ${classeDeDoenca(processo.doenca)}`}>{labelDeDoenca(processo.doenca)}</span>
            <span className={`badge ${statusBadge.classe}`}>{statusBadge.label}</span>
            {processo.urgente && (
              <span className="badge badge-urgent">
                <Icon name="alert" size={12} /> Urgente
              </span>
            )}
          </div>
          <h1 style={{ fontFamily: 'var(--font-mono)', letterSpacing: 0 }}>Processo {processo.protocolo}</h1>
          <p className="subtitle">
            {labelDeLaboratorio(processo.laboratorio)} · Aberto em {formatarData(processo.dataAbertura)}
          </p>
        </div>
      </div>

      {processo.urgente && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">
            <strong>Atenção — contato humano-animal confirmado.</strong> Ao menos uma amostra deste processo registrou
            contato humano-animal (RN2/DER.md §3.5).
          </div>
        </div>
      )}

      <div className="det-grid">
        <div className="col gap-4">
          <div className="card">
            <div className="card-header">
              <h3>Dados do Processo</h3>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="field">
                  <label>Protocolo</label>
                  <div className="mono" style={{ fontWeight: 600 }}>
                    {processo.protocolo}
                  </div>
                </div>
                <div className="field">
                  <label>CID</label>
                  <div className="mono">{cid ?? '—'}</div>
                </div>
                <div className="field">
                  <label>Nº GAL</label>
                  <div className="mono">{processo.galNumero ?? '—'}</div>
                </div>
                <div className="field">
                  <label>Nº Notificação SINAN</label>
                  <div className="mono">{processo.sinanNumero ?? '—'}</div>
                </div>
                <div className="field">
                  <label>Data de abertura</label>
                  <div className="mono">{formatarData(processo.dataAbertura)}</div>
                </div>
                <div className="field">
                  <label>Criado por</label>
                  <div>{processo.criadoPorNome}</div>
                </div>
                {processo.observacoes && (
                  <div className="field full">
                    <label>Observações</label>
                    <div>{processo.observacoes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Ocorrência Vinculada</h3>
            </div>
            <div className="card-body">
              {processo.ocorrenciaVinculado === null ? (
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Este processo não está vinculado a nenhuma ocorrência.
                </p>
              ) : (
                <div className="form-grid">
                  <div className="field">
                    <label>Protocolo</label>
                    <div>
                      <Link to={`/ocorrencias/${processo.ocorrenciaVinculado.id}`} className="mono" style={{ fontWeight: 600 }}>
                        {processo.ocorrenciaVinculado.protocolo}
                      </Link>
                    </div>
                  </div>
                  <div className="field">
                    <label>Bairro</label>
                    <div>{processo.ocorrenciaVinculado.bairro}</div>
                  </div>
                  <div className="field full">
                    <label>Denunciante</label>
                    <div>
                      {processo.ocorrenciaVinculado.denunciante === null || processo.ocorrenciaVinculado.denunciante.nome === null
                        ? processo.ocorrenciaVinculado.sigilosa
                          ? 'Sigiloso'
                          : '—'
                        : processo.ocorrenciaVinculado.denunciante.nome}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Responsável / Munícipe</h3>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="field">
                  <label>Nome</label>
                  <div>{processo.responsavel.nome}</div>
                </div>
                <div className="field">
                  <label>CPF</label>
                  <div className="mono">{processo.responsavel.cpf ?? '—'}</div>
                </div>
                <div className="field">
                  <label>Telefone</label>
                  <div className="mono">{processo.responsavel.telefone ?? '—'}</div>
                </div>
                <div className="field">
                  <label>E-mail</label>
                  <div>{processo.responsavel.email ?? '—'}</div>
                </div>
                <div className="field full">
                  <label>Endereço</label>
                  <div>
                    {[processo.responsavel.endereco, processo.responsavel.bairroResidencial, processo.responsavel.cep]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {processo.amostras.map((amostra, indice) => (
            <CardAmostra key={indice} amostra={amostra} indice={indice} />
          ))}
        </div>

        <div className="col gap-4">
          <div className="card">
            <div className="card-header">
              <h3>Resultado Laboratorial</h3>
            </div>
            <div className="card-body">
              {processo.resultadoLaboratorial ? (
                <div className="form-grid">
                  <div className="field">
                    <label>Resultado</label>
                    <div>
                      <span className={`badge ${badgeDeResultado(processo.resultadoLaboratorial).classe}`}>
                        {badgeDeResultado(processo.resultadoLaboratorial).label}
                      </span>
                    </div>
                  </div>
                  <div className="field">
                    <label>Data do resultado</label>
                    <div className="mono">{processo.dataResultado ? formatarData(processo.dataResultado) : '—'}</div>
                  </div>
                  <div className="field full">
                    <label>Desfecho do animal</label>
                    <div>{processo.desfechoAnimal ? DESFECHO_LABEL[processo.desfechoAnimal] : '—'}</div>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Aguardando resultado do laboratório.
                  {processo.previsaoRetorno ? ` Previsão de retorno: ${formatarData(processo.previsaoRetorno)}.` : ''}
                </p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>Documentos</h3>
            </div>
            <div className="card-body" style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {processo.documentos.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', padding: '4px 6px' }}>
                  Nenhum documento anexado a este processo.
                </p>
              )}
              {processo.documentos.map((doc) => (
                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, fontSize: 13 }}>
                  <Icon name="clipboard" size={16} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{doc.nome}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {formatarTamanho(doc.tamanho)} · {formatarData(doc.criadoEm)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

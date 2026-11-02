import { Suspense, lazy, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import { FiltroPeriodo } from '@/components/FiltroPeriodo'
import { Icon } from '@/components/layout/Icon'
import { Skeleton } from '@/components/layout/Skeleton'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { classeDoFiltro, useFiltrosLista, useManterPaginaNoIntervalo, useValorComAtraso } from '@/lib/useFiltrosLista'
import type { OcorrenciaResumo, StatusOcorrencia, TipoOcorrencia } from '../types/ocorrencias.types'
import { badgeDeStatus, iconeDeTipo } from '../utils/statusBadge'
import { formatarData } from '../utils/datas'
import { formatarProtocoloOcorrencia, formatarProtocoloProcesso } from '../utils/protocolo'
import { useCatalogosOcorrenciaQuery, useOcorrenciasQuery } from '../hooks/useOcorrencias'

const GraficoOcorrenciasPorBairro = lazy(() =>
  import('./GraficoOcorrenciasPorBairro').then((m) => ({ default: m.GraficoOcorrenciasPorBairro })),
)

const TAMANHO_PAGINA = 20
const LINHAS_SKELETON = [0, 1, 2, 3, 4]
const COLUNAS_TABELA = ['protocolo', 'data', 'tipo', 'bairro', 'denunciante', 'status', 'processo', 'acoes']

const STATUS_OCORRENCIA: StatusOcorrencia[] = ['ABERTA', 'EM_ATENDIMENTO', 'ENCERRADA']
const FILTROS_PADRAO = { busca: '', tipo: '', status: '', de: '', ate: '' }

const STATUS_PENDENTES = 'PENDENTES'
const STATUS_NAO_ENCERRADOS: StatusOcorrencia[] = ['ABERTA', 'EM_ATENDIMENTO']

function ColunaDenunciante({ ocorrencia }: { ocorrencia: OcorrenciaResumo }) {
  const textoMudo = { fontStyle: 'italic', color: 'var(--color-text-muted)' } as const
  if (ocorrencia.anonima) return <span style={textoMudo}>Anônima</span>
  if (ocorrencia.sigilosa) return <span style={textoMudo}>Sigiloso</span>
  return <>{ocorrencia.denuncianteNome ?? '—'}</>
}

export function Ocorrencias() {
  const { roleKey } = useAuth()
  const podeEscrever = roleKey === 'admin' || roleKey === 'agente'

  const { filtros, pagina, definirFiltros, irParaPagina, limparFiltros, filtrosAtivos } = useFiltrosLista('ocorrencias', FILTROS_PADRAO)
  const buscaDebounced = useValorComAtraso(filtros.busca).trim()
  const { tipo: tipoFiltro, status: statusFiltro, de: deFiltro, ate: ateFiltro } = filtros
  const deDebounced = useValorComAtraso(deFiltro)
  const ateDebounced = useValorComAtraso(ateFiltro)
  const [graficoAberto, setGraficoAberto] = useState(false)

  const { data: catalogos } = useCatalogosOcorrenciaQuery()
  const { data, isLoading, isError, refetch } = useOcorrenciasQuery({
    tipo: (tipoFiltro || undefined) as TipoOcorrencia | undefined,
    status: statusFiltro === STATUS_PENDENTES ? STATUS_NAO_ENCERRADOS : ((statusFiltro || undefined) as StatusOcorrencia | undefined),
    q: buscaDebounced || undefined,
    de: deDebounced || undefined,
    ate: ateDebounced || undefined,
    pagina,
    tamanho: TAMANHO_PAGINA,
  })

  useManterPaginaNoIntervalo(pagina, data?.totalPaginas, irParaPagina)

  const totalPaginas = Math.max(data?.totalPaginas ?? 1, 1)
  const primeiroItem = data && data.totalItens > 0 ? pagina * TAMANHO_PAGINA + 1 : 0
  const ultimoItem = data ? Math.min((pagina + 1) * TAMANHO_PAGINA, data.totalItens) : 0

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>
            Ocorrências {data && <span className="counter">{data.totalItens} registros</span>}
          </h1>
          <p className="subtitle">Denúncias e demandas recebidas de munícipes</p>
        </div>
        {podeEscrever && (
          <div className="actions">
            <Link to="/ocorrencias/novo" className="btn btn-primary">
              <Icon name="plus" size={14} />
              Registrar Ocorrência
            </Link>
          </div>
        )}
      </div>

      <div className="filter-bar">
        <div className="search-input">
          <Icon name="search" size={14} />
          <input
            type="text"
            placeholder="Buscar protocolo, denunciante, bairro, endereço ou processo..."
            aria-label="Buscar ocorrências"
            value={filtros.busca}
            onChange={(event) => definirFiltros({ busca: event.target.value })}
          />
        </div>
        <select
          className={classeDoFiltro(statusFiltro)}
          aria-label="Filtrar por status"
          value={statusFiltro}
          onChange={(event) => definirFiltros({ status: event.target.value })}
        >
          <option value="">Status: Todos</option>
          <option value={STATUS_PENDENTES}>Pendentes</option>
          {STATUS_OCORRENCIA.map((status) => (
            <option key={status} value={status}>
              {badgeDeStatus(status).label}
            </option>
          ))}
        </select>
        <select
          className={classeDoFiltro(tipoFiltro)}
          aria-label="Filtrar por tipo"
          value={tipoFiltro}
          onChange={(event) => definirFiltros({ tipo: event.target.value })}
        >
          <option value="">Tipo: Todos</option>
          {catalogos?.tiposOcorrencia.map((tipo) => (
            <option key={tipo.codigo} value={tipo.codigo}>
              {tipo.nome}
            </option>
          ))}
        </select>
        <FiltroPeriodo rotulo="Abertura" de={deFiltro} ate={ateFiltro} onAlterar={definirFiltros} />
        {filtrosAtivos && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={limparFiltros}>
            Limpar filtros
          </button>
        )}
      </div>

      {isError && <ErroComRetry mensagem="Não foi possível carregar as ocorrências." onTentarNovamente={() => void refetch()} />}

      {isLoading && (
        <div className="table-wrap">
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Bairro</th>
                  <th>Denunciante</th>
                  <th>Status</th>
                  <th>Processo Vinc.</th>
                  <th style={{ width: 80 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {LINHAS_SKELETON.map((linha) => (
                  <tr key={linha}>
                    {COLUNAS_TABELA.map((coluna) => (
                      <td key={coluna}>
                        <span className="skel" style={{ display: 'inline-block', width: '80%', height: 14 }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && !isError && data && data.totalItens === 0 && (
        <div className="empty">
          <span className="ico">
            <Icon name="alert" size={28} />
          </span>
          <h3>Nenhuma ocorrência encontrada</h3>
          <p>{filtrosAtivos ? 'Nenhum resultado com estes filtros.' : 'Ainda não há ocorrências registradas.'}</p>
          {filtrosAtivos && (
            <button type="button" className="btn btn-outline btn-sm" onClick={limparFiltros}>
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {!isLoading && !isError && data && data.itens.length > 0 && (
        <div className="table-wrap">
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Bairro</th>
                  <th>Denunciante</th>
                  <th>Status</th>
                  <th>Processo Vinc.</th>
                  <th style={{ width: 80 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.itens.map((ocorrencia) => {
                  const statusBadge = badgeDeStatus(ocorrencia.statusOcorrencia)
                  return (
                    <tr key={ocorrencia.id}>
                      <td>
                        <span className="mono" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {formatarProtocoloOcorrencia(ocorrencia.protocolo)}
                        </span>
                        {ocorrencia.urgente && (
                          <span className="badge badge-urgent" style={{ marginLeft: 6, gap: 4 }}>
                            <Icon name="alert" size={10} /> Urgente
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: 12 }}>
                          {formatarData(ocorrencia.dataAbertura)}
                        </span>
                      </td>
                      <td>
                        <span className="occur-type" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          <Icon name={iconeDeTipo(ocorrencia.tipoOcorrencia)} size={14} />
                          {ocorrencia.tipoOcorrenciaNome}
                        </span>
                      </td>
                      <td>{ocorrencia.bairro}</td>
                      <td>
                        <ColunaDenunciante ocorrencia={ocorrencia} />
                      </td>
                      <td>
                        <span className={`badge ${statusBadge.classe}`}>{statusBadge.label}</span>
                      </td>
                      <td>
                                                {ocorrencia.processoProtocolo ? (
                          <span className="mono" style={{ fontWeight: 600 }}>
                            {formatarProtocoloProcesso(ocorrencia.processoProtocolo)}
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/ocorrencias/${ocorrencia.id}`}
                          className="btn btn-ghost btn-sm btn-icon-only"
                          title="Ver"
                          aria-label={`Ver ocorrência ${formatarProtocoloOcorrencia(ocorrencia.protocolo)}`}
                        >
                          <Icon name="eye" size={14} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span>
              Mostrando{' '}
              <strong>
                {primeiroItem}–{ultimoItem}
              </strong>{' '}
              de <strong>{data.totalItens}</strong> ocorrências
            </span>
            <div className="pager">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={pagina === 0}
                onClick={() => irParaPagina(pagina - 1)}
              >
                Anterior
              </button>
              <span className="mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                Página {pagina + 1} de {totalPaginas}
              </span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={pagina >= totalPaginas - 1}
                onClick={() => irParaPagina(pagina + 1)}
              >
                Próximo
              </button>
            </div>
          </div>
        </div>
      )}

      <details className="secao-recolhivel" onToggle={(event) => setGraficoAberto(event.currentTarget.open)}>
        <summary>Distribuição por bairro</summary>
        {graficoAberto && (
          <Suspense fallback={<Skeleton width="100%" height={220} />}>
            <GraficoOcorrenciasPorBairro />
          </Suspense>
        )}
      </details>
    </>
  )
}

import { Suspense, lazy, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/layout/Icon'
import { Skeleton } from '@/components/layout/Skeleton'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { OcorrenciaResumo, StatusOcorrencia, TipoOcorrencia } from '../types/ocorrencias.types'
import { badgeDeStatus, iconeDeTipo, labelDeTipo } from '../utils/statusBadge'
import { formatarData } from '../utils/datas'
import { formatarProtocoloOcorrencia, formatarProtocoloProcesso } from '../utils/protocolo'
import { useOcorrenciasQuery } from '../hooks/useOcorrencias'

// Lazy: isola o chunk do Recharts do carregamento inicial da tela de
// Ocorrências — máquinas do CCZ têm ~2GB RAM (ver CLAUDE.md).
const GraficoOcorrenciasPorBairro = lazy(() =>
  import('./GraficoOcorrenciasPorBairro').then((m) => ({ default: m.GraficoOcorrenciasPorBairro })),
)

const TAMANHO_PAGINA = 20
const LINHAS_SKELETON = [0, 1, 2, 3, 4]
const COLUNAS_TABELA = ['protocolo', 'data', 'tipo', 'bairro', 'denunciante', 'status', 'processo', 'acoes']

const TIPOS_OCORRENCIA: TipoOcorrencia[] = ['zoonose', 'morcegos', 'irregular', 'agressivo', 'outros']
const STATUS_OCORRENCIA: StatusOcorrencia[] = ['ABERTA', 'EM_ATENDIMENTO', 'ENCERRADA']

// A anônima não tem denunciante para ninguém (D32). Na sigilosa, a listagem
// não traz o nome para nenhum perfil (T26, revisão da D14) — mesmo quem tem
// permissão só o vê no detalhe, onde o acesso é auditado.
function ColunaDenunciante({ ocorrencia }: { ocorrencia: OcorrenciaResumo }) {
  const textoMudo = { fontStyle: 'italic', color: 'var(--color-text-muted)' } as const
  if (ocorrencia.anonima) return <span style={textoMudo}>Anônima</span>
  if (ocorrencia.sigilosa) return <span style={textoMudo}>Sigiloso</span>
  return <>{ocorrencia.denuncianteNome ?? '—'}</>
}

export function Ocorrencias() {
  const { roleKey } = useAuth()
  const podeEscrever = roleKey === 'admin' || roleKey === 'agente'

  const [busca, setBusca] = useState('')
  const [buscaDebounced, setBuscaDebounced] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [pagina, setPagina] = useState(0)
  const [filtroAnterior, setFiltroAnterior] = useState({ busca: '', tipo: '', status: '' })

  useEffect(() => {
    const timeout = setTimeout(() => setBuscaDebounced(busca.trim()), 300)
    return () => clearTimeout(timeout)
  }, [busca])

  // Reset da página ao mudar de filtro, ajustado durante a renderização (em
  // vez de um efeito) — mesmo padrão de Animais.tsx.
  const filtroMudou =
    filtroAnterior.busca !== buscaDebounced || filtroAnterior.tipo !== tipoFiltro || filtroAnterior.status !== statusFiltro
  if (filtroMudou) {
    setFiltroAnterior({ busca: buscaDebounced, tipo: tipoFiltro, status: statusFiltro })
    setPagina(0)
  }

  const { data, isLoading, isError } = useOcorrenciasQuery({
    tipo: (tipoFiltro || undefined) as TipoOcorrencia | undefined,
    status: (statusFiltro || undefined) as StatusOcorrencia | undefined,
    q: buscaDebounced || undefined,
    pagina,
    tamanho: TAMANHO_PAGINA,
  })

  const totalPaginas = Math.max(data?.totalPaginas ?? 1, 1)
  const primeiroItem = data && data.totalItens > 0 ? pagina * TAMANHO_PAGINA + 1 : 0
  const ultimoItem = data ? Math.min((pagina + 1) * TAMANHO_PAGINA, data.totalItens) : 0

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>
            Ocorrências <span className="counter">{data?.totalItens ?? 0} registros</span>
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

      <Suspense fallback={<Skeleton width="100%" height={220} />}>
        <GraficoOcorrenciasPorBairro />
      </Suspense>

      <div className="filter-bar">
        <div className="search-input">
          <Icon name="search" size={14} />
          <input
            type="text"
            placeholder="Buscar protocolo, denunciante ou bairro..."
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </div>
        <select
          className="filter-select"
          aria-label="Filtrar por tipo"
          value={tipoFiltro}
          onChange={(event) => setTipoFiltro(event.target.value)}
        >
          <option value="">Tipo: Todos</option>
          {TIPOS_OCORRENCIA.map((tipo) => (
            <option key={tipo} value={tipo}>
              {labelDeTipo(tipo)}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          aria-label="Filtrar por status"
          value={statusFiltro}
          onChange={(event) => setStatusFiltro(event.target.value)}
        >
          <option value="">Status: Todos</option>
          {STATUS_OCORRENCIA.map((status) => (
            <option key={status} value={status}>
              {badgeDeStatus(status).label}
            </option>
          ))}
        </select>
      </div>

      {isError && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar as ocorrências. Tente novamente.</div>
        </div>
      )}

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

      {!isLoading && !isError && data && data.itens.length === 0 && (
        <div className="empty">
          <span className="ico">
            <Icon name="alert" size={28} />
          </span>
          <h3>Nenhuma ocorrência encontrada</h3>
          <p>Ajuste os filtros de busca.</p>
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
                          <span className="badge badge-urgent" style={{ marginLeft: 6 }} title="Urgente" aria-label="Urgente">
                            🚨
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
                        {/* Sem link: a tela de processos ainda é de demonstração (D40). */}
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
                onClick={() => setPagina((paginaAtual) => paginaAtual - 1)}
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
                onClick={() => setPagina((paginaAtual) => paginaAtual + 1)}
              >
                Próximo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

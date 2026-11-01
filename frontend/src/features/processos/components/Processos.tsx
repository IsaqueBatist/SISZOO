import { Link } from 'react-router-dom'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import { Icon } from '@/components/layout/Icon'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useFiltrosLista, useValorComAtraso } from '@/lib/useFiltrosLista'
import { formatarData } from '@/features/ocorrencias/utils/datas'
import { formatarProtocoloOcorrencia, formatarProtocoloProcesso } from '@/features/ocorrencias/utils/protocolo'
import { STATUS_PROCESSO_OPCOES } from '../utils/processosCatalogos'
import type { StatusProcesso } from '../types/processos.types'
import { badgeDeStatusProcesso, classeDeDoenca } from '../utils/statusBadge'
import { useCatalogosProcessoQuery, useProcessosQuery } from '../hooks/useProcessos'

const TAMANHO_PAGINA = 20
const LINHAS_SKELETON = [0, 1, 2, 3, 4]
const COLUNAS_TABELA = ['protocolo', 'doenca', 'status', 'data', 'ocorrencia', 'acoes']
const FILTROS_PADRAO = { busca: '', doenca: '', status: '', urgencia: '' }

function Cabecalho() {
  return (
    <thead>
      <tr>
        <th>Protocolo</th>
        <th>Doença</th>
        <th>Status</th>
        <th>Data de abertura</th>
        <th>Ocorrência vinculada</th>
        <th style={{ width: 80 }}>Ações</th>
      </tr>
    </thead>
  )
}

export function Processos() {
  const { roleKey } = useAuth()
  // PROCESSOS_SANITARIOS:escrita (V3): os três cargos.
  const podeEscrever = roleKey === 'admin' || roleKey === 'vet' || roleKey === 'agente'

  const { filtros, pagina, definirFiltros, irParaPagina, limparFiltros, filtrosAtivos } = useFiltrosLista('processos', FILTROS_PADRAO)
  const { doenca: doencaFiltro, status: statusFiltro, urgencia: urgenciaFiltro } = filtros
  const buscaDebounced = useValorComAtraso(filtros.busca).trim()

  const { data: catalogos } = useCatalogosProcessoQuery()
  const { data, isLoading, isError, refetch } = useProcessosQuery({
    doenca: doencaFiltro || undefined,
    status: (statusFiltro || undefined) as StatusProcesso | undefined,
    urgente: urgenciaFiltro === 'urgentes' ? true : undefined,
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
            Processos Sanitários {data && <span className="counter">{data.totalItens} registros</span>}
          </h1>
          <p className="subtitle">Investigações laboratoriais de zoonoses</p>
        </div>
        {podeEscrever && (
          <div className="actions">
            <Link to="/processos/novo" className="btn btn-primary">
              <Icon name="plus" size={14} />
              Novo Processo
            </Link>
          </div>
        )}
      </div>

      <div className="filter-bar">
        <div className="search-input">
          <Icon name="search" size={14} />
          <input
            type="text"
            placeholder="Buscar protocolo, responsável, Nº GAL ou Nº SINAN..."
            aria-label="Buscar processos"
            value={filtros.busca}
            onChange={(event) => definirFiltros({ busca: event.target.value })}
          />
        </div>
        <select
          className="filter-select"
          aria-label="Filtrar por doença"
          value={doencaFiltro}
          onChange={(event) => definirFiltros({ doenca: event.target.value })}
        >
          <option value="">Doença: Todas</option>
          {catalogos?.doencas.map((opcao) => (
            <option key={opcao.codigo} value={opcao.codigo}>
              {opcao.nome}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          aria-label="Filtrar por status"
          value={statusFiltro}
          onChange={(event) => definirFiltros({ status: event.target.value })}
        >
          <option value="">Status: Todos</option>
          {STATUS_PROCESSO_OPCOES.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.label}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          aria-label="Filtrar por urgência"
          value={urgenciaFiltro}
          onChange={(event) => definirFiltros({ urgencia: event.target.value })}
        >
          <option value="">Urgência: Todos</option>
          <option value="urgentes">Só urgentes</option>
        </select>
        {filtrosAtivos && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={limparFiltros}>
            Limpar filtros
          </button>
        )}
      </div>

      {isError && <ErroComRetry mensagem="Não foi possível carregar os processos sanitários." onTentarNovamente={() => void refetch()} />}

      {isLoading && (
        <div className="table-wrap">
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <Cabecalho />
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
            <Icon name="clipboard" size={28} />
          </span>
          <h3>Nenhum processo sanitário encontrado</h3>
          <p>{filtrosAtivos ? 'Ajuste os filtros de busca.' : 'Nenhum processo foi aberto ainda.'}</p>
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
              <Cabecalho />
              <tbody>
                {data.itens.map((processo) => {
                  const statusBadge = badgeDeStatusProcesso(processo.statusProcesso)
                  const protocolo = formatarProtocoloProcesso(processo.protocolo)
                  return (
                    <tr key={processo.id} className={processo.urgente ? 'urgent' : undefined}>
                      <td>
                        <span className="mono" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {protocolo}
                        </span>
                        {processo.urgente && (
                          <span className="badge badge-urgent" style={{ marginLeft: 6, gap: 4 }}>
                            <Icon name="alert" size={10} /> Urgente
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-disease ${classeDeDoenca(processo.doenca.codigo)}`}>{processo.doenca.nome}</span>
                      </td>
                      <td>
                        <span className={`badge ${statusBadge.classe}`}>{statusBadge.label}</span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: 12 }}>
                          {formatarData(processo.dataAbertura)}
                        </span>
                      </td>
                      <td>
                        {processo.ocorrenciaProtocolo ? (
                          <span className="mono" style={{ fontWeight: 600 }}>
                            {formatarProtocoloOcorrencia(processo.ocorrenciaProtocolo)}
                          </span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/processos/${processo.id}`}
                          className="btn btn-ghost btn-sm btn-icon-only"
                          title="Ver"
                          aria-label={`Ver processo ${protocolo}`}
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
              de <strong>{data.totalItens}</strong> processos
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
    </>
  )
}

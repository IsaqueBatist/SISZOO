import { Link } from 'react-router-dom'
import { FiltroPeriodo } from '@/components/FiltroPeriodo'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import { Icon } from '@/components/layout/Icon'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useLinhaClicavel } from '@/lib/useLinhaClicavel'
import {
  classeDoFiltro,
  useFiltroDeLink,
  useFiltrosLista,
  useManterPaginaNoIntervalo,
  useValorComAtraso,
} from '@/lib/useFiltrosLista'
import { formatarData } from '@/features/ocorrencias/utils/datas'
import { formatarProtocoloOcorrencia, formatarProtocoloProcesso } from '@/features/ocorrencias/utils/protocolo'
import { STATUS_PROCESSO_OPCOES } from '../utils/processosCatalogos'
import type { StatusProcesso } from '../types/processos.types'
import { badgeDeStatusProcesso, classeDeDoenca } from '../utils/statusBadge'
import { useCatalogosProcessoQuery, useProcessosQuery } from '../hooks/useProcessos'

const TAMANHO_PAGINA = 20
const LINHAS_SKELETON = [0, 1, 2, 3, 4]
const COLUNAS_TABELA = ['protocolo', 'doenca', 'status', 'data', 'ocorrencia', 'acoes']
const FILTROS_PADRAO = { busca: '', doenca: '', status: '', urgencia: '', de: '', ate: '' }

const STATUS_EM_ANDAMENTO = 'EM_ANDAMENTO'
const STATUS_NAO_CONCLUIDOS: StatusProcesso[] = ['ABERTO', 'AGUARDANDO_RESULTADO', 'COM_RESULTADO']

function Cabecalho() {
  return (
    <thead>
      <tr>
        <th>Protocolo</th>
        <th>Doença</th>
        <th>Status</th>
        <th>Data de abertura</th>
        <th>Ocorrência vinculada</th>
        <th className="col-acoes">
          <span className="visually-hidden">Ações</span>
        </th>
      </tr>
    </thead>
  )
}

export function Processos() {
  const { roleKey } = useAuth()
  const podeEscrever = roleKey === 'admin' || roleKey === 'vet' || roleKey === 'agente'

  const urgentesDoLink = useFiltroDeLink('urgente')
  const statusDoLink = useFiltroDeLink('status')
  const filtrosDoLink = {
    ...(urgentesDoLink ? { urgencia: 'urgentes' } : {}),
    ...(statusDoLink ? { status: statusDoLink } : {}),
  }
  const { filtros, pagina, definirFiltros, irParaPagina, limparFiltros, filtrosAtivos } = useFiltrosLista(
    'processos',
    FILTROS_PADRAO,
    Object.keys(filtrosDoLink).length > 0 ? filtrosDoLink : undefined,
  )
  const propsDaLinha = useLinhaClicavel()
  const { doenca: doencaFiltro, status: statusFiltro, urgencia: urgenciaFiltro, de: deFiltro, ate: ateFiltro } = filtros
  const buscaDebounced = useValorComAtraso(filtros.busca).trim()
  const deDebounced = useValorComAtraso(deFiltro)
  const ateDebounced = useValorComAtraso(ateFiltro)
  const soUrgentes = urgenciaFiltro === 'urgentes'

  const { data: catalogos } = useCatalogosProcessoQuery()
  const { data, isLoading, isError, refetch } = useProcessosQuery({
    doenca: doencaFiltro || undefined,
    status: statusFiltro === STATUS_EM_ANDAMENTO ? STATUS_NAO_CONCLUIDOS : ((statusFiltro || undefined) as StatusProcesso | undefined),
    urgente: soUrgentes ? true : undefined,
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
            Processos Sanitários {data && <span className="counter">{data.totalItens} registros</span>}
          </h1>
          <p className="subtitle">Investigações laboratoriais de zoonoses</p>
        </div>
        {podeEscrever && (
          <div className="actions">
            <Link to="/processos/novo" className="btn btn-primary">
              <Icon name="plus" size={14} />
              Novo processo
            </Link>
          </div>
        )}
      </div>

      <div className="filter-bar">
        <div className="search-input">
          <Icon name="search" size={14} />
          <input
            type="text"
            placeholder="Buscar protocolo, ocorrência, animal, responsável, Nº GAL ou Nº SINAN..."
            aria-label="Buscar processos"
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
          <option value={STATUS_EM_ANDAMENTO}>Em andamento</option>
          {STATUS_PROCESSO_OPCOES.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.label}
            </option>
          ))}
        </select>
        <select
          className={classeDoFiltro(doencaFiltro)}
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
        <button
          type="button"
          className={`btn btn-sm ${soUrgentes ? 'btn-primary' : 'btn-outline'}`}
          aria-pressed={soUrgentes}
          onClick={() => definirFiltros({ urgencia: soUrgentes ? '' : 'urgentes' })}
        >
          Só urgentes
        </button>
        <FiltroPeriodo rotulo="Abertura" de={deFiltro} ate={ateFiltro} onAlterar={definirFiltros} />
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

      {!isLoading && !isError && data && data.totalItens === 0 && (
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
                    <tr
                      key={processo.id}
                      {...propsDaLinha(`/processos/${processo.id}`)}
                      className={`linha-clicavel${processo.urgente ? ' urgent' : ''}`}
                    >
                      <td>
                        <div className="celula-protocolo">
                          <Link to={`/processos/${processo.id}`} className="protocolo">
                            {protocolo}
                          </Link>
                          {processo.urgente && (
                            <span className="badge badge-urgent">
                              <Icon name="alert" size={12} /> Urgente
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-disease ${classeDeDoenca(processo.doenca.codigo)}`}>{processo.doenca.nome}</span>
                      </td>
                      <td>
                        <span className={`badge ${statusBadge.classe}`}>{statusBadge.label}</span>
                      </td>
                      <td>{formatarData(processo.dataAbertura)}</td>
                      <td>
                        {processo.ocorrenciaProtocolo ? (
                          <span className="protocolo">{formatarProtocoloOcorrencia(processo.ocorrenciaProtocolo)}</span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td className="col-acoes">
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
                className="btn btn-outline btn-sm"
                disabled={pagina === 0}
                onClick={() => irParaPagina(pagina - 1)}
              >
                Anterior
              </button>
              <span className="pager-posicao">
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

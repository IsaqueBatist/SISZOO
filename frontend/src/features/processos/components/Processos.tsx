import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '@/components/layout/Icon'
import { useAuth } from '@/features/auth/hooks/AuthContext'
import { DOENCA_OPCOES, labelDeDoenca } from '../utils/processosCatalogos'
import type { Doenca, StatusProcesso } from '../types/processos.types'
import { badgeDeStatusProcesso, classeDeDoenca } from '../utils/statusBadge'
import { useProcessosQuery } from '../hooks/useProcessos'

const TAMANHO_PAGINA = 20
const FUSO_ITU = 'America/Sao_Paulo'
const LINHAS_SKELETON = [0, 1, 2, 3, 4]
const COLUNAS_TABELA = ['protocolo', 'doenca', 'status', 'data', 'ocorrencia', 'acoes']

const STATUS_PROCESSO_OPCOES: StatusProcesso[] = ['aberto', 'aguardando_resultado', 'com_resultado', 'concluido']

function formatarData(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: FUSO_ITU }).format(
    new Date(iso),
  )
}

export function Processos() {
  const { roleKey } = useAuth()
  const podeEscrever = roleKey === 'admin' || roleKey === 'vet' || roleKey === 'agente'

  const [doencaFiltro, setDoencaFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [pagina, setPagina] = useState(0)
  const [filtroAnterior, setFiltroAnterior] = useState({ doenca: '', status: '' })

  // Reset da página ao mudar de filtro, ajustado durante a renderização (em
  // vez de um efeito) — mesmo padrão de Animais.tsx/Ocorrencias.tsx.
  const filtroMudou = filtroAnterior.doenca !== doencaFiltro || filtroAnterior.status !== statusFiltro
  if (filtroMudou) {
    setFiltroAnterior({ doenca: doencaFiltro, status: statusFiltro })
    setPagina(0)
  }

  const { data, isLoading, isError } = useProcessosQuery({
    doenca: (doencaFiltro || undefined) as Doenca | undefined,
    statusProcesso: (statusFiltro || undefined) as StatusProcesso | undefined,
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
            Processos Sanitários <span className="counter">{data?.totalItens ?? 0} registros</span>
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
        <select
          className="filter-select"
          aria-label="Filtrar por doença"
          value={doencaFiltro}
          onChange={(event) => setDoencaFiltro(event.target.value)}
        >
          <option value="">Doença: Todas</option>
          {DOENCA_OPCOES.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.label}
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
          {STATUS_PROCESSO_OPCOES.map((status) => (
            <option key={status} value={status}>
              {badgeDeStatusProcesso(status).label}
            </option>
          ))}
        </select>
      </div>

      {isError && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar os processos sanitários. Tente novamente.</div>
        </div>
      )}

      {isLoading && (
        <div className="table-wrap">
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
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
          <p>{doencaFiltro || statusFiltro ? 'Ajuste os filtros de busca.' : 'Nenhum processo foi aberto ainda.'}</p>
        </div>
      )}

      {!isLoading && !isError && data && data.itens.length > 0 && (
        <div className="table-wrap">
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
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
              <tbody>
                {data.itens.map((processo) => {
                  const statusBadge = badgeDeStatusProcesso(processo.statusProcesso)
                  return (
                    <tr key={processo.id} className={processo.urgente ? 'urgent' : undefined}>
                      <td>
                        <span className="mono" style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {processo.protocolo}
                        </span>
                        {processo.urgente && (
                          <span className="badge badge-urgent" style={{ marginLeft: 6, gap: 4 }}>
                            <Icon name="alert" size={10} /> Urgente
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-disease ${classeDeDoenca(processo.doenca)}`}>
                          {labelDeDoenca(processo.doenca)}
                        </span>
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
                        {processo.ocorrenciaVinculado ? (
                          <Link to={`/ocorrencias/${processo.ocorrenciaVinculado.id}`} className="mono" style={{ fontWeight: 600 }}>
                            {processo.ocorrenciaVinculado.protocolo}
                          </Link>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/processos/${processo.id}`}
                          className="btn btn-ghost btn-sm btn-icon-only"
                          title="Ver"
                          aria-label={`Ver processo ${processo.protocolo}`}
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

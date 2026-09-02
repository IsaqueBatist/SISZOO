import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/layout/Icon'
import { useAuth } from '../auth/AuthContext'
import {
  useAlterarStatusBaiaMutation,
  useBaiasQuery,
  useCatalogosAnimaisQuery,
  useExcluirBaiaMutation,
} from '../animais/useAnimais'
import type { Baia } from '../animais/animais.types'
import { BaiaFormModal } from './BaiaFormModal'
import { calcularPercentual, estadoLotacao, type EstadoLotacao } from './estadoLotacao'
import './GestaoBaias.css'

type FiltroLotacao = '' | EstadoLotacao
type FiltroStatus = 'ativas' | 'inativas' | 'todas'

const LABEL_LOTACAO: Record<EstadoLotacao, string> = {
  disponivel: 'Disponível',
  atencao: 'Próx. limite',
  superlotada: 'Superlotada',
}

function classeCard(baia: Baia, estado: EstadoLotacao): string {
  if (!baia.ativa) return 'baia-card inativa'
  if (estado === 'superlotada') return 'baia-card danger'
  if (estado === 'atencao') return 'baia-card warn'
  return 'baia-card'
}

function classeBarra(estado: EstadoLotacao): string {
  if (estado === 'superlotada') return 'occ-bar danger'
  if (estado === 'atencao') return 'occ-bar warn'
  return 'occ-bar'
}

function rotuloStatus(baia: Baia, estado: EstadoLotacao): string | null {
  if (!baia.ativa) return 'Inativa'
  if (estado === 'disponivel') return null
  return LABEL_LOTACAO[estado]
}

export function GestaoBaias() {
  const { roleKey } = useAuth()
  const podeEscrever = roleKey === 'admin' || roleKey === 'vet'
  const podeExcluir = roleKey === 'admin'

  const { data: baias, isLoading, isError } = useBaiasQuery()
  const { data: catalogos } = useCatalogosAnimaisQuery()
  const excluirMutation = useExcluirBaiaMutation()
  const alterarStatusMutation = useAlterarStatusBaiaMutation()

  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [lotacaoFiltro, setLotacaoFiltro] = useState<FiltroLotacao>('')
  const [statusFiltro, setStatusFiltro] = useState<FiltroStatus>('ativas')
  const [baiaEmEdicao, setBaiaEmEdicao] = useState<Baia | 'nova' | null>(null)

  const totais = useMemo(() => {
    const ativas = (baias ?? []).filter((baia) => baia.ativa)
    const totalAnimais = ativas.reduce((soma, baia) => soma + baia.ocupacaoAtual, 0)
    const capacidadeTotal = ativas.reduce((soma, baia) => soma + baia.capacidade, 0)
    const superlotadas = ativas.filter((baia) => estadoLotacao(baia.ocupacaoAtual, baia.capacidade) === 'superlotada')
    return {
      numBaias: ativas.length,
      totalAnimais,
      capacidadeTotal,
      taxaGeral: calcularPercentual(totalAnimais, capacidadeTotal),
      numSuperlotadas: superlotadas.length,
    }
  }, [baias])

  const baiasFiltradas = useMemo(() => {
    const buscaNormalizada = busca.trim().toLowerCase()
    return (baias ?? []).filter((baia) => {
      const combinaStatus =
        statusFiltro === 'todas' || (statusFiltro === 'ativas' ? baia.ativa : !baia.ativa)
      const combinaTipo = !tipoFiltro || baia.tipoBaiaCodigo === tipoFiltro
      const combinaLotacao = !lotacaoFiltro || estadoLotacao(baia.ocupacaoAtual, baia.capacidade) === lotacaoFiltro
      const combinaBusca = !buscaNormalizada || baia.nome.toLowerCase().includes(buscaNormalizada)
      return combinaStatus && combinaTipo && combinaLotacao && combinaBusca
    })
  }, [baias, busca, tipoFiltro, lotacaoFiltro, statusFiltro])

  const secoes = useMemo(() => {
    const grupos = new Map<string, Baia[]>()
    for (const baia of baiasFiltradas) {
      const lista = grupos.get(baia.tipoBaiaCodigo) ?? []
      lista.push(baia)
      grupos.set(baia.tipoBaiaCodigo, lista)
    }
    const ordemCatalogo = catalogos?.tiposBaia.map((tipo) => tipo.codigo) ?? []
    const codigosOrdenados = [
      ...ordemCatalogo.filter((codigo) => grupos.has(codigo)),
      ...[...grupos.keys()].filter((codigo) => !ordemCatalogo.includes(codigo)),
    ]
    return codigosOrdenados.map((codigo) => {
      const baiasDoTipo = grupos.get(codigo) as Baia[]
      return { codigo, nome: baiasDoTipo[0].tipoBaiaNome, baias: baiasDoTipo }
    })
  }, [baiasFiltradas, catalogos])

  function handleExcluir(baia: Baia) {
    // A confirmação é a única proteção contra excluir uma baia ocupada: o
    // backend faz soft-delete sem bloquear, mesmo com animais alocados.
    const aviso =
      baia.ocupacaoAtual > 0
        ? ` Esta baia tem ${baia.ocupacaoAtual} animal(is) alocado(s). Os registros desses animais continuarão referenciando esta baia mesmo após a exclusão.`
        : ''
    const confirmado = window.confirm(`Tem certeza que deseja excluir a baia ${baia.nome}?${aviso}`)
    if (!confirmado) return
    excluirMutation.mutate(baia.id)
  }

  function handleReativar(baia: Baia) {
    const confirmado = window.confirm(`Tem certeza que deseja reativar a baia ${baia.nome}?`)
    if (!confirmado) return
    alterarStatusMutation.mutate({ id: baia.id, ativa: true })
  }

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>
            Gestão de Baias{' '}
            <span className="counter">
              {totais.numBaias} baias · {totais.totalAnimais} animais
            </span>
          </h1>
          <p className="subtitle">
            Capacidade total: {totais.capacidadeTotal} vagas · Taxa de ocupação geral: {totais.taxaGeral}% ·{' '}
            {totais.numSuperlotadas} baia(s) superlotada(s)
          </p>
        </div>
        {podeEscrever && (
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={() => setBaiaEmEdicao('nova')}>
              <Icon name="plus" size={14} />
              Adicionar Baia
            </button>
          </div>
        )}
      </div>

      <div className="legend-strip" style={{ marginBottom: 'var(--space-3)' }}>
        <span className="l-dot">
          <span className="d" style={{ background: 'var(--color-success)' }} />
          Disponível (até 80%)
        </span>
        <span className="l-dot">
          <span className="d" style={{ background: 'var(--color-alert)' }} />
          Atenção (80–99%)
        </span>
        <span className="l-dot">
          <span className="d" style={{ background: 'var(--color-danger)' }} />
          Superlotada (100%+)
        </span>
      </div>

      <div className="filter-bar" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="search-input">
          <Icon name="search" size={14} />
          <input
            type="text"
            placeholder="Buscar por nome da baia..."
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
          {catalogos?.tiposBaia.map((tipo) => (
            <option key={tipo.codigo} value={tipo.codigo}>
              {tipo.nome}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          aria-label="Filtrar por lotação"
          value={lotacaoFiltro}
          onChange={(event) => setLotacaoFiltro(event.target.value as FiltroLotacao)}
        >
          <option value="">Lotação: Todas</option>
          <option value="disponivel">Disponível</option>
          <option value="atencao">Atenção</option>
          <option value="superlotada">Superlotada</option>
        </select>
        <select
          className="filter-select"
          aria-label="Filtrar por status"
          value={statusFiltro}
          onChange={(event) => setStatusFiltro(event.target.value as FiltroStatus)}
        >
          <option value="ativas">Status: Ativas</option>
          <option value="inativas">Inativas</option>
          <option value="todas">Todas</option>
        </select>
      </div>

      {isError && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar as baias. Tente novamente.</div>
        </div>
      )}

      {isLoading && <p className="subtitle">Carregando baias…</p>}

      {!isLoading && !isError && baiasFiltradas.length === 0 && (
        <div className="empty">
          <span className="ico">
            <Icon name="grid" size={28} />
          </span>
          <h3>Nenhuma baia encontrada</h3>
          <p>Ajuste os filtros ou cadastre uma nova baia.</p>
        </div>
      )}

      {!isLoading &&
        !isError &&
        secoes.map((secao) => (
          <div className="baia-section" key={secao.codigo}>
            <h2>
              {secao.nome} <span className="count">{secao.baias.length} baia(s)</span>
            </h2>
            <div className="baia-grid">
              {secao.baias.map((baia) => {
                const estado = estadoLotacao(baia.ocupacaoAtual, baia.capacidade)
                const pct = calcularPercentual(baia.ocupacaoAtual, baia.capacidade)
                const statusLabel = rotuloStatus(baia, estado)
                return (
                  <div className={classeCard(baia, estado)} key={baia.id}>
                    <div className="head">
                      <span className="baia-name">{baia.nome}</span>
                      {statusLabel && <span className="status-label">{statusLabel}</span>}
                    </div>
                    <div className="occupancy-line">
                      <div className={classeBarra(estado)} style={{ flex: 1 }}>
                        <span className="fill" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <span className="nums">
                        {baia.ocupacaoAtual}/{baia.capacidade}
                      </span>
                      <span className="pct">{pct}%</span>
                    </div>
                    <Link
                      to={`/animais?baiaId=${baia.id}`}
                      className="btn btn-ghost btn-sm"
                      style={{ alignSelf: 'flex-start', height: 'auto', padding: 0, fontSize: 11 }}
                    >
                      Ver animais →
                    </Link>
                    <div className="card-footer">
                      <span className="tipo">{baia.finalidade ?? baia.tipoBaiaNome}</span>
                      <div className="card-actions">
                        {baia.ativa ? (
                          <>
                            {podeEscrever && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setBaiaEmEdicao(baia)}
                              >
                                Editar
                              </button>
                            )}
                            {podeExcluir && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleExcluir(baia)}
                              >
                                Excluir
                              </button>
                            )}
                          </>
                        ) : (
                          podeEscrever && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleReativar(baia)}
                            >
                              Reativar
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

      {baiaEmEdicao && (
        <BaiaFormModal
          baia={baiaEmEdicao === 'nova' ? undefined : baiaEmEdicao}
          onFechar={() => setBaiaEmEdicao(null)}
        />
      )}
    </>
  )
}

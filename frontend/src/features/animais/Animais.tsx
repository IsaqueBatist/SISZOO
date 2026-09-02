import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Icon } from '../../components/layout/Icon'
import { useAuth } from '../auth/AuthContext'
import { roleKeyFromCargos } from '../../lib/nav'
import { useAnimaisQuery, useBaiasAtivasQuery, useCatalogosAnimaisQuery } from './useAnimais'
import { badgeDeEspecie, badgeDeStatus } from './statusBadge'
import type { Animal, Pelagem, Porte, Sexo } from './animais.types'

const TAMANHO_PAGINA = 20
const FUSO_ITU = 'America/Sao_Paulo'
const LINHAS_SKELETON = [0, 1, 2, 3, 4]
const COLUNAS_TABELA = ['animal', 'especie', 'baia', 'status', 'sexo', 'porte', 'entrada', 'castrado', 'acoes']

function formatarData(iso: string): string {
  const data = new Date(iso)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: FUSO_ITU,
  }).format(data)
}

function formatarSexo(sexo: Sexo): string {
  if (sexo === 'macho') return 'Macho'
  if (sexo === 'femea') return 'Fêmea'
  return 'Não identificado'
}

function formatarPorte(porte: Porte | null): string {
  if (porte === 'pequeno') return 'Pequeno'
  if (porte === 'medio') return 'Médio'
  if (porte === 'grande') return 'Grande'
  return '—'
}

function formatarPelagem(pelagem: Pelagem | null): string {
  if (pelagem === 'curta') return 'Curta'
  if (pelagem === 'longa') return 'Longa'
  return ''
}

function corAvatar(seed: string): string {
  const hue = Math.abs([...seed].reduce((acumulado, char) => acumulado + char.charCodeAt(0), 0)) % 360
  return `hsl(${hue}, 35%, 50%)`
}

export function Animais() {
  const { user } = useAuth()
  const podeEscrever = ['admin', 'vet'].includes(roleKeyFromCargos(user?.cargos ?? []))
  const [searchParams] = useSearchParams()
  const [busca, setBusca] = useState('')
  const [buscaDebounced, setBuscaDebounced] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [especieFiltro, setEspecieFiltro] = useState('')
  // Hidrata só na primeira renderização: um card de baia (T19) linka para cá
  // com `?baiaId=`; depois disso o filtro vira estado local normal, sem
  // sincronização de volta para a URL.
  const [baiaFiltro, setBaiaFiltro] = useState(() => searchParams.get('baiaId') ?? '')
  const [pagina, setPagina] = useState(0)
  const [filtroAnterior, setFiltroAnterior] = useState({ busca: '', status: '', especie: '', baia: '' })

  useEffect(() => {
    const timeout = setTimeout(() => setBuscaDebounced(busca.trim()), 300)
    return () => clearTimeout(timeout)
  }, [busca])

  // Reset da página ao mudar de filtro, ajustado durante a renderização (em
  // vez de um efeito) para não cair no anti-padrão "setState em effect" —
  // ver https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes.
  const filtroMudou =
    filtroAnterior.busca !== buscaDebounced ||
    filtroAnterior.status !== statusFiltro ||
    filtroAnterior.especie !== especieFiltro ||
    filtroAnterior.baia !== baiaFiltro
  if (filtroMudou) {
    setFiltroAnterior({ busca: buscaDebounced, status: statusFiltro, especie: especieFiltro, baia: baiaFiltro })
    setPagina(0)
  }

  const { data, isLoading, isError } = useAnimaisQuery({
    status: statusFiltro || undefined,
    especie: especieFiltro || undefined,
    baiaId: baiaFiltro || undefined,
    q: buscaDebounced || undefined,
    pagina,
    tamanho: TAMANHO_PAGINA,
  })
  const { data: catalogos } = useCatalogosAnimaisQuery()
  const { data: baias } = useBaiasAtivasQuery()

  const totalPaginas = Math.max(data?.totalPaginas ?? 1, 1)
  const primeiroItem = data && data.totalItens > 0 ? pagina * TAMANHO_PAGINA + 1 : 0
  const ultimoItem = data ? Math.min((pagina + 1) * TAMANHO_PAGINA, data.totalItens) : 0

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>
            Animais <span className="counter">{data?.totalItens ?? 0} animais</span>
          </h1>
          <p className="subtitle">Listagem de animais cadastrados no CCZ</p>
        </div>
        {podeEscrever && (
          <div className="actions">
            <Link to="/animais/novo" className="btn btn-primary">
              <Icon name="plus" size={14} />
              Novo animal
            </Link>
          </div>
        )}
      </div>

      <div className="filter-bar">
        <div className="search-input">
          <Icon name="search" size={14} />
          <input
            type="text"
            placeholder="Buscar por nome ou microchip..."
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </div>
        <select
          className="filter-select"
          aria-label="Filtrar por espécie"
          value={especieFiltro}
          onChange={(event) => setEspecieFiltro(event.target.value)}
        >
          <option value="">Espécie: Todas</option>
          {catalogos?.especies.map((especie) => (
            <option key={especie.codigo} value={especie.codigo}>
              {especie.nome}
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
          {catalogos?.status.map((status) => (
            <option key={status.codigo} value={status.codigo}>
              {status.nome}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          aria-label="Filtrar por baia"
          value={baiaFiltro}
          onChange={(event) => setBaiaFiltro(event.target.value)}
        >
          <option value="">Baia: Todas</option>
          {baias?.map((baia) => (
            <option key={baia.id} value={baia.id}>
              {baia.nome}
            </option>
          ))}
        </select>
      </div>

      {isError && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar os animais. Tente novamente.</div>
        </div>
      )}

      {isLoading && (
        <div className="table-wrap">
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Animal</th>
                  <th>Espécie</th>
                  <th>Baia</th>
                  <th>Status</th>
                  <th>Sexo</th>
                  <th>Porte</th>
                  <th>Entrada</th>
                  <th>Castrado</th>
                  <th>Ações</th>
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
            <Icon name="paw" size={28} />
          </span>
          <h3>Nenhum animal encontrado</h3>
          <p>Ajuste os filtros de busca.</p>
        </div>
      )}

      {!isLoading && !isError && data && data.itens.length > 0 && (
        <div className="table-wrap">
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Animal</th>
                  <th>Espécie</th>
                  <th>Baia</th>
                  <th>Status</th>
                  <th>Sexo</th>
                  <th>Porte</th>
                  <th>Entrada</th>
                  <th>Castrado</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {data.itens.map((animal: Animal) => {
                  const statusBadge = badgeDeStatus(animal.statusCodigo, animal.statusNome)
                  const especieBadge = badgeDeEspecie(animal.especieCodigo, animal.especieNome)
                  return (
                    <tr key={animal.id}>
                      <td>
                        <div className="animal-cell">
                          <div
                            className="animal-avatar"
                            style={animal.fotoUrl ? undefined : { background: corAvatar(animal.id), color: '#fff' }}
                          >
                            {animal.fotoUrl ? (
                              <img
                                src={animal.fotoUrl}
                                alt=""
                                style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }}
                              />
                            ) : (
                              <Icon name="paw" size={16} />
                            )}
                          </div>
                          <div>
                            <div className="name">
                              <Link to={`/animais/${animal.id}`}>{animal.nome}</Link>
                            </div>
                            <div className="chip">{animal.microchip ?? '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${especieBadge.classe}`}>{especieBadge.label}</span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: 12 }}>
                          {animal.baiaNome ?? '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${statusBadge.classe}`}>
                          <span className="badge-dot" aria-hidden="true" style={{ background: 'currentColor' }} />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td>{formatarSexo(animal.sexo)}</td>
                      <td title={formatarPelagem(animal.pelagem) || undefined}>{formatarPorte(animal.porte)}</td>
                      <td>
                        <span className="mono" style={{ fontSize: 12 }}>
                          {formatarData(animal.dataEntrada)}
                        </span>
                      </td>
                      <td>
                        {animal.esterilizado ? (
                          <span style={{ color: 'var(--color-success)' }}>● Sim</span>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)' }}>○ Não</span>
                        )}
                      </td>
                      <td>
                        {podeEscrever && (
                          <Link
                            to={`/animais/${animal.id}/editar`}
                            className="btn btn-ghost btn-sm btn-icon-only"
                            aria-label={`Editar ${animal.nome}`}
                          >
                            <Icon name="edit" size={14} />
                          </Link>
                        )}
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
              de <strong>{data.totalItens}</strong> animais
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

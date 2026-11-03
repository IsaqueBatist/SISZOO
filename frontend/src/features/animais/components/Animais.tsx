import { Link } from 'react-router-dom'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import { Icon } from '@/components/layout/Icon'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { formatarDataBR } from '@/lib/datas'
import { useLinhaClicavel } from '@/lib/useLinhaClicavel'
import {
  classeDoFiltro,
  useFiltroDeLink,
  useFiltrosLista,
  useManterPaginaNoIntervalo,
  useValorComAtraso,
} from '@/lib/useFiltrosLista'
import { useAnimaisQuery, useBaiasQuery, useCatalogosAnimaisQuery } from '../hooks/useAnimais'
import { badgeDeStatus } from '../utils/statusBadge'
import type { Animal, Pelagem } from '../types/animais.types'
import { CODIGOS_PENDENCIA_ANIMAL, ehPendenciaAnimal, PENDENCIAS_ANIMAL } from '../utils/pendenciasAnimal'
import { formatarPorte, formatarSexo } from '../utils/rotulosAnimal'

const TAMANHO_PAGINA = 20
const LINHAS_SKELETON = [0, 1, 2, 3, 4]
const COLUNAS_TABELA = ['animal', 'especie', 'baia', 'status', 'sexo', 'porte', 'entrada', 'castrado', 'acoes']
const FILTROS_PADRAO = { busca: '', status: '', especie: '', baia: '', pendencia: '' }
const STATUS_SOB_CUSTODIA = 'sob_custodia'
const ROTULOS_STATUS_FILTRO: Record<string, string> = { disponivel_adocao: 'Disponível p/ adoção' }

const formatarData = formatarDataBR

function formatarPelagem(pelagem: Pelagem | null): string {
  if (pelagem === 'curta') return 'Curta'
  if (pelagem === 'longa') return 'Longa'
  return ''
}

export function Animais() {
  const { roleKey } = useAuth()
  const podeEscrever = roleKey === 'admin' || roleKey === 'vet'
  const baiaDaUrl = useFiltroDeLink('baiaId')
  const pendenciaDaUrl = useFiltroDeLink('pendencia')
  const statusDaUrl = useFiltroDeLink('status')
  const filtrosDaUrl = {
    ...(baiaDaUrl ? { baia: baiaDaUrl } : {}),
    ...(ehPendenciaAnimal(pendenciaDaUrl) ? { pendencia: pendenciaDaUrl } : {}),
    ...(statusDaUrl ? { status: statusDaUrl } : {}),
  }
  const { filtros, pagina, definirFiltros, irParaPagina, limparFiltros, filtrosAtivos } = useFiltrosLista(
    'animais',
    FILTROS_PADRAO,
    Object.keys(filtrosDaUrl).length > 0 ? filtrosDaUrl : undefined,
  )
  const { status: statusFiltro, especie: especieFiltro, baia: baiaFiltro } = filtros
  const pendenciaFiltro = ehPendenciaAnimal(filtros.pendencia) ? filtros.pendencia : undefined
  const propsDaLinha = useLinhaClicavel()
  const buscaDebounced = useValorComAtraso(filtros.busca).trim()
  const sobCustodia = statusFiltro === STATUS_SOB_CUSTODIA

  const { data, isLoading, isError, refetch } = useAnimaisQuery({
    status: sobCustodia ? undefined : statusFiltro || undefined,
    custodia: sobCustodia || undefined,
    especie: especieFiltro || undefined,
    baiaId: baiaFiltro || undefined,
    q: buscaDebounced || undefined,
    pendencia: pendenciaFiltro,
    pagina,
    tamanho: TAMANHO_PAGINA,
  })
  const { data: catalogos } = useCatalogosAnimaisQuery()
  const { data: baias } = useBaiasQuery()
  const opcoesDeBaia = baias?.filter((baia) => baia.ativa || baia.id === baiaFiltro)

  useManterPaginaNoIntervalo(pagina, data?.totalPaginas, irParaPagina)

  const totalPaginas = Math.max(data?.totalPaginas ?? 1, 1)
  const primeiroItem = data && data.totalItens > 0 ? pagina * TAMANHO_PAGINA + 1 : 0
  const ultimoItem = data ? Math.min((pagina + 1) * TAMANHO_PAGINA, data.totalItens) : 0

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>
            Animais {data && <span className="counter">{data.totalItens} animais</span>}
          </h1>
          <p className="subtitle">Clique em um animal para abrir a ficha.</p>
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
            placeholder="Buscar por nome, microchip ou medalha..."
            aria-label="Buscar animais"
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
          <option value={STATUS_SOB_CUSTODIA}>Sob custódia</option>
          {catalogos?.status.map((status) => (
            <option key={status.codigo} value={status.codigo}>
              {ROTULOS_STATUS_FILTRO[status.codigo] ?? status.nome}
            </option>
          ))}
        </select>
        <select
          className={classeDoFiltro(especieFiltro)}
          aria-label="Filtrar por espécie"
          value={especieFiltro}
          onChange={(event) => definirFiltros({ especie: event.target.value })}
        >
          <option value="">Espécie: Todas</option>
          {catalogos?.especies.map((especie) => (
            <option key={especie.codigo} value={especie.codigo}>
              {especie.nome}
            </option>
          ))}
        </select>
        <select
          className={classeDoFiltro(baiaFiltro)}
          aria-label="Filtrar por baia"
          value={baiaFiltro}
          onChange={(event) => definirFiltros({ baia: event.target.value })}
        >
          <option value="">Baia: Todas</option>
          {opcoesDeBaia?.map((baia) => (
            <option key={baia.id} value={baia.id}>
              {baia.ativa ? baia.nome : `${baia.nome} (inativa)`}
            </option>
          ))}
        </select>
        <select
          className={`${classeDoFiltro(filtros.pendencia)} filtro-largo`}
          aria-label="Filtrar por pendência"
          value={filtros.pendencia}
          onChange={(event) => definirFiltros({ pendencia: event.target.value })}
        >
          <option value="">Pendência: Todas</option>
          {CODIGOS_PENDENCIA_ANIMAL.map((codigo) => (
            <option key={codigo} value={codigo}>
              {PENDENCIAS_ANIMAL[codigo].rotulo}
            </option>
          ))}
        </select>
        {filtrosAtivos && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={limparFiltros}>
            Limpar filtros
          </button>
        )}
      </div>

      {pendenciaFiltro && (
        <p className="aviso-filtro" role="status">
          <Icon name="alert" size={14} />
          <span>
            <strong>{PENDENCIAS_ANIMAL[pendenciaFiltro].rotulo}:</strong> {PENDENCIAS_ANIMAL[pendenciaFiltro].regra}
          </span>
        </p>
      )}

      {isError && <ErroComRetry mensagem="Não foi possível carregar os animais." onTentarNovamente={() => void refetch()} />}

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
                  <th className="col-acoes">
                    <span className="visually-hidden">Ações</span>
                  </th>
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
            <Icon name="paw" size={28} />
          </span>
          <h3>Nenhum animal encontrado</h3>
          <p>
            {pendenciaFiltro
              ? 'Nenhum animal com esta pendência no momento.'
              : filtrosAtivos
                ? 'Nenhum resultado com estes filtros.'
                : 'Ainda não há animais cadastrados. Use "Novo animal" para registrar a primeira entrada.'}
          </p>
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
                  <th>Animal</th>
                  <th>Espécie</th>
                  <th>Baia</th>
                  <th>Status</th>
                  <th>Sexo</th>
                  <th>Porte</th>
                  <th>Entrada</th>
                  <th>Castrado</th>
                  <th className="col-acoes">
                    <span className="visually-hidden">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.itens.map((animal: Animal) => {
                  const statusBadge = badgeDeStatus(animal.statusCodigo, animal.statusNome)
                  return (
                    <tr key={animal.id} {...propsDaLinha(`/animais/${animal.id}`)}>
                      <td>
                        <div className="animal-cell">
                          <div className="animal-avatar">
                            {animal.fotoUrl ? (
                              <img
                                src={animal.fotoUrl}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <Icon name="paw" size={16} />
                            )}
                          </div>
                          <div>
                            <div className="name">
                              <Link to={`/animais/${animal.id}`}>{animal.nome}</Link>
                            </div>
                            <div className="chip">
                              {animal.microchip ?? '—'}
                              {animal.numeroMedalha && ` · Medalha ${animal.numeroMedalha}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {animal.especieNome}
                      </td>
                      <td>
                        {animal.baiaNome ?? <span className="muted">—</span>}
                      </td>
                      <td>
                        <span className={`badge ${statusBadge.classe}`}>
                          <span className="badge-dot" aria-hidden="true" />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td>{formatarSexo(animal.sexo)}</td>
                      <td title={formatarPelagem(animal.pelagem) || undefined}>{formatarPorte(animal.porte)}</td>
                      <td>
                        {formatarData(animal.dataEntrada)}
                      </td>
                      <td>
                        {animal.esterilizado === null ? (
                          <span className="muted">Não informado</span>
                        ) : animal.esterilizado ? (
                          'Sim'
                        ) : (
                          'Não'
                        )}
                      </td>
                      <td className="col-acoes">
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

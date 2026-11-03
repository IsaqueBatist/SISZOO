import { useMemo } from 'react'
import { FiltroPeriodo } from '@/components/FiltroPeriodo'
import { Icon } from '@/components/layout/Icon'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import { Skeleton } from '@/components/layout/Skeleton'
import { formatarHora } from '@/features/ocorrencias/utils/datas'
import { classeDoFiltro, useFiltrosLista, useManterPaginaNoIntervalo, useValorComAtraso } from '@/lib/useFiltrosLista'
import { useEventosAuditoriaQuery, useOpcoesFiltroAuditoriaQuery } from '../hooks/useAuditoria'
import { agruparPorDia } from '../utils/agruparPorDia'
import { agruparPorModulo } from '../utils/agruparPorModulo'
import { descricaoAcao, type TomAcao } from '../utils/descricaoAcao'
import { diferencasDoEvento, justificativaDoEvento } from '../utils/diferencasPayload'
import { labelModulo, moduloDaEntidade, type Modulo } from '../utils/moduloDaEntidade'
import type { EventoAuditoria } from '../types/auditoria.types'
import './Logs.css'

const TAMANHO_PAGINA = 20
const FILTROS_PADRAO = { acao: '', usuario: '', modulo: '', de: '', ate: '' }

const COR_POR_TOM: Record<TomAcao, string> = {
  info: 'var(--color-info)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
}

function valoresUnicos<T>(itens: T[]): T[] {
  return [...new Set(itens)].sort()
}

function LinhaEvento({ evento }: { evento: EventoAuditoria }) {
  const descricao = descricaoAcao(evento.acao)
  return (
    <li className="log-item">
      <span className="log-hora">{formatarHora(evento.ocorreuEm.slice(11))}</span>
      <span className="log-ico" style={{ color: COR_POR_TOM[descricao.tom] }} aria-hidden="true">
        <Icon name={descricao.icone} size={15} />
      </span>
      <div className="log-texto">
        <span>
          <strong>{evento.usuarioEmail ?? 'Sistema'}</strong> {descricao.verbo}{' '}
          <span className="log-entidade">{evento.entidade}</span>
        </span>
        <DetalhesEvento evento={evento} />
      </div>
    </li>
  )
}

function DetalhesEvento({ evento }: { evento: EventoAuditoria }) {
  const justificativa = justificativaDoEvento(evento.payloadDepois)
  const diferencas = diferencasDoEvento(evento.payloadAntes, evento.payloadDepois)
  if (!justificativa && diferencas.length === 0) return null

  return (
    <details className="log-detalhes">
      <summary>Ver detalhes</summary>
      <div className="col gap-1">
        {justificativa && (
          <div>
            <strong>Motivo:</strong> {justificativa}
          </div>
        )}
        {diferencas.length > 0 && (
          <ul>
            {diferencas.map((diferenca) => (
              <li key={diferenca.campo}>
                {diferenca.campo}: {diferenca.antes} → {diferenca.depois}
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  )
}

export function Logs() {
  const { filtros: filtrosLista, pagina, definirFiltros, irParaPagina, limparFiltros, filtrosAtivos: filtroAtivo } = useFiltrosLista('logs', FILTROS_PADRAO)
  const { acao: acaoFiltro, usuario: usuarioFiltro, de: deFiltro, ate: ateFiltro } = filtrosLista
  const moduloFiltro = filtrosLista.modulo as Modulo | ''
  const deDebounced = useValorComAtraso(deFiltro)
  const ateDebounced = useValorComAtraso(ateFiltro)

  const filtros = useMemo(
    () => ({ acao: acaoFiltro, usuarioEmail: usuarioFiltro, modulo: moduloFiltro, de: deDebounced, ate: ateDebounced }),
    [acaoFiltro, usuarioFiltro, moduloFiltro, deDebounced, ateDebounced],
  )
  const { data, isLoading, isError, refetch } = useEventosAuditoriaQuery(pagina, TAMANHO_PAGINA, filtros)
  const { data: opcoes } = useOpcoesFiltroAuditoriaQuery()

  useManterPaginaNoIntervalo(pagina, data?.totalPaginas, irParaPagina)

  const itens = useMemo(() => data?.itens ?? [], [data])
  const acoesDisponiveis = useMemo(() => opcoes?.acoes ?? valoresUnicos(itens.map((e) => e.acao)), [opcoes, itens])
  const usuariosDisponiveis = useMemo(
    () => opcoes?.usuarios ?? valoresUnicos(itens.map((e) => e.usuarioEmail).filter((email): email is string => Boolean(email))),
    [opcoes, itens],
  )
  const modulosDisponiveis = useMemo(
    () => (opcoes?.modulos as Modulo[] | undefined) ?? valoresUnicos(itens.map((e) => moduloDaEntidade(e.entidade))),
    [opcoes, itens],
  )

  const grupos = agruparPorDia(itens)

  const totalPaginas = Math.max(data?.totalPaginas ?? 1, 1)

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>Histórico de ações</h1>
          <p className="subtitle">Quem fez o quê no SISZOO, com data e hora.</p>
        </div>
      </div>

      <div className="filter-bar">
        <FiltroPeriodo rotulo="Período" de={deFiltro} ate={ateFiltro} onAlterar={definirFiltros} />
        <select
          className={classeDoFiltro(moduloFiltro)}
          aria-label="Filtrar por módulo"
          value={moduloFiltro}
          onChange={(event) => definirFiltros({ modulo: event.target.value })}
        >
          <option value="">Módulo: Todos</option>
          {modulosDisponiveis.map((modulo) => (
            <option key={modulo} value={modulo}>
              {labelModulo(modulo)}
            </option>
          ))}
        </select>
        <select
          className={classeDoFiltro(acaoFiltro)}
          aria-label="Filtrar por ação"
          value={acaoFiltro}
          onChange={(event) => definirFiltros({ acao: event.target.value })}
        >
          <option value="">Ação: Todas</option>
          {acoesDisponiveis.map((acao) => (
            <option key={acao} value={acao}>
              {descricaoAcao(acao).rotulo}
            </option>
          ))}
        </select>
        <select
          className={classeDoFiltro(usuarioFiltro)}
          aria-label="Filtrar por usuário"
          value={usuarioFiltro}
          onChange={(event) => definirFiltros({ usuario: event.target.value })}
        >
          <option value="">Usuário: Todos</option>
          {usuariosDisponiveis.map((email) => (
            <option key={email} value={email}>
              {email}
            </option>
          ))}
        </select>
        {filtroAtivo && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={limparFiltros}>
            Limpar filtros
          </button>
        )}
      </div>

      {filtroAtivo && data && (
        <p className="subtitle">
          {data.totalItens} evento(s) encontrado(s) em toda a trilha.
        </p>
      )}

      {isError && <ErroComRetry mensagem="Não foi possível carregar os logs." onTentarNovamente={refetch} />}
      {isLoading && <Skeleton width="100%" height={300} />}

      {!isLoading && !isError && data?.totalItens === 0 && (
        <div className="empty">
          <span className="ico">
            <Icon name="history" size={28} />
          </span>
          <h3>Nenhum evento encontrado</h3>
          <p>{filtroAtivo ? 'Nenhum resultado com estes filtros.' : 'Ainda não há eventos registrados.'}</p>
          {filtroAtivo && (
            <button type="button" className="btn btn-outline btn-sm" onClick={limparFiltros}>
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {!isLoading &&
        !isError &&
        grupos.map((grupo) => (
          <section key={grupo.rotulo} className="card log-dia">
            <div className="card-header">
              <h2>{grupo.rotulo}</h2>
            </div>
            {agruparPorModulo(grupo.eventos).map((grupoModulo) => (
              <div key={grupoModulo.modulo} className="log-modulo">
                <h3>{grupoModulo.rotulo}</h3>
                <ul>
                  {grupoModulo.eventos.map((evento) => (
                    <LinhaEvento key={evento.id} evento={evento} />
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}

      {!isLoading && !isError && data && (
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
      )}
    </>
  )
}

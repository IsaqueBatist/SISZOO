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
    <li
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <span style={{ color: COR_POR_TOM[descricao.tom], flexShrink: 0 }} aria-hidden="true">
        <Icon name={descricao.icone} size={16} />
      </span>
      <span style={{ flex: 1 }}>
        <strong>{evento.usuarioEmail ?? 'Sistema'}</strong> {descricao.verbo}{' '}
        <span className="mono" style={{ fontSize: 12 }}>
          {evento.entidade}
        </span>
      </span>
      <span className="mono" style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
        {formatarHora(evento.ocorreuEm.slice(11))}
      </span>
      <DetalhesEvento evento={evento} />
    </li>
  )
}

function DetalhesEvento({ evento }: { evento: EventoAuditoria }) {
  const justificativa = justificativaDoEvento(evento.payloadDepois)
  const diferencas = diferencasDoEvento(evento.payloadAntes, evento.payloadDepois)
  if (!justificativa && diferencas.length === 0) return null

  return (
    <details style={{ flexBasis: '100%', fontSize: 12 }}>
      <summary style={{ cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Ver detalhes</summary>
      <div className="col gap-1" style={{ marginTop: 'var(--space-2)' }}>
        {justificativa && (
          <div>
            <strong>Motivo:</strong> {justificativa}
          </div>
        )}
        {diferencas.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 16 }}>
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

  // F2-027 (Fase 3 do TG): os filtros vão ao servidor (GET /api/auditoria com
  // acao/usuarioEmail/modulo/de/ate) e valem para toda a trilha, não só para
  // a página carregada. Trocar um filtro volta à primeira página.
  const filtros = useMemo(
    () => ({ acao: acaoFiltro, usuarioEmail: usuarioFiltro, modulo: moduloFiltro, de: deDebounced, ate: ateDebounced }),
    [acaoFiltro, usuarioFiltro, moduloFiltro, deDebounced, ateDebounced],
  )
  const { data, isLoading, isError, refetch } = useEventosAuditoriaQuery(pagina, TAMANHO_PAGINA, filtros)
  const { data: opcoes } = useOpcoesFiltroAuditoriaQuery()

  useManterPaginaNoIntervalo(pagina, data?.totalPaginas, irParaPagina)

  // Memoizado: `data?.itens ?? []` cria um array novo a cada render enquanto
  // `data` está undefined, o que quebraria a identidade estável exigida
  // pelos useMemo abaixo.
  const itens = useMemo(() => data?.itens ?? [], [data])
  // Opções: catálogo do servidor (toda a trilha); enquanto não carrega, os
  // valores da página atual (mesmo comportamento anterior).
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
          <h1>Logs do Sistema</h1>
          <p className="subtitle">Ações registradas pelos usuários do SISZOO</p>
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
        <p className="subtitle" style={{ marginBottom: 'var(--space-3)' }}>
          {data.totalItens} evento(s) encontrado(s) em toda a trilha.
        </p>
      )}

      {isError && <ErroComRetry mensagem="Não foi possível carregar os logs." onTentarNovamente={refetch} />}
      {isLoading && <Skeleton width="100%" height={300} />}

      {!isLoading && !isError && data?.totalItens === 0 && (
        <div className="empty">
          <span className="ico">
            <Icon name="eye" size={28} />
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
          <div key={grupo.rotulo} style={{ marginBottom: 'var(--space-5)' }}>
            <h2 className="uppercase-label" style={{ marginBottom: 'var(--space-3)' }}>
              {grupo.rotulo}
            </h2>
            {agruparPorModulo(grupo.eventos).map((grupoModulo) => (
              <div key={grupoModulo.modulo} style={{ marginBottom: 'var(--space-3)' }}>
                <h3
                  style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)' }}
                >
                  {grupoModulo.rotulo}
                </h3>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {grupoModulo.eventos.map((evento) => (
                    <LinhaEvento key={evento.id} evento={evento} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}

      {!isLoading && !isError && data && (
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
      )}
    </>
  )
}

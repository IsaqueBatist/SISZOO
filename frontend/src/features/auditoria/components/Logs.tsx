import { useMemo } from 'react'
import { Icon } from '@/components/layout/Icon'
import { ErroComRetry } from '@/components/layout/ErroComRetry'
import { Skeleton } from '@/components/layout/Skeleton'
import { formatarHora } from '@/features/ocorrencias/utils/datas'
import { useFiltrosLista } from '@/lib/useFiltrosLista'
import { useEventosAuditoriaQuery, useOpcoesFiltroAuditoriaQuery } from '../hooks/useAuditoria'
import { agruparPorDia } from '../utils/agruparPorDia'
import { agruparPorModulo } from '../utils/agruparPorModulo'
import { descricaoAcao, type TomAcao } from '../utils/descricaoAcao'
import { diferencasDoEvento, justificativaDoEvento } from '../utils/diferencasPayload'
import { labelModulo, moduloDaEntidade, type Modulo } from '../utils/moduloDaEntidade'
import type { EventoAuditoria } from '../types/auditoria.types'

const TAMANHO_PAGINA = 20
const FILTROS_PADRAO = { acao: '', entidade: '', usuario: '', modulo: '', de: '', ate: '' }

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

// O que mudou, o motivo e a origem do evento. Fica recolhido: a lista continua
// fácil de percorrer.
function DetalhesEvento({ evento }: { evento: EventoAuditoria }) {
  const justificativa = justificativaDoEvento(evento.payloadDepois)
  const diferencas = diferencasDoEvento(evento.payloadAntes, evento.payloadDepois)
  if (!justificativa && !evento.ip && diferencas.length === 0) return null

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
        {evento.ip && (
          <div>
            <strong>IP:</strong> <span className="mono">{evento.ip}</span>
          </div>
        )}
      </div>
    </details>
  )
}

export function Logs() {
  const { filtros: filtrosLista, pagina, definirFiltros, irParaPagina, limparFiltros, filtrosAtivos: filtroAtivo } = useFiltrosLista('logs', FILTROS_PADRAO)
  const { acao: acaoFiltro, entidade: entidadeFiltro, usuario: usuarioFiltro, de: deFiltro, ate: ateFiltro } = filtrosLista
  const moduloFiltro = filtrosLista.modulo as Modulo | ''

  // F2-027 (Fase 3 do TG): os filtros vão ao servidor (GET /api/auditoria com
  // acao/entidade/usuarioEmail/modulo/de/ate) e valem para toda a trilha, não só para
  // a página carregada. Trocar um filtro volta à primeira página.
  const filtros = useMemo(
    () => ({ acao: acaoFiltro, entidade: entidadeFiltro, usuarioEmail: usuarioFiltro, modulo: moduloFiltro, de: deFiltro, ate: ateFiltro }),
    [acaoFiltro, entidadeFiltro, usuarioFiltro, moduloFiltro, deFiltro, ateFiltro],
  )
  const { data, isLoading, isError, refetch } = useEventosAuditoriaQuery(pagina, TAMANHO_PAGINA, filtros)
  const { data: opcoes } = useOpcoesFiltroAuditoriaQuery()

  // Memoizado: `data?.itens ?? []` cria um array novo a cada render enquanto
  // `data` está undefined, o que quebraria a identidade estável exigida
  // pelos useMemo abaixo.
  const itens = useMemo(() => data?.itens ?? [], [data])
  // Opções: catálogo do servidor (toda a trilha); enquanto não carrega, os
  // valores da página atual (mesmo comportamento anterior).
  const acoesDisponiveis = useMemo(() => opcoes?.acoes ?? valoresUnicos(itens.map((e) => e.acao)), [opcoes, itens])
  const entidadesDisponiveis = useMemo(
    () => opcoes?.entidades ?? valoresUnicos(itens.map((e) => e.entidade)),
    [opcoes, itens],
  )
  const usuariosDisponiveis = useMemo(
    () => opcoes?.usuarios ?? valoresUnicos(itens.map((e) => e.usuarioEmail).filter((email): email is string => Boolean(email))),
    [opcoes, itens],
  )
  const modulosDisponiveis = useMemo(
    () => (opcoes?.modulos as Modulo[] | undefined) ?? valoresUnicos(itens.map((e) => moduloDaEntidade(e.entidade))),
    [opcoes, itens],
  )

  // Defesa local: o servidor já filtra; esta passagem só garante a consistência
  // da página exibida (e mantém o comportamento quando a API ignora um parâmetro).
  const eventosFiltrados = itens.filter((evento) => {
    const combinaAcao = !acaoFiltro || evento.acao === acaoFiltro
    const combinaEntidade = !entidadeFiltro || evento.entidade === entidadeFiltro
    const combinaUsuario = !usuarioFiltro || evento.usuarioEmail === usuarioFiltro
    const combinaModulo = !moduloFiltro || moduloDaEntidade(evento.entidade) === moduloFiltro
    return combinaAcao && combinaEntidade && combinaUsuario && combinaModulo
  })
  const grupos = agruparPorDia(eventosFiltrados)

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
        <select
          className="filter-select"
          aria-label="Filtrar por ação"
          value={acaoFiltro}
          onChange={(event) => definirFiltros({ acao: event.target.value })}
        >
          <option value="">Ação: Todas</option>
          {acoesDisponiveis.map((acao) => (
            <option key={acao} value={acao}>
              {descricaoAcao(acao).verbo}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          aria-label="Filtrar por entidade"
          value={entidadeFiltro}
          onChange={(event) => definirFiltros({ entidade: event.target.value })}
        >
          <option value="">Entidade: Todas</option>
          {entidadesDisponiveis.map((entidade) => (
            <option key={entidade} value={entidade}>
              {entidade}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
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
        <select
          className="filter-select"
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
        <input
          className="filter-select"
          type="date"
          aria-label="Eventos a partir de"
          title="Eventos a partir de"
          value={deFiltro}
          max={ateFiltro || undefined}
          onChange={(event) => definirFiltros({ de: event.target.value })}
        />
        <input
          className="filter-select"
          type="date"
          aria-label="Eventos até"
          title="Eventos até"
          value={ateFiltro}
          min={deFiltro || undefined}
          onChange={(event) => definirFiltros({ ate: event.target.value })}
        />
        {filtroAtivo && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={limparFiltros}>
            Limpar filtros
          </button>
        )}
      </div>

      {filtroAtivo && data && (
        <p className="subtitle" style={{ marginBottom: 'var(--space-3)' }}>
          Filtro aplicado em toda a trilha: {data.totalItens} evento(s) encontrado(s), {eventosFiltrados.length} nesta página.
        </p>
      )}

      {isError && <ErroComRetry mensagem="Não foi possível carregar os logs." onTentarNovamente={refetch} />}
      {isLoading && <Skeleton width="100%" height={300} />}

      {!isLoading && !isError && grupos.length === 0 && (
        <div className="empty">
          <span className="ico">
            <Icon name="eye" size={28} />
          </span>
          <h3>Nenhum evento encontrado</h3>
          <p>Ajuste os filtros ou troque de página.</p>
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

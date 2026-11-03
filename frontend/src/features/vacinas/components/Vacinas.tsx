import { useMemo, useState } from 'react'
import { Icon } from '@/components/layout/Icon'
import { ResumoCatalogo } from '@/components/ResumoCatalogo'
import { toast } from '@/components/toast/toast'
import { useAlertasVacinaisQuery } from '@/features/alertas/hooks/useAlertas'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { mensagemDeRegraDaApi } from '@/lib/erroApi'
import { normalizarBusca } from '@/lib/texto'
import { classeDoFiltro, useFiltrosLista } from '@/lib/useFiltrosLista'
import { useAtualizarVacinaMutation, useDesativarVacinaMutation, useVacinasQuery } from '../hooks/useVacinas'
import type { Vacina } from '../types/vacinas.types'
import { VacinaFormModal } from './VacinaFormModal'
import { useLinhaClicavel } from '@/lib/useLinhaClicavel'

type FiltroSituacao = 'ativas' | 'inativas' | 'todas'

const FILTROS_PADRAO = { busca: '', situacao: 'ativas' }

const LINHAS_SKELETON = [0, 1, 2, 3]
const COLUNAS_TABELA = 5

interface AlertaDaVacina {
  animais: number
  vencidas: number
}

export function Vacinas() {
  const { roleKey } = useAuth()
  const podeEscrever = roleKey === 'admin' || roleKey === 'vet'
  const podeDesativar = roleKey === 'admin'

  const { filtros, definirFiltros, limparFiltros, filtrosAtivos } = useFiltrosLista('vacinas', FILTROS_PADRAO)
  const { busca } = filtros
  const situacao = filtros.situacao as FiltroSituacao
  const [emEdicao, setEmEdicao] = useState<Vacina | 'nova' | undefined>(undefined)

  const { data: vacinas, isLoading, isError } = useVacinasQuery(true)

  const { data: alertas } = useAlertasVacinaisQuery()

  const alertaPorVacina = useMemo(() => {
    const mapa = new Map<string, AlertaDaVacina>()
    for (const animal of alertas ?? []) {
      for (const item of animal.vacinas) {
        const atual = mapa.get(item.vacinaId) ?? { animais: 0, vencidas: 0 }
        atual.animais += 1
        if (item.severidade === 'VENCIDA') atual.vencidas += 1
        mapa.set(item.vacinaId, atual)
      }
    }
    return mapa
  }, [alertas])

  const filtradas = useMemo(() => {
    const termo = normalizarBusca(busca)
    return (vacinas ?? []).filter((vacina) => {
      if (situacao === 'ativas' && !vacina.ativo) return false
      if (situacao === 'inativas' && vacina.ativo) return false
      return termo === '' || normalizarBusca(vacina.nome).includes(termo)
    })
  }, [vacinas, busca, situacao])

  const total = vacinas?.length ?? 0
  const ativas = (vacinas ?? []).filter((vacina) => vacina.ativo).length
  const semReforco = (vacinas ?? []).filter((vacina) => vacina.ativo && vacina.intervaloMeses === null).length
  const animaisEmAlerta = (alertas ?? []).length

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <h1>
            Vacinas {vacinas && <span className="counter">{total} no catálogo</span>}
          </h1>
          <p className="subtitle">Catálogo usado no registro de vacinação da ficha do animal.</p>
        </div>
        {podeEscrever && (
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={() => setEmEdicao('nova')}>
              <Icon name="plus" size={14} />
              Cadastrar vacina
            </button>
          </div>
        )}
      </div>

      {!isError && (
        <ResumoCatalogo
          itens={[
            { id: 'total', valor: total, rotulo: 'No catálogo', descricao: 'Vacinas cadastradas' },
            { id: 'ativas', valor: ativas, rotulo: 'Ativas', descricao: 'Oferecidas no registro' },
            { id: 'sem-reforco', valor: semReforco, rotulo: 'Sem reforço', descricao: 'Não geram alerta' },
            {
              id: 'alerta',
              valor: animaisEmAlerta,
              rotulo: 'Em alerta',
              descricao: 'Animais com reforço a vencer',
              alerta: true,
            },
          ]}
        />
      )}

      <div className="filter-bar">
        <div className="search-input">
          <Icon name="search" size={14} />
          <input
            type="search"
            placeholder="Buscar por nome da vacina..."
            aria-label="Buscar por nome da vacina"
            value={busca}
            onChange={(evento) => definirFiltros({ busca: evento.target.value })}
          />
        </div>
        <select
          className={classeDoFiltro(situacao, 'ativas')}
          aria-label="Filtrar por situação"
          value={situacao}
          onChange={(evento) => definirFiltros({ situacao: evento.target.value })}
        >
          <option value="ativas">Situação: Ativas</option>
          <option value="inativas">Situação: Inativas</option>
          <option value="todas">Situação: Todas</option>
        </select>
        {filtrosAtivos && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={limparFiltros}>
            Limpar filtros
          </button>
        )}
      </div>

      {isError && (
        <div className="alert danger" role="alert">
          <div className="alert-content">Não foi possível carregar as vacinas. Tente novamente.</div>
        </div>
      )}

      {!isError && (isLoading || filtradas.length > 0) && (
        <div className="table-wrap">
          <div style={{ overflowX: 'auto' }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Vacina</th>
                  <th>Intervalo de reforço</th>
                  <th title="Animais com reforço vencido ou a vencer nos próximos 7 dias. Conta só animais sob custódia e a aplicação mais recente de cada vacina.">
                    Em alerta
                  </th>
                  <th>Situação</th>
                  {(podeEscrever || podeDesativar) && <th style={{ width: 160 }}>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? LINHAS_SKELETON.map((linha) => (
                      <tr key={linha}>
                        {Array.from({ length: COLUNAS_TABELA }).map((_, coluna) => (
                          <td key={coluna}>
                            <span className="skel" style={{ display: 'block', height: 14, borderRadius: 4 }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  : filtradas.map((vacina) => (
                      <LinhaVacina
                        key={vacina.id}
                        vacina={vacina}
                        alerta={alertaPorVacina.get(vacina.id)}
                        podeEscrever={podeEscrever}
                        podeDesativar={podeDesativar}
                        onEditar={() => setEmEdicao(vacina)}
                      />
                    ))}
              </tbody>
            </table>
          </div>
          {!isLoading && (
            <div className="table-footer">
              <span>
                Mostrando <strong>{filtradas.length}</strong> de <strong>{total}</strong>{' '}
                {total === 1 ? 'vacina' : 'vacinas'}
              </span>
            </div>
          )}
        </div>
      )}

      {!isLoading && !isError && filtradas.length === 0 && (
        <div className="empty">
          <span className="ico">
            <Icon name="syringe" size={28} />
          </span>
          {total === 0 ? (
            <>
              <h3>Nenhuma vacina cadastrada</h3>
              <p>
                {podeEscrever
                  ? 'Cadastre a primeira vacina para que ela apareça no registro de vacinação.'
                  : 'Peça a um administrador ou veterinário para cadastrar.'}
              </p>
            </>
          ) : (
            <>
              <h3>Nenhuma vacina encontrada</h3>
              <p>Nenhuma vacina corresponde à busca ou ao filtro de situação.</p>
            </>
          )}
        </div>
      )}

      {emEdicao && (
        <VacinaFormModal
          vacina={emEdicao === 'nova' ? undefined : emEdicao}
          onFechar={() => setEmEdicao(undefined)}
        />
      )}
    </>
  )
}

function LinhaVacina({
  vacina,
  alerta,
  podeEscrever,
  podeDesativar,
  onEditar,
}: {
  vacina: Vacina
  alerta: AlertaDaVacina | undefined
  podeEscrever: boolean
  podeDesativar: boolean
  onEditar: () => void
}) {
  const desativar = useDesativarVacinaMutation()
  const atualizar = useAtualizarVacinaMutation()
  const propsDaLinha = useLinhaClicavel()

  function handleDesativar() {
    const confirmado = window.confirm(
      `Desativar a vacina ${vacina.nome}?\n\n` +
        '· Os registros já lançados continuam como estão.\n' +
        '· Ela deixa de gerar alerta de reforço e sai do indicador de cobertura.\n' +
        '· Some do catálogo do registro de vacinação.\n' +
        '· Novos registros com ela passam a ser recusados.\n\n' +
        'Dá para reativar depois. Os indicadores do painel podem levar até 5 minutos para acompanhar.',
    )
    if (!confirmado) return
    desativar.mutate(vacina.id, {
      onSuccess: () => toast.sucesso(`${vacina.nome} desativada.`),
      onError: (erro) =>
        toast.erro('Não foi possível desativar a vacina', mensagemDeRegraDaApi(erro) ?? 'Tente novamente.'),
    })
  }

  function handleReativar() {
    atualizar.mutate(
      {
        id: vacina.id,
        payload: { nome: vacina.nome, intervaloMeses: vacina.intervaloMeses ?? undefined, ativo: true },
      },
      {
        onSuccess: () => toast.sucesso(`${vacina.nome} reativada.`),
        onError: (erro) =>
          toast.erro('Não foi possível reativar a vacina', mensagemDeRegraDaApi(erro) ?? 'Tente novamente.'),
      },
    )
  }

  return (
    <tr {...(podeEscrever ? propsDaLinha(onEditar) : {})}>
      <td>{vacina.nome}</td>
      <td>
        {vacina.intervaloMeses === null ? (
          <span className="muted">Sem reforço</span>
        ) : (
          `${vacina.intervaloMeses} ${vacina.intervaloMeses === 1 ? 'mês' : 'meses'}`
        )}
      </td>
      <td>
        <CelulaAlerta vacina={vacina} alerta={alerta} />
      </td>
      <td>
        <span className={`badge ${vacina.ativo ? 'badge-available' : 'badge-deceased'}`}>
          {vacina.ativo ? 'Ativa' : 'Inativa'}
        </span>
      </td>
      {(podeEscrever || podeDesativar) && (
        <td>
          <div className="flex gap-1">
            {podeEscrever && (
              <button
                type="button"
                className="btn btn-ghost btn-sm btn-icon-only"
                title={`Editar ${vacina.nome}`}
                aria-label={`Editar ${vacina.nome}`}
                onClick={onEditar}
              >
                <Icon name="edit" size={14} />
              </button>
            )}
            {vacina.ativo
              ? podeDesativar && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleDesativar}
                    disabled={desativar.isPending}
                  >
                    Desativar
                  </button>
                )
              : podeEscrever && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={handleReativar}
                    disabled={atualizar.isPending}
                  >
                    Reativar
                  </button>
                )}
          </div>
        </td>
      )}
    </tr>
  )
}

function CelulaAlerta({ vacina, alerta }: { vacina: Vacina; alerta: AlertaDaVacina | undefined }) {
  if (!vacina.ativo) return <span className="muted" title="Vacina inativa não gera alerta de reforço.">—</span>
  if (vacina.intervaloMeses === null) {
    return (
      <span className="muted" title="Sem intervalo de reforço cadastrado, não há data de validade a vencer.">
        —
      </span>
    )
  }
  if (!alerta) {
    return <span className="muted">—</span>
  }

  const rotulo = `${alerta.animais} ${alerta.animais === 1 ? 'animal' : 'animais'}`
  const detalhe =
    alerta.vencidas > 0
      ? `${alerta.vencidas} com reforço vencido de ${alerta.animais} em alerta.`
      : 'Reforço a vencer nos próximos 7 dias.'

  return (
    <span className={`badge ${alerta.vencidas > 0 ? 'badge-positive' : 'badge-inconclusive'}`} title={detalhe}>
      {rotulo}
    </span>
  )
}

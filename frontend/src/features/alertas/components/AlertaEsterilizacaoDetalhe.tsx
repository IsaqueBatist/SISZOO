import { Link } from 'react-router-dom'
import { Icon } from '@/components/layout/Icon'
import './AlertaVacinasDetalhe.css'
import { useAlertasEsterilizacaoQuery } from '../hooks/useAlertas'
import { formatarTempoDesdeEntrada, HORAS_A_DISPOSICAO_DO_RESPONSAVEL } from '../utils/tempoDesdeEntrada'
import { formatarDataHoraBR } from '@/lib/datas'
import { normalizarBusca } from '@/lib/texto'
import { useFiltrosLista } from '@/lib/useFiltrosLista'
import { formatarSexo } from '@/features/animais/utils/rotulosAnimal'
import { useLinhaClicavel } from '@/lib/useLinhaClicavel'

const FILTROS_PADRAO = { busca: '' }

export function AlertaEsterilizacaoDetalhe() {
  const { data, isLoading, isError } = useAlertasEsterilizacaoQuery()
  const propsDaLinha = useLinhaClicavel()
  const { filtros, definirFiltros, limparFiltros, filtrosAtivos } = useFiltrosLista(
    'alertas-esterilizacao',
    FILTROS_PADRAO,
  )

  const animais = data ?? []
  const busca = normalizarBusca(filtros.busca)
  const animaisFiltrados = animais.filter(
    (animal) =>
      !busca ||
      normalizarBusca(animal.animalNome).includes(busca) ||
      normalizarBusca(animal.animalMicrochip ?? '').includes(busca),
  )
  const maiorEspera = animais.reduce((maior, animal) => Math.max(maior, animal.horasDesdeEntrada), 0)

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <Link to="/dashboard" className="link-voltar">
            ← Voltar para o início
          </Link>
          <h1>Esterilização pendente</h1>
          <p className="subtitle">
            Animais sob custódia recolhidos há mais de {HORAS_A_DISPOSICAO_DO_RESPONSAVEL} horas e ainda não
            esterilizados
          </p>
        </div>
      </div>

      {isError && (
        <div className="alert danger" role="alert">
          <div className="alert-content">Não foi possível carregar o alerta de esterilização.</div>
        </div>
      )}

      {isLoading && <p>Carregando alertas…</p>}

      {!isLoading && !isError && (
        <>
          <div className="alert-hero warning">
            <div className="ah-ico">
              <Icon name="alert" size={28} />
            </div>
            <div>
              <h2>
                {animais.length === 0
                  ? 'Nenhum animal com esterilização pendente'
                  : `${animais.length} anima${animais.length === 1 ? 'l' : 'is'} com esterilização pendente`}
              </h2>
              <p>
                Prazo de {HORAS_A_DISPOSICAO_DO_RESPONSAVEL} horas desde a entrada, em que o animal fica à disposição do
                responsável.
              </p>
              <div className="ah-kpis">
                <div className="ah-kpi">
                  <span className="v">{animais.length}</span>
                  <span className="l">Animais</span>
                </div>
                <div className="ah-kpi">
                  <span className="v">{animais.length === 0 ? '—' : formatarTempoDesdeEntrada(maiorEspera)}</span>
                  <span className="l">Entrada mais antiga</span>
                </div>
              </div>
            </div>
          </div>

          <div className="filter-bar" style={{ marginTop: 'var(--space-4)' }}>
            <div className="search-input">
              <Icon name="search" size={14} />
              <input
                type="text"
                placeholder="Buscar por animal ou microchip..."
                aria-label="Buscar alertas de esterilização"
                value={filtros.busca}
                onChange={(event) => definirFiltros({ busca: event.target.value })}
              />
            </div>
            {filtrosAtivos && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={limparFiltros}>
                Limpar filtros
              </button>
            )}
          </div>

          <div className="card" style={{ marginTop: 'var(--space-4)' }}>
            <div className="card-header">
              <h3>Animais afetados</h3>
              <span className="sub">Clique no nome do animal para abrir a ficha</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {animais.length === 0 && (
                <div className="empty">
                  <h3>Nenhum animal com esterilização pendente no momento</h3>
                  <p>
                    Quando um animal não esterilizado completar {HORAS_A_DISPOSICAO_DO_RESPONSAVEL} horas desde a entrada,
                    ele aparece aqui.
                  </p>
                </div>
              )}
              {animais.length > 0 && animaisFiltrados.length === 0 && (
                <div className="empty">
                  <h3>Nenhum alerta encontrado</h3>
                  <p>Nenhum resultado com estes filtros.</p>
                  <button type="button" className="btn btn-outline btn-sm" onClick={limparFiltros}>
                    Limpar filtros
                  </button>
                </div>
              )}
              {animaisFiltrados.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Animal</th>
                        <th>Espécie · Sexo</th>
                        <th>Status</th>
                        <th>Baia</th>
                        <th>Entrada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {animaisFiltrados.map((animal) => (
                        <tr key={animal.animalId} {...propsDaLinha(`/animais/${animal.animalId}`)}>
                          <td>
                            <Link to={`/animais/${animal.animalId}`} style={{ fontWeight: 600 }}>
                              {animal.animalNome}
                            </Link>
                          </td>
                          <td>
                            {animal.animalEspecieNome} · {formatarSexo(animal.animalSexo)}
                          </td>
                          <td>{animal.animalStatusNome}</td>
                          <td>{animal.animalBaiaNome ?? '—'}</td>
                          <td>
                            {formatarDataHoraBR(animal.dataEntrada)} · {formatarTempoDesdeEntrada(animal.horasDesdeEntrada)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

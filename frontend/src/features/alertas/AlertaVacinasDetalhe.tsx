import { Link } from 'react-router-dom'
import { Icon } from '../../components/layout/Icon'
import './AlertaVacinasDetalhe.css'
import { useAlertasVacinaisQuery } from './useAlertas'
import type { AlertaVacinalAnimal, AlertaVacinalItem } from './alertas.types'

const FUSO_ITU = 'America/Sao_Paulo'

function formatarData(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: FUSO_ITU }).format(
    new Date(iso),
  )
}

function formatarSexo(sexo: string): string {
  if (sexo === 'macho') return 'Macho'
  if (sexo === 'femea') return 'Fêmea'
  return 'Não identificado'
}

function formatarPrazo(diasRestantes: number): string {
  if (diasRestantes < 0) return `vencida há ${Math.abs(diasRestantes)}d`
  if (diasRestantes === 0) return 'vence hoje'
  return `em ${diasRestantes}d`
}

interface Linha {
  animal: AlertaVacinalAnimal
  item: AlertaVacinalItem
}

export function AlertaVacinasDetalhe() {
  const { data, isLoading, isError } = useAlertasVacinaisQuery()

  const linhas: Linha[] = (data ?? []).flatMap((animal) => animal.vacinas.map((item) => ({ animal, item })))
  const vencidas = linhas.filter((linha) => linha.item.severidade === 'VENCIDA')
  const totalVencidas = vencidas.length
  const totalAVencer = linhas.length - totalVencidas
  const atrasoMedio =
    totalVencidas === 0
      ? 0
      : Math.round(vencidas.reduce((soma, linha) => soma + Math.abs(linha.item.diasRestantes), 0) / totalVencidas)
  const heroTom = totalVencidas > 0 ? 'danger' : 'warning'

  return (
    <>
      <div className="page-header">
        <div className="title-block">
          <Link to="/dashboard" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start', marginBottom: 4 }}>
            ← Voltar para Dashboard
          </Link>
          <h1>Vacinas vencendo ou vencidas</h1>
          <p className="subtitle">Reforços com vencimento em até 7 dias, e reforços já vencidos</p>
        </div>
      </div>

      {isError && (
        <div className="alert danger" role="alert">
          <span className="bullet" />
          <div className="alert-content">Não foi possível carregar os alertas de vacina.</div>
        </div>
      )}

      {isLoading && <p>Carregando alertas…</p>}

      {!isLoading && !isError && (
        <>
          <div className={`alert-hero ${heroTom}`}>
            <div className="ah-ico">
              <Icon name="syringe" size={28} />
            </div>
            <div>
              <h2>
                {linhas.length === 0
                  ? 'Nenhuma vacina vencendo ou vencida'
                  : `${linhas.length} vacina${linhas.length === 1 ? '' : 's'} em alerta`}
              </h2>
              <p>Janela de 7 dias de antecedência para reforço vacinal.</p>
              <div className="ah-kpis">
                <div className="ah-kpi">
                  <span className="v">{data?.length ?? 0}</span>
                  <span className="l">Animais</span>
                </div>
                <div className="ah-kpi">
                  <span className="v">{totalVencidas}</span>
                  <span className="l">Vencidas</span>
                </div>
                <div className="ah-kpi">
                  <span className="v">{totalAVencer}</span>
                  <span className="l">A vencer</span>
                </div>
                <div className="ah-kpi">
                  <span className="v">{atrasoMedio}d</span>
                  <span className="l">Atraso médio</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 'var(--space-4)' }}>
            <div className="card-header">
              <h3>Animais afetados</h3>
              <span className="sub">Clique no nome do animal para abrir a ficha</span>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {linhas.length === 0 ? (
                <div className="empty">
                  <h3>Nenhuma vacina vencendo ou vencida no momento</h3>
                  <p>Quando algum reforço entrar na janela de 7 dias, ele aparece aqui.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Animal</th>
                        <th>Espécie · Sexo</th>
                        <th>Baia</th>
                        <th>Vacina</th>
                        <th>Vence em</th>
                        <th>Veterinário</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map(({ animal, item }) => (
                        <tr key={item.vacinacaoId}>
                          <td>
                            <Link to={`/animais/${animal.animalId}`} style={{ fontWeight: 600 }}>
                              {animal.animalNome}
                            </Link>
                          </td>
                          <td>
                            {animal.animalEspecieNome} · {formatarSexo(animal.animalSexo)}
                          </td>
                          <td>{animal.animalBaiaNome ?? '—'}</td>
                          <td>{item.vacinaNome}</td>
                          <td className="mono">
                            {formatarData(item.dataValidade)} · {formatarPrazo(item.diasRestantes)}
                          </td>
                          <td>{item.veterinarioNome ?? '—'}</td>
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

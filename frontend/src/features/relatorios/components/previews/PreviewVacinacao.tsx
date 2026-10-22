import { Icon } from '@/components/layout/Icon'
import type { PreviewVacinacao as DadosVacinacao } from '../../types/relatorios.types'

export function PreviewVacinacao({ dados }: { dados: DadosVacinacao }) {
  const semDados = dados.kpis.vacinasAplicadas === 0 && dados.porVacina.length === 0 && dados.animaisVencidos.length === 0

  if (semDados) {
    return (
      <div className="empty">
        <span className="ico">
          <Icon name="syringe" size={28} />
        </span>
        <h3>Nenhuma vacinação no período</h3>
        <p>Ajuste o período para gerar este relatório.</p>
      </div>
    )
  }

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Vacinas aplicadas</span>
          </div>
          <div className="kpi-value">{dados.kpis.vacinasAplicadas}</div>
        </div>
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">% Animais vacinados</span>
          </div>
          <div className="kpi-value">
            {dados.kpis.percentualAnimaisVacinados}
            <span className="unit">%</span>
          </div>
          <div className="kpi-foot">
            <span>
              {dados.kpis.animaisVacinados} de {dados.kpis.totalSobCustodia} animais
            </span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Vencidas (atraso)</span>
          </div>
          <div className="kpi-value">{dados.kpis.vencidas}</div>
        </div>
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">A vencer em 30 dias</span>
          </div>
          <div className="kpi-value">{dados.kpis.aVencerEm30Dias}</div>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: 'var(--space-4)' }}>
        <h2>Aplicações por Vacina</h2>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Vacina</th>
              <th>Aplicações</th>
              <th>Cobertura atual</th>
              <th>Vencendo em 30 dias</th>
            </tr>
          </thead>
          <tbody>
            {dados.porVacina.map((linha) => (
              <tr key={linha.vacina}>
                <td>{linha.vacina}</td>
                <td className="mono">{linha.aplicacoes}</td>
                <td>{linha.coberturaAtualPercentual}%</td>
                <td className="mono">{linha.vencendoEm30Dias}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-header" style={{ marginTop: 'var(--space-4)' }}>
        <h2>Aplicações por Veterinário</h2>
      </div>
      {dados.porVeterinario.length === 0 ? (
        <p className="desc">Nenhuma aplicação registrada no período.</p>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Veterinário</th>
                <th>Aplicações</th>
              </tr>
            </thead>
            <tbody>
              {dados.porVeterinario.map((linha) => (
                <tr key={linha.veterinario}>
                  <td>{linha.veterinario}</td>
                  <td className="mono">{linha.aplicacoes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="section-header" style={{ marginTop: 'var(--space-4)' }}>
        <h2>Animais com Vacinas Vencidas</h2>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Animal</th>
              <th>Microchip</th>
              <th>Baia</th>
              <th>Vacina vencida</th>
              <th>Dias de atraso</th>
            </tr>
          </thead>
          <tbody>
            {dados.animaisVencidos.map((linha, indice) => (
              <tr key={`${linha.animal}-${indice}`}>
                <td>{linha.animal}</td>
                <td className="mono">{linha.microchip ?? '—'}</td>
                <td>{linha.baia ?? '—'}</td>
                <td>{linha.vacina}</td>
                <td className="mono" style={{ color: 'var(--color-danger)' }}>
                  {linha.diasAtraso}
                </td>
              </tr>
            ))}
            {dados.animaisVencidosExcedente > 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  + {dados.animaisVencidosExcedente} animais
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

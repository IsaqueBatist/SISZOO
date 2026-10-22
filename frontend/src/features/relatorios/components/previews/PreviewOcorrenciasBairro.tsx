import { Icon } from '@/components/layout/Icon'
import type { PreviewOcorrenciasBairro as DadosOcorrenciasBairro } from '../../types/relatorios.types'

export function PreviewOcorrenciasBairro({ dados }: { dados: DadosOcorrenciasBairro }) {
  if (dados.kpis.ocorrenciasRegistradas === 0) {
    return (
      <div className="empty">
        <span className="ico">
          <Icon name="map" size={28} />
        </span>
        <h3>Nenhuma ocorrência no período</h3>
        <p>Ajuste o período para gerar este relatório.</p>
      </div>
    )
  }

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Ocorrências registradas</span>
          </div>
          <div className="kpi-value">{dados.kpis.ocorrenciasRegistradas}</div>
        </div>
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Bairros atingidos</span>
          </div>
          <div className="kpi-value">{dados.kpis.bairrosAtingidos}</div>
        </div>
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Tempo médio (h)</span>
          </div>
          <div className="kpi-value">{dados.kpis.tempoMedioHoras ?? '—'}</div>
        </div>
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Encerradas</span>
          </div>
          <div className="kpi-value">
            {dados.kpis.percentualEncerradas}
            <span className="unit">%</span>
          </div>
          <div className="kpi-foot">
            <span>
              {dados.kpis.encerradas} de {dados.kpis.ocorrenciasRegistradas}
            </span>
          </div>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: 'var(--space-4)' }}>
        <h2>Bairros com mais ocorrências</h2>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Bairro</th>
              <th>Ocorrências</th>
              <th>Tipo predominante</th>
              <th>Tempo médio (h)</th>
            </tr>
          </thead>
          <tbody>
            {dados.bairros.map((linha) => (
              <tr key={linha.bairro}>
                <td>{linha.bairro}</td>
                <td className="mono">{linha.ocorrencias}</td>
                <td>{linha.tipoPredominante}</td>
                <td className="mono">{linha.tempoMedioHoras ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-header" style={{ marginTop: 'var(--space-4)' }}>
        <h2>Tipos de ocorrência</h2>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {dados.tipos.map((linha) => (
              <tr key={linha.tipo}>
                <td>{linha.tipo}</td>
                <td className="mono">{linha.quantidade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="alert info" role="note">
        <span className="bullet" />
        <div className="alert-content">{dados.notaFocoGeografico}</div>
      </div>
    </>
  )
}

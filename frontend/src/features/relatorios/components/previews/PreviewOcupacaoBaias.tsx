import { Icon } from '@/components/layout/Icon'
import { formatarDataBR } from '@/lib/datas'
import type { PreviewOcupacaoBaias as DadosOcupacaoBaias, StatusOcupacaoBaia } from '../../types/relatorios.types'

const CLASSE_STATUS: Record<StatusOcupacaoBaia, string> = {
  normal: 'badge-available',
  proximo_limite: 'badge-process-awaiting',
  superlotada: 'badge-positive',
}

export function PreviewOcupacaoBaias({ dados }: { dados: DadosOcupacaoBaias }) {
  if (dados.baias.length === 0) {
    return (
      <div className="empty">
        <span className="ico">
          <Icon name="inbox" size={28} />
        </span>
        <h3>Nenhuma baia cadastrada</h3>
        <p>Cadastre baias em Gestão de Baias para gerar este relatório.</p>
      </div>
    )
  }

  return (
    <>
      <p className="subtitle" style={{ padding: '0 var(--space-4)' }}>
        Posição em {formatarDataBR(dados.periodoFim)}
      </p>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Ocupação média</span>
          </div>
          <div className="kpi-value">
            {dados.kpis.ocupacaoMediaPercentual}
            <span className="unit">%</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Baias superlotadas</span>
          </div>
          <div className="kpi-value">{dados.kpis.baiasSuperlotadas}</div>
        </div>
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Baias próximas do limite</span>
          </div>
          <div className="kpi-value">{dados.kpis.baiasNoLimite}</div>
        </div>
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Capacidade total</span>
          </div>
          <div className="kpi-value">{dados.kpis.capacidadeTotal}</div>
        </div>
      </div>

      <div className="table-wrap" style={{ marginTop: 'var(--space-4)' }}>
        <table className="data">
          <thead>
            <tr>
              <th>Baia</th>
              <th>Capacidade</th>
              <th>Atual</th>
              <th>% Ocupação</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {dados.baias.map((linha) => (
              <tr key={linha.baia}>
                <td>{linha.baia}</td>
                <td className="mono">{linha.capacidade}</td>
                <td className="mono">{linha.atual}</td>
                <td>{linha.percentualOcupacao}%</td>
                <td>
                  <span className={`badge ${CLASSE_STATUS[linha.status]}`}>{linha.rotuloStatus}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

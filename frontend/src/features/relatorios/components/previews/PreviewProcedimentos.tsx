import { Icon } from '@/components/layout/Icon'
import { formatarData } from '@/features/ocorrencias/utils/datas'
import type { PreviewProcedimentos as DadosProcedimentos } from '../../types/relatorios.types'

export function PreviewProcedimentos({ dados }: { dados: DadosProcedimentos }) {
  if (dados.kpis.totalProcedimentos === 0) {
    return (
      <div className="empty">
        <span className="ico">
          <Icon name="scissors" size={28} />
        </span>
        <h3>Nenhum procedimento no período</h3>
        <p>Ajuste o período para gerar este relatório.</p>
      </div>
    )
  }

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Total de procedimentos</span>
          </div>
          <div className="kpi-value">{dados.kpis.totalProcedimentos}</div>
        </div>
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Castrações</span>
          </div>
          <div className="kpi-value">{dados.kpis.castracoes}</div>
          <div className="kpi-foot">
            <span>
              {dados.kpis.castracoesMachos} machos · {dados.kpis.castracoesFemeas} fêmeas
            </span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Atendimentos clínicos</span>
          </div>
          <div className="kpi-value">{dados.kpis.atendimentosClinicos}</div>
        </div>
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Cirurgias maiores</span>
          </div>
          <div className="kpi-value">{dados.kpis.cirurgiasMaiores}</div>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: 'var(--space-4)' }}>
        <h2>Procedimentos por tipo</h2>
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
            {dados.porTipo.map((linha) => (
              <tr key={linha.tipo}>
                <td>{linha.tipo}</td>
                <td className="mono">{linha.quantidade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-header" style={{ marginTop: 'var(--space-4)' }}>
        <h2>Produtividade por Veterinário</h2>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Veterinário</th>
              <th>Atendimentos</th>
              <th>Castrações</th>
              <th>Cirurgias</th>
              <th>Vacinações</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {dados.porVeterinario.map((linha) => (
              <tr key={linha.veterinario}>
                <td>{linha.veterinario}</td>
                <td className="mono">{linha.atendimentos}</td>
                <td className="mono">{linha.castracoes}</td>
                <td className="mono">{linha.cirurgias}</td>
                <td className="mono">{linha.vacinacoes}</td>
                <td className="mono">{linha.total}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 700 }}>
              <td>TOTAL</td>
              <td className="mono">{dados.totalVeterinarios.atendimentos}</td>
              <td className="mono">{dados.totalVeterinarios.castracoes}</td>
              <td className="mono">{dados.totalVeterinarios.cirurgias}</td>
              <td className="mono">{dados.totalVeterinarios.vacinacoes}</td>
              <td className="mono">{dados.totalVeterinarios.total}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="section-header" style={{ marginTop: 'var(--space-4)' }}>
        <h2>Cirurgias realizadas</h2>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Data</th>
              <th>Animal</th>
              <th>Procedimento</th>
              <th>Vet. responsável</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {dados.cirurgias.map((linha, indice) => (
              <tr key={`${linha.animal}-${indice}`}>
                <td className="mono">{formatarData(linha.data)}</td>
                <td>{linha.animal}</td>
                <td>{linha.procedimento}</td>
                <td>{linha.veterinario}</td>
                <td>{linha.resultado}</td>
              </tr>
            ))}
            {dados.cirurgiasExcedente > 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  + {dados.cirurgiasExcedente} cirurgias
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

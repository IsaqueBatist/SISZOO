import { formatarDataBR } from '@/lib/datas'
import type { PreviewAdocoes as DadosAdocoes } from '../../types/relatorios.types'

export function PreviewAdocoes({ dados }: { dados: DadosAdocoes }) {
  return (
    <>
      <p className="subtitle" style={{ padding: '0 var(--space-4)' }}>
        Posição em {formatarDataBR(dados.periodoFim)}
      </p>

      <div className="alert warning" role="note">
        <span className="bullet" />
        <div className="alert-content">{dados.notaLimitacao}</div>
      </div>

      <div className="kpi-grid" style={{ marginTop: 'var(--space-4)' }}>
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Animais adotados</span>
          </div>
          <div className="kpi-value">{dados.kpis.animaisAdotados}</div>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: 'var(--space-4)' }}>
        <h2>Perfil dos animais adotados</h2>
      </div>
      {dados.perfil.length === 0 ? (
        <p className="desc">Nenhum animal adotado até o momento.</p>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Característica</th>
                <th>Quantidade</th>
                <th>% do total</th>
              </tr>
            </thead>
            <tbody>
              {dados.perfil.map((linha) => (
                <tr key={linha.caracteristica}>
                  <td>{linha.caracteristica}</td>
                  <td className="mono">{linha.quantidade}</td>
                  <td>{linha.percentual}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

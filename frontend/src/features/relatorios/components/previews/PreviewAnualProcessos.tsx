import type { PreviewAnualProcessos as DadosAnualProcessos } from '../../types/relatorios.types'

const CORES_ESPECIE = ['#1565C0', '#00695C', '#6A1B9A', '#424242']

export function PreviewAnualProcessos({ dados }: { dados: DadosAnualProcessos }) {
  if (dados.kpis.processosAbertos === 0) {
    return (
      <div className="empty">
        <h3>Nenhum processo sanitário em {dados.ano}</h3>
        <p>Ajuste o ano para gerar este relatório.</p>
      </div>
    )
  }

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Processos abertos</span>
          </div>
          <div className="kpi-value">{dados.kpis.processosAbertos}</div>
        </div>
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Confirmados positivos</span>
          </div>
          <div className="kpi-value">{dados.kpis.confirmadosPositivos}</div>
          <div className="kpi-foot">
            <span>{dados.kpis.percentualPositividade}% de positividade</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Com contato humano</span>
          </div>
          <div className="kpi-value">{dados.kpis.comContatoHumano}</div>
          <div className="kpi-foot">
            <span>Processos urgentes no ano</span>
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-head">
            <span className="kpi-label">Tempo médio (dias)</span>
          </div>
          <div className="kpi-value">{dados.kpis.tempoMedioDias ?? '—'}</div>
          <div className="kpi-foot">
            <span>Abertura → resultado</span>
          </div>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: 'var(--space-4)' }}>
        <h2>1. Sumário Executivo</h2>
      </div>
      <p className="desc">{dados.sumarioExecutivo}</p>

      <div className="section-header" style={{ marginTop: 'var(--space-4)' }}>
        <h2>2. Distribuição por Patologia</h2>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Doença</th>
              <th>Quantidade</th>
            </tr>
          </thead>
          <tbody>
            {dados.porPatologia.map((linha) => (
              <tr key={linha.doenca}>
                <td>{linha.doenca}</td>
                <td className="mono">{linha.quantidade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-header" style={{ marginTop: 'var(--space-4)' }}>
        <h2>3. Resultados Laboratoriais</h2>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Doença</th>
              <th>Investigados</th>
              <th>Positivos</th>
              <th>Negativos</th>
              <th>Inconclus.</th>
              <th>Aguard.</th>
              <th>Positividade</th>
            </tr>
          </thead>
          <tbody>
            {dados.resultadosPorDoenca.map((linha) => (
              <tr key={linha.doenca}>
                <td>{linha.doenca}</td>
                <td className="mono">{linha.investigados}</td>
                <td className="mono">{linha.positivos}</td>
                <td className="mono">{linha.negativos}</td>
                <td className="mono">{linha.inconclusivos}</td>
                <td className="mono">{linha.aguardando}</td>
                <td>{linha.percentualPositividade}%</td>
              </tr>
            ))}
            <tr style={{ fontWeight: 700 }}>
              <td>TOTAL</td>
              <td className="mono">{dados.totalResultados.investigados}</td>
              <td className="mono">{dados.totalResultados.positivos}</td>
              <td className="mono">{dados.totalResultados.negativos}</td>
              <td className="mono">{dados.totalResultados.inconclusivos}</td>
              <td className="mono">{dados.totalResultados.aguardando}</td>
              <td>{dados.totalResultados.percentualPositividade}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="section-header" style={{ marginTop: 'var(--space-4)' }}>
        <h2>4. Distribuição por Espécie</h2>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Espécie</th>
              <th>Quantidade</th>
              <th>% do total</th>
            </tr>
          </thead>
          <tbody>
            {dados.porEspecie.map((linha, indice) => (
              <tr key={linha.especie}>
                <td>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      marginRight: 6,
                      background: CORES_ESPECIE[indice % CORES_ESPECIE.length],
                    }}
                  />
                  {linha.especie}
                </td>
                <td className="mono">{linha.quantidade}</td>
                <td>{linha.percentual}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-header" style={{ marginTop: 'var(--space-4)' }}>
        <h2>5. Bairros com mais ocorrências</h2>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Bairro</th>
              <th>Processos</th>
              <th>Positivos</th>
              <th>Doenças predominantes</th>
            </tr>
          </thead>
          <tbody>
            {dados.bairros.map((linha) => (
              <tr key={linha.bairro}>
                <td>{linha.bairro}</td>
                <td className="mono">{linha.processos}</td>
                <td className="mono">{linha.positivos}</td>
                <td>{linha.doencasPredominantes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-header" style={{ marginTop: 'var(--space-4)' }}>
        <h2>6. Laboratórios utilizados</h2>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Laboratório</th>
              <th>Amostras</th>
              <th>% do total</th>
              <th>Tempo médio (dias)</th>
            </tr>
          </thead>
          <tbody>
            {dados.laboratorios.map((linha) => (
              <tr key={linha.laboratorio}>
                <td>{linha.laboratorio}</td>
                <td className="mono">{linha.amostras}</td>
                <td>{linha.percentualDoTotal}%</td>
                <td className="mono">{linha.tempoMedioDias ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="alert info" role="note">
        <span className="bullet" />
        <div className="alert-content">
          <strong>Observação LGPD:</strong> Este relatório consolida dados de forma anonimizada.
        </div>
      </div>
    </>
  )
}

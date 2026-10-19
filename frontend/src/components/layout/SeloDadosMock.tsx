// Selo exibido quando os dados do card/gráfico vêm de um mock local (env var
// VITE_USE_MOCK_KPIS / VITE_USE_MOCK_GRAFICOS ligada), porque o endpoint real
// ainda não existe no backend. Nunca aparece em dados reais.
export function SeloDadosMock() {
  return (
    <span className="badge-mock" title="Endpoint real ainda não existe — exibindo dados de exemplo.">
      Dados de demonstração
    </span>
  )
}

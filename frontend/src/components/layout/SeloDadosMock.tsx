// Selo exibido quando os dados do card/gráfico vêm do mock local de
// desenvolvimento (VITE_USE_MOCK_KPIS / VITE_USE_MOCK_GRAFICOS = "true" no
// build). Nunca aparece com dados reais da API.
export function SeloDadosMock() {
  return (
    <span className="badge-mock" title="Modo de demonstração ligado no build — dados de exemplo, não vêm da API.">
      Dados de demonstração
    </span>
  )
}

// Faixa de contagens acima de uma lista de catálogo. Os números são sempre
// derivados do conjunto COMPLETO carregado pela tela, não do que está filtrado
// na tabela — senão o resumo mudaria a cada tecla da busca e deixaria de
// resumir o catálogo.
export interface ItemResumo {
  // Chave estável: o rótulo pode repetir entre telas.
  id: string
  valor: number
  rotulo: string
  descricao: string
  // Destaca o número quando ele pede ação (ex.: animais em alerta).
  alerta?: boolean
}

export function ResumoCatalogo({ itens }: { itens: ItemResumo[] }) {
  return (
    <div className="grid grid-4" style={{ gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
      {itens.map((item) => (
        <div key={item.id} className={`resumo-card${item.alerta && item.valor > 0 ? ' alerta' : ''}`}>
          <span className="num">{item.valor}</span>
          <div>
            <div className="rotulo">{item.rotulo}</div>
            <div className="desc">{item.descricao}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

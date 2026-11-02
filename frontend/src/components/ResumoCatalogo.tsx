export interface ItemResumo {
  id: string
  valor: number
  rotulo: string
  descricao: string
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

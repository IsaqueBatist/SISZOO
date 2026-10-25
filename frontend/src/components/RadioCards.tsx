import type { ReactNode } from 'react'

export interface OpcaoRadioCard<T extends string> {
  valor: T
  label: string
  sub?: string
  icone?: ReactNode
}

interface RadioCardsProps<T extends string> {
  opcoes: readonly OpcaoRadioCard<T>[]
  valor: T | undefined
  onChange: (valor: T) => void
  // Colunas fixas na grade (sem o valor, a grade do CSS decide).
  colunas?: number
  'aria-label'?: string
  'aria-labelledby'?: string
}

// Grupo de cartões de escolha única do design system (.radio-cards), com a
// semântica de radiogroup.
export function RadioCards<T extends string>({
  opcoes,
  valor,
  onChange,
  colunas,
  'aria-label': rotulo,
  'aria-labelledby': rotuladoPor,
}: RadioCardsProps<T>) {
  return (
    <div
      className="radio-cards"
      style={colunas ? { gridTemplateColumns: `repeat(${colunas}, 1fr)` } : undefined}
      role="radiogroup"
      aria-label={rotulo}
      aria-labelledby={rotuladoPor}
    >
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          role="radio"
          aria-checked={valor === opcao.valor}
          className={`radio-card${valor === opcao.valor ? ' selected' : ''}`}
          onClick={() => onChange(opcao.valor)}
        >
          {opcao.icone && <span className="ico">{opcao.icone}</span>}
          <span className="label">{opcao.label}</span>
          {opcao.sub && <span className="sub">{opcao.sub}</span>}
        </button>
      ))}
    </div>
  )
}

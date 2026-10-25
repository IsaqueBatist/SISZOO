interface SwitchProps {
  checked: boolean
  onChange: (marcado: boolean) => void
  disabled?: boolean
  // Obrigatório: o seletor não tem texto próprio (o rótulo visível fica ao lado).
  'aria-label': string
}

// Seletor liga/desliga do design system (.switch/.slider).
export function Switch({ checked, onChange, disabled, 'aria-label': rotulo }: SwitchProps) {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={rotulo}
      />
      <span className="slider" />
    </label>
  )
}

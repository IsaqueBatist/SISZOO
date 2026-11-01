interface FiltroPeriodoProps {
  rotulo: string
  de: string
  ate: string
  onAlterar: (periodo: { de?: string; ate?: string }) => void
}

export function FiltroPeriodo({ rotulo, de, ate, onAlterar }: FiltroPeriodoProps) {
  const invertido = Boolean(de && ate && de > ate)

  return (
    <div className={`filter-periodo${de || ate ? ' ativo' : ''}`} role="group" aria-label={rotulo}>
      <span className="rotulo">{rotulo}</span>
      <input
        type="date"
        aria-label={`${rotulo} a partir de`}
        value={de}
        max={ate || undefined}
        onChange={(event) => onAlterar({ de: event.target.value })}
      />
      <span className="rotulo">até</span>
      <input
        type="date"
        aria-label={`${rotulo} até`}
        value={ate}
        min={de || undefined}
        onChange={(event) => onAlterar({ ate: event.target.value })}
      />
      {invertido && (
        <span className="erro" role="alert">
          A data final deve ser igual ou posterior à inicial.
        </span>
      )}
    </div>
  )
}

import { Fragment } from 'react'

interface StepperProps {
  etapas: readonly string[]
  // 1-based: a etapa em andamento; as anteriores aparecem como concluídas.
  atual: number
}

// Indicador de etapas dos formulários em wizard (.stepper).
export function Stepper({ etapas, atual }: StepperProps) {
  return (
    <div className="stepper">
      {etapas.map((rotulo, indice) => {
        const numero = indice + 1
        return (
          <Fragment key={rotulo}>
            {indice > 0 && <div className={`arrow${atual > numero - 1 ? ' done' : ''}`} />}
            <div className={`step${atual === numero ? ' active' : atual > numero ? ' done' : ''}`}>
              <span className="num">{numero}</span>
              <span>{rotulo}</span>
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}

import { Fragment } from 'react'

interface StepperProps {
  etapas: readonly string[]
  atual: number
  onIrPara?: (numero: number) => void
}

export function Stepper({ etapas, atual, onIrPara }: StepperProps) {
  return (
    <div className="stepper">
      {etapas.map((rotulo, indice) => {
        const numero = indice + 1
        const classe = `step${atual === numero ? ' active' : atual > numero ? ' done' : ''}`
        const conteudo = (
          <>
            <span className="num">{numero}</span>
            <span>{rotulo}</span>
          </>
        )
        return (
          <Fragment key={rotulo}>
            {indice > 0 && <div className={`arrow${atual > numero - 1 ? ' done' : ''}`} />}
            {onIrPara ? (
              <button
                type="button"
                className={`${classe} step-botao`}
                aria-current={atual === numero ? 'step' : undefined}
                onClick={() => onIrPara(numero)}
              >
                {conteudo}
              </button>
            ) : (
              <div className={classe} aria-current={atual === numero ? 'step' : undefined}>
                {conteudo}
              </div>
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

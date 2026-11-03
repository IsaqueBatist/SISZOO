import { useEffect, useRef } from 'react'

interface AlertaErroEnvioProps {
  mensagem: string | null
  estilo?: React.CSSProperties
}

export function AlertaErroEnvio({ mensagem, estilo }: AlertaErroEnvioProps) {
  const alerta = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mensagem || !alerta.current) return
    alerta.current.focus({ preventScroll: true })
    alerta.current.scrollIntoView?.({ block: 'center' })
  }, [mensagem])

  if (!mensagem) return null

  return (
    <div ref={alerta} className="alert danger" role="alert" tabIndex={-1} style={estilo}>
      <div className="alert-content">{mensagem}</div>
    </div>
  )
}

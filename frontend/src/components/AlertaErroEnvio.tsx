import { useEffect, useRef } from 'react'

interface AlertaErroEnvioProps {
  mensagem: string | null
  estilo?: React.CSSProperties
}

// Erro de envio de formulário. O botão de salvar costuma estar no fim da página
// e o aviso, no topo: sem levar a tela e o foco até ele, a falha passa
// despercebida e a pessoa acredita que o registro foi salvo.
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
      <span className="bullet" />
      <div className="alert-content">{mensagem}</div>
    </div>
  )
}

interface AvisoEnvioPausadoProps {
  pausado: boolean
}

export function AvisoEnvioPausado({ pausado }: AvisoEnvioPausadoProps) {
  if (!pausado) return null

  return (
    <span className="hint envio-pausado" role="status">
      Sem conexão. O envio será concluído quando a internet voltar.
    </span>
  )
}

interface AvisoEnvioPausadoProps {
  // `isPaused` da mutation: sem rede, o TanStack Query segura o envio e o
  // retoma sozinho quando a conexão volta.
  pausado: boolean
}

// Fica junto do botão de salvar, onde a pessoa está olhando enquanto espera.
export function AvisoEnvioPausado({ pausado }: AvisoEnvioPausadoProps) {
  if (!pausado) return null

  return (
    <span className="hint envio-pausado" role="status">
      Sem conexão. O envio será concluído quando a internet voltar.
    </span>
  )
}

export function extrairNomeArquivo(header: string | undefined | null): string | null {
  if (!header) return null

  const estendido = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header)
  if (estendido) {
    try {
      return decodeURIComponent(estendido[1].trim())
    } catch {
    }
  }

  const simples = /filename\s*=\s*"?([^";]+)"?/i.exec(header)
  return simples ? simples[1].trim() : null
}

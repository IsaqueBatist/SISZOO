// Extrai o nome do arquivo do header Content-Disposition (RFC 6266/5987),
// enviado pelo backend via ContentDisposition.builder("attachment").filename(nome, UTF_8).
// Prioriza a forma estendida filename*=UTF-8''... (nome com acentos
// corretos) e só cai no filename="..." simples se o header não tiver essa
// forma — nunca o contrário, senão acentos vem incorretos quando o backend
// manda as duas formas (compatibilidade com clientes antigos).
export function extrairNomeArquivo(header: string | undefined | null): string | null {
  if (!header) return null

  const estendido = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header)
  if (estendido) {
    try {
      return decodeURIComponent(estendido[1].trim())
    } catch {
      // Valor malformado: cai no fallback abaixo em vez de propagar o erro.
    }
  }

  const simples = /filename\s*=\s*"?([^";]+)"?/i.exec(header)
  return simples ? simples[1].trim() : null
}

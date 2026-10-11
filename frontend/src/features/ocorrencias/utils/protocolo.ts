// Ocorrência e processo usam o mesmo formato NNN/AAAA, com sequências
// independentes (D13) — "015/2026" pode ser dos dois. O prefixo existe só na
// exibição (D36); banco e API guardam o número puro, e a busca aceita os dois.
export function formatarProtocoloOcorrencia(protocolo: string): string {
  return `OC ${protocolo}`
}

export function formatarProtocoloProcesso(protocolo: string): string {
  return `PS ${protocolo}`
}

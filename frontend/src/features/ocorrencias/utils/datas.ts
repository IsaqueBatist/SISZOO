// Datas da API de ocorrências chegam sem fuso, já no horário local do CCZ
// (America/Sao_Paulo): `LocalDate` "2026-10-11", `LocalDateTime`
// "2026-10-11T19:28:59.9697862" (fração de segundo de tamanho variável) e
// `LocalTime` "10:30:00". Formatar separando a string — mesmo padrão de
// animais/AbaVacinas.tsx — evita o `new Date("2026-10-11")`, que o navegador
// lê como meia-noite UTC e mostraria o dia anterior em São Paulo.

// "2026-10-11" ou "2026-10-11T19:28:59.97" -> "11/10/2026"
export function formatarData(valor: string): string {
  const [ano, mes, dia] = valor.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

// "10:30:00" ou "10:30" -> "10:30"
export function formatarHora(valor: string): string {
  return valor.slice(0, 5)
}

// "2026-10-11T19:28:59.97" -> "11/10/2026 · 19:28" (separador do protótipo
// docs/prototipo/ocorrencia.html)
export function formatarDataHora(valor: string): string {
  return `${formatarData(valor)} · ${formatarHora(valor.slice(11))}`
}

// Data de hoje (AAAA-MM-DD) no fuso do CCZ, para campos de data padrão.
export function hojeIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}

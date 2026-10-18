// Datas de negócio do backend chegam sem fuso, já no horário do CCZ
// (America/Sao_Paulo): `LocalDate` "2026-10-11" ou `LocalDateTime`
// "2026-10-11T19:28:59.97". `new Date("2026-10-11")` é lido como meia-noite
// UTC (regra do ECMAScript para data sem hora) e, formatado em São Paulo,
// mostra o dia anterior — por isso a formatação separa a string em vez de
// passar por `Date`.
export const FUSO_ITU = 'America/Sao_Paulo'

// Data de hoje (AAAA-MM-DD) no fuso do CCZ. `toISOString()` daria o dia em
// UTC, que entre 21h e 23h59 em Itu já é o dia seguinte.
export function hojeEmItu(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO_ITU }).format(new Date())
}

// "2026-10-11" ou "2026-10-11T19:28:59.97" -> "11/10/2026"; nulo ou vazio -> "—"
export function formatarDataBR(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  if (!ano || !mes || !dia) return '—'
  return `${dia}/${mes}/${ano}`
}

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

// "2026-10-11T19:28:59.97" -> "11/10/2026, 19:28" (mesmo desenho do Intl
// pt-BR com hora); nulo, vazio ou sem hora -> "—". Mesma regra de
// formatarDataBR: LocalDateTime já é horário de Itu, sem passar por `Date`.
export function formatarDataHoraBR(iso: string | null | undefined): string {
  const data = formatarDataBR(iso)
  const hora = iso?.slice(11, 16) ?? ''
  if (data === '—' || !/^\d{2}:\d{2}$/.test(hora)) return '—'
  return `${data}, ${hora}`
}

// Soma dias a uma data civil (AAAA-MM-DD), sem hora e sem fuso.
export function adicionarDiasIso(isoDate: string, dias: number): string {
  const [ano, mes, dia] = isoDate.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10)
}

// Dias civis em Itu de uma data ou LocalDateTime da API até hoje: 0 = hoje,
// 1 = ontem. Conta pelo calendário, não por blocos de 24 h.
export function diasCivisAteHoje(iso: string): number {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number)
  const [anoHoje, mesHoje, diaHoje] = hojeEmItu().split('-').map(Number)
  return Math.round((Date.UTC(anoHoje, mesHoje - 1, diaHoje) - Date.UTC(ano, mes - 1, dia)) / 86_400_000)
}

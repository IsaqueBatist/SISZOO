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

// Agora como LocalDateTime de Itu ("AAAA-MM-DDTHH:mm:ss"), o formato que a API
// devolve em criadoEm/atualizadoEm (sem fuso). Usado pelo mock.
export function agoraEmItu(): string {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: FUSO_ITU,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((parte) => [parte.type, parte.value]),
  )
  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}:${partes.second}`
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

// Instante local (Date.now(), do próprio navegador) -> "24/10/2026, 19:42" no
// fuso do CCZ. Diferente de formatarDataHoraBR, que recebe o LocalDateTime em
// string que a API devolve: aqui a origem é um timestamp epoch gravado pelo
// front (o `salvoEm` do rascunho, T42), que precisa passar por Date.
export function formatarInstanteBR(ms: number): string {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: FUSO_ITU,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(ms))
      .map((parte) => [parte.type, parte.value]),
  )
  return `${partes.day}/${partes.month}/${partes.year}, ${partes.hour}:${partes.minute}`
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

const FUSO_ITU = 'America/Sao_Paulo'

export function hojeEmItu(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO_ITU }).format(new Date())
}

export function naoEhFutura(data: string): boolean {
  return !data || data <= hojeEmItu()
}

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

export function formatarDataBR(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  if (!ano || !mes || !dia) return '—'
  return `${dia}/${mes}/${ano}`
}

export function formatarDataHoraBR(iso: string | null | undefined): string {
  const data = formatarDataBR(iso)
  const hora = iso?.slice(11, 16) ?? ''
  if (data === '—' || !/^\d{2}:\d{2}$/.test(hora)) return '—'
  return `${data}, ${hora}`
}

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

export function adicionarDiasIso(isoDate: string, dias: number): string {
  const [ano, mes, dia] = isoDate.slice(0, 10).split('-').map(Number)
  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10)
}

export function adicionarMesesIso(isoDate: string, meses: number): string {
  const [ano, mes, dia] = isoDate.slice(0, 10).split('-').map(Number)
  const mesAlvoZeroBased = mes - 1 + meses
  const ultimoDiaDoMesAlvo = new Date(Date.UTC(ano, mesAlvoZeroBased + 1, 0)).getUTCDate()
  return new Date(Date.UTC(ano, mesAlvoZeroBased, Math.min(dia, ultimoDiaDoMesAlvo))).toISOString().slice(0, 10)
}
export function diasCivisAteHoje(iso: string): number {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number)
  const [anoHoje, mesHoje, diaHoje] = hojeEmItu().split('-').map(Number)
  return Math.round((Date.UTC(anoHoje, mesHoje - 1, diaHoje) - Date.UTC(ano, mes - 1, dia)) / 86_400_000)
}

export function hojePorExtensoEmItu(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: FUSO_ITU,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

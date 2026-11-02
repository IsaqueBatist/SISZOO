import { hojeEmItu } from '@/lib/datas'
import type { EventoAuditoria } from '../types/auditoria.types'

export interface GrupoEventosPorDia {
  rotulo: string
  eventos: EventoAuditoria[]
}

function dataDoEvento(ocorreuEm: string): string {
  return ocorreuEm.slice(0, 10)
}

function ontemIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
    new Date(Date.now() - 24 * 60 * 60 * 1000),
  )
}

function rotuloDoDia(dataIso: string, hoje: string, ontem: string): string {
  if (dataIso === hoje) return 'Hoje'
  if (dataIso === ontem) return 'Ontem'
  const [ano, mes, dia] = dataIso.split('-')
  return `${dia}/${mes}/${ano}`
}

export function agruparPorDia(eventos: EventoAuditoria[]): GrupoEventosPorDia[] {
  const hoje = hojeEmItu()
  const ontem = ontemIso()

  const ordenados = [...eventos].sort((a, b) => (a.ocorreuEm < b.ocorreuEm ? 1 : -1))

  const grupos: GrupoEventosPorDia[] = []
  const indicePorRotulo = new Map<string, number>()

  for (const evento of ordenados) {
    const rotulo = rotuloDoDia(dataDoEvento(evento.ocorreuEm), hoje, ontem)
    const indiceExistente = indicePorRotulo.get(rotulo)
    if (indiceExistente === undefined) {
      indicePorRotulo.set(rotulo, grupos.length)
      grupos.push({ rotulo, eventos: [evento] })
    } else {
      grupos[indiceExistente].eventos.push(evento)
    }
  }

  return grupos
}

import type { EventoAuditoria } from '../types/auditoria.types'
import { labelModulo, moduloDaEntidade, type Modulo } from './moduloDaEntidade'

export interface GrupoEventosPorModulo {
  modulo: Modulo
  rotulo: string
  eventos: EventoAuditoria[]
}

// Mesma técnica de agruparPorDia.ts: Map para preservar a ordem de primeira
// aparição do módulo na lista recebida, em vez de uma ordem fixa arbitrária.
export function agruparPorModulo(eventos: EventoAuditoria[]): GrupoEventosPorModulo[] {
  const grupos: GrupoEventosPorModulo[] = []
  const indicePorModulo = new Map<Modulo, number>()

  for (const evento of eventos) {
    const modulo = moduloDaEntidade(evento.entidade)
    const indiceExistente = indicePorModulo.get(modulo)
    if (indiceExistente === undefined) {
      indicePorModulo.set(modulo, grupos.length)
      grupos.push({ modulo, rotulo: labelModulo(modulo), eventos: [evento] })
    } else {
      grupos[indiceExistente].eventos.push(evento)
    }
  }

  return grupos
}

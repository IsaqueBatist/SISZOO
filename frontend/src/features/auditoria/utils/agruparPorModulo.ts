import type { EventoAuditoria } from '../types/auditoria.types'
import { labelModulo, moduloDaEntidade, type Modulo } from './moduloDaEntidade'

export interface GrupoEventosPorModulo {
  modulo: Modulo
  rotulo: string
  eventos: EventoAuditoria[]
}

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

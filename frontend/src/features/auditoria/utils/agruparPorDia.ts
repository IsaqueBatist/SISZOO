import { hojeIso } from '@/features/ocorrencias/utils/datas'
import type { EventoAuditoria } from '../types/auditoria.types'

export interface GrupoEventosPorDia {
  rotulo: string
  eventos: EventoAuditoria[]
}

// `ocorreuEm` chega sem fuso, já no horário local do CCZ (America/Sao_Paulo)
// — mesmo formato de LocalDateTime documentado em
// features/ocorrencias/utils/datas.ts. Fatiar a string em vez de
// `new Date(ocorreuEm)`: o construtor de Date interpretaria essa string sem
// fuso como horário LOCAL DO NAVEGADOR/MÁQUINA DE TESTE, não de São Paulo —
// o mesmo bug que aquele util já documenta e evita.
function dataDoEvento(ocorreuEm: string): string {
  return ocorreuEm.slice(0, 10)
}

// Aqui sim `new Date()` (sem argumento) é seguro: representa o instante
// atual de verdade, não uma string naive — só convertida para o fuso certo
// na formatação.
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

// Agrupa só a PÁGINA ATUAL de eventos (a tela não finge continuidade entre
// páginas — ex. não junta "Hoje" de duas páginas como se fosse uma lista
// só). Reordena por ocorreuEm desc antes de agrupar (comparação de string,
// segura porque o formato é sempre "AAAA-MM-DDTHH:mm:ss..."), sem assumir
// que o backend já devolve nessa ordem.
export function agruparPorDia(eventos: EventoAuditoria[]): GrupoEventosPorDia[] {
  const hoje = hojeIso()
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

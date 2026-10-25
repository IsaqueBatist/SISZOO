import type { IconName } from '@/components/layout/Icon'
import type { StatusProcesso } from '../types/ocorrencias.types'

export interface Badge {
  classe: string
  label: string
}

// Chaves em maiúsculas (códigos da API, StatusOcorrencia). O mock de
// processos (D40) ainda usa minúsculas nas ocorrências de demonstração — a
// busca normaliza para servir os dois.
const STATUS_BADGE_MAP: Record<string, Badge> = {
  ABERTA: { classe: 'badge-process-open', label: 'Aberta' },
  EM_ATENDIMENTO: { classe: 'badge-process-awaiting', label: 'Em atendimento' },
  ENCERRADA: { classe: 'badge-process-closed', label: 'Encerrada' },
}

export function badgeDeStatus(status: string): Badge {
  return STATUS_BADGE_MAP[status.toUpperCase()] ?? { classe: 'badge-neutral', label: status }
}

// O backend só aceita o status seguinte (ProcessoSanitarioService); null no
// último.
const PROXIMO_STATUS_PROCESSO: Record<StatusProcesso, StatusProcesso | null> = {
  ABERTO: 'AGUARDANDO_RESULTADO',
  AGUARDANDO_RESULTADO: 'COM_RESULTADO',
  COM_RESULTADO: 'CONCLUIDO',
  CONCLUIDO: null,
}

export function proximoStatusProcesso(status: StatusProcesso): StatusProcesso | null {
  return PROXIMO_STATUS_PROCESSO[status]
}

// Rótulos idênticos aos de docs/prototipo/cadastrar-ocorrencia.html.
const TIPO_LABEL_MAP: Record<string, string> = {
  zoonose: 'Suspeita de Zoonose',
  morcegos: 'Infestação de Morcegos',
  irregular: 'Criação Irregular',
  agressivo: 'Animal Agressivo',
  outros: 'Outros',
}

export function labelDeTipo(tipo: string): string {
  return TIPO_LABEL_MAP[tipo] ?? tipo
}

const TIPO_ICONE_MAP: Record<string, IconName> = {
  zoonose: 'alert',
  morcegos: 'bat',
  irregular: 'home',
  agressivo: 'dog',
  outros: 'clipboard',
}

export function iconeDeTipo(tipo: string): IconName {
  return TIPO_ICONE_MAP[tipo] ?? 'clipboard'
}

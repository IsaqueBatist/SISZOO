import type { IconName } from '@/components/layout/Icon'
import type { StatusProcesso } from '../types/ocorrencias.types'

export interface Badge {
  classe: string
  label: string
}

const STATUS_BADGE_MAP: Record<string, Badge> = {
  ABERTA: { classe: 'badge-pendente', label: 'Aberta' },
  EM_ATENDIMENTO: { classe: 'badge-andamento', label: 'Em atendimento' },
  ENCERRADA: { classe: 'badge-sucesso', label: 'Encerrada' },
}

export function badgeDeStatus(status: string): Badge {
  return STATUS_BADGE_MAP[status.toUpperCase()] ?? { classe: 'badge-neutral', label: status }
}

const STATUS_PROCESSO_LABEL: Record<string, string> = {
  ABERTO: 'Aberto',
  AGUARDANDO_RESULTADO: 'Aguardando resultado',
  COM_RESULTADO: 'Com resultado',
  CONCLUIDO: 'Concluído',
}

export function labelDeStatusProcesso(status: string): string {
  return STATUS_PROCESSO_LABEL[status] ?? status
}

const PROXIMO_STATUS_PROCESSO: Record<StatusProcesso, StatusProcesso | null> = {
  ABERTO: 'AGUARDANDO_RESULTADO',
  AGUARDANDO_RESULTADO: 'COM_RESULTADO',
  COM_RESULTADO: 'CONCLUIDO',
  CONCLUIDO: null,
}

export function proximoStatusProcesso(status: StatusProcesso): StatusProcesso | null {
  return PROXIMO_STATUS_PROCESSO[status]
}

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

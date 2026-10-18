import type { MaterialBiologico, NivelContato, StatusClinicoAmostra, StatusProcesso, TipoAbrigo } from '../types/processos.types'

// Rótulos dos enums da amostra e do status (valores do backend, D38). Doença,
// laboratório e sintoma são catálogos e vêm de GET /api/processos/catalogos.

export const STATUS_CLINICO_OPCOES: { valor: StatusClinicoAmostra; label: string }[] = [
  { valor: 'SINTOMATICO', label: 'Sintomático' },
  { valor: 'ASSINTOMATICO', label: 'Assintomático' },
  { valor: 'OBITO', label: 'Óbito' },
]

export const TIPO_ABRIGO_OPCOES: { valor: TipoAbrigo; label: string }[] = [
  { valor: 'INTRADOMICILIAR', label: 'Intradomiciliar' },
  { valor: 'PERIDOMICILIAR', label: 'Peridomiciliar' },
  { valor: 'SILVESTRE', label: 'Silvestre' },
  { valor: 'NAO_IDENTIFICADO', label: 'Não identificado' },
]

export const MATERIAL_BIOLOGICO_OPCOES: { valor: MaterialBiologico; label: string }[] = [
  { valor: 'TECIDO_ENCEFALICO', label: 'Tecido encefálico' },
  { valor: 'SORO', label: 'Soro' },
  { valor: 'SANGUE', label: 'Sangue' },
  { valor: 'SALIVA', label: 'Saliva' },
  { valor: 'URINA', label: 'Urina' },
]

export const NIVEL_CONTATO_OPCOES: { valor: NivelContato; label: string }[] = [
  { valor: 'DIRETA', label: 'Direta' },
  { valor: 'INDIRETA', label: 'Indireta' },
]

export const STATUS_PROCESSO_OPCOES: { valor: StatusProcesso; label: string }[] = [
  { valor: 'ABERTO', label: 'Aberto' },
  { valor: 'AGUARDANDO_RESULTADO', label: 'Aguardando resultado' },
  { valor: 'COM_RESULTADO', label: 'Com resultado' },
  { valor: 'CONCLUIDO', label: 'Concluído' },
]

export function labelDe<T extends string>(opcoes: readonly { valor: T; label: string }[], valor: T | null | undefined): string {
  if (!valor) return '—'
  return opcoes.find((opcao) => opcao.valor === valor)?.label ?? valor
}

// D18: o status só avança um passo por vez; CONCLUIDO é o último.
export function proximoStatusProcesso(status: StatusProcesso): StatusProcesso | null {
  const indice = STATUS_PROCESSO_OPCOES.findIndex((opcao) => opcao.valor === status)
  return indice >= 0 && indice < STATUS_PROCESSO_OPCOES.length - 1 ? STATUS_PROCESSO_OPCOES[indice + 1].valor : null
}

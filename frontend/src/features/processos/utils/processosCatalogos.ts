import type { MaterialBiologico, NivelContato, StatusClinicoAmostra, StatusProcesso, TipoAbrigo } from '../types/processos.types'

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

export const CONTATO_HUMANO_OPCOES = [
  { valor: 'nao_informado', label: 'Não informado' },
  { valor: 'sim', label: 'Sim' },
  { valor: 'nao', label: 'Não' },
] as const

export type ContatoHumanoOpcao = (typeof CONTATO_HUMANO_OPCOES)[number]['valor']

export function contatoHumanoParaOpcao(contato: boolean | null | undefined): ContatoHumanoOpcao {
  if (contato === null || contato === undefined) return 'nao_informado'
  return contato ? 'sim' : 'nao'
}

export function opcaoParaContatoHumano(opcao: ContatoHumanoOpcao): boolean | null {
  if (opcao === 'nao_informado') return null
  return opcao === 'sim'
}

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

export const ACAO_DE_AVANCO_PROCESSO: Partial<Record<StatusProcesso, string>> = {
  ABERTO: 'Marcar amostras como enviadas',
  COM_RESULTADO: 'Concluir processo',
}

export function labelDe<T extends string>(opcoes: readonly { valor: T; label: string }[], valor: T | null | undefined): string {
  if (!valor) return '—'
  return opcoes.find((opcao) => opcao.valor === valor)?.label ?? valor
}

export function proximoStatusProcesso(status: StatusProcesso): StatusProcesso | null {
  const indice = STATUS_PROCESSO_OPCOES.findIndex((opcao) => opcao.valor === status)
  return indice >= 0 && indice < STATUS_PROCESSO_OPCOES.length - 1 ? STATUS_PROCESSO_OPCOES[indice + 1].valor : null
}

import type {
  Doenca,
  Laboratorio,
  MaterialBiologico,
  Sintoma,
  StatusClinicoAmostra,
  StatusProcesso,
  TipoAbrigo,
} from './processos.types'

// Rótulos e opções fixas dos catálogos de docs/DER.md §3.5 — não vêm de
// endpoint próprio (o módulo `processos` ainda não tem backend real).

export const DOENCA_OPCOES: { valor: Doenca; label: string; cid: string }[] = [
  { valor: 'raiva', label: 'Raiva', cid: 'A82' },
  { valor: 'esporotricose', label: 'Esporotricose', cid: 'B42' },
  { valor: 'leishmaniose_visceral', label: 'Leishmaniose Visceral', cid: 'B55.0' },
  { valor: 'leptospirose', label: 'Leptospirose', cid: 'A27' },
  { valor: 'febre_maculosa', label: 'Febre Maculosa', cid: 'A77' },
  { valor: 'febre_amarela', label: 'Febre Amarela', cid: 'A95' },
]

export const LABORATORIO_OPCOES: { valor: Laboratorio; label: string }[] = [
  { valor: 'pasteur_sp', label: 'Instituto Pasteur — SP' },
  { valor: 'ial_sorocaba', label: 'IAL — Sorocaba' },
  { valor: 'ccz_sp', label: 'CCZ — São Paulo' },
  { valor: 'itu_ll01', label: 'Laboratório Local (Itu)' },
]

export const STATUS_CLINICO_OPCOES: { valor: StatusClinicoAmostra; label: string }[] = [
  { valor: 'sintomatico', label: 'Sintomático' },
  { valor: 'assintomatico', label: 'Assintomático' },
  { valor: 'obito', label: 'Óbito' },
]

export const TIPO_ABRIGO_OPCOES: { valor: TipoAbrigo; label: string }[] = [
  { valor: 'intradomiciliar', label: 'Intradomiciliar' },
  { valor: 'peridomiciliar', label: 'Peridomiciliar' },
  { valor: 'silvestre', label: 'Silvestre' },
  { valor: 'nao_identificado', label: 'Não identificado' },
]

export const MATERIAL_BIOLOGICO_OPCOES: { valor: MaterialBiologico; label: string }[] = [
  { valor: 'tecido_encefalico', label: 'Tecido encefálico' },
  { valor: 'soro', label: 'Soro' },
  { valor: 'sangue', label: 'Sangue' },
  { valor: 'saliva', label: 'Saliva' },
  { valor: 'urina', label: 'Urina' },
]

export const SINTOMA_OPCOES: { valor: Sintoma; label: string }[] = [
  { valor: 'apatia', label: 'Apatia' },
  { valor: 'alt_comportamental', label: 'Alteração comportamental' },
  { valor: 'descamacao', label: 'Descamação' },
  { valor: 'ulcera_pele', label: 'Úlcera de pele' },
  { valor: 'ceratoconjuntivite', label: 'Ceratoconjuntivite' },
  { valor: 'coriza', label: 'Coriza' },
  { valor: 'emagrecimento', label: 'Emagrecimento' },
  { valor: 'diarreia', label: 'Diarreia' },
  { valor: 'salivacao_excessiva', label: 'Salivação excessiva' },
  { valor: 'hemorragia_interna', label: 'Hemorragia interna' },
  { valor: 'vomito', label: 'Vômito' },
  { valor: 'aumento_linfonodo', label: 'Aumento de linfonodo' },
]

const STATUS_PROCESSO_LABEL: Record<StatusProcesso, string> = {
  aberto: 'Aberto',
  aguardando_resultado: 'Aguardando resultado',
  com_resultado: 'Com resultado',
  concluido: 'Concluído',
}

export function labelDeStatusProcesso(status: StatusProcesso): string {
  return STATUS_PROCESSO_LABEL[status] ?? status
}

export function labelDeDoenca(valor: Doenca): string {
  return DOENCA_OPCOES.find((item) => item.valor === valor)?.label ?? valor
}

export function labelDeLaboratorio(valor: Laboratorio): string {
  return LABORATORIO_OPCOES.find((item) => item.valor === valor)?.label ?? valor
}

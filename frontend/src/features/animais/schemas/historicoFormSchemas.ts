import { z } from 'zod'

// Campos e limites espelham com.siszoo.animais.clinico.dto.CriarVacinacaoRequest.
export const vacinacaoFormSchema = z.object({
  vacina: z.string().min(1, 'Selecione a vacina.'),
  dataAplicacao: z.string().min(1, 'Informe a data de aplicação.'),
  numeroDose: z.number().int().positive('Deve ser maior que zero.').optional(),
  doseQuantidade: z.number({ message: 'Informe a quantidade da dose.' }).positive('A dose deve ser maior que zero.'),
  doseUnidade: z
    .enum(['MILIGRAMA', 'MICROGRAMA', 'GRAMA', 'MILILITRO', 'UNIDADE_INTERNACIONAL'])
    .optional(),
  lote: z.string().trim().max(100, 'Máximo de 100 caracteres.').optional(),
  observacoes: z.string().trim().optional(),
})

export type VacinacaoFormValues = z.infer<typeof vacinacaoFormSchema>

// Campos espelham com.siszoo.animais.clinico.dto.CriarProcedimentoRequest.
export const procedimentoFormSchema = z.object({
  tipoProcedimento: z.string().min(1, 'Selecione o tipo de procedimento.'),
  data: z.string().min(1, 'Informe a data.'),
  descricao: z.string().trim().optional(),
  resultado: z.string().trim().optional(),
})

export type ProcedimentoFormValues = z.infer<typeof procedimentoFormSchema>

// Campos espelham com.siszoo.animais.clinico.dto.CriarPrescricaoRequest.
export const prescricaoFormSchema = z.object({
  medicamentoId: z.string().min(1, 'Selecione o medicamento.'),
  dataInicio: z.string().min(1, 'Informe a data de início.'),
  dataFimPrevista: z.string().optional(),
  dataFimReal: z.string().optional(),
  frequenciaAplicada: z.number({ message: 'Informe a frequência.' }).int().positive('Deve ser maior que zero.'),
  unidadeFrequencia: z.enum(['HORAS', 'DIAS'], { message: 'Selecione a unidade.' }),
  doseQuantidade: z.number({ message: 'Informe a quantidade da dose.' }).positive('A dose deve ser maior que zero.'),
  doseUnidade: z.enum(['MILIGRAMA', 'MICROGRAMA', 'GRAMA', 'MILILITRO', 'UNIDADE_INTERNACIONAL'], {
    message: 'Selecione a unidade da dose.',
  }),
  viaAdministracao: z.enum(['ORAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'SUBCUTANEA', 'TOPICA'], {
    message: 'Selecione a via de administração.',
  }),
  status: z.enum(['ATIVA', 'CONCLUIDA', 'SUSPENSA', 'CANCELADA']),
})

export type PrescricaoFormValues = z.infer<typeof prescricaoFormSchema>

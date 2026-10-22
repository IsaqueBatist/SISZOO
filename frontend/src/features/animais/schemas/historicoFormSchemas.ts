import { z } from 'zod'
import { hojeEmItu } from '../utils/regrasVacina'

// Campos e limites espelham com.siszoo.animais.clinico.dto.CriarVacinacaoRequest.
export const vacinacaoFormSchema = z.object({
  vacina: z.string().min(1, 'Selecione a vacina.'),
  // RN-C06: mesma regra do backend (VacinacaoService), com "hoje" no fuso de
  // Itu. Datas ISO (AAAA-MM-DD) comparam certo como texto. "Hoje" é lido a
  // cada validação, não fixado no carregamento do módulo.
  dataAplicacao: z
    .string()
    .min(1, 'Informe a data de aplicação.')
    .refine((data) => data <= hojeEmItu(), 'A data de aplicação não pode ser futura.'),
  numeroDose: z.number().int().positive('Deve ser maior que zero.').optional(),
  doseQuantidade: z.number({ message: 'Informe a quantidade da dose.' }).positive('A dose deve ser maior que zero.'),
  // Obrigatória desde a T24 (RN-C05, @NotNull no backend) — mesma regra e
  // mensagem da prescrição.
  doseUnidade: z.enum(['MILIGRAMA', 'MICROGRAMA', 'GRAMA', 'MILILITRO', 'UNIDADE_INTERNACIONAL'], {
    message: 'Selecione a unidade da dose.',
  }),
  lote: z.string().trim().max(100, 'Máximo de 100 caracteres.').optional(),
  observacoes: z.string().trim().optional(),
})

export type VacinacaoFormValues = z.infer<typeof vacinacaoFormSchema>

// Campos espelham com.siszoo.animais.clinico.dto.CriarProcedimentoRequest.
export const procedimentoFormSchema = z.object({
  tipoProcedimento: z.string().min(1, 'Selecione o tipo de procedimento.'),
  // Fato ocorrido, como a vacinação: mesma regra do ProcedimentoService.
  data: z
    .string()
    .min(1, 'Informe a data.')
    .refine((data) => data <= hojeEmItu(), 'A data do procedimento não pode ser futura.'),
  descricao: z.string().trim().optional(),
  resultado: z.string().trim().optional(),
})

export type ProcedimentoFormValues = z.infer<typeof procedimentoFormSchema>

// F2-007 / RF-A04 — espelha com.siszoo.animais.clinico.dto.CriarExameRequest. Regras
// entre campos (resultado ⇄ data do resultado; resultado ≥ solicitação) também
// valem no ExameService, que devolve 422 por campo.
export const exameFormSchema = z
  .object({
    tipoExame: z.string().min(1, 'Selecione o tipo de exame.'),
    laboratorio: z.string().optional(),
    dataSolicitacao: z
      .string()
      .min(1, 'Informe a data da solicitação.')
      .refine((data) => data <= hojeEmItu(), 'A data da solicitação não pode ser futura.'),
    dataResultado: z.string().optional(),
    resultado: z.string().trim().max(4000, 'Máximo de 4000 caracteres.').optional(),
    observacoes: z.string().trim().max(2000, 'Máximo de 2000 caracteres.').optional(),
  })
  .superRefine((dados, ctx) => {
    const temResultado = Boolean(dados.resultado)
    const temData = Boolean(dados.dataResultado)
    if (temResultado !== temData) {
      ctx.addIssue({ code: 'custom', path: [temResultado ? 'dataResultado' : 'resultado'], message: 'Informe o resultado e a data do resultado juntos.' })
    }
    if (dados.dataResultado && dados.dataResultado > hojeEmItu()) {
      ctx.addIssue({ code: 'custom', path: ['dataResultado'], message: 'A data do resultado não pode ser futura.' })
    }
    if (dados.dataResultado && dados.dataSolicitacao && dados.dataResultado < dados.dataSolicitacao) {
      ctx.addIssue({ code: 'custom', path: ['dataResultado'], message: 'A data do resultado não pode ser anterior à solicitação.' })
    }
  })

export type ExameFormValues = z.infer<typeof exameFormSchema>

// Campos espelham com.siszoo.animais.clinico.dto.CriarPrescricaoRequest.
// Data futura é aceita (início programado é legítimo); as regras entre datas
// e status são as do PrescricaoService. Datas vazias chegam como ''.
export const prescricaoFormSchema = z
  .object({
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
  .superRefine((dados, ctx) => {
    if (dados.dataFimPrevista && dados.dataInicio && dados.dataFimPrevista < dados.dataInicio) {
      ctx.addIssue({ code: 'custom', path: ['dataFimPrevista'], message: 'O término previsto não pode ser anterior ao início.' })
    }
    if (dados.dataFimReal && dados.dataInicio && dados.dataFimReal < dados.dataInicio) {
      ctx.addIssue({ code: 'custom', path: ['dataFimReal'], message: 'O término real não pode ser anterior ao início.' })
    }
    if (dados.status === 'CONCLUIDA' && !dados.dataFimReal) {
      ctx.addIssue({ code: 'custom', path: ['dataFimReal'], message: 'Informe o término real para concluir a prescrição.' })
    }
  })

export type PrescricaoFormValues = z.infer<typeof prescricaoFormSchema>

import { z } from 'zod'
import { MAXIMO_ANEXOS } from '../utils/anexoOcorrencia'
import type { TipoOcorrencia } from '../types/ocorrencias.types'

export const TIPOS_OCORRENCIA_VALORES: TipoOcorrencia[] = ['zoonose', 'morcegos', 'irregular', 'agressivo', 'outros']

const denuncianteSchema = z.object({
  nome: z.string().trim().optional(),
  cpf: z.string().trim().optional(),
  telefone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  cep: z.string().trim().optional(),
  endereco: z.string().trim().optional(),
  bairroResidencial: z.string().trim().optional(),
})

const denunciadoSchema = z.object({
  nome: z.string().trim().optional(),
  cpf: z.string().trim().optional(),
  telefone: z.string().trim().optional(),
  endereco: z.string().trim().optional(),
  observacoes: z.string().trim().optional(),
})

// Campos espelham CriarOcorrenciaRequest (ocorrencias.types.ts). Anexos ficam
// no form mas vão por multipart depois do cadastro (D15).
export const ocorrenciaFormSchema = z
  .object({
    tipoOcorrencia: z.enum(TIPOS_OCORRENCIA_VALORES as [string, ...string[]], {
      message: 'Selecione o tipo da ocorrência.',
    }),
    dataAbertura: z.string().min(1, 'Informe a data de abertura.'),
    horaAbertura: z.string().trim().optional(),
    endereco: z.string().trim().min(1, 'Informe o endereço da ocorrência.'),
    bairro: z.string().trim().min(1, 'Informe o bairro.'),
    pontoReferencia: z.string().trim().optional(),
    descricao: z.string().trim().min(1, 'Informe a descrição da ocorrência.'),
    urgente: z.boolean(),
    sigilosa: z.boolean(),
    anonima: z.boolean(),
    denunciante: denuncianteSchema,
    denunciadoAtivo: z.boolean(),
    denunciado: denunciadoSchema,
    anexos: z.array(z.instanceof(File)).max(MAXIMO_ANEXOS, `Máximo de ${MAXIMO_ANEXOS} anexos.`),
  })
  .superRefine((dados, ctx) => {
    // As mesmas regras são validadas no backend (422); aqui só antecipam o
    // erro na tela.
    // D32: anônima e sigilosa são excludentes, e anônima não guarda nenhum
    // dado do denunciante.
    if (dados.anonima && dados.sigilosa) {
      ctx.addIssue({
        code: 'custom',
        path: ['anonima'],
        message: 'Uma denúncia anônima não pode ser marcada como sigilosa.',
      })
    }
    if (dados.anonima && Object.values(dados.denunciante).some((valor) => valor)) {
      ctx.addIssue({
        code: 'custom',
        path: ['anonima'],
        message: 'Denúncia anônima não aceita dados do denunciante.',
      })
    }
    // D19: nome obrigatório quando a ocorrência não é sigilosa nem anônima.
    if (!dados.sigilosa && !dados.anonima && !dados.denunciante.nome) {
      ctx.addIssue({
        code: 'custom',
        path: ['denunciante', 'nome'],
        message: 'Informe o nome do denunciante ou marque a ocorrência como sigilosa ou anônima.',
      })
    }
  })

export type OcorrenciaFormValues = z.infer<typeof ocorrenciaFormSchema>

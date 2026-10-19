import { z } from 'zod'
import { cepValido, cpfValido, emailValido, telefoneValido } from '@/lib/mascaras'
import { MATERIAL_BIOLOGICO_OPCOES, STATUS_CLINICO_OPCOES, TIPO_ABRIGO_OPCOES } from '../utils/processosCatalogos'
import type { MaterialBiologico, StatusClinicoAmostra, TipoAbrigo } from '../types/processos.types'

const FUSO_ITU = 'America/Sao_Paulo'

export function hojeIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO_ITU }).format(new Date())
}

// Mesmas regras do servidor (D21 para a abertura, T29-5 para a coleta): o
// backend recusa data futura com 422; aqui o erro aparece antes de enviar.
function naoEhFutura(data: string): boolean {
  return !data || data <= hojeIso()
}

const STATUS_CLINICO_VALORES = STATUS_CLINICO_OPCOES.map((item) => item.valor) as [StatusClinicoAmostra, ...StatusClinicoAmostra[]]
const TIPO_ABRIGO_VALORES = TIPO_ABRIGO_OPCOES.map((item) => item.valor) as [TipoAbrigo, ...TipoAbrigo[]]
const MATERIAL_BIOLOGICO_VALORES = MATERIAL_BIOLOGICO_OPCOES.map((item) => item.valor) as [MaterialBiologico, ...MaterialBiologico[]]

const responsavelSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do responsável.').max(150, 'No máximo 150 caracteres.'),
  cpf: z
    .string()
    .trim()
    .max(14, 'No máximo 14 caracteres.')
    .optional()
    .refine((valor) => !valor || cpfValido(valor), 'CPF inválido.'),
  telefone: z
    .string()
    .trim()
    .max(20, 'No máximo 20 caracteres.')
    .optional()
    .refine((valor) => !valor || telefoneValido(valor), 'Telefone inválido.'),
  email: z
    .string()
    .trim()
    .max(150, 'No máximo 150 caracteres.')
    .optional()
    .refine((valor) => !valor || emailValido(valor), 'E-mail inválido.'),
  cep: z
    .string()
    .trim()
    .max(10, 'No máximo 10 caracteres.')
    .optional()
    .refine((valor) => !valor || cepValido(valor), 'CEP inválido.'),
  endereco: z.string().trim().max(255, 'No máximo 255 caracteres.').optional(),
  bairroResidencial: z.string().trim().max(80, 'No máximo 80 caracteres.').optional(),
  bairroOcorrencia: z.string().trim().max(80, 'No máximo 80 caracteres.').optional(),
})

const amostraClinicaSchema = z.object({
  statusClinico: z.enum(STATUS_CLINICO_VALORES, { message: 'Selecione o status clínico.' }),
  tipoAbrigo: z.enum(TIPO_ABRIGO_VALORES, { message: 'Selecione o tipo de abrigo.' }),
  alteracaoComportamental: z.string().trim().optional(),
  dataColeta: z
    .string()
    .min(1, 'Informe a data de coleta.')
    .refine(naoEhFutura, 'A data de coleta não pode ser uma data futura.'),
  materialBiologico: z.enum(MATERIAL_BIOLOGICO_VALORES, { message: 'Selecione o material biológico.' }),
  contatoHumano: z.boolean(),
  nivelContato: z.enum(['DIRETA', 'INDIRETA']).optional(),
  agrediuHumano: z.boolean().optional(),
  observacoes: z.string().trim().optional(),
  sintomas: z.array(z.string()),
})

// Animal do canil: só o animalId vai para a API — o servidor copia a
// identificação da ficha (DH-5). `animalDescricao` é só para exibir o animal
// escolhido no cartão e na revisão; nunca é enviado.
const amostraCanilSchema = amostraClinicaSchema.extend({
  origem: z.literal('canil'),
  animalId: z.string().min(1, 'Selecione um animal do canil.'),
  animalDescricao: z.string(),
})

// Animal de campo: espécie e sexo obrigatórios (DER §3.5).
const amostraCampoSchema = amostraClinicaSchema.extend({
  origem: z.literal('externo'),
  especie: z.string().min(1, 'Selecione a espécie.'),
  sexo: z.enum(['macho', 'femea', 'nao_identificado'], { message: 'Selecione o sexo do animal.' }),
  raca: z.string().trim().max(80, 'No máximo 80 caracteres.').optional(),
  coloracao: z.string().trim().max(80, 'No máximo 80 caracteres.').optional(),
  pelagem: z.enum(['curta', 'longa', '']).optional(),
  idadeAprox: z.string().trim().max(30, 'No máximo 30 caracteres.').optional(),
  pesoKg: z.number().positive('O peso deve ser maior que zero.').max(999.99, 'Peso acima do permitido.').optional(),
})

// União discriminada sem superRefine nas variantes (exigência do
// discriminatedUnion); as regras entre campos ficam no superRefine externo.
const amostraUniaoSchema = z.discriminatedUnion('origem', [amostraCanilSchema, amostraCampoSchema])

export const amostraSchema = amostraUniaoSchema.superRefine((dados, ctx) => {
  // Nível de contato e agressão existem se, e somente se, houve contato
  // humano (CHECK da V13).
  if (dados.contatoHumano) {
    if (!dados.nivelContato) {
      ctx.addIssue({ code: 'custom', path: ['nivelContato'], message: 'Informe o nível de contato.' })
    }
    if (dados.agrediuHumano === undefined) {
      ctx.addIssue({ code: 'custom', path: ['agrediuHumano'], message: 'Informe se o animal agrediu o munícipe.' })
    }
  }
  // T29-3: sintomas só em amostra sintomática.
  if (dados.sintomas.length > 0 && dados.statusClinico !== 'SINTOMATICO') {
    ctx.addIssue({
      code: 'custom',
      path: ['sintomas'],
      message: 'Sintomas só podem ser informados em amostra com status clínico sintomático.',
    })
  }
})

export type AmostraFormValues = z.infer<typeof amostraUniaoSchema>

// `vinculoDecisao` não é campo da API — gateia a etapa 1 exigindo uma decisão
// explícita (selecionar ocorrência OU "Pular esta etapa"), já que o vínculo em
// si (`ocorrenciaId`) é opcional (DER: 0 ou 1).
export const processoFormSchema = z
  .object({
    vinculoDecisao: z.enum(['vinculado', 'sem_vinculo'], {
      message: 'Selecione uma ocorrência ou clique em "Pular esta etapa".',
    }),
    ocorrenciaId: z.string().nullable(),
    // Só para exibição (etapa 1 travada e revisão), gravado no rascunho: evita
    // buscar o detalhe da ocorrência de novo, o que auditaria o acesso ao
    // denunciante sigiloso (T26) sem necessidade. Não vai para a API.
    ocorrenciaResumo: z
      .object({ id: z.string(), protocolo: z.string(), tipoOcorrenciaNome: z.string(), bairro: z.string() })
      .nullable(),
    dataAbertura: z
      .string()
      .min(1, 'Informe a data de abertura.')
      .refine(naoEhFutura, 'A data de abertura não pode ser uma data futura.'),
    doenca: z.string().min(1, 'Selecione a doença investigada.'),
    laboratorio: z.string().min(1, 'Selecione o laboratório de destino.'),
    responsavel: responsavelSchema,
    amostras: z.array(amostraSchema).min(1, 'Adicione pelo menos um animal amostrado.'),
    observacoes: z.string().trim().optional(),
  })
  .superRefine((dados, ctx) => {
    if (dados.vinculoDecisao === 'vinculado' && !dados.ocorrenciaId) {
      ctx.addIssue({ code: 'custom', path: ['ocorrenciaId'], message: 'Selecione uma ocorrência para vincular.' })
    }
  })

export type ProcessoFormValues = z.infer<typeof processoFormSchema>

// Campo → etapa que bloqueia "Avançar".
export const CAMPOS_STEP: Record<1 | 2 | 3 | 4, (keyof ProcessoFormValues)[]> = {
  1: ['vinculoDecisao', 'dataAbertura', 'doenca', 'laboratorio'],
  2: ['responsavel'],
  3: ['amostras'],
  4: [],
}

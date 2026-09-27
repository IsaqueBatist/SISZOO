import { z } from 'zod'
import { DOENCA_OPCOES, LABORATORIO_OPCOES, MATERIAL_BIOLOGICO_OPCOES, SINTOMA_OPCOES, STATUS_CLINICO_OPCOES, TIPO_ABRIGO_OPCOES } from './processosCatalogos'
import type { Doenca, Laboratorio, MaterialBiologico, Sintoma, StatusClinicoAmostra, TipoAbrigo } from './processos.types'

const FUSO_ITU = 'America/Sao_Paulo'

function hojeIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO_ITU }).format(new Date())
}

// [EXTRAPOLAÇÃO] não há regra no DER sobre data futura — extrapolação de bom
// senso (não se abre uma investigação nem se coleta amostra no futuro).
function naoEhFutura(data: string): boolean {
  return !data || data <= hojeIso()
}

const DOENCA_VALORES = DOENCA_OPCOES.map((item) => item.valor) as [Doenca, ...Doenca[]]
const LABORATORIO_VALORES = LABORATORIO_OPCOES.map((item) => item.valor) as [Laboratorio, ...Laboratorio[]]
const STATUS_CLINICO_VALORES = STATUS_CLINICO_OPCOES.map((item) => item.valor) as [StatusClinicoAmostra, ...StatusClinicoAmostra[]]
const TIPO_ABRIGO_VALORES = TIPO_ABRIGO_OPCOES.map((item) => item.valor) as [TipoAbrigo, ...TipoAbrigo[]]
const MATERIAL_BIOLOGICO_VALORES = MATERIAL_BIOLOGICO_OPCOES.map((item) => item.valor) as [MaterialBiologico, ...MaterialBiologico[]]
const SINTOMA_VALORES = SINTOMA_OPCOES.map((item) => item.valor) as [Sintoma, ...Sintoma[]]

const responsavelSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do responsável.'),
  cpf: z.string().trim().optional(),
  telefone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  cep: z.string().trim().optional(),
  endereco: z.string().trim().optional(),
  bairroResidencial: z.string().trim().optional(),
  bairroOcorrencia: z.string().trim().optional(),
})

// Campos de identificação do animal_amostrado (DER.md:559-580) — comuns aos
// dois modos de origem (no modo canil vêm de snapshot somente-leitura, no
// modo externo são digitados; a validação é a mesma).
const identificacaoSchema = z.object({
  sexo: z.enum(['macho', 'femea', 'nao_identificado'], { message: 'Selecione o sexo do animal.' }),
  raca: z.string().trim().optional(),
  coloracao: z.string().trim().optional(),
  pelagem: z.string().trim().optional(),
  idadeAprox: z.string().trim().optional(),
  pesoKg: z.number().positive('O peso deve ser maior que zero.').optional(),
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
  nivelContato: z.enum(['direta', 'indireta']).optional(),
  agrediuHumano: z.boolean().optional(),
  observacoes: z.string().trim().optional(),
  sintomas: z.array(z.enum(SINTOMA_VALORES)),
})

const amostraCanilSchema = identificacaoSchema.extend(amostraClinicaSchema.shape).extend({
  origem: z.literal('canil'),
  animalId: z.string().min(1, 'Selecione um animal do canil.'),
  especieId: z.string().min(1, 'Selecione a espécie.'),
})

const amostraExternoSchema = identificacaoSchema.extend(amostraClinicaSchema.shape).extend({
  origem: z.literal('externo'),
  especieId: z.string().min(1, 'Selecione a espécie.'),
})

// Discriminated union SEM superRefine dentro das variantes — cada membro
// fica um ZodObject "puro" (exigência do discriminatedUnion). A regra
// condicional de contato humano vive no .superRefine externo, aplicado
// depois da união já resolvida (ver amostraSchema abaixo).
const amostraUniaoSchema = z.discriminatedUnion('origem', [amostraCanilSchema, amostraExternoSchema])

export const amostraSchema = amostraUniaoSchema.superRefine((dados, ctx) => {
  // RN4 / DER.md:577-578: nivelContato e agrediuHumano só existem quando
  // contatoHumano = true.
  if (dados.contatoHumano) {
    if (!dados.nivelContato) {
      ctx.addIssue({ code: 'custom', path: ['nivelContato'], message: 'Informe o nível de contato.' })
    }
    if (dados.agrediuHumano === undefined) {
      ctx.addIssue({ code: 'custom', path: ['agrediuHumano'], message: 'Informe se o animal agrediu o munícipe.' })
    }
  }
})

export type AmostraFormValues = z.infer<typeof amostraUniaoSchema>

// [EXTRAPOLAÇÃO] `vinculoDecisao` não é campo do DER — gateia a etapa 1
// exigindo uma decisão explícita (selecionar ocorrência OU "Pular esta
// etapa"), já que o vínculo em si (`ocorrenciaId`) é opcional (DER: 0 ou 1).
export const processoFormSchema = z
  .object({
    // "" (nenhuma decisão ainda) é rejeitado pelo próprio z.enum — isso vira
    // um erro de campo comum (não um superRefine), então NÃO é descartado
    // quando outro campo do formulário também está inválido (ex.: as
    // amostras ainda com placeholder vazio nas etapas seguintes). Um
    // superRefine aqui seria pulado pelo Zod sempre que qualquer outro
    // campo do objeto também estivesse inválido — o que é o caso comum
    // enquanto o usuário ainda está na etapa 1.
    vinculoDecisao: z.enum(['vinculado', 'sem_vinculo'], {
      message: 'Selecione uma ocorrência ou clique em "Pular esta etapa".',
    }),
    ocorrenciaId: z.string().nullable(),
    dataAbertura: z
      .string()
      .min(1, 'Informe a data de abertura.')
      .refine(naoEhFutura, 'A data de abertura não pode ser uma data futura.'),
    doenca: z.enum(DOENCA_VALORES, { message: 'Selecione a doença investigada.' }),
    laboratorio: z.enum(LABORATORIO_VALORES, { message: 'Selecione o laboratório de destino.' }),
    responsavel: responsavelSchema,
    amostras: z.array(amostraSchema).min(1, 'Adicione pelo menos um animal amostrado.'),
    observacoes: z.string().trim().optional(),
  })
  .superRefine((dados, ctx) => {
    // Checagem defensiva: na prática `ocorrenciaId` é sempre setado junto de
    // `vinculoDecisao` (SeletorOcorrencia::onSelecionar) — não é o gate
    // principal da etapa 1 (esse é o enum acima).
    if (dados.vinculoDecisao === 'vinculado' && !dados.ocorrenciaId) {
      ctx.addIssue({ code: 'custom', path: ['ocorrenciaId'], message: 'Selecione uma ocorrência para vincular.' })
    }
  })

export type ProcessoFormValues = z.infer<typeof processoFormSchema>

// Campo → etapa que bloqueia "Avançar" (trigger([...]) antes de cada
// setStep). Campos opcionais do responsável e amostras.* específicos não
// entram aqui de propósito — só o que bloqueia o avanço.
export const CAMPOS_STEP: Record<1 | 2 | 3 | 4, (keyof ProcessoFormValues)[]> = {
  1: ['vinculoDecisao', 'dataAbertura', 'doenca', 'laboratorio'],
  2: ['responsavel'],
  3: ['amostras'],
  4: [],
}

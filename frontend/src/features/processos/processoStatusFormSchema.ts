import { z } from 'zod'
import { RESULTADO_OPCOES } from './processosCatalogos'

export const enviarAmostrasFormSchema = z.object({
  previsaoRetorno: z.string().trim().optional(),
})

export type EnviarAmostrasFormValues = z.infer<typeof enviarAmostrasFormSchema>

const VALORES_RESULTADO = RESULTADO_OPCOES.map((opcao) => opcao.valor)

export const registrarResultadoFormSchema = z.object({
  resultadoLaboratorial: z.enum(VALORES_RESULTADO as [string, ...string[]], {
    message: 'Selecione o resultado laboratorial.',
  }),
  desfechoAnimal: z.string().trim().optional(),
})

export type RegistrarResultadoFormValues = z.infer<typeof registrarResultadoFormSchema>

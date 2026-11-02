import { z } from 'zod'

export const registrarResultadoFormSchema = z.object({
  resultado: z.string().min(1, 'Selecione o resultado laboratorial.'),
  dataResultado: z.string().min(1, 'Informe a data do resultado.'),
  observacoes: z.string().optional(),
  desfechoAnimal: z.string().optional(),
})

export type RegistrarResultadoFormValues = z.infer<typeof registrarResultadoFormSchema>

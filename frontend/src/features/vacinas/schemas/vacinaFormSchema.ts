import { z } from 'zod'

export const vacinaFormSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome da vacina.').max(100, 'Máximo de 100 caracteres.'),
  intervaloMeses: z
    .number({ error: 'Informe um número de meses.' })
    .int('Use um número inteiro de meses.')
    .positive('O intervalo deve ser maior que zero.')
    .max(1200, 'Intervalo alto demais.')
    .optional(),
})

export type VacinaFormValues = z.infer<typeof vacinaFormSchema>

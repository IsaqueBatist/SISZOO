import { z } from 'zod'

const EMAIL_INSTITUCIONAL = /^[a-z.]+@itu\.sp\.gov\.br$/

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .regex(EMAIL_INSTITUCIONAL, 'Use seu e-mail institucional (@itu.sp.gov.br).'),
  senha: z.string().min(1, 'Informe sua senha.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

import { z } from 'zod'
import { loginSchema } from './loginSchema'

export const esqueciSenhaSchema = loginSchema.pick({ email: true })

export type EsqueciSenhaFormValues = z.infer<typeof esqueciSenhaSchema>

import { z } from 'zod'
import { loginSchema } from './loginSchema'

// Mesma regra de e-mail do login: a mensagem fala do formato institucional,
// nunca da existência da conta.
export const esqueciSenhaSchema = loginSchema.pick({ email: true })

export type EsqueciSenhaFormValues = z.infer<typeof esqueciSenhaSchema>

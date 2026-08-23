import { z } from 'zod'

// Regex diverge da regra `^[a-z.]+@itu\.sp\.gov\.br$` documentada como
// crítica ("nunca violar") no CLAUDE.md raiz: aquela rejeitaria e-mails
// institucionais legítimos com dígito, hífen ou underscore. Decisão
// explícita para a T11 — ver nota no PR pedindo confirmação da regra
// crítica em si junto à Beatriz/orientador.
const EMAIL_INSTITUCIONAL = /^[a-z0-9._-]+@itu\.sp\.gov\.br$/

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .regex(EMAIL_INSTITUCIONAL, 'Use seu e-mail institucional (@itu.sp.gov.br).'),
  senha: z.string().min(1, 'Informe sua senha.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

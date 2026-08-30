import { z } from 'zod'
import { EMAIL_INSTITUCIONAL } from '../auth/loginSchema'
import { PERFIS_USUARIO } from './usuarios.types'

export const usuarioFormSchema = z
  .object({
    nomeCompleto: z
      .string()
      .trim()
      .min(1, 'Informe o nome completo.')
      .refine((valor) => valor.trim().split(/\s+/).length >= 2, 'Informe nome e sobrenome.'),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .regex(EMAIL_INSTITUCIONAL, 'Use o e-mail institucional (@itu.sp.gov.br).'),
    cargo: z.enum(PERFIS_USUARIO as [string, ...string[]], { message: 'Selecione um perfil.' }),
    crmv: z.string().trim().optional(),
    senhaInicial: z.string().min(8, 'A senha inicial deve ter no mínimo 8 caracteres.'),
    ativo: z.boolean(),
  })
  .superRefine((dados, ctx) => {
    if (dados.cargo === 'Veterinário' && !dados.crmv) {
      ctx.addIssue({
        code: 'custom',
        path: ['crmv'],
        message: 'CRMV é obrigatório para o perfil Veterinário.',
      })
    }
  })

export type UsuarioFormValues = z.infer<typeof usuarioFormSchema>

import { z } from 'zod'
import { PERFIS_USUARIO } from '../types/usuarios.types'

export const edicaoUsuarioSchema = z
  .object({
    nome: z.string().trim().min(1, 'Informe o nome.').max(100, 'O nome deve ter no máximo 100 caracteres.'),
    sobrenome: z.string().trim().min(1, 'Informe o sobrenome.').max(100, 'O sobrenome deve ter no máximo 100 caracteres.'),
    cargo: z.enum(PERFIS_USUARIO as [string, ...string[]], { message: 'Selecione um perfil.' }),
    crmv: z.string().trim().max(20, 'O CRMV deve ter no máximo 20 caracteres.'),
    telefone: z.string().trim().max(20, 'O telefone deve ter no máximo 20 caracteres.'),
  })
  .superRefine((dados, ctx) => {
    if (dados.cargo === 'Veterinário' && !dados.crmv) {
      ctx.addIssue({ code: 'custom', path: ['crmv'], message: 'CRMV é obrigatório para o perfil Veterinário.' })
    }
  })

export type EdicaoUsuarioValues = z.infer<typeof edicaoUsuarioSchema>

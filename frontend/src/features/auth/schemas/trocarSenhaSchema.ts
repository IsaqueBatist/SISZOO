import { z } from 'zod'

export const trocarSenhaSchema = z
  .object({
    novaSenha: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.'),
    confirmarSenha: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((dados) => dados.novaSenha === dados.confirmarSenha, {
    message: 'As senhas não coincidem.',
    path: ['confirmarSenha'],
  })

export type TrocarSenhaFormValues = z.infer<typeof trocarSenhaSchema>

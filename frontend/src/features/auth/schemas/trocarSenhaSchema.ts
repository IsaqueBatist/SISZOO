import { z } from 'zod'
import { violacaoPoliticaSenha, type DonoDaSenha } from '../utils/politicaSenha'

// A política de senha depende de quem troca (nome da conta e nome de
// exibição), por isso o schema é montado com o usuário autenticado.
export function criarTrocarSenhaSchema(dono: DonoDaSenha) {
  return z
    .object({
      novaSenha: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.'),
      confirmarSenha: z.string().min(1, 'Confirme a nova senha.'),
    })
    .superRefine((dados, ctx) => {
      if (dados.novaSenha.length < 8) return
      const violacao = violacaoPoliticaSenha(dados.novaSenha, dono)
      if (violacao) {
        ctx.addIssue({ code: 'custom', path: ['novaSenha'], message: violacao })
      }
    })
    .refine((dados) => dados.novaSenha === dados.confirmarSenha, {
      message: 'As senhas não coincidem.',
      path: ['confirmarSenha'],
    })
}

export type TrocarSenhaFormValues = z.infer<ReturnType<typeof criarTrocarSenhaSchema>>

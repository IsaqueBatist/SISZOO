import { z } from 'zod'

// Campos e limites espelham com.siszoo.animais.dto.CriarBaiaRequest /
// AtualizarBaiaRequest (idênticos).
export const baiaFormSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome da baia.').max(40, 'Máximo de 40 caracteres.'),
  tipoBaia: z.string().min(1, 'Selecione o tipo.'),
  capacidade: z
    .number({ message: 'Informe a capacidade.' })
    .int('A capacidade deve ser um número inteiro.')
    .positive('A capacidade deve ser maior que zero.'),
  finalidade: z.string().trim().max(80, 'Máximo de 80 caracteres.').optional(),
  observacoes: z.string().trim().optional(),
})

export type BaiaFormValues = z.infer<typeof baiaFormSchema>

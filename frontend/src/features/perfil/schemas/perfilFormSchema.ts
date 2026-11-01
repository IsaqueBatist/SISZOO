import { z } from 'zod'

// Espelha a validação de AtualizarPerfilRequest no backend (@Size(max = 20)).
export const perfilFormSchema = z.object({
  telefone: z.string().trim().max(20, 'O telefone deve ter no máximo 20 caracteres.'),
})

export type PerfilFormValues = z.infer<typeof perfilFormSchema>

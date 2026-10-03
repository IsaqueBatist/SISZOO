import { z } from 'zod'

// Espelha a validação de AtualizarPerfilRequest no backend (@Size(max = 20)).
export const perfilFormSchema = z.object({
  telefone: z.string().trim().max(20, 'Telefone deve ter no maximo 20 caracteres'),
})

export type PerfilFormValues = z.infer<typeof perfilFormSchema>

import { z } from 'zod'

// Espelha com.siszoo.animais.clinico.dto.CriarMedicamentoRequest.
export const medicamentoFormSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do medicamento.').max(100, 'Máximo de 100 caracteres.'),
  categoriaId: z.string().min(1, 'Selecione a categoria.'),
})

export type MedicamentoFormValues = z.infer<typeof medicamentoFormSchema>

// Espelha CriarCategoriaFarmacologicaRequest.
export const categoriaFormSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome da categoria.').max(100, 'Máximo de 100 caracteres.'),
})

export type CategoriaFormValues = z.infer<typeof categoriaFormSchema>

import { z } from 'zod'

// T37: as opções do select vêm do catálogo real (GET /processos/catalogos,
// resultadosLaboratoriais/desfechos), não de uma lista fixa aqui — por isso
// a validação é só "não vazio"; um código inválido ainda é recusado pelo
// backend (422).
export const registrarResultadoFormSchema = z.object({
  resultadoLaboratorial: z.string().min(1, 'Selecione o resultado laboratorial.'),
  desfechoAnimal: z.string().optional(),
})

export type RegistrarResultadoFormValues = z.infer<typeof registrarResultadoFormSchema>

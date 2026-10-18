import { z } from 'zod'

// T34 + T37: as opções do select vêm do catálogo real (GET /processos/catalogos,
// resultadosLaboratoriais/desfechos), não de uma lista fixa aqui — por isso a
// validação é só "não vazio"; um código inválido ainda é recusado pelo
// backend (422). Limites de dataResultado (não futura, não antes da abertura
// do processo) também são conferidos pelo backend; o campo aqui usa
// `min`/`max` nativos do `<input type="date">` só para guiar o preenchimento.
export const registrarResultadoFormSchema = z.object({
  resultado: z.string().min(1, 'Selecione o resultado laboratorial.'),
  dataResultado: z.string().min(1, 'Informe a data do resultado.'),
  observacoes: z.string().optional(),
  desfechoAnimal: z.string().optional(),
})

export type RegistrarResultadoFormValues = z.infer<typeof registrarResultadoFormSchema>

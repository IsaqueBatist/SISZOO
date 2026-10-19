import { z } from 'zod'

// T34 + T37: as opções do select vêm do catálogo real (GET /processos/catalogos,
// resultadosLaboratoriais/desfechos), não de uma lista fixa aqui — por isso a
// validação é só "não vazio"; um código inválido ainda é recusado pelo
// backend (422). dataResultado: não futura; sem limite inferior
// (docs/decisoes/T34.md T34-5), conferido pelo backend; o campo aqui usa só o
// `max` nativo do `<input type="date">` para guiar o preenchimento.
export const registrarResultadoFormSchema = z.object({
  resultado: z.string().min(1, 'Selecione o resultado laboratorial.'),
  dataResultado: z.string().min(1, 'Informe a data do resultado.'),
  observacoes: z.string().optional(),
  desfechoAnimal: z.string().optional(),
})

export type RegistrarResultadoFormValues = z.infer<typeof registrarResultadoFormSchema>

import { z } from 'zod'

export const preferenciasFormSchema = z.object({
  tema: z.enum(['LIGHT', 'DARK']),
  densidade: z.enum(['COMPACTO', 'NORMAL', 'CONFORTAVEL']),
  notifVacinaVencendo: z.boolean(),
  notifSuperlotacao: z.boolean(),
  notifResultadoLab: z.boolean(),
  notifEmailDiario: z.boolean(),
})


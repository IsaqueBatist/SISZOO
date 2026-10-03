import { z } from 'zod'

// Espelha PreferenciaUsuarioRequest no backend (todos os campos @NotNull).
// notifAlertasCriticos fica fora do schema editável: é sempre enviado como
// `true` no submit, nunca exposto como controle de formulário.
export const preferenciasFormSchema = z.object({
  tema: z.enum(['LIGHT', 'DARK']),
  densidade: z.enum(['COMPACTO', 'NORMAL', 'CONFORTAVEL']),
  notifVacinaVencendo: z.boolean(),
  notifSuperlotacao: z.boolean(),
  notifResultadoLab: z.boolean(),
  notifEmailDiario: z.boolean(),
})

export type PreferenciasFormValues = z.infer<typeof preferenciasFormSchema>

import { z } from 'zod'

// Espelha com.siszoo.animais.clinico.dto.CriarVacinaRequest. O `codigo` não
// aparece: é derivado do nome no servidor.
export const vacinaFormSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome da vacina.').max(100, 'Máximo de 100 caracteres.'),
  // Opcional: vacina sem intervalo não gera alerta de reforço. O teto de 1200
  // meses acompanha o @Max do backend, que existe para o cálculo da validade
  // não estourar a data.
  intervaloMeses: z
    .number({ error: 'Informe um número de meses.' })
    .int('Use um número inteiro de meses.')
    .positive('O intervalo deve ser maior que zero.')
    .max(1200, 'Intervalo alto demais.')
    .optional(),
})

export type VacinaFormValues = z.infer<typeof vacinaFormSchema>

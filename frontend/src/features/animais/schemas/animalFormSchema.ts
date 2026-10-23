import { z } from 'zod'
import { hojeEmItu } from '@/lib/datas'

// "Hoje" lido a cada validação, não fixado no carregamento do módulo.
function naoEhFutura(data: string): boolean {
  return !data || data <= hojeEmItu()
}

// Opções fixas do design system (não vêm de catálogo da API): Sexo/Pelagem/
// Porte já são tipos fechados em animais.types.ts, espelhando os regex do
// DTO real (CriarAnimalRequest/AtualizarAnimalRequest). "Sem pelo" do
// protótipo foi removido: o backend só aceita curta|longa.
export const SEXO_OPCOES = [
  { valor: 'macho', label: 'Macho' },
  { valor: 'femea', label: 'Fêmea' },
  { valor: 'nao_identificado', label: 'Não identificado' },
] as const

export const PORTE_OPCOES = [
  { valor: 'pequeno', label: 'P', sub: 'até 10kg' },
  { valor: 'medio', label: 'M', sub: '10–25kg' },
  { valor: 'grande', label: 'G', sub: '25kg+' },
] as const

export const PELAGEM_OPCOES = [
  { valor: 'curta', label: 'Curta' },
  { valor: 'longa', label: 'Longa' },
] as const

// Os 3 cartões de castração do protótipo colapsam em `esterilizado: boolean`
// no DTO real — Orquiectomia e OSH viram ambos `esterilizado: true` (só
// mudam o rótulo por sexo). Não existe coluna própria para essa opção.
export type CastracaoOpcao = 'nao_castrado' | 'orquiectomia' | 'osh'

export const CASTRACAO_OPCOES: { valor: CastracaoOpcao; label: string; sub: string }[] = [
  { valor: 'nao_castrado', label: 'Não castrado', sub: 'A agendar' },
  { valor: 'orquiectomia', label: 'Orquiectomia', sub: 'Macho castrado' },
  { valor: 'osh', label: 'OSH', sub: 'Fêmea castrada' },
]

export function castracaoParaEsterilizado(opcao: CastracaoOpcao): boolean {
  return opcao !== 'nao_castrado'
}

export function esterilizadoParaCastracao(esterilizado: boolean, sexo: string): CastracaoOpcao {
  if (!esterilizado) return 'nao_castrado'
  return sexo === 'femea' ? 'osh' : 'orquiectomia'
}

// Campos e limites espelham com.siszoo.animais.dto.CriarAnimalRequest /
// AtualizarAnimalRequest (idênticos). Microchip e baiaId são opcionais no
// DTO real (sem @NotBlank/@NotNull) mesmo aparecendo com "*" no protótipo —
// decisão confirmada: ficha pode ficar incompleta (fichaCompleta calculado
// no backend), o form não bloqueia o envio por causa deles.
export const animalFormSchema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome do animal.').max(80, 'Máximo de 80 caracteres.'),
  especie: z.string().min(1, 'Selecione a espécie.'),
  sexo: z.enum(['macho', 'femea', 'nao_identificado'], { message: 'Selecione o sexo.' }),
  raca: z.string().trim().max(80, 'Máximo de 80 caracteres.').optional(),
  coloracao: z.string().trim().max(80, 'Máximo de 80 caracteres.').optional(),
  pelagem: z.enum(['curta', 'longa']).optional(),
  porte: z.enum(['pequeno', 'medio', 'grande']).optional(),
  pesoKg: z.number().positive('O peso deve ser maior que zero.').optional(),
  idadeAprox: z.string().trim().max(30, 'Máximo de 30 caracteres.').optional(),
  // Datas de fato ocorrido: nunca futuras, com "hoje" no fuso de Itu (mesma
  // regra do AnimalService). Datas ISO comparam certo como texto. A regra
  // entre campos (nascimento até a entrada) fica no schema de UI do
  // AnimalForm: refinamento de objeto impediria o .omit() feito lá.
  dataNascimentoAprox: z
    .string()
    .refine(naoEhFutura, 'A data de nascimento não pode ser futura.')
    .optional(),
  microchip: z.string().trim().max(30, 'Máximo de 30 caracteres.').optional(),
  // F2-004 (RF-A01/RN01): identificação complementar. A exigência de
  // microchip para a data de implantação e a unicidade da medalha ficam no
  // backend (AnimalService), que devolve 422 por campo.
  numeroMedalha: z.string().trim().max(30, 'Máximo de 30 caracteres.').optional(),
  dataImplantacaoChip: z
    .string()
    .refine(naoEhFutura, 'A data de implantação não pode ser futura.')
    .optional(),
  procedencia: z.string().trim().max(200, 'Máximo de 200 caracteres.').optional(),
  // F2-008 (RF-A05): laudo exigido pelo backend só na transição para eutanásia.
  laudoEutanasia: z.string().trim().max(4000, 'Máximo de 4000 caracteres.').optional(),
  esterilizado: z.boolean(),
  dataEsterilizacao: z
    .string()
    .refine(naoEhFutura, 'A data da castração não pode ser futura.')
    .optional(),
  status: z.string().min(1, 'Selecione o status.'),
  motivoEntrada: z.string().min(1, 'Selecione o motivo de entrada.'),
  dataEntrada: z
    .string()
    .min(1, 'Informe a data de entrada.')
    .refine(naoEhFutura, 'A data de entrada não pode ser futura.'),
  baiaId: z.string().optional(),
  fotoUrl: z.string().optional(),
  observacoes: z.string().trim().max(2000, 'Máximo de 2000 caracteres.').optional(),
})

export type AnimalFormValues = z.infer<typeof animalFormSchema>

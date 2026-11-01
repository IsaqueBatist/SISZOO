import { useSyncExternalStore } from 'react'

export type VarianteToast = 'sucesso' | 'erro' | 'atencao'

export interface Toast {
  id: number
  variante: VarianteToast
  titulo: string
  descricao?: string
}

// Máquinas do CCZ têm ~2 GB e telas de 1366px: uma rajada de avisos não pode
// cobrir a interface. O mais antigo é descartado.
const LIMITE_TOASTS = 3

// Erro fica mais tempo na tela: o toast é confirmação complementar (erro de
// formulário continua inline, ao lado do campo), mas ainda precisa de tempo de
// leitura maior que uma confirmação de sucesso.
const DURACAO_MS: Record<VarianteToast, number> = {
  sucesso: 5000,
  atencao: 5000,
  erro: 8000,
}

// Store de módulo, e não Context: quem salva costuma navegar logo em seguida,
// e o aviso precisa sobreviver à troca de tela. Mais importante, isto deixa o
// aviso ser disparado de fora de um componente — o encerramento de sessão em
// AuthContext e o guarda de rota precisam disso, e um `useContext` obrigaria
// toda árvore de teste que monta o AuthProvider a montar um provider de UI só
// para não quebrar.
let toasts: Toast[] = []
let proximoId = 1
const ouvintes = new Set<() => void>()

function publicar(novos: Toast[]) {
  toasts = novos
  for (const ouvinte of ouvintes) ouvinte()
}

export function dispensarToast(id: number) {
  publicar(toasts.filter((toast) => toast.id !== id))
}

// Encerrar a sessão não pode deixar aviso do usuário anterior na tela.
export function limparToasts() {
  publicar([])
}

function mostrar(variante: VarianteToast, titulo: string, descricao?: string) {
  // Mesmo título não empilha: salvar duas vezes em sequência, ou dois pontos
  // do código avisando do mesmo fato, não viram dois avisos idênticos.
  if (toasts.some((toast) => toast.titulo === titulo && toast.variante === variante)) return
  const id = proximoId++
  publicar([...toasts, { id, variante, titulo, descricao }].slice(-LIMITE_TOASTS))
}

export const toast = {
  sucesso: (titulo: string, descricao?: string) => mostrar('sucesso', titulo, descricao),
  erro: (titulo: string, descricao?: string) => mostrar('erro', titulo, descricao),
  atencao: (titulo: string, descricao?: string) => mostrar('atencao', titulo, descricao),
  limpar: limparToasts,
}

export function duracaoDe(variante: VarianteToast): number {
  return DURACAO_MS[variante]
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte)
  return () => {
    ouvintes.delete(ouvinte)
  }
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(assinar, () => toasts)
}

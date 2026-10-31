import { useSyncExternalStore } from 'react'

export type TipoAviso = 'sucesso' | 'erro' | 'atencao'

export interface Aviso {
  id: number
  tipo: TipoAviso
  texto: string
}

// Tempo na tela de um aviso de sucesso. Erro e atenção ficam até a pessoa
// dispensar: ela precisa ter visto que a ação não aconteceu ou o que vem aí.
const DURACAO_AVISO_MS = 6000

let avisos: Aviso[] = []
let proximoId = 1
const ouvintes = new Set<() => void>()

function publicar(novos: Aviso[]) {
  avisos = novos
  for (const ouvinte of ouvintes) ouvinte()
}

export function dispensarAviso(id: number) {
  publicar(avisos.filter((aviso) => aviso.id !== id))
}

// Resposta única de uma ação (salvou, falhou, sem acesso). Fora de um hook de
// propósito: quem salva costuma navegar logo em seguida, e o aviso precisa
// sobreviver à troca de tela. O mesmo texto não empilha.
export function avisar(texto: string, tipo: TipoAviso = 'sucesso') {
  if (avisos.some((aviso) => aviso.texto === texto)) return
  const id = proximoId++
  publicar([...avisos, { id, tipo, texto }])
  if (tipo === 'sucesso') setTimeout(() => dispensarAviso(id), DURACAO_AVISO_MS)
}

// Encerrar a sessão não pode deixar aviso do usuário anterior na tela.
export function limparAvisos() {
  publicar([])
}

function assinar(ouvinte: () => void) {
  ouvintes.add(ouvinte)
  return () => {
    ouvintes.delete(ouvinte)
  }
}

export function useAvisos(): Aviso[] {
  return useSyncExternalStore(assinar, () => avisos)
}

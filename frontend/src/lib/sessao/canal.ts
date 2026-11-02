export type MensagemSessao = 'login' | 'logout' | 'expirada' | 'inatividade'

const NOME_CANAL = 'siszoo-sessao'

let canal: BroadcastChannel | null = null

function obterCanal(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null
  canal ??= new BroadcastChannel(NOME_CANAL)
  return canal
}

export function avisarOutrasAbas(mensagem: MensagemSessao) {
  obterCanal()?.postMessage(mensagem)
}

export function ouvirOutrasAbas(aoReceber: (mensagem: MensagemSessao) => void): () => void {
  const atual = obterCanal()
  if (!atual) return () => {}
  const ouvinte = (evento: MessageEvent<MensagemSessao>) => aoReceber(evento.data)
  atual.addEventListener('message', ouvinte)
  return () => atual.removeEventListener('message', ouvinte)
}

export function reiniciarCanal() {
  canal?.close()
  canal = null
}

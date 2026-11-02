// Atividade real da pessoa, compartilhada entre as abas do navegador pelo
// localStorage: é só um instante, sem segredo. Requisição não conta como
// atividade, então uma aba esquecida com polling não prolonga a sessão.

// Decisão funcional (docs/decisoes/sessao.md). O servidor aplica o
// mesmo limite (siszoo.sessao.inatividade-minutos).
export const LIMITE_INATIVIDADE_MS = 60 * 60 * 1000
export const ANTECEDENCIA_AVISO_MS = 5 * 60 * 1000
// Com atividade, o servidor é avisado no máximo uma vez por minuto: a sessão
// expira entre 59 e 60 minutos depois do último uso.
export const INTERVALO_EXTENSAO_MS = 60 * 1000

const CHAVE_ATIVIDADE = 'siszoo_ultima_atividade'
const CHAVE_EXTENSAO = 'siszoo_ultima_extensao'

// Reserva para quando o localStorage está indisponível: vale só para esta aba.
const memoria = new Map<string, number>()

function ler(chave: string): number {
  try {
    const salvo = Number(localStorage.getItem(chave))
    if (Number.isFinite(salvo) && salvo > 0) return salvo
  } catch {
    /* localStorage indisponível */
  }
  return memoria.get(chave) ?? 0
}

function gravar(chave: string, instante: number) {
  memoria.set(chave, instante)
  try {
    localStorage.setItem(chave, String(instante))
  } catch {
    /* localStorage indisponível */
  }
}

export function ultimaAtividade(): number {
  return ler(CHAVE_ATIVIDADE)
}

export function registrarAtividade(instante = Date.now()) {
  gravar(CHAVE_ATIVIDADE, instante)
}

export function ultimaExtensao(): number {
  return ler(CHAVE_EXTENSAO)
}

export function registrarExtensao(instante = Date.now()) {
  gravar(CHAVE_EXTENSAO, instante)
}

// Só a interação ocorrida depois da última extensão pode deslizar a janela.
export function houveAtividadeDesdeExtensao(): boolean {
  return ultimaAtividade() > ultimaExtensao()
}

export function limparAtividade() {
  memoria.clear()
  try {
    localStorage.removeItem(CHAVE_ATIVIDADE)
    localStorage.removeItem(CHAVE_EXTENSAO)
  } catch {
    /* localStorage indisponível */
  }
}

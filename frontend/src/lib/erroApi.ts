import { isAxiosError } from 'axios'

// Mensagem de regra de negócio devolvida pela API (ErroResponse.mensagem do
// backend) em 409/422 — é o motivo real da recusa ("Data de aplicacao nao
// pode ser futura", "Registro ja foi retificado por outro"...). Qualquer outro
// erro (rede, 5xx, 401/403) devolve null para o chamador usar o texto genérico.
export function mensagemDeRegraDaApi(erro: unknown): string | null {
  if (!isAxiosError(erro)) return null
  const status = erro.response?.status
  if (status !== 409 && status !== 422) return null
  const mensagem = (erro.response?.data as { mensagem?: unknown } | undefined)?.mensagem
  return typeof mensagem === 'string' && mensagem.trim() !== '' ? mensagem : null
}

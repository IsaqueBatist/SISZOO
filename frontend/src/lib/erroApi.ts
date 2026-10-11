import { isAxiosError } from 'axios'

// Mensagem de regra de negócio devolvida pela API (ErroResponse.mensagem do
// backend) em 409/422 — é o motivo real da recusa ("Data de aplicacao nao
// pode ser futura", "Registro ja foi retificado por outro"...). Qualquer outro
// erro (rede, 5xx, 401/403) devolve null para o chamador usar o texto genérico.
// Status HTTP de um erro do axios (null para erro de rede ou não-HTTP). Para
// as telas que tratam um status específico fora de 409/422 — ex.: 403 de
// anexo restrito e 413 de arquivo grande em ocorrências.
export function statusHttpDoErro(erro: unknown): number | null {
  if (!isAxiosError(erro)) return null
  return erro.response?.status ?? null
}

export function mensagemDeRegraDaApi(erro: unknown): string | null {
  if (!isAxiosError(erro)) return null
  const status = erro.response?.status
  if (status !== 409 && status !== 422) return null
  const mensagem = (erro.response?.data as { mensagem?: unknown } | undefined)?.mensagem
  return typeof mensagem === 'string' && mensagem.trim() !== '' ? mensagem : null
}

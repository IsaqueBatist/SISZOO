import { isAxiosError } from 'axios'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

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

// Erros por campo do 422 (ErroResponse.campos do backend:
// `[{ campo, mensagem }]`, vindo do Bean Validation ou de uma regra presa a
// um campo) aplicados no formulário com setError. `mapa` traduz o nome do
// campo no DTO para o nome no formulário e também limita o que é aplicado:
// campo do DTO fora do mapa não tem onde aparecer na tela e é ignorado. Sem
// mapa, aplica cada campo com o mesmo nome. Devolve os campos do formulário
// que receberam erro — vazio quando não há o que mapear, para o chamador
// manter a mensagem geral.
export function aplicarErrosDeCampo<T extends FieldValues>(
  erro: unknown,
  setError: UseFormSetError<T>,
  mapa?: Readonly<Record<string, Path<T>>>,
): Path<T>[] {
  if (!isAxiosError(erro) || erro.response?.status !== 422) return []

  const aplicados: Path<T>[] = []
  for (const { campo, mensagem } of camposDoErro(erro)) {
    const destino = mapa ? mapa[campo] : (campo as Path<T>)
    if (!destino || aplicados.includes(destino)) continue
    setError(destino, { type: 'server', message: mensagem })
    aplicados.push(destino)
  }
  return aplicados
}

// `ErroResponse.campos` de qualquer resposta de erro, só os itens bem
// formados. Quem chama decide para quais status eles valem.
export function camposDoErro(erro: unknown): { campo: string; mensagem: string }[] {
  if (!isAxiosError(erro)) return []
  const campos = (erro.response?.data as { campos?: unknown } | undefined)?.campos
  if (!Array.isArray(campos)) return []
  return campos.flatMap((item) => {
    const { campo, mensagem } = (item ?? {}) as { campo?: unknown; mensagem?: unknown }
    return typeof campo === 'string' && typeof mensagem === 'string' ? [{ campo, mensagem }] : []
  })
}

// Mapa identidade (campo do DTO = campo do formulário) para os nomes dados.
export function mapaDeCampos<T extends FieldValues>(campos: readonly Path<T>[]): Record<string, Path<T>> {
  return Object.fromEntries(campos.map((campo) => [campo, campo]))
}

// Status HTTP de um erro do axios (null para erro de rede ou não-HTTP). Para
// as telas que tratam um status específico fora de 409/422 — ex.: 403 de
// anexo restrito e 413 de arquivo grande em ocorrências.
export function statusHttpDoErro(erro: unknown): number | null {
  if (!isAxiosError(erro)) return null
  return erro.response?.status ?? null
}

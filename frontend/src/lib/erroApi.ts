import { isAxiosError } from 'axios'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

export function mensagemDeRegraDaApi(erro: unknown): string | null {
  if (!isAxiosError(erro)) return null
  const status = erro.response?.status
  if (status !== 403 && status !== 409 && status !== 422) return null
  const mensagem = (erro.response?.data as { mensagem?: unknown } | undefined)?.mensagem
  return typeof mensagem === 'string' && mensagem.trim() !== '' ? mensagem : null
}

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

export function camposDoErro(erro: unknown): { campo: string; mensagem: string }[] {
  if (!isAxiosError(erro)) return []
  const campos = (erro.response?.data as { campos?: unknown } | undefined)?.campos
  if (!Array.isArray(campos)) return []
  return campos.flatMap((item) => {
    const { campo, mensagem } = (item ?? {}) as { campo?: unknown; mensagem?: unknown }
    return typeof campo === 'string' && typeof mensagem === 'string' ? [{ campo, mensagem }] : []
  })
}

export function mapaDeCampos<T extends FieldValues>(campos: readonly Path<T>[]): Record<string, Path<T>> {
  return Object.fromEntries(campos.map((campo) => [campo, campo]))
}

export function statusHttpDoErro(erro: unknown): number | null {
  if (!isAxiosError(erro)) return null
  return erro.response?.status ?? null
}

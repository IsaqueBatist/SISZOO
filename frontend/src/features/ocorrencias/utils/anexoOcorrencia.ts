import { mensagemDeRegraDaApi, statusHttpDoErro } from '@/lib/erroApi'

const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'application/pdf']
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024

export const MAXIMO_ANEXOS = 5

export class AnexoInvalidoError extends Error {}

export function validarAnexo(arquivo: File): void {
  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    throw new AnexoInvalidoError('Envie um arquivo JPG, PNG ou PDF.')
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    throw new AnexoInvalidoError('Cada anexo deve ter no máximo 5MB.')
  }
}

export function mensagemErroEnvioAnexo(erro: unknown): string {
  if (statusHttpDoErro(erro) === 413) return 'Arquivo excede o tamanho máximo de 5 MB'
  return mensagemDeRegraDaApi(erro) ?? 'Não foi possível enviar o anexo. Tente novamente.'
}

import { mensagemDeRegraDaApi, statusHttpDoErro } from '@/lib/erroApi'

const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'application/pdf']
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024

export const MAXIMO_ANEXOS = 5

export class AnexoInvalidoError extends Error {}

// Só checa tipo/tamanho — o navegador informa o MIME pela extensão do
// arquivo (é proteção de UX, não de segurança). O backend valida o tipo pelos
// bytes iniciais do conteúdo (OcorrenciaService) e o tamanho pelo limite de
// multipart. Sem FileReader/canvas: ao contrário da foto do animal
// (comprimirImagem.ts), anexo pode ser PDF, então o `File` original é enviado
// como está.
export function validarAnexo(arquivo: File): void {
  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    throw new AnexoInvalidoError('Envie um arquivo JPG, PNG ou PDF.')
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    throw new AnexoInvalidoError('Cada anexo deve ter no máximo 5MB.')
  }
}

// Motivo de recusa de um upload: 413 tem texto fixo (o corpo do 413 pode nem
// chegar como JSON, dependendo de onde o limite de multipart corta), 422 traz
// a regra do backend e o resto vira mensagem genérica.
export function mensagemErroEnvioAnexo(erro: unknown): string {
  if (statusHttpDoErro(erro) === 413) return 'Arquivo excede o tamanho máximo de 5 MB'
  return mensagemDeRegraDaApi(erro) ?? 'Não foi possível enviar o anexo. Tente novamente.'
}

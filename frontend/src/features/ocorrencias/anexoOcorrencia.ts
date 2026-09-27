const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'application/pdf']
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024

export const MAXIMO_ANEXOS = 5

export class AnexoInvalidoError extends Error {}

// Só checa tipo/tamanho — o navegador informa o MIME pela extensão do
// arquivo (é proteção de UX, não de segurança). O backend real, quando
// existir, precisa validar o conteúdo do arquivo, não só o header.
// Sem FileReader/canvas: ao contrário da foto do animal (comprimirImagem.ts),
// anexo pode ser PDF, então não há compressão de imagem aqui — o `File`
// original é guardado como está (ver NovoAnexo em ocorrencias.types.ts).
export function validarAnexo(arquivo: File): void {
  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    throw new AnexoInvalidoError('Envie um arquivo JPG, PNG ou PDF.')
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    throw new AnexoInvalidoError('Cada anexo deve ter no máximo 5MB.')
  }
}

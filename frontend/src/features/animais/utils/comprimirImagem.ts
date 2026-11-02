const TAMANHO_MAXIMO_ENTRADA_BYTES = 5 * 1024 * 1024
const TIPOS_ACEITOS = ['image/jpeg', 'image/png']
const DIMENSAO_MAXIMA_PX = 800
const QUALIDADE_JPEG = 0.7

export class ImagemInvalidaError extends Error {}

function validarArquivoFoto(arquivo: File): void {
  if (!TIPOS_ACEITOS.includes(arquivo.type)) {
    throw new ImagemInvalidaError('Envie uma imagem JPG ou PNG.')
  }
  if (arquivo.size > TAMANHO_MAXIMO_ENTRADA_BYTES) {
    throw new ImagemInvalidaError('A imagem deve ter no máximo 5MB.')
  }
}

export function dataUriParaBlob(dataUri: string): Blob | null {
  const separador = dataUri.indexOf(',')
  if (!dataUri.startsWith('data:') || separador === -1) return null
  const cabecalho = dataUri.slice(5, separador)
  if (!cabecalho.endsWith(';base64')) return null
  const tipo = cabecalho.slice(0, -';base64'.length)
  try {
    const binario = atob(dataUri.slice(separador + 1))
    const bytes = Uint8Array.from(binario, (caractere) => caractere.charCodeAt(0))
    return new Blob([bytes], { type: tipo })
  } catch {
    return null
  }
}

export function blobParaDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onerror = () => reject(new ImagemInvalidaError('Não foi possível ler a foto do rascunho.'))
    leitor.onload = () => resolve(leitor.result as string)
    leitor.readAsDataURL(blob)
  })
}

export function comprimirImagem(arquivo: File): Promise<string> {
  validarArquivoFoto(arquivo)

  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onerror = () => reject(new ImagemInvalidaError('Não foi possível ler o arquivo.'))
    leitor.onload = () => {
      const imagem = new Image()
      imagem.onerror = () => reject(new ImagemInvalidaError('Não foi possível processar a imagem.'))
      imagem.onload = () => {
        const escala = Math.min(1, DIMENSAO_MAXIMA_PX / Math.max(imagem.width, imagem.height))
        const largura = Math.round(imagem.width * escala)
        const altura = Math.round(imagem.height * escala)

        const canvas = document.createElement('canvas')
        canvas.width = largura
        canvas.height = altura
        const contexto = canvas.getContext('2d')
        if (!contexto) {
          reject(new ImagemInvalidaError('Não foi possível processar a imagem.'))
          return
        }
        contexto.drawImage(imagem, 0, 0, largura, altura)
        resolve(canvas.toDataURL('image/jpeg', QUALIDADE_JPEG))
      }
      imagem.src = leitor.result as string
    }
    leitor.readAsDataURL(arquivo)
  })
}

// O download precisa do token, então não dá para usar <a href> direto: baixa
// o Blob, cria um object URL só para o clique e revoga logo depois.
export function salvarBlob(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

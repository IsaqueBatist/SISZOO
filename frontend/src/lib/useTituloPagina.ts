import { useEffect } from 'react'

// Título da aba do navegador, lido primeiro pelo leitor de tela ao trocar de tela.
export function useTituloPagina(titulo: string) {
  useEffect(() => {
    document.title = `${titulo} · SISZOO`
  }, [titulo])
}

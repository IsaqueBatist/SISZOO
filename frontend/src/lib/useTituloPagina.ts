import { useEffect } from 'react'

export function useTituloPagina(titulo: string) {
  useEffect(() => {
    document.title = `${titulo} · SISZOO`
  }, [titulo])
}

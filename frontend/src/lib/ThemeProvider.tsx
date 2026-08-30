import { useEffect, type ReactNode } from 'react'
import { usePreferenciasQuery } from '../features/configuracoes/useConfiguracoes'
import { aplicarPreferenciasVisuais } from './theme'

// Envolve <Layout> inteiro (não só /perfil e /configuracoes) para que o
// tema/densidade escolhidos valham em todas as telas autenticadas. Um flash
// do tema padrão até a query resolver é aceito sem cache em localStorage,
// consistente com a restrição de "sistema leve" do projeto.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data } = usePreferenciasQuery()

  useEffect(() => {
    if (data) aplicarPreferenciasVisuais(data)
  }, [data])

  return <>{children}</>
}

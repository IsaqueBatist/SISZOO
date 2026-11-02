import { useEffect, type ReactNode } from 'react'
import { usePreferenciasQuery } from '@/features/configuracoes/hooks/useConfiguracoes'
import { aplicarPreferenciasVisuais } from '@/lib/theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data } = usePreferenciasQuery()

  useEffect(() => {
    if (data) aplicarPreferenciasVisuais(data)
  }, [data])

  return <>{children}</>
}

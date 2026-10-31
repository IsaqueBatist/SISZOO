import { useEffect } from 'react'
import { avisar } from '@/lib/avisos'

const ANTECEDENCIA_MS = 5 * 60 * 1000

// `exp` do JWT, em milissegundos. Serve só para avisar: quem valida o token é a
// API. Token sem esse formato não gera aviso.
export function expiracaoDoToken(token: string): number | null {
  try {
    const carga = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(carga)) as { exp?: unknown }
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

// A sessão não renova sozinha: sem este aviso, ela cai no meio do trabalho.
export function useAvisoFimDeSessao(token: string | null) {
  useEffect(() => {
    const expiraEm = token ? expiracaoDoToken(token) : null
    if (expiraEm === null) return
    const espera = Math.max(expiraEm - ANTECEDENCIA_MS - Date.now(), 0)
    const timer = setTimeout(() => {
      avisar('Sua sessão termina em breve. Salve o que estiver fazendo: será preciso entrar de novo.', 'atencao')
    }, espera)
    return () => clearTimeout(timer)
  }, [token])
}

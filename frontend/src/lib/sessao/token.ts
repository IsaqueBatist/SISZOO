export function expiracaoDoToken(token: string): number | null {
  try {
    const carga = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(carga)) as { exp?: unknown }
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

const MARGEM_MS = 30 * 1000

export function tokenPertoDeVencer(token: string, agora = Date.now()): boolean {
  const expiraEm = expiracaoDoToken(token)
  return expiraEm !== null && expiraEm - agora < MARGEM_MS
}

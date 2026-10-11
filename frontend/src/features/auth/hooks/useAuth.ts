import { useContext } from 'react'
import { AuthContext, type AuthContextValue } from './authContextValue'

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

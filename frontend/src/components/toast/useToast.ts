import { useContext } from 'react'
import { ToastContext, type ToastContextValue } from './toastContextValue'

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider')
  }
  return context
}

import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from '@/components/toast/toast'

export function RedirecionarSemAcesso({ para }: { para: string }) {
  useEffect(() => {
    toast.atencao('Seu perfil não tem acesso a essa área.')
  }, [])

  return <Navigate to={para} replace />
}

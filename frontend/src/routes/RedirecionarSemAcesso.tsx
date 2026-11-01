import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from '@/components/toast/toast'

// Guarda de rota: quem chega por um link sem ter o perfil necessário precisa
// saber por que caiu em outra tela. A restrição em si continua na API.
export function RedirecionarSemAcesso({ para }: { para: string }) {
  useEffect(() => {
    toast.atencao('Seu perfil não tem acesso a essa área.')
  // O toast tem identidade estável (o provider memoiza as funções), então
  // entrar na dependência não refaz o efeito.
  }, [])

  return <Navigate to={para} replace />
}

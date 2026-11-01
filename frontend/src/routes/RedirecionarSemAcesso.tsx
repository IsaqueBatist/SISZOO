import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { avisar } from '@/lib/avisos'

// Guarda de rota: quem chega por um link sem ter o perfil necessário precisa
// saber por que caiu em outra tela. A restrição em si continua na API.
export function RedirecionarSemAcesso({ para }: { para: string }) {
  useEffect(() => {
    avisar('Seu perfil não tem acesso a essa área.', 'atencao')
  }, [])

  return <Navigate to={para} replace />
}

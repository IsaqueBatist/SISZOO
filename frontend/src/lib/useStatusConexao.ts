import { useEffect, useState } from 'react'
import { EVENTO_REDE_FALHA, EVENTO_REDE_OK } from './http'

export type MotivoSemConexao = 'navegador' | 'falha-de-rede'

function navegadorOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

export function useStatusConexao(): MotivoSemConexao | null {
  const [offline, setOffline] = useState(navegadorOffline)
  const [falhaDeRede, setFalhaDeRede] = useState(false)

  useEffect(() => {
    function aoFicarOnline() {
      setOffline(false)
      setFalhaDeRede(false)
    }
    function aoFicarOffline() {
      setOffline(true)
    }
    function aoFalharRede() {
      setFalhaDeRede(true)
    }
    function aoResponder() {
      setFalhaDeRede(false)
    }
    function aoVoltarParaAba() {
      if (document.visibilityState === 'visible') setFalhaDeRede(false)
    }

    window.addEventListener('online', aoFicarOnline)
    window.addEventListener('offline', aoFicarOffline)
    window.addEventListener('focus', aoVoltarParaAba)
    document.addEventListener('visibilitychange', aoVoltarParaAba)
    window.addEventListener(EVENTO_REDE_FALHA, aoFalharRede)
    window.addEventListener(EVENTO_REDE_OK, aoResponder)
    return () => {
      window.removeEventListener('online', aoFicarOnline)
      window.removeEventListener('offline', aoFicarOffline)
      window.removeEventListener('focus', aoVoltarParaAba)
      document.removeEventListener('visibilitychange', aoVoltarParaAba)
      window.removeEventListener(EVENTO_REDE_FALHA, aoFalharRede)
      window.removeEventListener(EVENTO_REDE_OK, aoResponder)
    }
  }, [])

  if (offline) return 'navegador'
  return falhaDeRede ? 'falha-de-rede' : null
}

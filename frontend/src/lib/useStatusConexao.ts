import { useEffect, useState } from 'react'
import { EVENTO_REDE_FALHA, EVENTO_REDE_OK } from './http'

// Por que a conexão está em dúvida:
// - 'navegador': navigator.onLine === false, ou seja o próprio sistema diz que
//   não há rede. É o caso de afirmar "offline" na tela.
// - 'falha-de-rede': o navegador se diz online, mas uma requisição morreu sem
//   resposta. O MDN é explícito: onLine === true não garante internet
//   (https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine), e no
//   CCZ isso acontece com link instável ou servidor inalcançável. Aqui a tela
//   fala em "possível instabilidade", não em offline, porque não há certeza.
export type MotivoSemConexao = 'navegador' | 'falha-de-rede'

function navegadorOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

// Estado da conexão para o banner. O motivo 'navegador' tem precedência: é uma
// informação do sistema, mais forte que a inferência da falha de requisição.
export function useStatusConexao(): MotivoSemConexao | null {
  const [offline, setOffline] = useState(navegadorOffline)
  const [falhaDeRede, setFalhaDeRede] = useState(false)

  useEffect(() => {
    function aoFicarOnline() {
      setOffline(false)
      // A rede voltou: a falha inferida antes não vale mais.
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
    // Voltar para a aba é o momento em que a pessoa reconectou o cabo ou o
    // wi-fi e quer ver a tela limpa — sem depender de haver alguma requisição
    // em curso para descobrir que a rede voltou.
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

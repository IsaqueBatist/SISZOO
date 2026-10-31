import { useEffect, useRef } from 'react'
import { avisar } from '../avisos'
import {
  ANTECEDENCIA_AVISO_MS,
  INTERVALO_EXTENSAO_MS,
  LIMITE_INATIVIDADE_MS,
  registrarAtividade,
  registrarExtensao,
  ultimaAtividade,
  ultimaExtensao,
} from './atividade'
import { renovarSessao, sessaoRecusada } from './renovacao'

const INTERVALO_VERIFICACAO_MS = 15 * 1000
const INTERVALO_REGISTRO_MS = 5 * 1000
const EVENTOS_DE_ATIVIDADE = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'] as const

export const TEXTO_AVISO_INATIVIDADE =
  'Sua sessão vai expirar em 5 minutos por inatividade. Continue usando o sistema para mantê-la ativa.'

// Enquanto há sessão: conta a inatividade, avisa antes do fim e estende a sessão
// no servidor quando a pessoa interage. A conta usa o instante compartilhado,
// então trabalhar em uma aba mantém as outras abertas.
export function useSessaoAtiva(ativa: boolean, aoExpirar: () => void, aoSerRecusada: () => void) {
  const callbacks = useRef({ aoExpirar, aoSerRecusada })
  useEffect(() => {
    callbacks.current = { aoExpirar, aoSerRecusada }
  })

  useEffect(() => {
    if (!ativa) return
    if (!ultimaAtividade()) registrarAtividade()
    if (!ultimaExtensao()) registrarExtensao()
    let avisado = false

    // Devolve false quando a sessão acabou: a atividade que chega depois do
    // limite não ressuscita a sessão.
    function verificar(): boolean {
      const ociosoMs = Date.now() - ultimaAtividade()
      if (ociosoMs >= LIMITE_INATIVIDADE_MS) {
        callbacks.current.aoExpirar()
        return false
      }
      if (ociosoMs < LIMITE_INATIVIDADE_MS - ANTECEDENCIA_AVISO_MS) {
        avisado = false
      } else if (!avisado) {
        avisado = true
        avisar(TEXTO_AVISO_INATIVIDADE, 'atencao')
      }
      return true
    }

    function aoInteragir() {
      if (!verificar()) return
      const agora = Date.now()
      if (agora - ultimaAtividade() >= INTERVALO_REGISTRO_MS) registrarAtividade(agora)
      if (agora - ultimaExtensao() < INTERVALO_EXTENSAO_MS) return
      registrarAtividade(agora)
      renovarSessao(true).catch((erro: unknown) => {
        if (sessaoRecusada(erro)) callbacks.current.aoSerRecusada()
      })
    }

    const intervalo = setInterval(verificar, INTERVALO_VERIFICACAO_MS)
    // Máquina que volta da suspensão: o timer pode ter ficado parado.
    document.addEventListener('visibilitychange', verificar)
    for (const evento of EVENTOS_DE_ATIVIDADE) {
      window.addEventListener(evento, aoInteragir, { passive: true })
    }
    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', verificar)
      for (const evento of EVENTOS_DE_ATIVIDADE) window.removeEventListener(evento, aoInteragir)
    }
  }, [ativa])
}

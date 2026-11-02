import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { statusHttpDoErro } from '@/lib/erroApi'
import { enviarAnexo } from '../api/ocorrenciasApi'
import {
  carregarAnexosPendentes,
  removerAnexosPendentes,
  salvarAnexosPendentes,
  type AnexosPendentesOcorrencia,
} from '../storage/rascunhoOcorrenciaStorage'
import { mensagemErroEnvioAnexo } from '../utils/anexoOcorrencia'

export interface FalhaEnvioAnexo {
  nome: string
  mensagem: string
  definitiva: boolean
}

function recusaDefinitiva(erro: unknown): boolean {
  const status = statusHttpDoErro(erro)
  return status === 422 || status === 413
}

export function useAnexosPendentes() {
  const { user } = useAuth()
  const usuarioId = user?.id ?? null
  const [pendencia, setPendencia] = useState<AnexosPendentesOcorrencia | null>(null)
  const [falhas, setFalhas] = useState<FalhaEnvioAnexo[]>([])
  const [reenvioInutil, setReenvioInutil] = useState(false)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (!usuarioId) return
    let cancelado = false
    void carregarAnexosPendentes(usuarioId).then((salva) => {
      if (!cancelado && salva) setPendencia(salva)
    })
    return () => {
      cancelado = true
    }
  }, [usuarioId])

  const enviar = useCallback(
    async (aEnviar: AnexosPendentesOcorrencia): Promise<boolean> => {
      if (!usuarioId) return false
      setEnviando(true)
      setFalhas([])
      setReenvioInutil(false)
      let restantes = [...aEnviar.anexos]
      const novasFalhas: FalhaEnvioAnexo[] = []
      const recusados = new Set<File>()
      await salvarAnexosPendentes(usuarioId, { ...aEnviar, anexos: restantes })
      setPendencia({ ...aEnviar, anexos: restantes })

      for (const arquivo of aEnviar.anexos) {
        try {
          await enviarAnexo(aEnviar.ocorrenciaId, arquivo)
          restantes = restantes.filter((item) => item !== arquivo)
          await salvarAnexosPendentes(usuarioId, { ...aEnviar, anexos: restantes })
        } catch (erro) {
          const definitiva = recusaDefinitiva(erro)
          if (definitiva) recusados.add(arquivo)
          novasFalhas.push({ nome: arquivo.name, mensagem: mensagemErroEnvioAnexo(erro), definitiva })
        }
      }

      if (restantes.length === 0) {
        await removerAnexosPendentes(usuarioId)
        setPendencia(null)
      } else {
        setPendencia({ ...aEnviar, anexos: restantes })
      }
      setFalhas(novasFalhas)
      setReenvioInutil(restantes.length > 0 && restantes.every((arquivo) => recusados.has(arquivo)))
      setEnviando(false)
      return restantes.length === 0
    },
    [usuarioId],
  )

  const descartar = useCallback(async () => {
    if (usuarioId) await removerAnexosPendentes(usuarioId)
    setPendencia(null)
    setFalhas([])
    setReenvioInutil(false)
  }, [usuarioId])

  return { pendencia, falhas, reenvioInutil, enviando, enviar, descartar }
}

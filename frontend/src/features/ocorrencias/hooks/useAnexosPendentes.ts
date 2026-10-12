import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/hooks/useAuth'
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
}

// D15: envio em duas fases. A ocorrência já existe no backend; aqui só sobem
// os anexos, um POST multipart por arquivo. Cada sucesso sai da pendência
// gravada no IndexedDB; os que falham continuam lá para "Reenviar" — sem
// nunca repetir o POST /ocorrencias. A pendência é do usuário logado (chave
// com o id dele): outro usuário do mesmo navegador não a vê.
export function useAnexosPendentes() {
  const { user } = useAuth()
  const usuarioId = user?.id ?? null
  const [pendencia, setPendencia] = useState<AnexosPendentesOcorrencia | null>(null)
  const [falhas, setFalhas] = useState<FalhaEnvioAnexo[]>([])
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

  // Devolve true quando não sobrou nenhum anexo pendente.
  const enviar = useCallback(
    async (aEnviar: AnexosPendentesOcorrencia): Promise<boolean> => {
      if (!usuarioId) return false
      setEnviando(true)
      setFalhas([])
      let restantes = [...aEnviar.anexos]
      const novasFalhas: FalhaEnvioAnexo[] = []
      await salvarAnexosPendentes(usuarioId, { ...aEnviar, anexos: restantes })
      setPendencia({ ...aEnviar, anexos: restantes })

      for (const arquivo of aEnviar.anexos) {
        try {
          await enviarAnexo(aEnviar.ocorrenciaId, arquivo)
          restantes = restantes.filter((item) => item !== arquivo)
          await salvarAnexosPendentes(usuarioId, { ...aEnviar, anexos: restantes })
        } catch (erro) {
          novasFalhas.push({ nome: arquivo.name, mensagem: mensagemErroEnvioAnexo(erro) })
        }
      }

      if (restantes.length === 0) {
        await removerAnexosPendentes(usuarioId)
        setPendencia(null)
      } else {
        setPendencia({ ...aEnviar, anexos: restantes })
      }
      setFalhas(novasFalhas)
      setEnviando(false)
      return restantes.length === 0
    },
    [usuarioId],
  )

  // Descarta só os arquivos pendentes; a ocorrência criada não é afetada.
  const descartar = useCallback(async () => {
    if (usuarioId) await removerAnexosPendentes(usuarioId)
    setPendencia(null)
    setFalhas([])
  }, [usuarioId])

  return { pendencia, falhas, enviando, enviar, descartar }
}

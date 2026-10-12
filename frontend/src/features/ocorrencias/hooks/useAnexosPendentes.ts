import { useCallback, useEffect, useState } from 'react'
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
// nunca repetir o POST /ocorrencias.
export function useAnexosPendentes() {
  const [pendencia, setPendencia] = useState<AnexosPendentesOcorrencia | null>(null)
  const [falhas, setFalhas] = useState<FalhaEnvioAnexo[]>([])
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let cancelado = false
    void carregarAnexosPendentes().then((salva) => {
      if (!cancelado && salva) setPendencia(salva)
    })
    return () => {
      cancelado = true
    }
  }, [])

  // Devolve true quando não sobrou nenhum anexo pendente.
  const enviar = useCallback(async (aEnviar: AnexosPendentesOcorrencia): Promise<boolean> => {
    setEnviando(true)
    setFalhas([])
    let restantes = [...aEnviar.anexos]
    const novasFalhas: FalhaEnvioAnexo[] = []
    await salvarAnexosPendentes({ ...aEnviar, anexos: restantes })
    setPendencia({ ...aEnviar, anexos: restantes })

    for (const arquivo of aEnviar.anexos) {
      try {
        await enviarAnexo(aEnviar.ocorrenciaId, arquivo)
        restantes = restantes.filter((item) => item !== arquivo)
        await salvarAnexosPendentes({ ...aEnviar, anexos: restantes })
      } catch (erro) {
        novasFalhas.push({ nome: arquivo.name, mensagem: mensagemErroEnvioAnexo(erro) })
      }
    }

    if (restantes.length === 0) {
      await removerAnexosPendentes()
      setPendencia(null)
    } else {
      setPendencia({ ...aEnviar, anexos: restantes })
    }
    setFalhas(novasFalhas)
    setEnviando(false)
    return restantes.length === 0
  }, [])

  // Descarta só os arquivos pendentes; a ocorrência criada não é afetada.
  const descartar = useCallback(async () => {
    await removerAnexosPendentes()
    setPendencia(null)
    setFalhas([])
  }, [])

  return { pendencia, falhas, enviando, enviar, descartar }
}

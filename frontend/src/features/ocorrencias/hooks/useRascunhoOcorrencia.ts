import { useEffect, useRef, useState } from 'react'
import type { UseFormGetValues, UseFormReset, UseFormWatch } from 'react-hook-form'
import {
  carregarArquivoRascunho,
  removerArquivoRascunho,
  removerArquivosDoRascunho,
  salvarArquivoRascunho,
  type DonoArquivoRascunho,
  type ReferenciaArquivoRascunho,
} from '@/lib/rascunhoDb'
import type { OcorrenciaFormValues } from '../schemas/ocorrenciaFormSchema'
import {
  agendarSalvarRascunhoOcorrencia,
  cancelarRascunhoAgendadoOcorrencia,
  carregarRascunhoOcorrencia,
  removerRascunhoOcorrencia,
  salvarRascunhoOcorrencia,
} from '../storage/rascunhoOcorrenciaStorage'

const AVISO_ANEXO_SIGILOSO =
  'Em ocorrência sigilosa os anexos não são guardados no rascunho: se a página for recarregada, anexe os arquivos de novo.'

type RascunhoOcorrenciaValores = Omit<OcorrenciaFormValues, 'anexos'> & {
  anexos: ReferenciaArquivoRascunho[]
}

function paraRascunho(valores: OcorrenciaFormValues, anexos: ReferenciaArquivoRascunho[]): RascunhoOcorrenciaValores {
  return { ...valores, anexos }
}

interface OpcoesRascunhoOcorrencia {
  chave: string
  usuarioId: string
  watch: UseFormWatch<OcorrenciaFormValues>
  reset: UseFormReset<OcorrenciaFormValues>
  getValues: UseFormGetValues<OcorrenciaFormValues>
}

export function useRascunhoOcorrencia({ chave, usuarioId, watch, reset, getValues }: OpcoesRascunhoOcorrencia) {
  const [rascunhoDisponivel, setRascunhoDisponivel] = useState<RascunhoOcorrenciaValores | null>(null)
  const [rascunhoSalvoEm, setRascunhoSalvoEm] = useState<number | null>(null)
  const [prontoParaAutoSalvar, setProntoParaAutoSalvar] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [avisoAnexo, setAvisoAnexo] = useState<string | null>(null)
  const autosaveSuspenso = useRef(false)

  const idsDosAnexos = useRef(new Map<File, string>())
  const donoDosArquivos: DonoArquivoRascunho = { store: 'ocorrencias', chave }

  function referenciasDosAnexos(anexos: File[]): ReferenciaArquivoRascunho[] {
    return anexos.flatMap((arquivo) => {
      const id = idsDosAnexos.current.get(arquivo)
      return id ? [{ id, nome: arquivo.name, tamanho: arquivo.size, tipo: arquivo.type }] : []
    })
  }

  function reagendar() {
    const valores = getValues()
    agendarSalvarRascunhoOcorrencia(paraRascunho(valores, referenciasDosAnexos(valores.anexos)), chave)
  }

  useEffect(() => {
    let cancelado = false
    carregarRascunhoOcorrencia<RascunhoOcorrenciaValores>(chave).then((registro) => {
      if (cancelado) return
      if (registro) {
        setRascunhoDisponivel(registro.dados)
        setRascunhoSalvoEm(registro.salvoEm)
      }
      setProntoParaAutoSalvar(true)
    })
    return () => {
      cancelado = true
    }
  }, [chave])

  const aguardandoEscolha = rascunhoDisponivel !== null

  useEffect(() => {
    if (!prontoParaAutoSalvar || aguardandoEscolha) return
    const inscricao = watch((valoresAtuais) => {
      if (autosaveSuspenso.current) return
      const valores = valoresAtuais as OcorrenciaFormValues
      agendarSalvarRascunhoOcorrencia(paraRascunho(valores, referenciasDosAnexos(valores.anexos)), chave)
    })
    return () => inscricao.unsubscribe()
  }, [prontoParaAutoSalvar, aguardandoEscolha, watch, chave])

  useEffect(() => {
    if (!mensagem) return
    const timer = setTimeout(() => setMensagem(null), 3000)
    return () => clearTimeout(timer)
  }, [mensagem])

  async function restaurar() {
    if (!rascunhoDisponivel) return
    const salvo = rascunhoDisponivel
    setRascunhoDisponivel(null)
    setRascunhoSalvoEm(null)

    const restaurados: File[] = []
    idsDosAnexos.current = new Map()
    for (const referencia of salvo.anexos) {
      const blob = await carregarArquivoRascunho(usuarioId, referencia.id)
      if (!blob) continue
      const arquivo = new File([blob], referencia.nome, { type: referencia.tipo })
      restaurados.push(arquivo)
      idsDosAnexos.current.set(arquivo, referencia.id)
    }
    reset({ ...salvo, anexos: restaurados }, { keepDefaultValues: true })
    if (restaurados.length < salvo.anexos.length) {
      setAvisoAnexo('Alguns anexos do rascunho não foram encontrados e precisam ser anexados de novo.')
    }
  }

  async function descartar() {
    setRascunhoDisponivel(null)
    setRascunhoSalvoEm(null)
    await removerRascunhoOcorrencia(chave)
    await removerArquivosDoRascunho(donoDosArquivos)
    idsDosAnexos.current = new Map()
  }

  async function salvarAgora() {
    const valores = getValues()
    await salvarRascunhoOcorrencia(paraRascunho(valores, referenciasDosAnexos(valores.anexos)), chave)
    setMensagem('Rascunho salvo.')
  }

  async function guardarAnexos(arquivos: File[]) {
    if (getValues('sigilosa')) {
      setAvisoAnexo(AVISO_ANEXO_SIGILOSO)
      return
    }
    let algumFalhou = false
    for (const arquivo of arquivos) {
      const referencia = await salvarArquivoRascunho(usuarioId, donoDosArquivos, arquivo)
      if (referencia) idsDosAnexos.current.set(arquivo, referencia.id)
      else algumFalhou = true
    }
    reagendar()
    if (algumFalhou) setAvisoAnexo('Um anexo não ficou salvo no rascunho, mas continua no formulário.')
  }

  async function esquecerAnexosGuardados() {
    const tinhaArquivos = idsDosAnexos.current.size > 0
    idsDosAnexos.current = new Map()
    await removerArquivosDoRascunho(donoDosArquivos)
    reagendar()
    if (tinhaArquivos) setAvisoAnexo(AVISO_ANEXO_SIGILOSO)
  }

  async function removerAnexoGuardado(arquivo: File) {
    const id = idsDosAnexos.current.get(arquivo)
    if (!id) return
    idsDosAnexos.current.delete(arquivo)
    await removerArquivoRascunho(usuarioId, id)
    reagendar()
  }

  async function encerrarAposEnvio() {
    autosaveSuspenso.current = true
    cancelarRascunhoAgendadoOcorrencia(chave)
    await removerRascunhoOcorrencia(chave)
    await removerArquivosDoRascunho(donoDosArquivos)
    idsDosAnexos.current = new Map()
  }

  function retomarAutosave() {
    autosaveSuspenso.current = false
  }

  return {
    rascunhoDisponivel: rascunhoDisponivel !== null,
    rascunhoSalvoEm,
    mensagem,
    avisoAnexo,
    limparAvisoAnexo: () => setAvisoAnexo(null),
    restaurar,
    descartar,
    salvarAgora,
    guardarAnexos,
    esquecerAnexosGuardados,
    removerAnexoGuardado,
    encerrarAposEnvio,
    retomarAutosave,
  }
}

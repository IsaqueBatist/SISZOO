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

// O que vai para o IndexedDB: igual aos valores do formulário, menos os
// anexos, que entram como referência (id, nome, tamanho, tipo) ao arquivo
// guardado na store 'arquivos'. O conteúdo nunca fica no rascunho de texto.
type RascunhoOcorrenciaValores = Omit<OcorrenciaFormValues, 'anexos'> & {
  anexos: ReferenciaArquivoRascunho[]
}

// T42: os dados do denunciante PASSAM a ser persistidos, inclusive em
// ocorrência sigilosa — decisão dos dois autores, revertendo a "rev. 12 item 3"
// (ver docs/decisoes/T42.md). Motivo: não perder o que foi digitado numa queda
// de rede. Risco aceito: o dado fica em claro no disco de uma máquina
// compartilhada até a submissão, o descarte, o logout ou a expiração de 7 dias.
// Em denúncia anônima não há o que guardar: o próprio formulário limpa os
// campos ao marcar a opção.
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

// Rascunho do formulário de ocorrência, com os anexos guardados à parte na
// store 'arquivos' (T42). Mesmas regras de useRascunho — confere uma vez ao
// montar, só então salva, com debounce — mais as dos anexos: cada arquivo é
// gravado uma vez, fora do debounce; ocorrência sigilosa não grava arquivo em
// disco; e o autosave fica suspenso depois do envio, para limpar o formulário
// não recriar o rascunho de uma ocorrência que já existe no backend. Fica fora
// de useRascunho porque nenhum outro formulário precisa disso.
export function useRascunhoOcorrencia({ chave, usuarioId, watch, reset, getValues }: OpcoesRascunhoOcorrencia) {
  const [rascunhoDisponivel, setRascunhoDisponivel] = useState<RascunhoOcorrenciaValores | null>(null)
  const [rascunhoSalvoEm, setRascunhoSalvoEm] = useState<number | null>(null)
  const [prontoParaAutoSalvar, setProntoParaAutoSalvar] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [avisoAnexo, setAvisoAnexo] = useState<string | null>(null)
  const autosaveSuspenso = useRef(false)

  // Id na store 'arquivos' de cada anexo que está no formulário. Em ref
  // porque só alimenta o que é gravado no rascunho; mudar não redesenha a tela.
  const idsDosAnexos = useRef(new Map<File, string>())
  const donoDosArquivos: DonoArquivoRascunho = { store: 'ocorrencias', chave }

  // Referências dos anexos que realmente foram para o disco, na ordem do
  // formulário. Anexo de ocorrência sigilosa e anexo que não caiu na cota não
  // têm referência: ficam só em memória.
  function referenciasDosAnexos(anexos: File[]): ReferenciaArquivoRascunho[] {
    return anexos.flatMap((arquivo) => {
      const id = idsDosAnexos.current.get(arquivo)
      return id ? [{ id, nome: arquivo.name, tamanho: arquivo.size, tipo: arquivo.type }] : []
    })
  }

  // O autosave disparado pelo `watch` calcula as referências no instante do
  // evento, e a gravação do arquivo só termina depois dele. Sem reagendar, o
  // salvamento pendente levaria a lista de referências de antes — por isso
  // quem mexe nos arquivos chama isto ao terminar (o agendamento substitui o
  // anterior da mesma chave).
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

  useEffect(() => {
    // O gate precisa envolver a CRIAÇÃO da assinatura, não só o corpo do
    // callback — senão um stale closure pode sobrescrever um rascunho real com
    // um objeto vazio antes da hidratação terminar.
    if (!prontoParaAutoSalvar) return
    const inscricao = watch((valoresAtuais) => {
      if (autosaveSuspenso.current) return
      const valores = valoresAtuais as OcorrenciaFormValues
      agendarSalvarRascunhoOcorrencia(paraRascunho(valores, referenciasDosAnexos(valores.anexos)), chave)
    })
    return () => inscricao.unsubscribe()
    // referenciasDosAnexos só lê uma ref, não precisa recriar a assinatura.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prontoParaAutoSalvar, watch, chave])

  useEffect(() => {
    if (!mensagem) return
    const timer = setTimeout(() => setMensagem(null), 3000)
    return () => clearTimeout(timer)
  }, [mensagem])

  // keepDefaultValues: na edição, "alterado" continua sendo em relação à
  // ocorrência original, não ao rascunho restaurado. Os anexos voltam da store
  // de arquivos, o que é assíncrono: o rascunho de texto só tem a referência.
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

  // Grava cada anexo UMA vez, aqui — fora do debounce do rascunho de texto.
  // Ocorrência sigilosa não grava nada em disco (decisão da T42): o anexo pode
  // ser a foto do local ou um documento do denunciante protegido.
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
    // Sem IndexedDB ou sem cota: o anexo segue no formulário e no envio, só não
    // sobrevive a um recarregamento.
    if (algumFalhou) setAvisoAnexo('Um anexo não ficou salvo no rascunho, mas continua no formulário.')
  }

  // Marcar o sigilo depois de anexar não pode deixar resto no disco.
  async function esquecerAnexosGuardados() {
    const tinhaArquivos = idsDosAnexos.current.size > 0
    idsDosAnexos.current = new Map()
    await removerArquivosDoRascunho(donoDosArquivos)
    reagendar()
    if (tinhaArquivos) setAvisoAnexo(AVISO_ANEXO_SIGILOSO)
  }

  // Tirar o anexo da tela tira o arquivo do disco na hora.
  async function removerAnexoGuardado(arquivo: File) {
    const id = idsDosAnexos.current.get(arquivo)
    if (!id) return
    idsDosAnexos.current.delete(arquivo)
    await removerArquivoRascunho(usuarioId, id)
    reagendar()
  }

  // Depois do envio com sucesso: daqui para frente quem guarda os anexos que
  // ainda não subiram é a pendência de anexos da D15, com outro ciclo de vida.
  // O autosave fica suspenso até retomarAutosave.
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

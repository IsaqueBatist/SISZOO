import { useCallback, useEffect, useRef, useState } from 'react'
import type { FieldValues, UseFormGetValues, UseFormReset, UseFormWatch } from 'react-hook-form'
import type { ArmazenamentoRascunho } from './rascunhoDb'

interface OpcoesRascunho<TForm extends FieldValues, TSalvo> {
  armazenamento: ArmazenamentoRascunho<TSalvo>
  chave: string
  watch: UseFormWatch<TForm>
  reset: UseFormReset<TForm>
  getValues: UseFormGetValues<TForm>
  paraRascunho?: (valores: TForm) => TSalvo
  deRascunho?: (salvo: TSalvo) => TForm
}

export function useRascunho<TForm extends FieldValues, TSalvo = TForm>({
  armazenamento,
  chave,
  watch,
  reset,
  getValues,
  paraRascunho,
  deRascunho,
}: OpcoesRascunho<TForm, TSalvo>) {
  const [rascunhoDisponivel, setRascunhoDisponivel] = useState<TSalvo | null>(null)
  const [rascunhoSalvoEm, setRascunhoSalvoEm] = useState<number | null>(null)
  const [prontoParaAutoSalvar, setProntoParaAutoSalvar] = useState(false)

  const conversoes = useRef({ armazenamento, paraRascunho, deRascunho })
  useEffect(() => {
    conversoes.current = { armazenamento, paraRascunho, deRascunho }
  })

  const converterParaRascunho = useCallback(
    (valores: TForm) => (conversoes.current.paraRascunho ? conversoes.current.paraRascunho(valores) : (valores as unknown as TSalvo)),
    [],
  )

  useEffect(() => {
    let cancelado = false
    conversoes.current.armazenamento.carregar(chave).then((registro) => {
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
      conversoes.current.armazenamento.agendarSalvar(chave, converterParaRascunho(valoresAtuais as TForm))
    })
    return () => inscricao.unsubscribe()
  }, [prontoParaAutoSalvar, aguardandoEscolha, chave, watch, converterParaRascunho])

  function restaurar() {
    if (rascunhoDisponivel) {
      const { deRascunho: converter } = conversoes.current
      reset(converter ? converter(rascunhoDisponivel) : (rascunhoDisponivel as unknown as TForm))
    }
    setRascunhoDisponivel(null)
    setRascunhoSalvoEm(null)
  }

  async function descartar() {
    setRascunhoDisponivel(null)
    setRascunhoSalvoEm(null)
    await conversoes.current.armazenamento.remover(chave)
  }

  function salvarAgora(): Promise<void> {
    conversoes.current.armazenamento.cancelarAgendado?.(chave)
    return conversoes.current.armazenamento.salvar(chave, converterParaRascunho(getValues()))
  }

  async function removerAposSucesso() {
    conversoes.current.armazenamento.cancelarAgendado?.(chave)
    await conversoes.current.armazenamento.remover(chave)
  }

  return { rascunhoDisponivel, rascunhoSalvoEm, restaurar, descartar, salvarAgora, removerAposSucesso }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import type { FieldValues, UseFormGetValues, UseFormReset, UseFormWatch } from 'react-hook-form'
import type { ArmazenamentoRascunho } from './rascunhoDb'

interface OpcoesRascunho<TForm extends FieldValues, TSalvo> {
  armazenamento: ArmazenamentoRascunho<TSalvo>
  chave: string
  watch: UseFormWatch<TForm>
  reset: UseFormReset<TForm>
  getValues: UseFormGetValues<TForm>
  // Conversão entre os valores do formulário e o formato gravado (quando o
  // formato do rascunho não pode mudar, como no cadastro de animal).
  paraRascunho?: (valores: TForm) => TSalvo
  deRascunho?: (salvo: TSalvo) => TForm
}

// Rascunho automático de formulário react-hook-form em IndexedDB (rede do
// CCZ é instável: o que foi digitado não pode se perder). Regras, as mesmas
// que o cadastro de animal já seguia:
// - confere UMA vez, ao montar, se há rascunho salvo; se houver, oferece
//   restaurar ou descartar (o formulário não é preenchido sozinho);
// - só começa a salvar depois dessa checagem — senão um rascunho vazio
//   gravaria por cima do verdadeiro antes de ele ser lido;
// - salva a cada alteração, com o debounce do armazenamento;
// - depois do envio com sucesso, cancela o salvamento pendente e remove.
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
  const [prontoParaAutoSalvar, setProntoParaAutoSalvar] = useState(false)

  // Funções em ref: quem chama costuma passá-las inline, e mudar a cada
  // render não pode recriar a assinatura do watch nem recarregar o rascunho.
  // Atualizada num efeito (não no render), declarado antes dos outros para
  // rodar primeiro no mesmo commit.
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
    conversoes.current.armazenamento.carregar(chave).then((salvo) => {
      if (cancelado) return
      if (salvo) setRascunhoDisponivel(salvo)
      setProntoParaAutoSalvar(true)
    })
    return () => {
      cancelado = true
    }
  }, [chave])

  useEffect(() => {
    // O gate envolve a CRIAÇÃO da assinatura, não só o corpo do callback:
    // checar a flag dentro do callback seria um stale closure.
    if (!prontoParaAutoSalvar) return
    const inscricao = watch((valoresAtuais) => {
      conversoes.current.armazenamento.agendarSalvar(chave, converterParaRascunho(valoresAtuais as TForm))
    })
    return () => inscricao.unsubscribe()
  }, [prontoParaAutoSalvar, chave, watch, converterParaRascunho])

  function restaurar() {
    if (rascunhoDisponivel) {
      const { deRascunho: converter } = conversoes.current
      reset(converter ? converter(rascunhoDisponivel) : (rascunhoDisponivel as unknown as TForm))
    }
    setRascunhoDisponivel(null)
  }

  async function descartar() {
    setRascunhoDisponivel(null)
    await conversoes.current.armazenamento.remover(chave)
  }

  function salvarAgora(): Promise<void> {
    return conversoes.current.armazenamento.salvar(chave, converterParaRascunho(getValues()))
  }

  // Sem cancelar o agendado, uma tecla digitada até 800 ms antes do envio
  // regravaria o rascunho depois de removido.
  async function removerAposSucesso() {
    conversoes.current.armazenamento.cancelarAgendado?.(chave)
    await conversoes.current.armazenamento.remover(chave)
  }

  return { rascunhoDisponivel, restaurar, descartar, salvarAgora, removerAposSucesso }
}

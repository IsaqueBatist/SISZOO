import { useState, type FormEvent } from 'react'
import { mensagemDeRegraDaApi } from '@/lib/erroApi'
import { useAdicionarNotaMutation } from '../hooks/useOcorrencias'

// D37: nota interna na linha do tempo. Só aparece para quem escreve e
// enquanto a ocorrência não está encerrada; se o backend recusar mesmo assim
// (ex.: encerrada por outra pessoa no meio tempo), mostra o motivo dele.
export function FormNota({ ocorrenciaId }: { ocorrenciaId: string }) {
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const mutation = useAdicionarNotaMutation(ocorrenciaId)

  async function aoEnviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro(null)
    const texto = descricao.trim()
    if (!texto) {
      setErro('Escreva a nota antes de adicionar.')
      return
    }
    try {
      await mutation.mutateAsync(texto)
      setDescricao('')
    } catch (falha) {
      setErro(mensagemDeRegraDaApi(falha) ?? 'Não foi possível adicionar a nota. Tente novamente.')
    }
  }

  return (
    <form onSubmit={aoEnviar} noValidate style={{ marginBottom: 'var(--space-4)' }}>
      <div className="field">
        <label htmlFor="nota-descricao">Nova nota interna</label>
        <textarea
          id="nota-descricao"
          className={`textarea${erro ? ' error' : ''}`}
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
          placeholder="Registre uma observação para a equipe."
        />
        {erro && <span className="err">{erro}</span>}
      </div>
      <button type="submit" className="btn btn-outline btn-sm" style={{ marginTop: 8 }} disabled={mutation.isPending}>
        {mutation.isPending ? 'Adicionando…' : 'Adicionar nota'}
      </button>
    </form>
  )
}

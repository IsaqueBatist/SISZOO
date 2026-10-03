import { useState, type ChangeEvent } from 'react'
// Reaproveita a mesma validação de tipo/tamanho já usada em
// OcorrenciaForm.tsx — regra idêntica (JPG/PNG/PDF, 5MB), sem motivo pra
// duplicar.
import { AnexoInvalidoError, validarAnexo } from '@/features/ocorrencias/utils/anexoOcorrencia'
import { DOCUMENTO_OPCOES } from '../utils/processosCatalogos'
import type { Processo, TipoDocumentoProcesso } from '../types/processos.types'
import { useAnexarDocumentoMutation } from '../hooks/useProcessos'

interface CardAnexarDocumentoProps {
  processo: Processo
  podeEscrever: boolean
}

// Um documento por vez (tipo + arquivo), ao contrário do anexo de
// ocorrência (vários de uma vez, sem classificação) — aqui o DER modela
// `documento_processo.tipo` por documento, então cada anexo precisa da sua
// própria classificação antes de ser adicionado.
export function CardAnexarDocumento({ processo, podeEscrever }: CardAnexarDocumentoProps) {
  const [tipo, setTipo] = useState<TipoDocumentoProcesso | ''>('')
  const [erro, setErro] = useState<string | null>(null)
  const mutation = useAnexarDocumentoMutation(processo.id)

  if (!podeEscrever) return null

  function handleArquivo(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0]
    event.target.value = ''
    if (!arquivo) return

    setErro(null)
    if (!tipo) {
      setErro('Selecione o tipo do documento antes de anexar.')
      return
    }
    try {
      validarAnexo(arquivo)
    } catch (erroValidacao) {
      setErro(erroValidacao instanceof AnexoInvalidoError ? erroValidacao.message : 'Não foi possível anexar o documento.')
      return
    }

    mutation.mutate(
      { tipo, arquivo },
      {
        onSuccess: () => setTipo(''),
        onError: () => setErro('Não foi possível anexar o documento. Tente novamente.'),
      },
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
      {erro && <span className="err">{erro}</span>}
      <select
        className="select"
        value={tipo}
        onChange={(event) => setTipo(event.target.value as TipoDocumentoProcesso)}
        aria-label="Tipo do documento"
      >
        <option value="">Selecione o tipo do documento...</option>
        {DOCUMENTO_OPCOES.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.label}
          </option>
        ))}
      </select>
      <label className="btn btn-outline btn-sm" style={{ width: 'fit-content', cursor: 'pointer' }}>
        {mutation.isPending ? 'Anexando…' : 'Anexar documento'}
        <input
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          onChange={handleArquivo}
          style={{ display: 'none' }}
          disabled={mutation.isPending}
        />
      </label>
    </div>
  )
}

import { useRef, useState, type ChangeEvent } from 'react'
import { Icon } from '@/components/layout/Icon'
import { formatarDataBR } from '@/lib/datas'
import { mensagemDeRegraDaApi } from '@/lib/erroApi'
import { baixarAnexoAnimal } from '../api/animaisApi'
import { useAnexosAnimalQuery, useEnviarAnexoAnimalMutation } from '../hooks/useAnimais'
import type { AnexoAnimal } from '../types/animais.types'

// F2-007 / RF-A04 (Fase 3 do TG): documentos e fotos do animal (Quadro 69).
// Mesmo padrão do cartão de anexos da ocorrência: lista, upload (JPG/PNG/PDF
// até 5 MB) e download autenticado via Blob. Sem exclusão (histórico).
interface AnexosAnimalProps {
  animalId: string
  podeEscrever: boolean
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AnexosAnimal({ animalId, podeEscrever }: AnexosAnimalProps) {
  const { data: anexos, isLoading, isError } = useAnexosAnimalQuery(animalId)
  const mutation = useEnviarAnexoAnimalMutation(animalId)
  const [erro, setErro] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function aoEscolherArquivo(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0]
    event.target.value = ''
    if (!arquivo) return
    setErro(null)
    try {
      await mutation.mutateAsync({ arquivo })
    } catch (falha) {
      setErro(mensagemDeRegraDaApi(falha) ?? 'Não foi possível enviar o anexo. Use JPG, PNG ou PDF de até 5 MB.')
    }
  }

  async function baixar(anexo: AnexoAnimal) {
    setErro(null)
    try {
      const blob = await baixarAnexoAnimal(animalId, anexo.id)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = anexo.nome
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setErro('Não foi possível baixar o anexo.')
    }
  }

  return (
    <>
      <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Anexos</span>
        {podeEscrever && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              style={{ display: 'none' }}
              aria-label="Selecionar arquivo para anexar"
              onChange={(event) => void aoEscolherArquivo(event)}
            />
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={mutation.isPending}
              onClick={() => inputRef.current?.click()}
            >
              {mutation.isPending ? 'Enviando…' : 'Anexar'}
            </button>
          </>
        )}
      </div>
      <div className="section-pad" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {erro && (
          <div className="alert danger" role="alert">
            <span className="bullet" />
            <div className="alert-content">{erro}</div>
          </div>
        )}
        {isError && <p style={{ fontSize: 12, color: 'var(--color-danger)' }}>Não foi possível carregar os anexos.</p>}
        {isLoading && <span className="skel" style={{ display: 'inline-block', width: '80%', height: 14 }} />}
        {anexos && anexos.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Nenhum anexo registrado.</p>
        )}
        {anexos?.map((anexo) => (
          <div key={anexo.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <Icon name="clipboard" size={16} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{anexo.nome}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                {formatarTamanho(anexo.tamanho)} · {formatarDataBR(anexo.criadoEm)}
                {anexo.criadoPorNome ? ` · ${anexo.criadoPorNome}` : ''}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-icon-only"
              aria-label={`Baixar ${anexo.nome}`}
              onClick={() => void baixar(anexo)}
            >
              <Icon name="chevronDown" size={14} />
            </button>
          </div>
        ))}
      </div>
    </>
  )
}

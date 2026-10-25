import type { ChangeEvent } from 'react'
import { Icon } from '@/components/layout/Icon'
import { MAXIMO_ANEXOS } from '../utils/anexoOcorrencia'

interface AnexosOcorrenciaFormProps {
  anexos: File[]
  erro: string | null
  aviso: string | null
  onAdicionar: (event: ChangeEvent<HTMLInputElement>) => void
  onRemover: (indice: number) => void
}

// Card 5 do cadastro de ocorrência: os anexos escolhidos, que sobem depois do
// POST (D15). A validação e o rascunho dos arquivos ficam em quem usa.
export function AnexosOcorrenciaForm({ anexos, erro, aviso, onAdicionar, onRemover }: AnexosOcorrenciaFormProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h3>5. Anexos</h3>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {erro && (
          <div className="alert danger" role="alert">
            <span className="bullet" />
            <div className="alert-content">{erro}</div>
          </div>
        )}
        {aviso && <span className="hint">{aviso}</span>}
        {anexos.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Nenhum anexo adicionado.</p>}
        {anexos.map((arquivo, indice) => (
          <div
            key={`${arquivo.name}-${arquivo.size}-${indice}`}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
          >
            <Icon name="clipboard" size={16} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{arquivo.name}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{(arquivo.size / (1024 * 1024)).toFixed(1)} MB</div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-icon-only"
              aria-label={`Remover ${arquivo.name}`}
              onClick={() => onRemover(indice)}
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
        {anexos.length < MAXIMO_ANEXOS && (
          <label className="btn btn-outline btn-sm" style={{ width: 'fit-content', cursor: 'pointer' }}>
            <Icon name="plus" size={14} />
            Adicionar anexo
            <input type="file" accept="image/jpeg,image/png,application/pdf" multiple onChange={onAdicionar} style={{ display: 'none' }} />
          </label>
        )}
      </div>
    </div>
  )
}

import type { ChangeEvent } from 'react'
import { Icon } from '@/components/layout/Icon'

interface UploadFotoAnimalProps {
  fotoUrl: string | undefined
  carregando: boolean
  erro: string | null
  aviso: string | null
  onArquivo: (event: ChangeEvent<HTMLInputElement>) => void
}

// Área de envio da foto (etapa 3). A compressão e o rascunho da foto ficam em
// quem usa.
export function UploadFotoAnimal({ fotoUrl, carregando, erro, aviso, onArquivo }: UploadFotoAnimalProps) {
  return (
    <div className="field full" style={{ marginBottom: 'var(--space-5)' }}>
      <label htmlFor="foto">Foto do animal</label>
      <label className="upload-area" style={{ display: 'block' }}>
        <input id="foto" type="file" accept="image/jpeg,image/png" onChange={onArquivo} style={{ display: 'none' }} />
        {fotoUrl ? (
          <div className="animal-avatar xl" style={{ margin: '0 auto 12px' }}>
            <img src={fotoUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }} />
          </div>
        ) : (
          <div className="ico">
            <Icon name="plus" size={24} />
          </div>
        )}
        <h4>{carregando ? 'Processando imagem…' : fotoUrl ? 'Trocar foto' : 'Arraste uma foto ou clique para enviar'}</h4>
        <p>JPG ou PNG, até 5MB.</p>
      </label>
      {erro && <span className="err">{erro}</span>}
      {aviso && <span className="hint">{aviso}</span>}
    </div>
  )
}

import { formatarInstanteBR } from '@/lib/datas'

interface BannerRascunhoProps {
  onRestaurar: () => void
  onDescartar: () => void
  salvoEm?: number | null
}

export function BannerRascunho({ onRestaurar, onDescartar, salvoEm }: BannerRascunhoProps) {
  return (
    <div className="alert info" role="alert">
      <span className="bullet" />
      <div className="alert-content">
        Encontramos um rascunho salvo deste formulário.
        {typeof salvoEm === 'number' && <div className="alert-desc">Salvo em {formatarInstanteBR(salvoEm)}.</div>}
        <div className="flex gap-2" style={{ marginTop: 8 }}>
          <button type="button" className="btn btn-sm btn-primary" onClick={onRestaurar}>
            Restaurar rascunho
          </button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onDescartar}>
            Descartar
          </button>
        </div>
      </div>
    </div>
  )
}

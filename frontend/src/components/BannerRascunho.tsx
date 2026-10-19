interface BannerRascunhoProps {
  onRestaurar: () => void
  onDescartar: () => void
}

// Aviso de rascunho salvo (useRascunho): o formulário não é preenchido
// sozinho, quem decide é o usuário.
export function BannerRascunho({ onRestaurar, onDescartar }: BannerRascunhoProps) {
  return (
    <div className="alert info" role="alert">
      <span className="bullet" />
      <div className="alert-content">
        Encontramos um rascunho salvo deste formulário.
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

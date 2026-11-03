interface ErroComRetryProps {
  mensagem: string
  onTentarNovamente: () => void
}

export function ErroComRetry({ mensagem, onTentarNovamente }: ErroComRetryProps) {
  return (
    <div className="alert danger" role="alert">
      <div className="alert-content">
        {mensagem}
        <div className="alert-desc">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onTentarNovamente}>
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  )
}

interface ErroComRetryProps {
  mensagem: string
  onTentarNovamente: () => void
  tom?: 'danger' | 'warning'
}

// Primeiro botão de retry do projeto — até aqui todo erro era texto estático
// sem ação (ex. ProcessoDetalhe.tsx). Reaproveita as classes .alert/.btn já
// existentes no design system.
export function ErroComRetry({ mensagem, onTentarNovamente, tom = 'danger' }: ErroComRetryProps) {
  return (
    <div className={`alert ${tom}`} role="alert">
      <span className="bullet" />
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

import { useStatusConexao } from '@/lib/useStatusConexao'

export function BannerOffline() {
  const motivo = useStatusConexao()
  if (!motivo) return null

  return (
    <div className="alert warning banner-conexao" role="status" aria-live="polite">
      <div className="alert-content">
        <strong>{motivo === 'navegador' ? 'Sem conexão com a internet.' : 'Possível instabilidade na conexão.'}</strong>
        <div className="alert-desc">
          {motivo === 'navegador'
            ? 'O que você digitar continua guardado neste computador. Envie quando a conexão voltar.'
            : 'Não conseguimos falar com o servidor. O que você digitar continua guardado neste computador; tente enviar de novo em instantes.'}
        </div>
      </div>
    </div>
  )
}

import { useStatusConexao } from '@/lib/useStatusConexao'

// Aviso de conexão (T42). Não bloqueia nada: a rede do CCZ é instável e o
// trabalho continua, com os formulários longos guardando rascunho local.
// Dois textos, porque os dois casos têm certezas diferentes — ver
// MotivoSemConexao em lib/useStatusConexao.ts.
export function BannerOffline() {
  const motivo = useStatusConexao()
  if (!motivo) return null

  return (
    <div className="alert warning" role="status" aria-live="polite">
      <span className="bullet" />
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

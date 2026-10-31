import { dispensarAviso, useAvisos, type TipoAviso } from '@/lib/avisos'
import { Icon, type IconName } from './layout/Icon'

const ICONE_POR_TIPO: Record<TipoAviso, IconName> = {
  sucesso: 'check',
  erro: 'alert',
  atencao: 'bell',
}

// Área de avisos da aplicação (.toast). A região fica sempre montada: leitor de
// tela só anuncia o que muda dentro de uma região que já existia.
export function Avisos() {
  const avisos = useAvisos()

  return (
    <div className="toast-area" role="status" aria-live="polite">
      {avisos.map((aviso) => (
        <div key={aviso.id} className={`toast ${aviso.tipo}`} role={aviso.tipo === 'sucesso' ? undefined : 'alert'}>
          <span className="ico">
            <Icon name={ICONE_POR_TIPO[aviso.tipo]} size={14} />
          </span>
          <span className="title">{aviso.texto}</span>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon-only"
            aria-label="Dispensar aviso"
            onClick={() => dispensarAviso(aviso.id)}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

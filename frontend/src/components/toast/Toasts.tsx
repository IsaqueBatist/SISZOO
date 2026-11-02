import { useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from '@/components/layout/Icon'
import { dispensarToast, duracaoDe, useToasts, type Toast, type VarianteToast } from './toast'

const ICONE_POR_VARIANTE: Record<VarianteToast, IconName> = {
  sucesso: 'check',
  erro: 'alert',
  atencao: 'bell',
}

export function Toasts() {
  const toasts = useToasts()

  const avisos = toasts.filter((item) => item.variante !== 'erro')
  const erros = toasts.filter((item) => item.variante === 'erro')

  return (
    <div className="toast-stack">
      <div
        className="toast-regiao"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
        aria-label="Avisos"
      >
        {avisos.map((item) => (
          <ItemToast key={item.id} toast={item} />
        ))}
      </div>
      <div
        className="toast-regiao"
        aria-label="Erros"
      >
        {erros.map((item) => (
          <ItemToast key={item.id} toast={item} />
        ))}
      </div>
    </div>
  )
}

function ItemToast({ toast }: { toast: Toast }) {
  const [pausado, setPausado] = useState(false)
  const restanteRef = useRef(duracaoDe(toast.variante))
  const inicioRef = useRef(0)

  useEffect(() => {
    if (pausado) return

    inicioRef.current = Date.now()
    const timer = setTimeout(() => dispensarToast(toast.id), restanteRef.current)

    return () => {
      clearTimeout(timer)
      restanteRef.current -= Date.now() - inicioRef.current
    }
  }, [pausado, toast.id])

  return (
    <div
      className={`toast toast-${toast.variante}`}
      role={toast.variante === 'erro' ? 'alert' : undefined}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <span className="ico">
        <Icon name={ICONE_POR_VARIANTE[toast.variante]} size={14} />
      </span>
      <div className="toast-texto">
        <div className="title">{toast.titulo}</div>
        {toast.descricao && <div className="desc">{toast.descricao}</div>}
      </div>
      <button
        type="button"
        className="toast-fechar"
        aria-label={`Fechar aviso: ${toast.titulo}`}
        onClick={() => dispensarToast(toast.id)}
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  )
}

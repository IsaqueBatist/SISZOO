import { useEffect, useRef, useState } from 'react'
import { Icon, type IconName } from '@/components/layout/Icon'
import { dispensarToast, duracaoDe, useToasts, type Toast, type VarianteToast } from './toast'

const ICONE_POR_VARIANTE: Record<VarianteToast, IconName> = {
  sucesso: 'check',
  erro: 'alert',
  atencao: 'bell',
}

// Área de avisos da aplicação. Montada uma vez, perto da raiz: o estado vive
// no store de módulo (./toast), então este componente só desenha.
export function Toasts() {
  const toasts = useToasts()

  const avisos = toasts.filter((item) => item.variante !== 'erro')
  const erros = toasts.filter((item) => item.variante === 'erro')

  return (
    /* A região de avisos (polite) fica SEMPRE montada, mesmo vazia: uma região
       live inserida no DOM junto com o conteúdo costuma não ser anunciada.
       `aria-relevant="additions"` + `aria-atomic=false` anunciam só o aviso
       novo, sem reler a lista nem anunciar a remoção automática.

       Erro é diferente: cada item leva `role="alert"`, que o leitor anuncia ao
       ser inserido. Por isso o contêiner de erros não tem `aria-live` — teria
       anúncio duplicado — e por isso `getByRole("alert")` só encontra algo
       quando há erro de fato, nunca uma região vazia. */
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

  // Timer é sistema externo — o caso legítimo de useEffect. O cleanup SEMPRE
  // limpa o timer, então nada dispara depois do unmount nem na dupla montagem
  // do StrictMode; e o tempo já decorrido é descontado, para a pausa no
  // hover/foco retomar de onde parou em vez de reiniciar.
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
      // Foco também pausa: quem navega por teclado precisa do mesmo tempo que
      // o hover dá a quem usa mouse para alcançar o botão de fechar.
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
        // O título entra no rótulo porque podem existir vários botões "Fechar"
        // ao mesmo tempo — sem isso a lista de botões do leitor de tela fica
        // ambígua.
        aria-label={`Fechar aviso: ${toast.titulo}`}
        onClick={() => dispensarToast(toast.id)}
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  )
}

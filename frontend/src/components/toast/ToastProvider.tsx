import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Icon, type IconName } from '@/components/layout/Icon'
import { ToastContext, type Toast, type ToastContextValue, type VarianteToast } from './toastContextValue'

// Segundo Context do app (o primeiro é o AuthContext). O item 8 do guia de
// boas práticas restringe Context a estado global de baixa frequência — este
// se qualifica e, principalmente, o VALOR exposto é só um trio de funções
// estáveis: a identidade nunca muda, então nenhum consumidor re-renderiza
// quando um toast entra ou sai. A alternativa seria passar um callback de
// App.tsx até um modal de formulário, 4+ níveis sem uso no meio — exatamente
// o prop-drilling que o item 8 proíbe.
//
// Quando `toasts` muda, o provider re-renderiza, mas `children` continua sendo
// o MESMO elemento (vem de App.tsx, que não re-renderizou), então o React faz
// bail-out e não re-renderiza a árvore da aplicação. É isso que torna o
// provider barato — não é preciso React.memo em volta.

// Máquinas do CCZ têm ~2 GB e telas de 1366px: uma rajada de avisos não pode
// cobrir a interface. O mais antigo é descartado.
const LIMITE_TOASTS = 3

// Erro fica mais tempo na tela: o toast é confirmação/aviso complementar (erro
// de formulário continua inline, ao lado do campo), mas ainda precisa de tempo
// de leitura maior que uma confirmação de sucesso.
const DURACAO_MS: Record<VarianteToast, number> = {
  sucesso: 5000,
  info: 5000,
  erro: 8000,
}

const ICONE_POR_VARIANTE: Record<VarianteToast, IconName> = {
  sucesso: 'check',
  erro: 'alert',
  info: 'bell',
}

// Contador de módulo em vez de crypto.randomUUID(): não depende do que o
// ambiente de teste expõe em `globalThis.crypto` e dá ids estáveis de ler.
let proximoId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Identidade estável é requisito, não otimização: `fechar` entra no array de
  // dependências do efeito de auto-dismiss de cada item. Se mudasse a cada
  // render do provider, o efeito reiniciaria o timer sem parar e o toast nunca
  // fecharia sozinho. O updater form dispensa `toasts` na dependência.
  const fechar = useCallback((id: string) => {
    setToasts((atuais) => atuais.filter((toast) => toast.id !== id))
  }, [])

  const mostrar = useCallback((variante: VarianteToast, titulo: string, descricao?: string) => {
    proximoId += 1
    const novo: Toast = { id: `toast-${proximoId}`, variante, titulo, descricao }
    setToasts((atuais) => [...atuais, novo].slice(-LIMITE_TOASTS))
  }, [])

  const sucesso = useCallback((titulo: string, descricao?: string) => mostrar('sucesso', titulo, descricao), [mostrar])
  const erro = useCallback((titulo: string, descricao?: string) => mostrar('erro', titulo, descricao), [mostrar])
  const info = useCallback((titulo: string, descricao?: string) => mostrar('info', titulo, descricao), [mostrar])

  const valor = useMemo<ToastContextValue>(() => ({ sucesso, erro, info }), [sucesso, erro, info])

  const avisos = toasts.filter((toast) => toast.variante !== 'erro')
  const erros = toasts.filter((toast) => toast.variante === 'erro')

  return (
    <ToastContext.Provider value={valor}>
      {children}
      {/* As duas regiões live ficam SEMPRE montadas, mesmo vazias: uma região
          inserida no DOM junto com o conteúdo frequentemente não é anunciada
          pelo leitor de tela. `aria-relevant="additions"` + `aria-atomic=false`
          fazem anunciar só o aviso novo, sem reler a lista nem anunciar a
          remoção automática.

          `aria-live` explícito em vez de role="status"/role="alert": os dois
          papéis são só atalhos para polite/assertive e o anúncio é idêntico,
          mas, como estes contêineres nunca saem do DOM, declarar o papel faria
          `getByRole('alert')` encontrar uma região vazia em qualquer tela —
          e o projeto usa esses papéis em dezenas de avisos de verdade. */}
      <div className="toast-stack">
        <div
          className="toast-regiao"
          aria-live="polite"
          aria-atomic="false"
          aria-relevant="additions"
          aria-label="Avisos"
        >
          {avisos.map((toast) => (
            <ItemToast key={toast.id} toast={toast} onFechar={fechar} />
          ))}
        </div>
        <div
          className="toast-regiao"
          aria-live="assertive"
          aria-atomic="false"
          aria-relevant="additions"
          aria-label="Erros"
        >
          {erros.map((toast) => (
            <ItemToast key={toast.id} toast={toast} onFechar={fechar} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

function ItemToast({ toast, onFechar }: { toast: Toast; onFechar: (id: string) => void }) {
  const [pausado, setPausado] = useState(false)
  const restanteRef = useRef(DURACAO_MS[toast.variante])
  const inicioRef = useRef(0)

  // Timer é sistema externo — o caso legítimo de useEffect (item 2 do guia).
  // O cleanup SEMPRE limpa o timer, então nada dispara depois do unmount nem
  // na dupla montagem do StrictMode; e o tempo já decorrido é descontado, para
  // a pausa no hover/foco retomar de onde parou em vez de reiniciar.
  useEffect(() => {
    if (pausado) return

    inicioRef.current = Date.now()
    const timer = setTimeout(() => onFechar(toast.id), restanteRef.current)

    return () => {
      clearTimeout(timer)
      restanteRef.current -= Date.now() - inicioRef.current
    }
  }, [pausado, toast.id, onFechar])

  function pausar() {
    setPausado(true)
  }

  function retomar() {
    setPausado(false)
  }

  return (
    <div
      className={`toast toast-${toast.variante}`}
      onMouseEnter={pausar}
      onMouseLeave={retomar}
      // Foco também pausa: quem navega por teclado precisa do mesmo tempo que
      // o hover dá a quem usa mouse para alcançar o botão de fechar.
      onFocus={pausar}
      onBlur={retomar}
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
        onClick={() => onFechar(toast.id)}
      >
        <Icon name="x" size={14} />
      </button>
    </div>
  )
}

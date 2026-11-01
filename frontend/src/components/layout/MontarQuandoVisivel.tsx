import { useEffect, useRef, useState, type ReactNode } from 'react'

interface MontarQuandoVisivelProps {
  children: ReactNode
  // Altura do espaço reservado enquanto não monta (evita a página "pular").
  alturaReservada: number
}

const MARGEM_ANTECIPADA = '200px'

// T45: só monta os filhos quando o bloco se aproxima da área visível. Usado
// nos gráficos do Dashboard (recharts, o maior chunk do front): quem não rola
// até eles não baixa nem executa a biblioteca. Sem IntersectionObserver
// (navegador antigo, jsdom), monta na hora — o comportamento de antes.
export function MontarQuandoVisivel({ children, alturaReservada }: MontarQuandoVisivelProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visivel, setVisivel] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const alvo = ref.current
    if (visivel || !alvo) return
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((entrada) => entrada.isIntersecting)) {
          setVisivel(true)
          observador.disconnect()
        }
      },
      { rootMargin: MARGEM_ANTECIPADA },
    )
    observador.observe(alvo)
    return () => observador.disconnect()
  }, [visivel])

  if (visivel) return <>{children}</>
  return <div ref={ref} style={{ minHeight: alturaReservada }} aria-hidden="true" />
}

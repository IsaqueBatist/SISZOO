import { useEffect, useRef, useState, type ReactNode } from 'react'

interface MontarQuandoVisivelProps {
  children: ReactNode
  alturaReservada: number
}

const MARGEM_ANTECIPADA = '200px'

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
